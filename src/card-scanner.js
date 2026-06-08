/**
 * card-scanner.js — Captura de imagen desde cámara para reconocimiento de cartas.
 *
 * No incluye OCR ni modelo local. Captura un frame del vídeo y lo expone
 * como blob JPEG para que el llamador lo envíe a la API que prefiera.
 *
 * API pública:
 *   CardScanner.captureFrame(videoEl)  → Promise<{ blob, dataUrl }>
 */

// Zona de crop: encuadre generoso centrado en la parte inferior del frame,
// donde suele estar el ID de la carta.
export const CROP = { x: 0.05, y: 0.30, w: 0.90, h: 0.60 };

let offscreenCanvas = null;

const CardScanner = {
  /**
   * Captura un único frame del vídeo, recorta la zona del ID y devuelve
   * la imagen como blob JPEG y como dataURL base64.
   *
   * @param {HTMLVideoElement} videoEl
   * @returns {Promise<{ blob: Blob, dataUrl: string } | null>}
   */
  async captureFrame(videoEl) {
    const natW = videoEl.videoWidth;
    const natH = videoEl.videoHeight;
    if (!natW || !natH) return null;

    const srcX = Math.round(natW * CROP.x);
    const srcY = Math.round(natH * CROP.y);
    const srcW = Math.round(natW * CROP.w);
    const srcH = Math.round(natH * CROP.h);

    if (!offscreenCanvas) offscreenCanvas = document.createElement("canvas");
    offscreenCanvas.width = srcW;
    offscreenCanvas.height = srcH;

    const ctx = offscreenCanvas.getContext("2d");
    ctx.drawImage(videoEl, srcX, srcY, srcW, srcH, 0, 0, srcW, srcH);

    const dataUrl = offscreenCanvas.toDataURL("image/jpeg", 0.92);
    const blob = await new Promise((resolve) =>
      offscreenCanvas.toBlob(resolve, "image/jpeg", 0.92)
    );

    return { blob, dataUrl };
  },
};

export default CardScanner;

