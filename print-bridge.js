const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const { exec } = require('child_process');
const readline = require('readline');
const os = require('os');

// Default API host & config file
let API_HOST = "https://ais-dev-egrk2wowcq2iiigeyghws5-162617806363.asia-southeast1.run.app";
const CONFIG_FILE = path.join(process.cwd(), 'printbridge-config.json');
const LOCAL_PORT = 1337;

let currentShopId = "";
let currentShopName = "";

// Helper logs
function logInfo(msg) { console.log(`\x1b[36m[INFO]\x1b[0m ${msg}`); }
function logSuccess(msg) { console.log(`\x1b[32m[SUCCESS]\x1b[0m ${msg}`); }
function logWarn(msg) { console.log(`\x1b[33m[WARNING]\x1b[0m ${msg}`); }
function logError(msg) { console.error(`\x1b[31m[ERROR]\x1b[0m ${msg}`); }

function drawBanner() {
  console.clear();
  console.log("\x1b[35m");
  console.log("====================================================================");
  console.log("   ____       _             _   _   _       _       ___   ____ ");
  console.log("  |  _ \\ _ __(_)_ __   _  _| |_| | | |_   _| |__   / _ \\ |  _ \\");
  console.log("  | |_) | '__| | '_ \\ / _` | __| |_| | | | | '_ \\ / /_\\ \\| |_) |");
  console.log("  |  __/| |  | | | | | (_| | |_|  _  | |_| | |_) |  _   /|  _ < ");
  console.log("  |_|   |_|  |_|_| |_|\\__,_|\\__|_| |_|\\__,_|_.__/|_| |_| |_| \\_\\");
  console.log("                                                                   ");
  console.log("    - SECURE LOCAL PRINT BRIDGE & AUTOMATIC DESKTOP DAEMON -       ");
  console.log("====================================================================");
  console.log("\x1b[0m");
}

function makeRequest(url, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (url.startsWith('https') ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'PrintHub-Bridge/2.0'
      }
    };
    
    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve(data);
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });
    
    req.on('error', (err) => reject(err));
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(destPath);
    
    client.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to download: HTTP ${res.statusCode}`));
        return;
      }
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(destPath);
      });
    }).on('error', (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

// Get installed printers across Windows, macOS, and Linux
function getInstalledPrinters() {
  return new Promise((resolve) => {
    const platform = os.platform();
    
    if (platform === 'win32') {
      const psCommand = `powershell -NoProfile -Command "Get-Printer | Select-Object Name, Type, Default | ConvertTo-Json -Compress"`;
      exec(psCommand, { timeout: 4000 }, (err, stdout) => {
        if (err || !stdout) {
          resolve([{ name: 'Default Windows Printer', isDefault: true }]);
          return;
        }
        try {
          const parsed = JSON.parse(stdout.trim());
          const list = Array.isArray(parsed) ? parsed : [parsed];
          const printers = list.filter(p => p && p.Name).map(p => ({
            name: p.Name,
            isDefault: Boolean(p.Default)
          }));
          resolve(printers.length > 0 ? printers : [{ name: 'Default Windows Printer', isDefault: true }]);
        } catch (_) {
          resolve([{ name: 'Default Windows Printer', isDefault: true }]);
        }
      });
    } else if (platform === 'darwin' || platform === 'linux') {
      exec('lpstat -p', { timeout: 3000 }, (err, stdout) => {
        if (err || !stdout) {
          resolve([{ name: 'Default System Printer', isDefault: true }]);
          return;
        }
        const lines = stdout.split('\n');
        const printers = [];
        for (const line of lines) {
          const match = line.match(/^printer\s+([^\s]+)/);
          if (match && match[1]) {
            printers.push({ name: match[1], isDefault: printers.length === 0 });
          }
        }
        resolve(printers.length > 0 ? printers : [{ name: 'Default System Printer', isDefault: true }]);
      });
    } else {
      resolve([{ name: 'Default Printer', isDefault: true }]);
    }
  });
}

// Print a PDF file directly to target printer
function printPDF(filePath, printerName) {
  return new Promise((resolve, reject) => {
    const platform = os.platform();
    logInfo(`Sending document to printer on ${platform}: ${printerName || 'Default'}...`);
    
    if (platform === 'win32') {
      let psCommand = '';
      if (printerName && printerName !== 'default' && !printerName.includes('Default')) {
        psCommand = `powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath '${filePath}' -Verb PrintTo -ArgumentList '${printerName}'"`;
      } else {
        psCommand = `powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath '${filePath}' -Verb Print"`;
      }
      exec(psCommand, (err) => {
        if (err) reject(err);
        else resolve();
      });
    } else if (platform === 'darwin' || platform === 'linux') {
      const dest = printerName && printerName !== 'default' ? `-d "${printerName}"` : '';
      exec(`lp ${dest} "${filePath}"`, (err, stdout, stderr) => {
        if (err) reject(new Error(stderr || err.message));
        else resolve();
      });
    } else {
      reject(new Error(`Unsupported platform for auto-print: ${platform}`));
    }
  });
}

// Start local HTTP server on port 1337 for direct web-app communication
function startLocalServer() {
  const server = http.createServer(async (req, res) => {
    // Enable complete CORS for browser communication
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    const urlObj = new URL(req.url, `http://127.0.0.1:${LOCAL_PORT}`);
    const pathname = urlObj.pathname;

    // 1. Health & Status
    if (pathname === '/' || pathname === '/status' || pathname === '/health') {
      res.writeHead(200);
      res.end(JSON.stringify({
        status: 'ok',
        app: 'PrintHub PrintBridge',
        version: '2.2.0',
        shopId: currentShopId || null,
        shopName: currentShopName || null,
        apiHost: API_HOST,
        port: LOCAL_PORT,
        platform: os.platform()
      }));
      return;
    }

    // 2. Discover Printers
    if (pathname === '/printers') {
      try {
        const printers = await getInstalledPrinters();
        res.writeHead(200);
        res.end(JSON.stringify({ success: true, printers }));
      } catch (e) {
        res.writeHead(500);
        res.end(JSON.stringify({ success: false, error: e.message, printers: [] }));
      }
      return;
    }

    // 3. Print Job from Web App
    if (pathname === '/print' && req.method === 'POST') {
      let bodyData = '';
      req.on('data', chunk => { bodyData += chunk; });
      req.on('end', async () => {
        try {
          const body = JSON.parse(bodyData);
          const { orderId, token, pdfBase64, pdfUrl, printerId, printerName } = body;

          const tempFile = path.join(os.tmpdir(), `PrintHub_${token || orderId || Date.now()}.pdf`);
          
          if (pdfBase64) {
            fs.writeFileSync(tempFile, Buffer.from(pdfBase64, 'base64'));
          } else if (pdfUrl) {
            await downloadFile(pdfUrl, tempFile);
          } else if (orderId) {
            const dlUrl = `${API_HOST}/api/companion/download-pdf/${orderId}`;
            await downloadFile(dlUrl, tempFile);
          } else {
            res.writeHead(400);
            res.end(JSON.stringify({ success: false, error: 'No PDF data or order ID provided' }));
            return;
          }

          logSuccess(`[Direct Print] Received print job for Token: ${token || orderId || 'N/A'}`);
          await printPDF(tempFile, printerName || printerId);
          
          res.writeHead(200);
          res.end(JSON.stringify({ success: true, message: 'Print job dispatched successfully to local printer' }));
        } catch (err) {
          logError(`[Direct Print Error] ${err.message}`);
          res.writeHead(500);
          res.end(JSON.stringify({ success: false, error: err.message }));
        }
      });
      return;
    }

    // 4. Test Print
    if (pathname === '/test-print') {
      try {
        const testFile = path.join(os.tmpdir(), 'PrintHub_Test_Page.txt');
        fs.writeFileSync(testFile, `PrintHub Print Bridge - Hardware Test Page\n=========================================\nStatus: Connected & Functional\nDate: ${new Date().toLocaleString()}\nPort: ${LOCAL_PORT}\nPlatform: ${os.platform()}\n=========================================\nYour PrintHub local bridge is working perfectly!\n`);
        
        if (os.platform() === 'win32') {
          exec(`powershell -NoProfile -Command "Start-Process -FilePath '${testFile}' -Verb Print"`);
        } else {
          exec(`lp "${testFile}"`);
        }
        res.writeHead(200);
        res.end(JSON.stringify({ success: true, message: 'Hardware test page sent to printer' }));
      } catch (err) {
        res.writeHead(500);
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
      return;
    }

    // Default 404
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Endpoint not found' }));
  });

  server.listen(LOCAL_PORT, '127.0.0.1', () => {
    logSuccess(`Local Print Bridge HTTP server listening on http://127.0.0.1:${LOCAL_PORT}`);
  });

  server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
      logWarn(`Port ${LOCAL_PORT} is already in use. A PrintBridge instance is already running!`);
    } else {
      logError(`Local server error: ${e.message}`);
    }
  });
}

async function validateAndSaveShopId(shopId) {
  try {
    logInfo("Connecting to PrintHub server to authorize...");
    const res = await makeRequest(`${API_HOST}/api/companion/validate?shopId=${shopId}`);
    if (res && res.valid) {
      currentShopName = res.name;
      currentShopId = shopId;
      fs.writeFileSync(CONFIG_FILE, JSON.stringify({ shopId, apiHost: API_HOST }, null, 2));
      logSuccess(`Authenticated! Connected to print shop: "${res.name}"`);
      return res.name;
    } else {
      throw new Error(res.error || "Invalid Shop ID");
    }
  } catch (err) {
    logError(`Authentication failed: ${err.message}`);
    return null;
  }
}

async function checkAndPrintPending(shopId) {
  if (!shopId) return;
  try {
    const orders = await makeRequest(`${API_HOST}/api/companion/pending-orders?shopId=${shopId}`);
    if (!orders || !Array.isArray(orders) || orders.length === 0) return;
    
    logSuccess(`Received ${orders.length} cloud print order(s)!`);
    
    for (const order of orders) {
      console.log("\n------------------------------------------------------------");
      logInfo(`Processing print order token: \x1b[35m${order.token}\x1b[0m`);
      logInfo(`Total Price Paid: ₹${order.price}`);
      
      const tempPdfPath = path.join(os.tmpdir(), `PrintHub_Job_${order.token}.pdf`);
      const downloadUrl = `${API_HOST}/api/companion/download-pdf/${order.id}`;
      
      logInfo(`Downloading compiled print document...`);
      await downloadFile(downloadUrl, tempPdfPath);
      logSuccess(`Document ready.`);
      
      try {
        logInfo(`Sending document to printer...`);
        await printPDF(tempPdfPath);
        logSuccess(`Successfully sent to printer!`);
        
        await makeRequest(`${API_HOST}/api/companion/update-status`, 'POST', {
          orderId: order.id,
          status: 'Printing Started'
        });
        
        setTimeout(async () => {
          try {
            await makeRequest(`${API_HOST}/api/companion/update-status`, 'POST', {
              orderId: order.id,
              status: 'Ready for Pickup'
            });
            logSuccess(`Marked Token ${order.token} as Ready for Pickup!`);
          } catch (_) {}
        }, 7000);
        
      } catch (printErr) {
        logError(`Local printing failed: ${printErr.message}`);
      }
      console.log("------------------------------------------------------------\n");
    }
  } catch (err) {
    // Non-fatal poll warning
  }
}

async function main() {
  drawBanner();

  // Load config if exists
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      const savedConfig = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
      if (savedConfig.apiHost) {
        API_HOST = savedConfig.apiHost;
      }
      if (savedConfig.shopId) {
        currentShopId = savedConfig.shopId;
        logInfo(`Loaded configuration. Connecting to Shop ID: ${currentShopId}`);
        const validatedName = await validateAndSaveShopId(currentShopId);
        if (validatedName) {
          currentShopName = validatedName;
        } else {
          currentShopId = "";
        }
      }
    } catch (_) {
      logWarn("Stale configuration found.");
    }
  }

  // Start local HTTP server on port 1337 FIRST so browser can connect immediately
  startLocalServer();

  // Prompt for Shop ID if not already saved
  if (!currentShopId) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const askShopId = () => {
      return new Promise((resolve) => {
        rl.question("\x1b[33m🔑 Enter your Shop ID (found on your PrintHub Dashboard): \x1b[0m", async (ans) => {
          const trimmed = ans.trim();
          if (!trimmed) {
            logError("Shop ID cannot be empty!");
            resolve(await askShopId());
            return;
          }
          const validatedName = await validateAndSaveShopId(trimmed);
          if (validatedName) {
            currentShopId = trimmed;
            currentShopName = validatedName;
            rl.close();
            resolve();
          } else {
            resolve(await askShopId());
          }
        });
      });
    };
    await askShopId();
  }

  drawBanner();
  logSuccess(`PRINT BRIDGE IS ACTIVE & CONNECTED`);
  console.log(`\x1b[34m Shop Name   : ${currentShopName || 'Local Print Shop'}`);
  console.log(` Shop ID     : ${currentShopId}`);
  console.log(` Bridge Port : http://127.0.0.1:${LOCAL_PORT}`);
  console.log(` Status      : Listening to cloud orders & browser auto-print requests...\x1b[0m`);
  console.log("====================================================================");
  console.log(" Keep this window open. All customer print jobs will print automatically.");
  console.log(" Press Ctrl+C at any time to close.");
  console.log("====================================================================\n");

  // Start cloud order polling interval
  setInterval(() => checkAndPrintPending(currentShopId), 4000);
}

main().catch(console.error);
