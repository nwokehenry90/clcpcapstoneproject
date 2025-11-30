import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { getEnvVar } from '../utils/common';

const sesClient = new SESClient({ region: getEnvVar('AWS_REGION', 'us-east-1') });
const FROM_EMAIL = getEnvVar('SES_FROM_EMAIL', 'noreply@oshawaskills.com');

export class SESService {
  /**
   * Send certification approval email
   */
  async sendApprovalEmail(
    toEmail: string,
    userName: string,
    certificateTitle: string,
    organization: string
  ): Promise<void> {
    const subject = '✓ Certificate Approved - Oshawa Skills Exchange';
    const htmlBody = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2563eb;">Certificate Approved!</h2>
            <p>Hi ${userName},</p>
            <p>Great news! Your certificate has been approved:</p>
            <div style="background-color: #f3f4f6; padding: 15px; border-left: 4px solid #2563eb; margin: 20px 0;">
              <strong>${certificateTitle}</strong><br/>
              <em>${organization}</em>
            </div>
            <p>You are now a <strong>certified provider</strong> on Oshawa Skills Exchange. Your profile will display a verified badge.</p>
            <p>Thank you for being part of our community!</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;"/>
            <p style="color: #6b7280; font-size: 14px;">
              Oshawa Skills Exchange<br/>
              Building trust through verification
            </p>
          </div>
        </body>
      </html>
    `;

    const textBody = `
Hi ${userName},

Great news! Your certificate has been approved.

Certificate: ${certificateTitle}
Organization: ${organization}

You are now a certified provider on Oshawa Skills Exchange. Your profile will display a verified badge.

Thank you for being part of our community!

Oshawa Skills Exchange
    `.trim();

    await this.sendEmail(toEmail, subject, htmlBody, textBody);
  }

  /**
   * Send certification rejection email
   */
  async sendRejectionEmail(
    toEmail: string,
    userName: string,
    certificateTitle: string,
    rejectionReason: string
  ): Promise<void> {
    const subject = 'Certificate Review - Oshawa Skills Exchange';
    const htmlBody = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #dc2626;">Certificate Not Approved</h2>
            <p>Hi ${userName},</p>
            <p>Unfortunately, we were unable to approve your certificate submission:</p>
            <div style="background-color: #f3f4f6; padding: 15px; border-left: 4px solid #dc2626; margin: 20px 0;">
              <strong>${certificateTitle}</strong>
            </div>
            <p><strong>Reason:</strong></p>
            <div style="background-color: #fef2f2; padding: 15px; border-radius: 5px; margin: 15px 0;">
              ${rejectionReason}
            </div>
            <p>Please review the feedback above and feel free to upload a new certificate or contact us if you have questions.</p>
            <p>We appreciate your understanding and look forward to verifying your credentials.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;"/>
            <p style="color: #6b7280; font-size: 14px;">
              Oshawa Skills Exchange<br/>
              Building trust through verification
            </p>
          </div>
        </body>
      </html>
    `;

    const textBody = `
Hi ${userName},

Unfortunately, we were unable to approve your certificate submission:

Certificate: ${certificateTitle}

Reason:
${rejectionReason}

Please review the feedback above and feel free to upload a new certificate or contact us if you have questions.

We appreciate your understanding and look forward to verifying your credentials.

Oshawa Skills Exchange
    `.trim();

    await this.sendEmail(toEmail, subject, htmlBody, textBody);
  }

  /**
   * Send email using AWS SES
   */
  private async sendEmail(
    toEmail: string,
    subject: string,
    htmlBody: string,
    textBody: string
  ): Promise<void> {
    const command = new SendEmailCommand({
      Source: FROM_EMAIL,
      Destination: {
        ToAddresses: [toEmail],
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: htmlBody,
            Charset: 'UTF-8',
          },
          Text: {
            Data: textBody,
            Charset: 'UTF-8',
          },
        },
      },
    });

    try {
      await sesClient.send(command);
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error('Failed to send email notification');
    }
  }
}
