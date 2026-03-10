import smtplib
from email.mime.text import MIMEText
import os

SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")


def send_email(to_email, subject, message):

    if not SMTP_USER or not SMTP_PASSWORD:
        print("Email niet ingesteld")
        return

    msg = MIMEText(message)
    msg["Subject"] = subject
    msg["From"] = SMTP_USER
    msg["To"] = to_email

    try:
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.sendmail(SMTP_USER, to_email, msg.as_string())
        server.quit()

    except Exception as e:
        print("Email fout:", e)


def send_approval_email(email, competition_name):

    subject = "Je inschrijving is goedgekeurd"

    message = f"""
Je bent goedgekeurd voor de wedstrijd:

{competition_name}

Tot dan!
"""

    send_email(email, subject, message)


def send_rejection_email(email, competition_name):

    subject = "Je inschrijving is afgewezen"

    message = f"""
Je inschrijving voor:

{competition_name}

is helaas afgewezen.
"""

    send_email(email, subject, message)
