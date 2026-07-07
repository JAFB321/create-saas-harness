/**
 * Transactional email templates. Keep them pure (string in, string out) so providers (mock/Resend)
 * just transport the rendered output. Add templates as your product needs them.
 */
export type EmailTemplate = "welcome" | "payment_receipt";

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

/** Vars are user-provided (names, plan labels) — escape them before interpolating into HTML. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function layout(title: string, body: string): string {
  return `<!doctype html><html><body style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px">
<h1 style="font-size:20px">${title}</h1>
${body}
<hr style="margin:24px 0;border:none;border-top:1px solid #eee"/>
<p style="color:#888;font-size:12px">Sent by {{PROJECT_NAME}}</p>
</body></html>`;
}

export function renderEmail(template: EmailTemplate, vars: Record<string, string>): RenderedEmail {
  // Escaped view for HTML interpolation; subject/text stay raw (they are not HTML).
  const h = Object.fromEntries(Object.entries(vars).map(([k, v]) => [k, escapeHtml(v)]));
  switch (template) {
    case "welcome":
      return {
        subject: `Welcome to {{PROJECT_NAME}}`,
        html: layout("Welcome!", `<p>Hi ${h.name ?? "there"}, your account is ready.</p>`),
        text: `Welcome! Hi ${vars.name ?? "there"}, your account is ready.`,
      };
    case "payment_receipt":
      return {
        subject: `Your receipt`,
        html: layout("Payment received", `<p>We received your payment of ${h.amount ?? ""}.</p>`),
        text: `Payment received: ${vars.amount ?? ""}.`,
      };
  }
}
