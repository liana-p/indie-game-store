import { Resend } from "resend";
import { siteConfig } from "../config/site";
import type { PurchaseData } from "./storage";
import { getBaseUrl } from "./utils";

// Email service abstraction
export interface EmailService {
  sendDownloadEmail(purchase: PurchaseData): Promise<void>;
  sendRecoveryEmail(email: string, purchases: PurchaseData[]): Promise<void>;
  isConfigured(): boolean;
}

class ResendEmailService implements EmailService {
  private resend: Resend | null = null;

  constructor() {
    const apiKey = import.meta.env.RESEND_API_KEY;
    console.log(
      "📧 [Resend] Initializing with API key:",
      apiKey ? `${apiKey.substring(0, 8)}...` : "NOT SET"
    );
    if (apiKey) {
      this.resend = new Resend(apiKey);
      console.log("📧 [Resend] Client initialized successfully");
    } else {
      console.warn("📧 [Resend] No API key found in environment");
    }
  }

  isConfigured(): boolean {
    return this.resend !== null;
  }

  async sendDownloadEmail(purchase: PurchaseData): Promise<void> {
    if (!this.resend) {
      console.error("❌ Resend client not initialized");
      throw new Error("Resend not configured");
    }

    const expiryDate = new Date(purchase.downloadExpires).toLocaleDateString();
    const fromAddress = `${siteConfig.developer.name} <${siteConfig.email.from_downloads}>`;

    console.log("📧 [Resend] Preparing email...");
    console.log("📧 [Resend] From:", fromAddress);
    console.log("📧 [Resend] To:", purchase.customerEmail);
    console.log(
      "📧 [Resend] Subject:",
      `Your ${purchase.gameTitle} download is ready!`
    );

    try {
      const result = await this.resend.emails.send({
        from: fromAddress,
        to: purchase.customerEmail,
        subject: `Your ${purchase.gameTitle} download is ready!`,
        html: this.generateDownloadEmailHTML(purchase, expiryDate),
        text: this.generateDownloadEmailText(purchase, expiryDate),
      });

      console.log("✅ [Resend] Email sent successfully:", result);
    } catch (error) {
      console.error("❌ [Resend] Failed to send email:", error);
      throw error;
    }
  }

  async sendRecoveryEmail(
    email: string,
    purchases: PurchaseData[]
  ): Promise<void> {
    if (!this.resend) {
      throw new Error("Resend not configured");
    }

    const fromAddress = `${siteConfig.developer.name} <${siteConfig.email.from_downloads}>`;
    console.log("📧 [Resend] Sending recovery email from:", fromAddress);

    await this.resend.emails.send({
      from: fromAddress,
      to: email,
      subject: "Your game download links",
      html: this.generateRecoveryEmailHTML(purchases),
      text: this.generateRecoveryEmailText(purchases),
    });
  }

  private getDomain(): string {
    // Extract domain from site URL, fallback to example.com for development
    try {
      return new URL(siteConfig.site.url).hostname;
    } catch {
      return "example.com";
    }
  }

  private generateDownloadEmailHTML(
    purchase: PurchaseData,
    expiryDate: string
  ): string {
    return `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #1e293b; margin-bottom: 20px;">Thanks for your purchase! 🎉</h1>
        
        <p>Hi there!</p>
        
        <p>Your purchase of <strong>${purchase.gameTitle}</strong> is complete. You can download your game using the link below:</p>
        
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h2 style="color: #374151; margin-top: 0;">${purchase.gameTitle}</h2>
          <p style="margin: 10px 0;">Purchase Date: ${new Date(purchase.purchaseDate).toLocaleDateString()}</p>
          <a href="${purchase.downloadUrl}" 
             style="display: inline-block; background: #3b82f6; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 500; margin: 10px 0;">
            Download Your Game
          </a>
        </div>
        
        <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0;">
          <h3 style="color: #92400e; margin-top: 0; font-size: 16px;">⚠️ Important Information</h3>
          <ul style="color: #92400e; margin: 0; padding-left: 20px;">
            <li>Download link expires on <strong>${expiryDate}</strong></li>
            <li>You have <strong>${purchase.maxDownloads} download attempts</strong></li>
            <li>Save the file to your computer after downloading</li>
          </ul>
        </div>

        <p>Lost this email? You can recover your download link at <a href="${getBaseUrl()}/recover-download">${getBaseUrl()}/recover-download</a></p>

        <p>Need help? Reply to this email or contact us at <a href="mailto:${siteConfig.developer.support_email}">${siteConfig.developer.support_email}</a></p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        
        <p style="color: #6b7280; font-size: 14px;">
          Thanks for supporting indie game development!<br>
          ${siteConfig.developer.name}
        </p>
      </div>
    `;
  }

  private generateDownloadEmailText(
    purchase: PurchaseData,
    expiryDate: string
  ): string {
    return `
Thanks for your purchase! 🎉

Your purchase of ${purchase.gameTitle} is complete.

Download your game: ${purchase.downloadUrl}

IMPORTANT:
- Download link expires on ${expiryDate}
- You have ${purchase.maxDownloads} download attempts
- Save the file to your computer after downloading

Lost this email? Recover your download at: ${siteConfig.site.url}/recover-download

Need help? Contact us at ${siteConfig.developer.support_email}

Thanks for supporting indie game development!
${siteConfig.developer.name}
    `.trim();
  }

  private generateRecoveryEmailHTML(purchases: PurchaseData[]): string {
    const gamesList = purchases
      .map((purchase) => {
        const expiryDate = new Date(
          purchase.downloadExpires
        ).toLocaleDateString();
        return `
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 15px 0;">
          <h3 style="color: #374151; margin-top: 0;">${purchase.gameTitle}</h3>
          <p>Purchased: ${new Date(purchase.purchaseDate).toLocaleDateString()}</p>
          <p>Expires: ${expiryDate}</p>
          <a href="${purchase.downloadUrl}" 
             style="display: inline-block; background: #3b82f6; color: white; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: 500;">
            Download
          </a>
        </div>
      `;
      })
      .join("");

    return `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #1e293b; margin-bottom: 20px;">Your Game Downloads</h1>
        
        <p>Here are your recent game purchases with fresh download links:</p>
        
        ${gamesList}
        
        <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0;">
          <p style="color: #92400e; margin: 0;"><strong>Remember:</strong> Download links expire after 48 hours and have limited download attempts.</p>
        </div>
        
        <p>Need help? Contact us at <a href="mailto:${siteConfig.developer.support_email}">${siteConfig.developer.support_email}</a></p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        
        <p style="color: #6b7280; font-size: 14px;">
          ${siteConfig.developer.name}
        </p>
      </div>
    `;
  }

  private generateRecoveryEmailText(purchases: PurchaseData[]): string {
    const gamesList = purchases
      .map((purchase) => {
        const expiryDate = new Date(
          purchase.downloadExpires
        ).toLocaleDateString();
        return `
${purchase.gameTitle}
Purchased: ${new Date(purchase.purchaseDate).toLocaleDateString()}
Expires: ${expiryDate}
Download: ${purchase.downloadUrl}
      `;
      })
      .join("\n---\n");

    return `
Your Game Downloads

Here are your recent game purchases:

${gamesList}

Remember: Download links expire after 48 hours and have limited download attempts.

Need help? Contact us at ${siteConfig.developer.support_email}

${siteConfig.developer.name}
    `.trim();
  }
}

// Fallback console logger for development
class ConsoleEmailService implements EmailService {
  isConfigured(): boolean {
    return true;
  }

  async sendDownloadEmail(purchase: PurchaseData): Promise<void> {
    console.log("📧 [CONSOLE EMAIL] Fallback email service triggered");
    console.log("📧 [CONSOLE EMAIL] Would send download email:");
    console.log(`📧 [CONSOLE EMAIL] To: ${purchase.customerEmail}`);
    console.log(
      `📧 [CONSOLE EMAIL] Subject: Your ${purchase.gameTitle} download is ready!`
    );
    console.log(`📧 [CONSOLE EMAIL] Download URL: ${purchase.downloadUrl}`);
    console.log(`📧 [CONSOLE EMAIL] Expires: ${purchase.downloadExpires}`);
    console.log(
      "📧 [CONSOLE EMAIL] This means Resend is not configured - check your RESEND_API_KEY"
    );
  }

  async sendRecoveryEmail(
    email: string,
    purchases: PurchaseData[]
  ): Promise<void> {
    console.log("📧 [EMAIL] Would send recovery email:");
    console.log(`To: ${email}`);
    console.log(`Games: ${purchases.map((p) => p.gameTitle).join(", ")}`);
    purchases.forEach((p) => {
      console.log(`- ${p.gameTitle}: ${p.downloadUrl}`);
    });
  }
}

// Email service factory
export function getEmailService(): EmailService {
  console.log("📧 [FACTORY] Creating email service...");
  const resendService = new ResendEmailService();

  if (resendService.isConfigured()) {
    console.log("📧 [FACTORY] Using Resend email service");
    return resendService;
  }

  console.warn(
    "📧 [FACTORY] Resend not configured, using console logger for emails"
  );
  return new ConsoleEmailService();
}
