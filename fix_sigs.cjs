const fs = require('fs');
let code = fs.readFileSync('src/pages/ShopDashboard.tsx', 'utf8');

code = code.replace(/const compilePdfHelper = async \(url: string\) => \{/, 'const compilePdfHelper = async (order: PrintOrder) => {');
code = code.replace(/const toggleShopOpenStatus = async \(\) => \{/, 'const toggleShopOpenStatus = async (currentStatus: boolean) => {');
code = code.replace(/const compilePrintJob = async \(orderId: string, urls: string\[\]\) => \{/, 'const compilePrintJob = async (order: PrintOrder) => {');

fs.writeFileSync('src/pages/ShopDashboard.tsx', code);
