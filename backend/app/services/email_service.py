"""Email service for DCCheck.

Provides async SMTP sending via aiosmtplib with HTML message support.
All SMTP errors are caught and logged so that a mail outage never crashes
the API.
"""
from __future__ import annotations

import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import aiosmtplib

from app.config import settings

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Low-level helper
# ---------------------------------------------------------------------------

async def send_email(to: str, subject: str, body: str) -> None:
    """Send an HTML e-mail to *to* with the given *subject* and HTML *body*.

    Connects to the SMTP server configured in ``settings``, sends the
    message, and disconnects.  Any exception is caught, logged as an error,
    and swallowed so that callers are not affected by transient mail issues.
    """
    message = MIMEMultipart("alternative")
    message["Subject"] = subject
    message["From"] = settings.SMTP_FROM
    message["To"] = to
    message.attach(MIMEText(body, "html", "utf-8"))

    try:
        await aiosmtplib.send(
            message,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USER or None,
            password=settings.SMTP_PASSWORD or None,
            # Use STARTTLS when the port is the standard submission port (587).
            # For port 465 (implicit TLS) set use_tls=True instead.
            start_tls=(settings.SMTP_PORT == 587),
            use_tls=(settings.SMTP_PORT == 465),
        )
        logger.info("E-mail sent to %s | subject: %s", to, subject)
    except aiosmtplib.SMTPException as exc:
        logger.error(
            "SMTP error while sending to %s | subject: %s | error: %s",
            to,
            subject,
            exc,
        )
    except OSError as exc:
        logger.error(
            "Network error while connecting to SMTP %s:%s | error: %s",
            settings.SMTP_HOST,
            settings.SMTP_PORT,
            exc,
        )
    except Exception as exc:  # pragma: no cover – unexpected
        logger.exception(
            "Unexpected error while sending e-mail to %s: %s", to, exc
        )


# ---------------------------------------------------------------------------
# Domain-specific helpers
# ---------------------------------------------------------------------------

async def send_falha_notification(
    gestor_email: str,
    sala_nome: str,
    item_identificador: str,
    tecnico_username: str,
    observacao: str,
    data_hora: str,
) -> None:
    """Notify the gestor about a failure detected during a ronda.

    Args:
        gestor_email: Destination address of the manager to be notified.
        sala_nome: Human-readable name of the room where the failure occurred.
        item_identificador: Identifier string of the failing item (e.g. "AC-07").
        tecnico_username: Username of the technician that performed the ronda.
        observacao: Free-text observation recorded by the technician.
        data_hora: ISO-formatted date/time string of the ronda.
    """
    subject = f"[DCCheck] Falha detectada – {sala_nome} / {item_identificador}"

    body = f"""
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <style>
    body {{ font-family: Arial, sans-serif; color: #333; margin: 0; padding: 0; }}
    .container {{ max-width: 600px; margin: 40px auto; border: 1px solid #e0e0e0;
                  border-radius: 6px; overflow: hidden; }}
    .header {{ background-color: #c0392b; color: #fff; padding: 24px 32px; }}
    .header h1 {{ margin: 0; font-size: 22px; }}
    .body {{ padding: 24px 32px; }}
    .field {{ margin-bottom: 12px; }}
    .label {{ font-weight: bold; color: #555; font-size: 13px;
              text-transform: uppercase; letter-spacing: 0.05em; }}
    .value {{ margin-top: 2px; font-size: 15px; }}
    .obs {{ background: #fdf3f3; border-left: 4px solid #c0392b;
             padding: 12px 16px; border-radius: 4px; margin-top: 16px; }}
    .footer {{ background: #f5f5f5; padding: 16px 32px; font-size: 12px; color: #888;
               border-top: 1px solid #e0e0e0; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>&#9888;&#65039; Falha detectada no datacenter</h1>
    </div>
    <div class="body">
      <div class="field">
        <div class="label">Sala</div>
        <div class="value">{sala_nome}</div>
      </div>
      <div class="field">
        <div class="label">Item</div>
        <div class="value">{item_identificador}</div>
      </div>
      <div class="field">
        <div class="label">Técnico</div>
        <div class="value">{tecnico_username}</div>
      </div>
      <div class="field">
        <div class="label">Data / Hora</div>
        <div class="value">{data_hora}</div>
      </div>
      <div class="obs">
        <div class="label">Observação</div>
        <div class="value" style="margin-top:6px;">{observacao or "Nenhuma observação registrada."}</div>
      </div>
    </div>
    <div class="footer">
      Esta mensagem foi gerada automaticamente pelo sistema DCCheck.<br />
      Acesse o portal para ver detalhes completos da ronda.
    </div>
  </div>
</body>
</html>
"""

    await send_email(to=gestor_email, subject=subject, body=body)


async def send_password_reset_email(to_email: str, reset_link: str) -> None:
    """Send a password-reset e-mail containing *reset_link*.

    The link is valid for ``settings.RESET_TOKEN_MINUTES`` minutes (default
    30).  The expiry is mentioned prominently in the e-mail body.
    """
    expiry_minutes = settings.RESET_TOKEN_MINUTES
    subject = "[DCCheck] Redefinição de senha"

    body = f"""
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <style>
    body {{ font-family: Arial, sans-serif; color: #333; margin: 0; padding: 0; }}
    .container {{ max-width: 600px; margin: 40px auto; border: 1px solid #e0e0e0;
                  border-radius: 6px; overflow: hidden; }}
    .header {{ background-color: #2c3e50; color: #fff; padding: 24px 32px; }}
    .header h1 {{ margin: 0; font-size: 22px; }}
    .body {{ padding: 24px 32px; line-height: 1.6; }}
    .btn {{ display: inline-block; margin: 24px 0; padding: 14px 28px;
             background: #2980b9; color: #fff; text-decoration: none;
             border-radius: 5px; font-size: 15px; font-weight: bold; }}
    .warn {{ background: #fef9e7; border-left: 4px solid #f39c12;
              padding: 12px 16px; border-radius: 4px; font-size: 13px; }}
    .footer {{ background: #f5f5f5; padding: 16px 32px; font-size: 12px; color: #888;
               border-top: 1px solid #e0e0e0; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>&#128274; Redefinição de senha</h1>
    </div>
    <div class="body">
      <p>Recebemos uma solicitação para redefinir a senha da sua conta no <strong>DCCheck</strong>.</p>
      <p>Clique no botão abaixo para criar uma nova senha:</p>
      <a href="{reset_link}" class="btn">Redefinir minha senha</a>
      <div class="warn">
        &#9201; Este link é válido por <strong>{expiry_minutes} minutos</strong>.
        Após esse prazo será necessário solicitar um novo link.
      </div>
      <p style="margin-top:24px; font-size:13px; color:#666;">
        Se você não solicitou a redefinição de senha, ignore este e-mail.
        Sua senha permanecerá a mesma.
      </p>
      <p style="font-size:13px; color:#999; word-break:break-all;">
        Caso o botão não funcione, copie e cole este endereço no navegador:<br />
        <a href="{reset_link}" style="color:#2980b9;">{reset_link}</a>
      </p>
    </div>
    <div class="footer">
      Esta mensagem foi gerada automaticamente pelo sistema DCCheck.<br />
      Por favor, não responda este e-mail.
    </div>
  </div>
</body>
</html>
"""

    await send_email(to=to_email, subject=subject, body=body)
