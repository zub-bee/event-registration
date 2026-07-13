const QRCode = require("qrcode");

// Generates a QR code PNG (as a Buffer) that encodes the registrant's
// unique token. This is the same token stored in the database and
// checked at scan time.
async function generateQRCodeBuffer(token) {
  return QRCode.toBuffer(token, {
    type: "png",
    width: 400,
    margin: 2,
  });
}

module.exports = { generateQRCodeBuffer };
