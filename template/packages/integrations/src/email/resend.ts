import { Resend } from "resend";
import { renderEmail } from "@app/core";
import type { EmailProvider, SendEmailInput, SendEmailResult } from "../types";
import { ProviderConfigError } from "../errors";
import { logger } from "../logger";

/** Resend email provider. Requires RESEND_API_KEY and EMAIL_FROM. */
export class ResendProvider implements EmailProvider {
  private resend: Resend;
  private from: string;

  constructor() {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new ProviderConfigError("RESEND_API_KEY is required for the Resend provider.");
    this.resend = new Resend(key);
    this.from = process.env.EMAIL_FROM ?? "onboarding@resend.dev";
  }

  async sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
    const rendered = renderEmail(input.template, input.vars);
    const { data, error } = await this.resend.emails.send({
      from: this.from,
      to: input.to,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
    });
    if (error) {
      logger.error("email_send_failed", { to: input.to, template: input.template, error: error.message });
      return { messageId: "", status: "failed" };
    }
    return { messageId: data?.id ?? "", status: "sent" };
  }
}
