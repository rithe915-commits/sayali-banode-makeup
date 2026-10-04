const nodemailer = require('nodemailer');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { clientName, clientPhone, clientEmail, eventDate, service, message, notificationEmails } = req.body || {};

    if (!clientName || !clientPhone || !eventDate) {
      return res.status(400).json({ error: 'Missing required booking fields (clientName, clientPhone, eventDate)' });
    }

    const senderEmail = (
      process.env.GMAIL_USER ||
      process.env.EMAIL_USER ||
      process.env.SMTP_USER ||
      'rivasatechnologies@gmail.com'
    ).trim();

    // Collect recipient notification emails (Sayali's emails, up to 5)
    let recipients = [];
    if (Array.isArray(notificationEmails) && notificationEmails.length > 0) {
      recipients = notificationEmails
        .map(e => (typeof e === 'string' ? e.trim().toLowerCase() : ''))
        .filter(e => e.includes('@') && e.includes('.'))
        .slice(0, 5);
    }
    if (recipients.length === 0) {
      recipients = [senderEmail];
    }
    const toRecipients = Array.from(new Set(recipients)).slice(0, 5);

    const appPassword = (
      process.env.GMAIL_APP_PASSWORD ||
      process.env.EMAIL_APP_PASSWORD ||
      process.env.GMAIL_PASSWORD ||
      process.env.EMAIL_PASSWORD ||
      process.env.SMTP_PASSWORD ||
      process.env.APP_PASSWORD ||
      process.env.GMAIL_PASS ||
      process.env.EMAIL_PASS ||
      ''
    ).replace(/\s+/g, '');

    if (!appPassword) {
      console.warn("Gmail App Password not found in Vercel environment variables.");
      return res.status(200).json({
        warning: 'App Password not configured in Vercel environment variables',
        saved: true
      });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: senderEmail,
        pass: appPassword
      }
    });

    const cleanPhone = (clientPhone || '').replace(/[^0-9]/g, '');

    // 1. Send Email to Sayali / Admin (up to 5 notification recipients)
    const adminMailOptions = {
      from: `"Sayali Banode Makeup" <${senderEmail}>`,
      to: toRecipients.join(', '),
      replyTo: clientEmail || senderEmail,
      subject: `✨ New Appointment Request: ${clientName} - ${service || 'Bridal Makeup'}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0c0a09; color: #f4f4f5;">
          <div style="max-width: 600px; margin: 0 auto; background: #1c1917; border: 1px solid #d4af37; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.6);">
            <div style="background: linear-gradient(135deg, #d4af37, #aa820a); padding: 24px; text-align: center; color: #000;">
              <h1 style="margin: 0; font-size: 24px; font-family: Georgia, serif; font-weight: bold;">✨ New Booking Request</h1>
              <p style="margin: 4px 0 0; font-size: 14px; font-weight: 600;">Sayali Banode Makeup Artist • Amravati</p>
            </div>
            <div style="padding: 26px;">
              <p style="font-size: 15px; line-height: 1.5; color: #e7e5e4;">
                A new appointment booking has been submitted on your website:
              </p>
              <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #292524; color: #a8a29e; width: 140px;">Client Name:</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #292524; color: #fff; font-weight: bold;">${clientName}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #292524; color: #a8a29e;">Phone Number:</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #292524; color: #d4af37; font-weight: bold;">
                    <a href="tel:${clientPhone}" style="color: #d4af37; text-decoration: none;">${clientPhone}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #292524; color: #a8a29e;">Client Email:</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #292524; color: #fff;">${clientEmail || 'Not provided'}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #292524; color: #a8a29e;">Event Date:</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #292524; color: #d4af37; font-weight: bold; font-size: 15px;">${eventDate}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #292524; color: #a8a29e;">Service:</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #292524; color: #fff; font-weight: bold;">${service || 'Bridal Makeup'}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #292524; color: #a8a29e;">Requirements:</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #292524; color: #e7e5e4;">${message || 'None'}</td>
                </tr>
              </table>
              <div style="text-align: center; margin-top: 26px;">
                <a href="https://wa.me/${cleanPhone}" style="display: inline-block; background: #22c55e; color: #fff; text-decoration: none; padding: 12px 22px; border-radius: 9999px; font-weight: bold; font-size: 13px; margin: 4px;">
                  💬 Open WhatsApp Chat
                </a>
                <a href="https://sayalibanodemakeup.vercel.app/admin" style="display: inline-block; background: #d4af37; color: #000; text-decoration: none; padding: 12px 22px; border-radius: 9999px; font-weight: bold; font-size: 13px; margin: 4px;">
                  🔒 View Admin Dashboard
                </a>
              </div>
            </div>
            <div style="background: #141210; padding: 14px; text-align: center; font-size: 11px; color: #78716c; border-top: 1px solid #292524;">
              Sayali Banode Makeup Artist • Amravati, Maharashtra
            </div>
          </div>
        </body>
        </html>
      `
    };

    const promises = [transporter.sendMail(adminMailOptions)];

    // 2. Send Confirmation Email to Client (if email was provided)
    if (clientEmail && clientEmail.includes('@')) {
      const clientMailOptions = {
        from: `"Sayali Banode Makeup" <${senderEmail}>`,
        to: clientEmail,
        subject: `✨ Booking Received: Sayali Banode Makeup Artist`,
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"></head>
          <body style="margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0c0a09; color: #f4f4f5;">
            <div style="max-width: 600px; margin: 0 auto; background: #1c1917; border: 1px solid #d4af37; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.6);">
              <div style="background: linear-gradient(135deg, #d4af37, #aa820a); padding: 26px 20px; text-align: center; color: #000;">
                <h1 style="margin: 0; font-size: 24px; font-family: Georgia, serif; font-weight: bold;">✨ Thank You, ${clientName}!</h1>
                <p style="margin: 4px 0 0; font-size: 14px; font-weight: 600;">Your Appointment Request Has Been Received</p>
              </div>
              <div style="padding: 26px;">
                <p style="font-size: 15px; line-height: 1.6; color: #e7e5e4;">
                  Dear <strong>${clientName}</strong>,
                </p>
                <p style="font-size: 14px; line-height: 1.6; color: #a8a29e;">
                  Thank you for choosing <strong>Sayali Banode Makeup Artist</strong> for your special occasion! We have safely received your details. Sayali will review your requested date and get in touch with you shortly to confirm timings and discuss your look.
                </p>
                <div style="background: #292524; border-left: 4px solid #d4af37; padding: 16px; border-radius: 8px; margin: 22px 0;">
                  <h3 style="margin: 0 0 10px; color: #d4af37; font-size: 15px;">Your Booking Summary:</h3>
                  <p style="margin: 4px 0; color: #e7e5e4; font-size: 14px;"><strong>Service:</strong> ${service || 'Bridal Makeup'}</p>
                  <p style="margin: 4px 0; color: #e7e5e4; font-size: 14px;"><strong>Event Date:</strong> ${eventDate}</p>
                  <p style="margin: 4px 0; color: #e7e5e4; font-size: 14px;"><strong>Studio Location:</strong> Amravati, Maharashtra</p>
                </div>
                <p style="font-size: 13px; line-height: 1.6; color: #a8a29e;">
                  Need an urgent answer or wish to send reference styles? You can reach Sayali directly on WhatsApp at any time:
                </p>
                <div style="text-align: center; margin: 24px 0 8px;">
                  <a href="https://wa.me/917030477747" style="display: inline-block; background: #22c55e; color: #fff; text-decoration: none; padding: 12px 26px; border-radius: 9999px; font-weight: bold; font-size: 14px;">
                    💬 Chat on WhatsApp (+91 7030477747)
                  </a>
                </div>
              </div>
              <div style="background: #141210; padding: 14px; text-align: center; font-size: 11px; color: #78716c; border-top: 1px solid #292524;">
                Sayali Banode Makeup Artist • Amravati, Maharashtra • <a href="https://sayalibanodemakeup.vercel.app" style="color: #d4af37; text-decoration: none;">sayalibanodemakeup.vercel.app</a>
              </div>
            </div>
          </body>
          </html>
        `
      };
      promises.push(transporter.sendMail(clientMailOptions));
    }

    await Promise.all(promises);

    return res.status(200).json({ success: true, message: 'Emails delivered successfully' });
  } catch (error) {
    console.error('Email sending error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error while sending email' });
  }
};
