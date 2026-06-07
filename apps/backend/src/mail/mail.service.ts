import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

interface SmtpSettings {
  host: string;
  port: number;
  secure: boolean;
  user?: string;
  pass?: string;
  from: string;
}

@Injectable()
export class MailService {
  private transporter: Transporter | null = null;

  constructor(private readonly configService: ConfigService) {}

  private readSettings(): SmtpSettings | null {
    const host = this.configService.get<string>('SMTP_HOST')?.trim();
    const port = Number(this.configService.get<string>('SMTP_PORT') ?? 0);
    const from = this.configService.get<string>('SMTP_FROM')?.trim();
    const secureValue =
      this.configService.get<string>('SMTP_SECURE')?.trim().toLowerCase() ?? '';
    const secure = secureValue === 'true' || secureValue === '1';
    const user = this.configService.get<string>('SMTP_USER')?.trim();
    const pass = this.configService.get<string>('SMTP_PASS')?.trim();

    if (!host || !port || !from) {
      return null;
    }

    return {
      host,
      port,
      secure,
      user,
      pass,
      from,
    };
  }

  isConfigured(): boolean {
    return (
      this.hasResendConfig() ||
      this.hasMailtrapConfig() ||
      this.readSettings() !== null
    );
  }

  private hasResendConfig(): boolean {
    return Boolean(this.configService.get<string>('RESEND_API_KEY')?.trim());
  }

  private getResendConfig() {
    const apiKey = this.configService.get<string>('RESEND_API_KEY')?.trim();
    const fromEmail =
      this.configService.get<string>('RESEND_FROM_EMAIL')?.trim() ||
      'onboarding@resend.dev';
    const fromName =
      this.configService.get<string>('RESEND_FROM_NAME')?.trim() ||
      'Online Bureau';
    const endpoint =
      this.configService.get<string>('RESEND_API_URL')?.trim() ||
      'https://api.resend.com/emails';

    if (!apiKey) {
      return null;
    }

    return {
      apiKey,
      fromEmail,
      fromName,
      endpoint,
    };
  }

  private hasMailtrapConfig(): boolean {
    return Boolean(
      this.configService.get<string>('MAILTRAP_TOKEN')?.trim() &&
        this.configService.get<string>('MAILTRAP_FROM_EMAIL')?.trim(),
    );
  }

  private getMailtrapConfig() {
    const token = this.configService.get<string>('MAILTRAP_TOKEN')?.trim();
    const fromEmail = this.configService
      .get<string>('MAILTRAP_FROM_EMAIL')
      ?.trim();
    const fromName = this.configService
      .get<string>('MAILTRAP_FROM_NAME')
      ?.trim();
    const endpoint =
      this.configService.get<string>('MAILTRAP_API_URL')?.trim() ||
      'https://send.api.mailtrap.io/api/send';

    if (!token || !fromEmail) {
      return null;
    }

    return {
      token,
      fromEmail,
      fromName,
      endpoint,
    };
  }

  private getTransporter(): Transporter | null {
    const settings = this.readSettings();

    if (!settings) {
      return null;
    }

    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: settings.host,
        port: settings.port,
        secure: settings.secure,
        auth:
          settings.user && settings.pass
            ? {
                user: settings.user,
                pass: settings.pass,
              }
            : undefined,
      });
    }

    return this.transporter;
  }

  async sendVerificationEmail(
    email: string,
    verificationUrl: string,
  ): Promise<boolean> {
    return this.sendMail({
      to: email,
      subject: 'Verify your Online Bureau account',
      text: [
        'Welcome to Online Bureau.',
        '',
        'Please verify your email address by opening the link below:',
        verificationUrl,
        '',
        'This link expires in 24 hours.',
      ].join('\n'),
      html: `
        <p>Welcome to <strong>Online Bureau</strong>.</p>
        <p>Please verify your email address by opening the link below:</p>
        <p><a href="${verificationUrl}">Verify your email</a></p>
        <p>This link expires in 24 hours.</p>
      `,
    });
  }

  async sendPasswordResetEmail(
    email: string,
    resetUrl: string,
  ): Promise<boolean> {
    return this.sendMail({
      to: email,
      subject: 'Reset your Online Bureau password',
      text: [
        'We received a request to reset your Online Bureau password.',
        '',
        'Use the link below to choose a new password:',
        resetUrl,
        '',
        'This link expires in 1 hour.',
      ].join('\n'),
      html: `
        <p>We received a request to reset your <strong>Online Bureau</strong> password.</p>
        <p>Use the link below to choose a new password:</p>
        <p><a href="${resetUrl}">Reset your password</a></p>
        <p>This link expires in 1 hour.</p>
      `,
    });
  }

  private async sendMail(options: {
    to: string;
    subject: string;
    text: string;
    html: string;
  }): Promise<boolean> {
    if (await this.sendViaResend(options)) {
      return true;
    }

    if (await this.sendViaMailtrap(options)) {
      return true;
    }

    const transporter = this.getTransporter();
    const settings = this.readSettings();

    if (!transporter || !settings) {
      return false;
    }

    try {
      await transporter.sendMail({
        from: settings.from,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });

      return true;
    } catch (error) {
      console.error('[MAIL_DELIVERY_ERROR]', error);
      return false;
    }
  }

  private async sendViaResend(options: {
    to: string;
    subject: string;
    text: string;
    html: string;
  }): Promise<boolean> {
    const config = this.getResendConfig();

    if (!config) {
      return false;
    }

    try {
      const response = await fetch(config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          from: `${config.fromName} <${config.fromEmail}>`,
          to: [options.to],
          subject: options.subject,
          text: options.text,
          html: options.html,
        }),
      });

      if (!response.ok) {
        const responseText = await response.text();
        console.error('[RESEND_DELIVERY_ERROR]', response.status, responseText);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[RESEND_DELIVERY_ERROR]', error);
      return false;
    }
  }

  private async sendViaMailtrap(options: {
    to: string;
    subject: string;
    text: string;
    html: string;
  }): Promise<boolean> {
    const config = this.getMailtrapConfig();

    if (!config) {
      return false;
    }

    try {
      const response = await fetch(config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.token}`,
        },
        body: JSON.stringify({
          from: {
            email: config.fromEmail,
            name: config.fromName,
          },
          to: [{ email: options.to }],
          subject: options.subject,
          text: options.text,
          html: options.html,
          category: 'Online Bureau',
        }),
      });

      if (!response.ok) {
        const responseText = await response.text();
        console.error('[MAILTRAP_DELIVERY_ERROR]', response.status, responseText);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[MAILTRAP_DELIVERY_ERROR]', error);
      return false;
    }
  }
}
