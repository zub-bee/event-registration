const nodemailer = require("nodemailer");

// If real SMTP credentials are set in .env, we use them.
// Otherwise we fall back to a "console transport"
function buildTransport() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    return nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT) || 587,
      secure: Number(SMTP_PORT) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
  }

  console.warn(
    "[email] No SMTP_HOST/SMTP_USER/SMTP_PASS set in .env — emails will be logged to the console instead of actually sent. See .env.example.",
  );
  return nodemailer.createTransport({ jsonTransport: true });
}

const transport = buildTransport();

async function sendTicketEmail({ to, fullName, qrCodeBuffer }) {
  const info = await transport.sendMail({
    from: process.env.EMAIL_FROM || "Event Team <no-reply@example.com>",
    to,
    subject: "Your Event Registration & Ticket QR Code",
    text: `Hi ${fullName},\n\nYou're registered! Your QR code ticket is attached, please bring it (on your phone or printed) to be scanned at entry.\n\nSee you there!`,
    html: `<p>Hi ${fullName},</p><p>You're registered! Your QR code ticket is attached below, please bring it (on your phone or printed) to be scanned at entry.</p><p>See you there!</p><img src="cid:ticketqr" alt="Your QR ticket" />`,
    attachments: [
      {
        filename: "ticket-qr.png",
        content: qrCodeBuffer,
        cid: "ticketqr",
      },
    ],
  });

  if (info.message) {
    console.log(`[email] (dev mode) Would send email to ${to}`);
  }

  return info;
}

module.exports = { sendTicketEmail };
