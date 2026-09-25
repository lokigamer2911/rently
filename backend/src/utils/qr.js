/**
 * QR rendering for the UPI deep link.
 *
 * `qrcode` is loaded lazily and defensively: if the dependency has not been
 * installed yet the whole payment flow must still work, so callers get `null`
 * and fall back to the "Open UPI app" deep-link button.
 */

let qrCodeLib;
let loadAttempted = false;

function loadLib() {
  if (loadAttempted) return qrCodeLib;
  loadAttempted = true;
  try {
    // eslint-disable-next-line global-require
    qrCodeLib = require('qrcode');
  } catch (error) {
    console.warn(
      'Optional dependency "qrcode" is not installed — UPI QRs will not be rendered as images. '
      + 'Run `npm install` in backend/ to enable them.',
    );
    qrCodeLib = null;
  }
  return qrCodeLib;
}

/**
 * Render `text` as a PNG data URL.
 * @returns {Promise<string|null>} data URL, or null when rendering is unavailable.
 */
async function toDataUrl(text) {
  if (!text) return null;
  const lib = loadLib();
  if (!lib) return null;

  try {
    return await lib.toDataURL(text, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 512,
      color: { dark: '#0f172a', light: '#ffffff' },
    });
  } catch (error) {
    console.warn(`Failed to render UPI QR: ${error.message}`);
    return null;
  }
}

module.exports = { toDataUrl };
