import os
import re
import logging
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from collections import deque

logger = logging.getLogger(__name__)

SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM = os.getenv("SMTP_FROM", "Security Scanner <noreply@localhost>")

# In-memory log of recent dev emails (last 50) for the /api/dev/emails endpoint
_dev_email_log: deque = deque(maxlen=50)


def _extract_action_url(html: str) -> str | None:
    """Pull the first href that looks like an action link from the HTML body."""
    m = re.search(r'href=["\']([^"\']*(?:verify|reset|action)[^"\']*)["\']', html, re.IGNORECASE)
    return m.group(1) if m else None


async def send_email(to: str, subject: str, html_body: str):
    action_url = _extract_action_url(html_body)

    if not SMTP_HOST or not SMTP_USER:
        # Dev mode: print the link visibly to the console
        border = "=" * 70
        print(f"\n{border}")
        print(f"  [DEV EMAIL] To: {to}")
        print(f"  Subject: {subject}")
        if action_url:
            print(f"  Action URL:")
            print(f"  {action_url}")
        print(f"{border}\n", flush=True)

        _dev_email_log.appendleft({
            "to": to,
            "subject": subject,
            "action_url": action_url,
        })
        return

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = SMTP_FROM
    msg["To"] = to

    plain = f"Please view this email in an HTML-capable client.\n\nLink: {action_url or ''}"
    msg.attach(MIMEText(plain, "plain"))
    msg.attach(MIMEText(html_body, "html"))

    await aiosmtplib.send(
        msg,
        hostname=SMTP_HOST,
        port=SMTP_PORT,
        username=SMTP_USER,
        password=SMTP_PASSWORD,
        start_tls=True,
    )
    logger.info(f"Email sent: '{subject}' to {to}")
