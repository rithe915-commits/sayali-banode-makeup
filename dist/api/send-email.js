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
    const {
      type,
      status,
      clientName,
      clientPhone,
      clientEmail,
      eventDate,
      service,
      message,
      notes,
      notificationEmails
    } = req.body || {};

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

    // =========================================================================
    // CASE A: STATUS CHANGE / CONFIRMATION EMAIL TO CUSTOMER
    // =========================================================================
    if (type === 'status_update' || (status && type !== 'new_booking')) {
      if (!clientEmail || typeof clientEmail !== 'string' || !clientEmail.includes('@')) {
        return res.status(200).json({
          success: true,
          skipped: true,
          warning: 'No customer email address on file. Status updated without sending email.'
        });
      }
    }

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

    if (type === 'status_update' || (status && type !== 'new_booking')) {

      const normalizedStatus = (status || 'Confirmed').trim();
      let emailSubject = '';
      let emailHtml = '';

      if (normalizedStatus.toLowerCase() === 'confirmed') {
        emailSubject = `🎉 Booking Confirmed: Sayali Banode Makeup Artist (${eventDate || 'Upcoming'})`;
        emailHtml = `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"></head>
          <body style="margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0c0a09; color: #f4f4f5;">
            <div style="max-width: 600px; margin: 0 auto; background: #1c1917; border: 1px solid #d4af37; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.6);">
              <div style="background: linear-gradient(135deg, #d4af37, #aa820a); padding: 26px 20px; text-align: center; color: #000;">
                <h1 style="margin: 0; font-size: 24px; font-family: Georgia, serif; font-weight: bold;">🎉 Booking Confirmed!</h1>
                <p style="margin: 6px 0 0; font-size: 14px; font-weight: 600;">Sayali Banode Makeup Artist • Amravati</p>
              </div>
              <div style="padding: 26px;">
                <p style="font-size: 15px; line-height: 1.6; color: #e7e5e4;">
                  Dear <strong>${clientName || 'Valued Client'}</strong>,
                </p>
                <p style="font-size: 14px; line-height: 1.6; color: #a8a29e;">
                  We are delighted to confirm your appointment with <strong>Sayali Banode Makeup Artist</strong>! Your slot has been officially scheduled.
                </p>

                <div style="background: #292524; border-left: 4px solid #10b981; padding: 18px; border-radius: 10px; margin: 22px 0;">
                  <div style="display: inline-block; background: #064e3b; color: #34d399; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; padding: 4px 10px; border-radius: 9999px; margin-bottom: 12px; border: 1px solid #059669;">
                    ✓ Status: Confirmed
                  </div>
                  <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                    <tr>
                      <td style="padding: 6px 0; color: #a8a29e; width: 130px;">Client:</td>
                      <td style="padding: 6px 0; color: #fff; font-weight: 600;">${clientName || 'Client'}</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0; color: #a8a29e;">Service:</td>
                      <td style="padding: 6px 0; color: #d4af37; font-weight: bold;">${service || 'Bridal Makeup'}</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0; color: #a8a29e;">Event Date:</td>
                      <td style="padding: 6px 0; color: #fff; font-weight: 600;">📅 ${eventDate}</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0; color: #a8a29e;">Location:</td>
                      <td style="padding: 6px 0; color: #fff;">Amravati, Maharashtra</td>
                    </tr>
                    ${notes || message ? `
                    <tr>
                      <td style="padding: 6px 0; color: #a8a29e; vertical-align: top;">Notes:</td>
                      <td style="padding: 6px 0; color: #e7e5e4;">${notes || message}</td>
                    </tr>` : ''}
                  </table>
                </div>

                <div style="background: #18181b; border: 1px solid #27272a; padding: 16px; border-radius: 10px; margin: 20px 0;">
                  <h4 style="margin: 0 0 8px; color: #d4af37; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">✨ Quick Preparation Tips:</h4>
                  <ul style="margin: 0; padding-left: 18px; font-size: 13px; line-height: 1.6; color: #d4d4d8;">
                    <li>Keep your skin well-hydrated and moisturized prior to the session.</li>
                    <li>Feel free to send outfit photos or hair & makeup references to Sayali in advance.</li>
                    <li>Sayali will touch base before your date to coordinate final setup timings.</li>
                  </ul>
                </div>

                <p style="font-size: 13px; line-height: 1.6; color: #a8a29e; text-align: center; margin-top: 24px;">
                  Have questions or wish to send reference pictures? Reach Sayali directly on WhatsApp:
                </p>

                <div style="text-align: center; margin: 18px 0 10px;">
                  <a href="https://wa.me/917030477747" style="display: inline-block; background: #22c55e; color: #fff; text-decoration: none; padding: 12px 26px; border-radius: 9999px; font-weight: bold; font-size: 14px; margin: 4px;">
                    💬 Chat on WhatsApp (+91 7030477747)
                  </a>
                  <a href="tel:+917030477747" style="display: inline-block; background: #27272a; color: #f4f4f5; text-decoration: none; padding: 12px 22px; border-radius: 9999px; font-weight: 600; font-size: 13px; margin: 4px; border: 1px solid #3f3f46;">
                    📞 Call Studio
                  </a>
                </div>
              </div>
              <div style="background: #141210; padding: 14px; text-align: center; font-size: 11px; color: #78716c; border-top: 1px solid #292524;">
                Sayali Banode Makeup Artist • Amravati, Maharashtra • <a href="https://sayalibanodemakeup.vercel.app" style="color: #d4af37; text-decoration: none;">sayalibanodemakeup.vercel.app</a>
              </div>
            </div>
          </body>
          </html>
        `;
      } else if (normalizedStatus.toLowerCase() === 'completed') {
        emailSubject = `💖 Thank You from Sayali Banode Makeup Artist! How Was Your Experience?`;
        emailHtml = `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"></head>
          <body style="margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0c0a09; color: #f4f4f5;">
            <div style="max-width: 600px; margin: 0 auto; background: #1c1917; border: 1px solid #d4af37; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.6);">
              <div style="background: linear-gradient(135deg, #d4af37, #be185d); padding: 26px 20px; text-align: center; color: #fff;">
                <h1 style="margin: 0; font-size: 24px; font-family: Georgia, serif; font-weight: bold;">💖 Thank You, ${clientName || 'Gorgeous'}!</h1>
                <p style="margin: 6px 0 0; font-size: 14px; font-weight: 500; color: #fde047;">It was an honor being part of your celebration</p>
              </div>
              <div style="padding: 26px;">
                <p style="font-size: 15px; line-height: 1.6; color: #e7e5e4;">
                  Dear <strong>${clientName || 'Valued Client'}</strong>,
                </p>
                <p style="font-size: 14px; line-height: 1.6; color: #a8a29e;">
                  Thank you so much for choosing <strong>Sayali Banode Makeup Artist</strong> for your <strong>${service || 'makeup look'}</strong> on <strong>${eventDate}</strong>!
                </p>
                <p style="font-size: 14px; line-height: 1.6; color: #a8a29e;">
                  We truly hope you loved your makeover and felt radiant, confident, and beautiful. Working with you was an absolute joy!
                </p>

                <!-- Review Callout Box -->
                <div style="background: #271e16; border: 1px solid #d4af37; padding: 20px; border-radius: 12px; margin: 24px 0; text-align: center;">
                  <h3 style="margin: 0 0 8px; color: #d4af37; font-size: 17px; font-family: Georgia, serif;">⭐ How Did We Do?</h3>
                  <p style="margin: 0 0 16px; font-size: 13px; line-height: 1.5; color: #d6d3d1;">
                    Your feedback means the world to our studio and helps other future brides and clients in Amravati find us!
                  </p>
                  <a href="https://sayalibanodemakeup.vercel.app/review" style="display: inline-block; background: linear-gradient(135deg, #d4af37, #aa820a); color: #000; text-decoration: none; padding: 12px 28px; border-radius: 9999px; font-weight: bold; font-size: 14px; box-shadow: 0 4px 12px rgba(212,175,55,0.3);">
                    ⭐ Leave a Review & Rating
                  </a>
                </div>

                <div style="text-align: center; margin-top: 20px;">
                  <p style="font-size: 13px; line-height: 1.5; color: #a8a29e; margin-bottom: 12px;">
                    Have event photos or candid shots you'd love to share? Send them to Sayali on WhatsApp!
                  </p>
                  <a href="https://wa.me/917030477747" style="display: inline-block; background: #22c55e; color: #fff; text-decoration: none; padding: 10px 22px; border-radius: 9999px; font-weight: 600; font-size: 13px;">
                    📸 Share Photos on WhatsApp (+91 7030477747)
                  </a>
                </div>
              </div>
              <div style="background: #141210; padding: 14px; text-align: center; font-size: 11px; color: #78716c; border-top: 1px solid #292524;">
                Sayali Banode Makeup Artist • Amravati, Maharashtra • <a href="https://sayalibanodemakeup.vercel.app" style="color: #d4af37; text-decoration: none;">sayalibanodemakeup.vercel.app</a>
              </div>
            </div>
          </body>
          </html>
        `;
      } else if (normalizedStatus.toLowerCase() === 'cancelled') {
        emailSubject = `Notice: Appointment Status - Sayali Banode Makeup Artist`;
        emailHtml = `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"></head>
          <body style="margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0c0a09; color: #f4f4f5;">
            <div style="max-width: 600px; margin: 0 auto; background: #1c1917; border: 1px solid #78716c; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.6);">
              <div style="background: linear-gradient(135deg, #44403c, #1c1917); padding: 24px 20px; text-align: center; color: #fff; border-bottom: 1px solid #57534e;">
                <h1 style="margin: 0; font-size: 22px; font-family: Georgia, serif; font-weight: bold;">Appointment Update</h1>
                <p style="margin: 6px 0 0; font-size: 13px; color: #a8a29e;">Sayali Banode Makeup Artist • Amravati</p>
              </div>
              <div style="padding: 26px;">
                <p style="font-size: 15px; line-height: 1.6; color: #e7e5e4;">
                  Dear <strong>${clientName || 'Valued Client'}</strong>,
                </p>
                <p style="font-size: 14px; line-height: 1.6; color: #a8a29e;">
                  This is a notification to confirm that your appointment request for <strong>${service || 'Makeup Service'}</strong> on <strong>${eventDate}</strong> has been marked as <strong>Cancelled</strong>.
                </p>
                <div style="background: #292524; border-left: 4px solid #ef4444; padding: 14px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0; font-size: 13px; color: #fca5a5;">
                    Status: <strong>Cancelled</strong>
                  </p>
                  ${notes || message ? `<p style="margin: 6px 0 0; font-size: 13px; color: #e7e5e4;">Note: ${notes || message}</p>` : ''}
                </div>
                <p style="font-size: 13px; line-height: 1.6; color: #a8a29e;">
                  If your plans have changed or you cancelled this booking, no further action is required. If you believe this cancellation was made in error or would like to reschedule for a different date, please feel free to reach out directly:
                </p>
                <div style="text-align: center; margin: 22px 0 10px;">
                  <a href="https://wa.me/917030477747" style="display: inline-block; background: #22c55e; color: #fff; text-decoration: none; padding: 11px 24px; border-radius: 9999px; font-weight: bold; font-size: 13px;">
                    💬 Contact on WhatsApp (+91 7030477747)
                  </a>
                </div>
              </div>
              <div style="background: #141210; padding: 14px; text-align: center; font-size: 11px; color: #78716c; border-top: 1px solid #292524;">
                Sayali Banode Makeup Artist • Amravati, Maharashtra • <a href="https://sayalibanodemakeup.vercel.app" style="color: #d4af37; text-decoration: none;">sayalibanodemakeup.vercel.app</a>
              </div>
            </div>
          </body>
          </html>
        `;
      } else {
        // Pending or any other status
        emailSubject = `Appointment Status Update: ${normalizedStatus} - Sayali Banode Makeup Artist`;
        emailHtml = `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"></head>
          <body style="margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0c0a09; color: #f4f4f5;">
            <div style="max-width: 600px; margin: 0 auto; background: #1c1917; border: 1px solid #d4af37; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.6);">
              <div style="background: linear-gradient(135deg, #d4af37, #aa820a); padding: 24px 20px; text-align: center; color: #000;">
                <h1 style="margin: 0; font-size: 22px; font-family: Georgia, serif; font-weight: bold;">Appointment Status Update</h1>
                <p style="margin: 4px 0 0; font-size: 13px; font-weight: 600;">Sayali Banode Makeup Artist • Amravati</p>
              </div>
              <div style="padding: 26px;">
                <p style="font-size: 15px; line-height: 1.6; color: #e7e5e4;">
                  Dear <strong>${clientName || 'Valued Client'}</strong>,
                </p>
                <p style="font-size: 14px; line-height: 1.6; color: #a8a29e;">
                  The status of your appointment for <strong>${service || 'Makeup Service'}</strong> on <strong>${eventDate}</strong> has been updated to:
                </p>
                <div style="background: #292524; border-left: 4px solid #d4af37; padding: 14px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0; font-size: 14px; color: #d4af37; font-weight: bold;">
                    Status: ${normalizedStatus}
                  </p>
                  ${notes || message ? `<p style="margin: 6px 0 0; font-size: 13px; color: #e7e5e4;">Note: ${notes || message}</p>` : ''}
                </div>
                <div style="text-align: center; margin: 22px 0 10px;">
                  <a href="https://wa.me/917030477747" style="display: inline-block; background: #22c55e; color: #fff; text-decoration: none; padding: 11px 24px; border-radius: 9999px; font-weight: bold; font-size: 13px;">
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
        `;
      }

      const clientMailOptions = {
        from: `"Sayali Banode Makeup" <${senderEmail}>`,
        to: clientEmail,
        bcc: toRecipients.join(', '),
        replyTo: senderEmail,
        subject: emailSubject,
        html: emailHtml
      };

      await transporter.sendMail(clientMailOptions);
      return res.status(200).json({
        success: true,
        message: `Status notification email (${normalizedStatus}) sent successfully to ${clientEmail}`
      });
    }

    // =========================================================================
    // CASE B: NEW BOOKING REQUEST (Submitted from website or added in Admin)
    // =========================================================================
    if (!clientName || !clientPhone || !eventDate) {
      return res.status(400).json({ error: 'Missing required booking fields (clientName, clientPhone, eventDate)' });
    }

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

    // 2. Send Receipt Confirmation Email to Client (if email was provided)
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
