import { toBlob, toPng } from 'html-to-image';

export interface CaptureResult {
  success: boolean;
  method?: 'clipboard' | 'download';
  dataUrl?: string;
  blob?: Blob;
  error?: string;
}

/**
 * Captures a crisp image of the podium element and copies it to the system clipboard.
 * If clipboard write access is denied or unsupported, falls back to direct download.
 */
export async function copyPodiumToClipboard(
  element: HTMLElement,
  fileName: string = 'knack-roeselare-podium.png'
): Promise<CaptureResult> {
  try {
    // Render high-res PNG blob (pixelRatio: 2 gives 2x retina crispness)
    const blob = await toBlob(element, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: '#071C3D',
      filter: (node: Node) => {
        if (node instanceof HTMLElement && node.classList.contains('exclude-from-photo')) {
          return false;
        }
        return true;
      },
    });

    if (!blob) {
      throw new Error('Kon geen afbeelding genereren van het podium.');
    }

    const dataUrl = await toPng(element, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: '#071C3D',
      filter: (node: Node) => {
        if (node instanceof HTMLElement && node.classList.contains('exclude-from-photo')) {
          return false;
        }
        return true;
      },
    });

    // Check if Clipboard API supports writing images
    if (
      typeof navigator !== 'undefined' &&
      navigator.clipboard &&
      typeof window.ClipboardItem !== 'undefined'
    ) {
      try {
        const clipboardItem = new ClipboardItem({ 'image/png': blob });
        await navigator.clipboard.write([clipboardItem]);
        return {
          success: true,
          method: 'clipboard',
          dataUrl,
          blob,
        };
      } catch (clipboardErr) {
        console.warn('Clipboard write failed, falling back to download:', clipboardErr);
        // Clipboard write failed (e.g. iframe permissions or user gesture timeout). Fallback to file download!
        triggerDownload(dataUrl, fileName);
        return {
          success: true,
          method: 'download',
          dataUrl,
          blob,
          error: 'Klembordtoegang werd beperkt door de browser. De podiumfoto is automatisch gedownload als PNG!',
        };
      }
    } else {
      // Browser doesn't support writing image blobs to clipboard
      triggerDownload(dataUrl, fileName);
      return {
        success: true,
        method: 'download',
        dataUrl,
        blob,
        error: 'Klembord kopiëren wordt niet ondersteund in deze browser. De foto is gedownload als PNG.',
      };
    }
  } catch (err: any) {
    console.error('Error capturing podium:', err);
    return {
      success: false,
      error: err?.message || 'Er trad een fout op bij het maken van de foto.',
    };
  }
}

/**
 * Directly downloads the podium element as a PNG image.
 */
export async function downloadPodiumImage(
  element: HTMLElement,
  fileName: string = 'knack-roeselare-podium.png'
): Promise<CaptureResult> {
  try {
    const dataUrl = await toPng(element, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: '#071C3D',
      filter: (node: Node) => {
        if (node instanceof HTMLElement && node.classList.contains('exclude-from-photo')) {
          return false;
        }
        return true;
      },
    });

    triggerDownload(dataUrl, fileName);
    return { success: true, method: 'download', dataUrl };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Downloaden mislukt.' };
  }
}

function triggerDownload(dataUrl: string, fileName: string) {
  const link = document.createElement('a');
  link.download = fileName;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
