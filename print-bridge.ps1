# PrintHub - Native Windows Print Bridge
# Requires NO Node.js, Python, or extra software. Built into Windows 10 & 11.
param (
    [string]$ShopId = "",
    [string]$ApiHost = "https://ais-dev-egrk2wowcq2iiigeyghws5-162617806363.asia-southeast1.run.app"
)

$Host.UI.RawUI.WindowTitle = "PrintHub Print Bridge (Port 1337)"
Clear-Host

Write-Host "====================================================================" -ForegroundColor Magenta
Write-Host "     ____       _             _   _   _       _       ___   ____ " -ForegroundColor Cyan
Write-Host "    |  _ \ _ __(_)_ __   _  _| |_| | | |_   _| |__   / _ \ |  _ \" -ForegroundColor Cyan
Write-Host "    | |_) | '__| | '_ \ / _` | __| |_| | | | | '_ \ / /_\ \| |_) |" -ForegroundColor Cyan
Write-Host "    |  __/| |  | | | | | (_| | |_|  _  | |_| | |_) |  _   /|  _ < " -ForegroundColor Cyan
Write-Host "    |_|   |_|  |_|_| |_|\__,_|\__|_| |_|\__,_|_.__/|_| |_| |_| \_\" -ForegroundColor Cyan
Write-Host "                                                                   " -ForegroundColor Magenta
Write-Host "       - PRINTHUB ZERO-CONFIG NATIVE WINDOWS PRINT BRIDGE -        " -ForegroundColor Yellow
Write-Host "====================================================================" -ForegroundColor Magenta

$Port = 1337
$ConfigFile = Join-Path $PSScriptRoot "printbridge-config.json"

# Load saved config if exists
if (Test-Path $ConfigFile) {
    try {
        $json = Get-Content $ConfigFile -Raw | ConvertFrom-Json
        if ($json.shopId -and -not $ShopId) { $ShopId = $json.shopId }
        if ($json.apiHost -and -not $ApiHost) { $ApiHost = $json.apiHost }
    } catch {}
}

if (-not $ShopId) {
    Write-Host ""
    Write-Host "Please enter your Shop ID (found on your PrintHub Dashboard):" -ForegroundColor Yellow
    $ShopId = Read-Host "Shop ID"
    $ShopId = $ShopId.Trim()
    
    # Save config
    $cfg = @{ shopId = $ShopId; apiHost = $ApiHost; port = $Port }
    $cfg | ConvertTo-Json | Set-Content $ConfigFile
}

Write-Host ""
Write-Host "[OK] Connected Shop ID : $ShopId" -ForegroundColor Green
Write-Host "[OK] Cloud Server      : $ApiHost" -ForegroundColor Green
Write-Host "[OK] Local Bridge Port : http://127.0.0.1:$Port" -ForegroundColor Green
Write-Host "====================================================================" -ForegroundColor Gray
Write-Host "Print Bridge is ACTIVE. Print jobs will execute automatically." -ForegroundColor Cyan
Write-Host "Keep this window open. Press Ctrl+C to close." -ForegroundColor Gray
Write-Host "====================================================================" -ForegroundColor Gray
Write-Host ""

# Start HTTP Listener
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://127.0.0.1:$Port/")

try {
    $listener.Start()
} catch {
    Write-Host "[WARN] Port $Port is already in use by another PrintBridge instance." -ForegroundColor Yellow
    Write-Host "If another window is already open, you are all set!" -ForegroundColor Yellow
    Start-Sleep -Seconds 10
    exit
}

$lastPollTime = [DateTime]::MinValue

while ($listener.IsListening) {
    # Check for pending cloud orders every 4 seconds
    if (([DateTime]::Now - $lastPollTime).TotalSeconds -ge 4) {
        $lastPollTime = [DateTime]::Now
        try {
            $pendingUrl = "$ApiHost/api/companion/pending-orders?shopId=$ShopId"
            $pendingOrders = Invoke-RestMethod -Uri $pendingUrl -Method Get -TimeoutSec 3 -ErrorAction SilentlyContinue
            if ($pendingOrders -and $pendingOrders.Count -gt 0) {
                foreach ($ord in $pendingOrders) {
                    Write-Host "[CLOUD PRINT] Processing order Token: $($ord.token)..." -ForegroundColor Magenta
                    $tmpPdf = Join-Path $env:TEMP "PrintHub_Job_$($ord.token).pdf"
                    $dlUrl = "$ApiHost/api/companion/download-pdf/$($ord.id)"
                    Invoke-WebRequest -Uri $dlUrl -OutFile $tmpPdf -TimeoutSec 10 -ErrorAction SilentlyContinue
                    
                    if (Test-Path $tmpPdf) {
                        Start-Process -FilePath $tmpPdf -Verb Print
                        Write-Host "[SUCCESS] Sent Token $($ord.token) to default Windows printer!" -ForegroundColor Green
                        
                        # Update status
                        $updateUrl = "$ApiHost/api/companion/update-status"
                        $statusBody = @{ orderId = $ord.id; status = "Printing Started" } | ConvertTo-Json
                        Invoke-RestMethod -Uri $updateUrl -Method Post -Body $statusBody -ContentType "application/json" -ErrorAction SilentlyContinue
                    }
                }
            }
        } catch {}
    }

    # Non-blocking async check for local browser requests
    $asyncResult = $listener.BeginGetContext($null, $null)
    $waited = $asyncResult.AsyncWaitHandle.WaitOne(500, $false)
    if ($waited) {
        $context = $listener.EndGetContext($asyncResult)
        $request = $context.Request
        $response = $context.Response

        # Full CORS headers
        $response.AddHeader("Access-Control-Allow-Origin", "*")
        $response.AddHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE")
        $response.AddHeader("Access-Control-Allow-Headers", "*")
        $response.ContentType = "application/json"

        if ($request.HttpMethod -eq "OPTIONS") {
            $response.StatusCode = 200
            $response.Close()
            continue
        }

        $path = $request.Url.AbsolutePath

        if ($path -eq "/" -or $path -eq "/status" -or $path -eq "/health") {
            $data = @{
                status = "ok"
                app = "PrintHub PowerShell Bridge"
                version = "2.2.0"
                shopId = $ShopId
                port = $Port
                platform = "win32"
            } | ConvertTo-Json
            $buffer = [System.Text.Encoding]::UTF8.GetBytes($data)
            $response.ContentLength64 = $buffer.Length
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
            $response.Close()
            continue
        }

        if ($path -eq "/printers") {
            try {
                $printers = Get-Printer | ForEach-Object {
                    @{ name = $_.Name; isDefault = [bool]($_.Default) }
                }
                if (-not $printers) {
                    $printers = @(@{ name = "Default Windows Printer"; isDefault = $true })
                }
                $data = @{ success = $true; printers = $printers } | ConvertTo-Json
            } catch {
                $data = @{ success = $true; printers = @(@{ name = "Default Windows Printer"; isDefault = $true }) } | ConvertTo-Json
            }
            $buffer = [System.Text.Encoding]::UTF8.GetBytes($data)
            $response.ContentLength64 = $buffer.Length
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
            $response.Close()
            continue
        }

        if ($path -eq "/print" -and $request.HttpMethod -eq "POST") {
            try {
                $reader = New-Object System.IO.StreamReader($request.InputStream, $request.ContentEncoding)
                $bodyText = $reader.ReadToEnd()
                $jsonBody = $bodyText | ConvertFrom-Json
                
                $tmpPdf = Join-Path $env:TEMP "PrintHub_Browser_$($jsonBody.token).pdf"
                if ($jsonBody.pdfBase64) {
                    $bytes = [Convert]::FromBase64String($jsonBody.pdfBase64)
                    [System.IO.File]::WriteAllBytes($tmpPdf, $bytes)
                } elseif ($jsonBody.orderId) {
                    $dlUrl = "$ApiHost/api/companion/download-pdf/$($jsonBody.orderId)"
                    Invoke-WebRequest -Uri $dlUrl -OutFile $tmpPdf
                }

                if (Test-Path $tmpPdf) {
                    if ($jsonBody.printerName) {
                        Start-Process -FilePath $tmpPdf -Verb PrintTo -ArgumentList "$($jsonBody.printerName)"
                    } else {
                        Start-Process -FilePath $tmpPdf -Verb Print
                    }
                    Write-Host "[DIRECT PRINT] Job sent to printer for Token: $($jsonBody.token)" -ForegroundColor Green
                }

                $data = @{ success = $true; message = "Job sent to printer" } | ConvertTo-Json
            } catch {
                $data = @{ success = $false; error = $_.Exception.Message } | ConvertTo-Json
            }
            $buffer = [System.Text.Encoding]::UTF8.GetBytes($data)
            $response.ContentLength64 = $buffer.Length
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
            $response.Close()
            continue
        }

        # Test Print
        if ($path -eq "/test-print") {
            $testTxt = Join-Path $env:TEMP "PrintHub_Test.txt"
            "PrintHub Hardware Test`r`nDate: $(Get-Date)`r`nStatus: Working Perfectly!" | Out-File $testTxt -Encoding utf8
            Start-Process -FilePath $testTxt -Verb Print
            $data = @{ success = $true; message = "Test page sent" } | ConvertTo-Json
            $buffer = [System.Text.Encoding]::UTF8.GetBytes($data)
            $response.ContentLength64 = $buffer.Length
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
            $response.Close()
            continue
        }

        # 404
        $response.StatusCode = 404
        $response.Close()
    }
}
