import logging
import smtplib
import ssl
from email.message import EmailMessage
from html import escape

from config import settings


logger = logging.getLogger(__name__)


class EmailDeliveryError(RuntimeError):
    pass


def send_password_reset_email(to_email: str, reset_url: str) -> None:
    if not settings.smtp_ready:
        raise EmailDeliveryError(
            "SMTP is not ready. Add the Gmail App Password to SMTP_PASSWORD."
        )

    message = EmailMessage()
    message["Subject"] = "Reset your PaddyScan password"
    message["From"] = settings.smtp_from
    message["To"] = to_email
    message.set_content(
        f"""Reset your PaddyScan password using this link:

{reset_url}

This link expires in {settings.password_reset_minutes} minutes and can only be used once.

If you did not request this password reset, you can safely ignore this email.
"""
    )

    safe_url = escape(reset_url, quote=True)
    message.add_alternative(
        f"""<!doctype html>
<html lang="en">
  <body style="margin:0;background:#f4f6ef;font-family:Arial,sans-serif;color:#17352c">
    <div style="max-width:560px;margin:0 auto;padding:42px 20px">
      <div style="border:1px solid #dfe5d8;border-radius:18px;background:#ffffff;padding:34px">
        <p style="margin:0 0 14px;color:#285d45;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase">PaddyScan security</p>
        <h1 style="margin:0;font-size:27px;line-height:1.2">Reset your password</h1>
        <p style="margin:18px 0 0;color:#5d7069;font-size:15px;line-height:1.65">We received a request to reset your PaddyScan password.</p>
        <p style="margin:28px 0">
          <a href="{safe_url}" style="display:inline-block;border-radius:9px;background:#285d45;padding:14px 21px;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none">Choose a new password</a>
        </p>
        <p style="margin:0;color:#71817b;font-size:12px;line-height:1.6">This link expires in {settings.password_reset_minutes} minutes and can only be used once.</p>
        <p style="margin:16px 0 0;color:#71817b;font-size:12px;line-height:1.6">If you did not request this reset, you can safely ignore this email. Your password has not been changed.</p>
      </div>
    </div>
  </body>
</html>""",
        subtype="html",
    )

    tls_context = ssl.create_default_context()
    try:
        if settings.smtp_use_ssl:
            with smtplib.SMTP_SSL(
                settings.smtp_host,
                settings.smtp_port,
                timeout=15,
                context=tls_context,
            ) as server:
                server.login(settings.smtp_username, settings.smtp_password)
                server.send_message(message)
        else:
            with smtplib.SMTP(
                settings.smtp_host,
                settings.smtp_port,
                timeout=15,
            ) as server:
                server.ehlo()
                server.starttls(context=tls_context)
                server.ehlo()
                server.login(settings.smtp_username, settings.smtp_password)
                server.send_message(message)
    except (OSError, smtplib.SMTPException) as exc:
        logger.exception("SMTP password-reset delivery failed for %s", to_email)
        raise EmailDeliveryError(
            "The password-reset email could not be delivered."
        ) from exc
