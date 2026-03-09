import os
import resend

resend.api_key = os.getenv("RESEND_API_KEY")
FROM_EMAIL = os.getenv("EMAIL_FROM", "noreply@hengelsport.app")

def send_approval_email(to_email: str, competition_name: str):
    subject = "✅ Goedkeuring inschrijving"
    html = f"""
    <h2>Goedkeuring inschrijving</h2>
    <p>Beste visser,</p>
    <p>Je inschrijving voor de wedstrijd <strong>{competition_name}</strong> is goedgekeurd!</p>
    <p>Je kunt de wedstrijddetails bekijken via de app. Veel plezier!</p>
    <p>Met vriendelijke groet,<br>Hengelsport Wedstrijdmanager</p>
    """
    try:
        resend.Emails.send({
            "from": FROM_EMAIL,
            "to": to_email,
            "subject": subject,
            "html": html
        })
    except Exception as e:
        print(f"Fout bij verzenden e-mail: {e}")

def send_rejection_email(to_email: str, competition_name: str):
    subject = "❌ Afwijzing inschrijving"
    html = f"""
    <h2>Afwijzing inschrijving</h2>
    <p>Beste visser,</p>
    <p>Helaas, je inschrijving voor de wedstrijd <strong>{competition_name}</strong> is afgewezen.</p>
    <p>Dit kan zijn omdat het maximum aantal deelnemers is bereikt of om andere redenen.</p>
    <p>Met vriendelijke groet,<br>Hengelsport Wedstrijdmanager</p>
    """
    try:
        resend.Emails.send({
            "from": FROM_EMAIL,
            "to": to_email,
            "subject": subject,
            "html": html
        })
    except Exception as e:
        print(f"Fout bij verzenden e-mail: {e}")
