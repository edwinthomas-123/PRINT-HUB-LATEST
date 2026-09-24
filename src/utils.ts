import { PDFDocument } from 'pdf-lib';
import { Shop } from './types';

export function isShopCurrentlyOpen(shop: Shop): boolean {
  if (shop.isOpen === false) {
    return false;
  }
  if (shop.openingHours) {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    const currentTime = currentHour + currentMin / 60;
    
    const [openH, openM] = shop.openingHours.open.split(':').map(Number);
    const [closeH, closeM] = shop.openingHours.close.split(':').map(Number);
    
    const openTime = openH + openM / 60;
    const closeTime = closeH + closeM / 60;
    
    return currentTime >= openTime && currentTime <= closeTime;
  }
  return shop.isOpen ?? true;
}

export async function getPdfPageCount(file: File): Promise<number> {
  if (file.type !== 'application/pdf') return 1;
  try {
    const buffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(buffer, { ignoreEncryption: true });
    return pdf.getPageCount();
  } catch (e) {
    console.warn("Failed to get pdf page count", e);
    return 1;
  }
}

export function parsePageRange(rangeStr: string, maxPages: number): number {
  if (!rangeStr || rangeStr.toLowerCase() === 'all') return maxPages;
  const parts = rangeStr.split(',');
  let count = 0;
  for (const part of parts) {
    const p = part.trim();
    if (!p) continue;
    if (p.includes('-')) {
      const [startStr, endStr] = p.split('-');
      const start = parseInt(startStr);
      const end = parseInt(endStr);
      if (!isNaN(start) && !isNaN(end) && start <= end) {
        const actualStart = Math.max(1, start);
        const actualEnd = Math.min(maxPages, end);
        if (actualStart <= actualEnd) {
          count += (actualEnd - actualStart + 1);
        }
      }
    } else {
      const pageNum = parseInt(p);
      if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= maxPages) {
        count += 1;
      }
    }
  }
  return count > 0 ? count : maxPages;
}
