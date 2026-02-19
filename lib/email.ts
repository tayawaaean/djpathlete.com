import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ?? "DJP Athlete <noreply@djpathlete.com>"

function getBaseUrl() {
  return (
    process.env.NEXTAUTH_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000"
  )
}

/** Shared email wrapper with branded header + footer */
function emailLayout(content: string) {
  const baseUrl = getBaseUrl()
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>DJP Athlete</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin:0; padding:0; background-color:#f4f4f5; -webkit-font-smoothing:antialiased; -moz-osx-font-smoothing:grayscale;">

  <!-- Outer wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f4f5;">
    <tr>
      <td align="center" style="padding:40px 16px;">

        <!-- Email container -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; width:100%; background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.06);">

          <!-- ===== HEADER ===== -->
          <tr>
            <td style="background: linear-gradient(135deg, #0E3F50 0%, #145569 100%); padding:40px 48px; text-align:center;">
              <!-- Logo text -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <h1 style="margin:0; font-family:'Trebuchet MS', Helvetica, Arial, sans-serif; font-size:32px; font-weight:700; color:#ffffff; letter-spacing:3px; text-transform:uppercase;">
                      DJP ATHLETE
                    </h1>
                    <p style="margin:6px 0 0; font-family:Georgia, 'Times New Roman', serif; font-size:13px; color:#C49B7A; letter-spacing:2px; text-transform:uppercase;">
                      Elite Performance Coaching
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ===== BODY ===== -->
          <tr>
            <td style="padding:0;">
              ${content}
            </td>
          </tr>

          <!-- ===== FOOTER ===== -->
          <tr>
            <td style="background-color:#0E3F50; padding:32px 48px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <!-- Footer links -->
                <tr>
                  <td align="center" style="padding-bottom:20px;">
                    <a href="${baseUrl}/programs" style="display:inline-block; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size:12px; color:#C49B7A; text-decoration:none; padding:0 12px;">Programs</a>
                    <span style="color:#1a5568;">|</span>
                    <a href="${baseUrl}/online" style="display:inline-block; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size:12px; color:#C49B7A; text-decoration:none; padding:0 12px;">Online Coaching</a>
                    <span style="color:#1a5568;">|</span>
                    <a href="${baseUrl}/blog" style="display:inline-block; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size:12px; color:#C49B7A; text-decoration:none; padding:0 12px;">Blog</a>
                    <span style="color:#1a5568;">|</span>
                    <a href="${baseUrl}/contact" style="display:inline-block; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size:12px; color:#C49B7A; text-decoration:none; padding:0 12px;">Contact</a>
                  </td>
                </tr>
                <!-- Divider -->
                <tr>
                  <td style="border-top:1px solid #1a5568; padding-top:20px;" align="center">
                    <p style="margin:0 0 6px; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size:12px; color:#7faab8;">
                      &copy; ${new Date().getFullYear()} DJP Athlete. All rights reserved.
                    </p>
                    <p style="margin:0; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size:11px; color:#4a8494;">
                      <a href="${baseUrl}/privacy-policy" style="color:#4a8494; text-decoration:underline;">Privacy Policy</a>
                      &nbsp;&bull;&nbsp;
                      <a href="${baseUrl}/terms-of-service" style="color:#4a8494; text-decoration:underline;">Terms of Service</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
        <!-- /Email container -->

      </td>
    </tr>
  </table>
  <!-- /Outer wrapper -->

</body>
</html>`
}

export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string,
  firstName: string
) {
  const html = emailLayout(`
    <!-- Content padding -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="padding:40px 48px 48px;">

          <p style="margin:0 0 20px; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size:18px; font-weight:600; color:#0E3F50;">
            Hi ${firstName},
          </p>

          <p style="margin:0 0 24px; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size:15px; color:#555; line-height:1.7;">
            We received a request to reset the password for your DJP Athlete account. Click the button below to set a new password.
          </p>

          <!-- CTA Button -->
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 32px;">
            <tr>
              <td align="center" style="background-color:#C49B7A; border-radius:8px;">
                <a href="${resetUrl}" target="_blank" style="display:inline-block; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size:15px; font-weight:600; color:#ffffff; text-decoration:none; padding:14px 40px; border-radius:8px;">
                  Reset My Password
                </a>
              </td>
            </tr>
          </table>

          <!-- Security note -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f8f9fa; border-radius:8px; border-left:4px solid #C49B7A;">
            <tr>
              <td style="padding:16px 20px;">
                <p style="margin:0 0 4px; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size:13px; font-weight:600; color:#0E3F50;">
                  Security Notice
                </p>
                <p style="margin:0; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size:13px; color:#666; line-height:1.6;">
                  This link expires in <strong>1 hour</strong>. If you didn&rsquo;t request this reset, you can safely ignore this email &mdash; your password will remain unchanged.
                </p>
              </td>
            </tr>
          </table>

          <!-- Fallback link -->
          <p style="margin:24px 0 0; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size:12px; color:#999; line-height:1.6;">
            Button not working? Copy and paste this link into your browser:<br />
            <a href="${resetUrl}" style="color:#0E3F50; word-break:break-all;">${resetUrl}</a>
          </p>

        </td>
      </tr>
    </table>
  `)

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "Reset your DJP Athlete password",
    html,
  })

  if (error) {
    console.error("Failed to send password reset email:", error)
    throw new Error("Failed to send email")
  }
}

export async function sendVerificationEmail(
  to: string,
  verifyUrl: string,
  firstName: string
) {
  const html = emailLayout(`
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="padding:40px 48px 48px;">

          <p style="margin:0 0 20px; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size:18px; font-weight:600; color:#0E3F50;">
            Hi ${firstName},
          </p>

          <p style="margin:0 0 24px; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size:15px; color:#555; line-height:1.7;">
            Thanks for signing up. Please verify your email address by clicking the button below.
          </p>

          <!-- CTA Button -->
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 32px;">
            <tr>
              <td align="center" style="background-color:#C49B7A; border-radius:8px;">
                <a href="${verifyUrl}" target="_blank" style="display:inline-block; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size:15px; font-weight:600; color:#ffffff; text-decoration:none; padding:14px 40px; border-radius:8px;">
                  Verify Email
                </a>
              </td>
            </tr>
          </table>

          <p style="margin:0 0 24px; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size:13px; color:#999; line-height:1.6;">
            This link expires in <strong>24 hours</strong>. If you didn&rsquo;t create this account, you can safely ignore this email.
          </p>

          <!-- Fallback link -->
          <p style="margin:0; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size:12px; color:#999; line-height:1.6;">
            Button not working? Copy and paste this link into your browser:<br />
            <a href="${verifyUrl}" style="color:#0E3F50; word-break:break-all;">${verifyUrl}</a>
          </p>

        </td>
      </tr>
    </table>
  `)

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "Verify your DJP Athlete email",
    html,
  })

  if (error) {
    console.error("Failed to send verification email:", error)
    throw new Error("Failed to send email")
  }
}

export async function sendWelcomeEmail(to: string, firstName: string) {
  const baseUrl = getBaseUrl()

  const html = emailLayout(`
    <!-- Hero welcome banner -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="background: linear-gradient(180deg, #0E3F50 0%, #145569 100%); padding:44px 48px; text-align:center;">
          <p style="margin:0 0 6px; font-family:Georgia, 'Times New Roman', serif; font-size:14px; color:#C49B7A; letter-spacing:1.5px; text-transform:uppercase;">
            Welcome to the team
          </p>
          <h2 style="margin:0; font-family:'Trebuchet MS', Helvetica, Arial, sans-serif; font-size:30px; font-weight:700; color:#ffffff;">
            You&rsquo;re in, ${firstName}!
          </h2>
        </td>
      </tr>
    </table>

    <!-- Main content -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="padding:40px 48px 28px;">

          <p style="margin:0 0 24px; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size:16px; color:#333; line-height:1.8;">
            Your email is verified and your account is fully activated. Welcome to DJP Athlete &mdash; the platform built for athletes who are serious about performance.
          </p>

          <p style="margin:0 0 8px; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size:15px; color:#555; line-height:1.7;">
            Whether you&rsquo;re training in-person, coaching online, or coming back from injury &mdash; we&rsquo;ve got you covered.
          </p>

        </td>
      </tr>
    </table>

    <!-- Divider -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="padding:0 48px;">
          <div style="border-top:1px solid #e8e8e8;"></div>
        </td>
      </tr>
    </table>

    <!-- What's waiting for you -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="padding:32px 48px 8px;">
          <h3 style="margin:0 0 24px; font-family:'Trebuchet MS', Helvetica, Arial, sans-serif; font-size:18px; font-weight:700; color:#0E3F50; text-transform:uppercase; letter-spacing:1px;">
            What&rsquo;s waiting for you
          </h3>
        </td>
      </tr>
    </table>

    <!-- Feature cards -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="padding:0 48px 12px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f8fafb; border-radius:12px; border-left:4px solid #0E3F50;">
            <tr>
              <td style="padding:20px 24px;">
                <p style="margin:0 0 4px; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size:15px; font-weight:700; color:#0E3F50;">
                  Personalized Programs
                </p>
                <p style="margin:0; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size:14px; color:#666; line-height:1.6;">
                  Access training programs designed around your sport, position, and goals.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:0 48px 12px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f8fafb; border-radius:12px; border-left:4px solid #C49B7A;">
            <tr>
              <td style="padding:20px 24px;">
                <p style="margin:0 0 4px; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size:15px; font-weight:700; color:#0E3F50;">
                  Expert Coaching
                </p>
                <p style="margin:0; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size:14px; color:#666; line-height:1.6;">
                  Get guidance from experienced coaches &mdash; in-person or online, wherever you train.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:0 48px 12px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f8fafb; border-radius:12px; border-left:4px solid #0E3F50;">
            <tr>
              <td style="padding:20px 24px;">
                <p style="margin:0 0 4px; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size:15px; font-weight:700; color:#0E3F50;">
                  Performance Tracking
                </p>
                <p style="margin:0; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size:14px; color:#666; line-height:1.6;">
                  Track your progress with data-driven assessments and benchmarks.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Get started CTA -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="padding:32px 48px 8px; text-align:center;">
          <p style="margin:0 0 20px; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size:16px; font-weight:600; color:#333;">
            Ready to get started?
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
            <tr>
              <td align="center" style="background: linear-gradient(135deg, #C49B7A 0%, #d4ab8a 100%); border-radius:10px; box-shadow:0 4px 14px rgba(196,155,122,0.35);">
                <a href="${baseUrl}/dashboard" target="_blank" style="display:inline-block; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size:16px; font-weight:700; color:#ffffff; text-decoration:none; padding:16px 48px; border-radius:10px; letter-spacing:0.5px;">
                  Go to My Dashboard
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Explore links -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="padding:24px 48px 40px; text-align:center;">
          <p style="margin:0 0 16px; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size:14px; color:#777;">
            Or explore what we offer:
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
            <tr>
              <td style="padding:0 6px;">
                <a href="${baseUrl}/programs" style="display:inline-block; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size:13px; font-weight:600; color:#0E3F50; text-decoration:none; padding:10px 22px; border:2px solid #0E3F50; border-radius:8px;">
                  Browse Programs
                </a>
              </td>
              <td style="padding:0 6px;">
                <a href="${baseUrl}/online" style="display:inline-block; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size:13px; font-weight:600; color:#0E3F50; text-decoration:none; padding:10px 22px; border:2px solid #0E3F50; border-radius:8px;">
                  Online Coaching
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `)

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "Welcome to DJP Athlete — Let's Get Started",
    html,
  })

  if (error) {
    console.error("Failed to send welcome email:", error)
    throw new Error("Failed to send email")
  }
}
