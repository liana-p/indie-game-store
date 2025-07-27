import { Resend } from "resend";
import nodemailer from "nodemailer";
import { siteConfig } from "../config/site";
import type { PurchaseData } from "./storage";
import { generateDownloadEmailHTML, generateRecoveryEmailText, generateDownloadEmailText, generateRecoveryEmailHTML } from "./utils";

export interface EmailService {
  sendDownloadEmail(purchase: PurchaseData): Promise<void>;
  sendRecoveryEmail(email: string, purchases: PurchaseData[]): Promise<void>;
  isConfigured(): boolean;
}

class ResendEmailService implements EmailService {
  private resend: Resend | null = null;

  constructor() {
    const apiKey = import.meta.env.RESEND_API_KEY;
    if (apiKey) {
      this.resend = new Resend(apiKey);
    }
  }

  isConfigured(): boolean {
    return this.resend !== null;
  }

  async sendDownloadEmail(purchase: PurchaseData): Promise<void> {
    if (!this.resend) throw new Error("Resend not configured");

    const expiryDate = new Date(purchase.downloadExpires).toLocaleDateString();
    const fromAddress = `${siteConfig.developer.name} <${siteConfig.email.from_downloads}>`;

    await this.resend.emails.send({
      from: fromAddress,
      to: purchase.customerEmail,
      subject: `Your ${purchase.gameTitle} download is ready!`,
      html: generateDownloadEmailHTML(purchase, expiryDate),
      text: generateDownloadEmailText(purchase, expiryDate),
    });
  }

  async sendRecoveryEmail(email: string, purchases: PurchaseData[]): Promise<void> {
    if (!this.resend) throw new Error("Resend not configured");

    const fromAddress = `${siteConfig.developer.name} <${siteConfig.email.from_downloads}>`;

    await this.resend.emails.send({
      from: fromAddress,
      to: email,
      subject: "Your game download links",
      html: generateRecoveryEmailHTML(purchases),
      text: generateRecoveryEmailText(purchases),
    });
  }
}

class SMTPEmailService implements EmailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: import.meta.env.SMTP_HOST,
      port: parseInt(import.meta.env.SMTP_PORT || "587"),
      secure: import.meta.env.SMTP_SECURE === "true",
      auth: {
        user: import.meta.env.SMTP_USER,
        pass: import.meta.env.SMTP_PASS,
      },
    });
  }

  isConfigured(): boolean {
    return !!this.transporter;
  }

  async sendDownloadEmail(purchase: PurchaseData): Promise<void> {
    const expiryDate = new Date(purchase.downloadExpires).toLocaleDateString();

    await this.transporter.sendMail({
      from: `${siteConfig.developer.name} <${siteConfig.email.from_downloads}>`,
      to: purchase.customerEmail,
      subject: `Your ${purchase.gameTitle} download is ready!`,
      html: generateDownloadEmailHTML(purchase, expiryDate),
      text: generateDownloadEmailText(purchase, expiryDate),
    });
  }

  async sendRecoveryEmail(email: string, purchases: PurchaseData[]): Promise<void> {
    await this.transporter.sendMail({
      from: `${siteConfig.developer.name} <${siteConfig.email.from_downloads}>`,
      to: email,
      subject: "Your game download links",
      html: generateRecoveryEmailHTML(purchases),
      text: generateRecoveryEmailText(purchases),
    });
  }
}

class ConsoleEmailService implements EmailService {
  isConfigured(): boolean {
    return true;
  }

  async sendDownloadEmail(purchase: PurchaseData): Promise<void> {
    console.log("📧 [CONSOLE EMAIL] Would send download email:");
    console.log(`To: ${purchase.customerEmail}`);
    console.log(`Game: ${purchase.gameTitle}`);
    console.log(`URL: ${purchase.downloadUrl}`);
  }

  async sendRecoveryEmail(email: string, purchases: PurchaseData[]): Promise<void> {
    console.log("📧 [CONSOLE EMAIL] Would send recovery email to:", email);
    purchases.forEach((p) => {
      console.log(`- ${p.gameTitle}: ${p.downloadUrl}`);
    });
  }
}

export function getEmailService(): EmailService {
  const provider = (import.meta.env.MAIL_PROVIDER || "console").toLowerCase();

  if (provider === "resend") {
    const service = new ResendEmailService();
    if (service.isConfigured()) return service;
  }

  if (provider === "smtp") {
    const service = new SMTPEmailService();
    if (service.isConfigured()) return service;
  }

  return new ConsoleEmailService();
}
