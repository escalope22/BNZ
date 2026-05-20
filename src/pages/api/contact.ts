import { Buffer } from 'node:buffer';
import type { APIRoute } from 'astro';
import { Resend } from 'resend';

export const prerender = false;

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const TO_EMAIL = 'victor.rambaud.85@gmail.com';
const FROM_EMAIL = 'onboarding@resend.dev';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function json(body: object, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const POST: APIRoute = async ({ request }) => {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return json({ error: 'Données invalides.' }, 400);
  }

  const nom         = formData.get('nom')?.toString().trim()         ?? '';
  const telephone   = formData.get('telephone')?.toString().trim()   ?? '';
  const email       = formData.get('email')?.toString().trim()       ?? '';
  const description = formData.get('description')?.toString().trim() ?? '';
  const localisation = formData.get('localisation')?.toString().trim() ?? '';

  if (!nom || !email || !description || !localisation) {
    return json({ error: 'Veuillez remplir tous les champs obligatoires.' }, 400);
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: 'Adresse e-mail invalide.' }, 400);
  }

  const rawPhotos = formData.getAll('photos');
  const attachments: Array<{ filename: string; content: Buffer }> = [];

  for (const raw of rawPhotos) {
    if (!(raw instanceof File) || raw.size === 0) continue;
    if (!raw.type.startsWith('image/')) {
      return json({ error: `"${raw.name}" n'est pas une image valide.` }, 400);
    }
    if (raw.size > MAX_FILE_SIZE) {
      return json({ error: `"${raw.name}" dépasse la limite de 5 Mo.` }, 400);
    }
    attachments.push({
      filename: raw.name,
      content: Buffer.from(await raw.arrayBuffer()),
    });
  }

  const resend = new Resend(import.meta.env.RESEND_API_KEY);

  const localisationRow = localisation
    ? `<tr><td style="padding:8px 12px;font-weight:bold;background:#f1f5f9;white-space:nowrap;">Localisation</td><td style="padding:8px 12px;">${escapeHtml(localisation)}</td></tr>`
    : '';

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: [TO_EMAIL],
    replyTo: email,
    subject: `Nouveau devis — ${nom}`,
    html: `
      <div style="font-family:sans-serif;max-width:640px;margin:0 auto;">
        <h2 style="color:#1e293b;border-bottom:2px solid #e2e8f0;padding-bottom:12px;">
          Nouvelle demande de devis
        </h2>
        <table style="border-collapse:collapse;width:100%;">
          <tr><td style="padding:8px 12px;font-weight:bold;background:#f1f5f9;white-space:nowrap;">Nom</td><td style="padding:8px 12px;">${escapeHtml(nom)}</td></tr>
          <tr><td style="padding:8px 12px;font-weight:bold;background:#f1f5f9;white-space:nowrap;">Téléphone</td><td style="padding:8px 12px;">${escapeHtml(telephone)}</td></tr>
          <tr><td style="padding:8px 12px;font-weight:bold;background:#f1f5f9;white-space:nowrap;">Email</td><td style="padding:8px 12px;">${escapeHtml(email)}</td></tr>
          ${localisationRow}
          <tr>
            <td style="padding:8px 12px;font-weight:bold;background:#f1f5f9;vertical-align:top;white-space:nowrap;">Description</td>
            <td style="padding:8px 12px;white-space:pre-wrap;">${escapeHtml(description)}</td>
          </tr>
        </table>
      </div>
    `,
    attachments: attachments.length > 0 ? attachments : undefined,
  });

  if (error) {
    console.error('[contact] Resend error:', error);
    return json(
      { error: "L'envoi a échoué. Veuillez réessayer ou nous appeler directement." },
      500,
    );
  }

  return json({ success: true }, 200);
};
