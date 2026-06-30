import { renderEmail } from "@app/core";
import type { EmailProvider, SendEmailInput, SendEmailResult } from "../types";
import { logger } from "../logger";

/**
 * Mock email provider — the default. Renders the template and logs it instead of sending.
 * Lets the app run with no email keys. Inspect the structured log lines to see "sent" mail.
 */
export class MockEmailProvider implements EmailProvider {
  async sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
    const rendered = renderEmail(input.template, input.vars);
    logger.info("email_mock_sent", {
      to: input.to,
      template: input.template,
      subject: rendered.subject,
    });
    return { messageId: `mock_${input.template}_${Date.now()}`, status: "sent" };
  }
}
