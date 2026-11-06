import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from app.core.config import settings

logger = logging.getLogger(__name__)

class EmailService:
    @staticmethod
    def send_password_reset_email(
        recipient_email: str,
        recipient_name: str,
        reset_token: str
    ) -> bool:
        """
        Sends a responsive HTML password reset email with both deep-link and web-link support.
        Returns True if sent successfully or handled in development mode.
        """
        web_link = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}&email={recipient_email}"
        app_link = f"{settings.APP_DEEP_LINK_SCHEME}://reset-password?token={reset_token}&email={recipient_email}"
        expires_minutes = settings.RESET_TOKEN_EXPIRE_MINUTES

        subject = "StudyMate AI - Reset Your Password"
        
        # HTML Email Body
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>{subject}</title>
          <style>
            body {{
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              background-color: #F8FAFC;
              margin: 0;
              padding: 0;
              color: #1E293B;
            }}
            .container {{
              max-width: 560px;
              margin: 36px auto;
              background: #FFFFFF;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
              border: 1px solid #E2E8F0;
            }}
            .header {{
              background: linear-gradient(135deg, #6C5CE7 0%, #4F46E5 100%);
              padding: 32px 24px;
              text-align: center;
              color: #FFFFFF;
            }}
            .header h1 {{
              margin: 0;
              font-size: 26px;
              font-weight: 700;
              letter-spacing: -0.5px;
            }}
            .content {{
              padding: 36px 32px;
            }}
            .greeting {{
              font-size: 18px;
              font-weight: 600;
              margin-bottom: 12px;
            }}
            .message {{
              font-size: 15px;
              line-height: 1.6;
              color: #475569;
              margin-bottom: 24px;
            }}
            .btn-container {{
              text-align: center;
              margin: 32px 0;
            }}
            .btn {{
              display: inline-block;
              background-color: #6C5CE7;
              color: #FFFFFF !important;
              font-size: 16px;
              font-weight: 600;
              text-decoration: none;
              padding: 14px 32px;
              border-radius: 10px;
              box-shadow: 0 4px 12px rgba(108, 92, 231, 0.3);
            }}
            .app-link-box {{
              background-color: #F1F5F9;
              border-radius: 8px;
              padding: 14px 18px;
              margin-top: 20px;
              font-size: 13px;
              color: #64748B;
              line-height: 1.5;
            }}
            .app-link-box a {{
              color: #6C5CE7;
              word-break: break-all;
            }}
            .notice {{
              font-size: 13px;
              color: #94A3B8;
              margin-top: 28px;
              border-top: 1px solid #F1F5F9;
              padding-top: 18px;
            }}
            .footer {{
              text-align: center;
              padding: 16px;
              font-size: 12px;
              color: #94A3B8;
            }}
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>StudyMate AI</h1>
            </div>
            <div class="content">
              <div class="greeting">Hello {recipient_name or 'Student'},</div>
              <p class="message">
                We received a request to reset the password for your StudyMate AI account.
                Tap the button below to choose a new password:
              </p>
              <div class="btn-container">
                <a href="{web_link}" class="btn" target="_blank">Reset Password</a>
              </div>
              <div class="app-link-box">
                <strong>Opening from mobile app?</strong><br>
                If you have StudyMate AI installed, tap here: <a href="{app_link}">Open in StudyMate AI</a>
              </div>
              <div class="notice">
                • This single-use link expires in <strong>{expires_minutes} minutes</strong>.<br>
                • If you did not request a password reset, you can safely ignore this email — your account remains secure.
              </div>
            </div>
            <div class="footer">
              &copy; 2026 StudyMate AI. All rights reserved.
            </div>
          </div>
        </body>
        </html>
        """

        # Plain Text Fallback
        text_content = f"""
Hello {recipient_name or 'Student'},

We received a request to reset your StudyMate AI password.
Visit this link to choose a new password:
{web_link}

Mobile App Deep Link:
{app_link}

This link expires in {expires_minutes} minutes and can only be used once.
If you did not make this request, you can safely ignore this email.

--
StudyMate AI Team
"""

        # If SMTP is not configured, log and return True (safe fallback in dev/test)
        if not settings.SMTP_HOST or not settings.SMTP_USER:
            logger.info(
                "[EMAIL MOCK] SMTP not configured. Password reset link for %s: %s (token: %s)",
                recipient_email, web_link, reset_token[:8] + "..."
            )
            return True

        # SMTP Sending
        try:
            msg = MIMEMultipart("alternative")
            from_addr = settings.SMTP_FROM_EMAIL or settings.SMTP_USER
            msg["From"] = f"{settings.SMTP_FROM_NAME} <{from_addr}>"
            msg["To"] = recipient_email
            msg["Subject"] = subject

            msg.attach(MIMEText(text_content, "plain"))
            msg.attach(MIMEText(html_content, "html"))

            if settings.SMTP_PORT == 465:
                # SSL
                with smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
                    if settings.SMTP_PASSWORD:
                        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                    server.send_message(msg)
            else:
                # STARTTLS (587 or default)
                with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
                    if settings.SMTP_TLS:
                        server.starttls()
                    if settings.SMTP_PASSWORD:
                        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                    server.send_message(msg)

            logger.info("Password reset email sent to %s", recipient_email)
            return True
        except Exception as e:
            logger.error("Failed to deliver password reset email to %s: %s", recipient_email, e)
            return False

email_service = EmailService()

