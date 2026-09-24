declare module 'jscanify/client' {
  export default class jscanify {
    constructor();
    highlightPaper(image: HTMLCanvasElement | HTMLImageElement): HTMLCanvasElement;
    extractPaper(image: HTMLCanvasElement | HTMLImageElement, resultWidth: number, resultHeight: number): HTMLCanvasElement;
  }
}
