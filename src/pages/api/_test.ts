import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { getStorageAdapter, type PurchaseData } from "../../lib/storage";
import { getBaseUrl } from "../../lib/utils";
import { getEmailService } from "../../lib/email";
import { siteConfig } from "../../config/site";

// Explicitly mark this route as server-rendered
export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  console.log("Test endpoint called");

  try {
      // Get customer email
      const customerEmail = "example@email.com";

      // Get game ID from metadata
      const gameId = "demo-game";

      // Get game details
      const games = await getCollection("games");
      const game = games.find((g) => g.id === gameId);

      if (!game) {
        console.error("Game not found:", gameId);
        return new Response("Game not found", { status: 404 });
      }

      // Generate secure token for download verification
      const downloadToken = generateDownloadToken(
        "1",
        customerEmail,
        gameId
      );

      // Generate download selection page URL with token
      const downloadUrl = `${getBaseUrl()}/download/${gameId}?token=${downloadToken}`;

      // Set expiration date
      const expirationDate = new Date();
      expirationDate.setHours(
        expirationDate.getHours() +
          siteConfig.file_storage.download_expires_hours
      );

      // Create purchase record
      const purchaseData: PurchaseData = {
        sessionId: "1",
        gameId: gameId,
        gameTitle: game.data.title,
        customerEmail: customerEmail,
        purchaseDate: new Date().toISOString(),
        downloadUrl: downloadUrl,
        downloadExpires: expirationDate.toISOString(),
        maxDownloads: 5, // Allow 5 downloads
        downloadCount: 0,
      };

      // Store purchase data
      const storage = await getStorageAdapter();
      await storage.storePurchase(customerEmail, purchaseData);

      console.log("Purchase data stored for:", customerEmail);

      // Send email with download link
      try {
        console.log("📧 Attempting to send download email...");
        const emailService = getEmailService();
        console.log(
          "📧 Email service configured:",
          emailService.isConfigured()
        );
        console.log("📧 Sending to:", customerEmail);
        console.log("📧 Download URL:", purchaseData.downloadUrl);

        await emailService.sendDownloadEmail(purchaseData);
        console.log("✅ Download email sent successfully to:", customerEmail);
      } catch (emailError: any) {
        console.error("❌ Failed to send download email:", emailError);
        console.error("❌ Email error details:", {
          message: emailError.message,
          stack: emailError.stack,
          customerEmail,
          gameTitle: purchaseData.gameTitle,
        });
        // Don't fail the webhook if email fails - purchase data is still stored
      }

    return new Response("Webhook processed", { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response("Webhook error", { status: 400 });
  }
};

// Generate a secure download token
function generateDownloadToken(
  sessionId: string,
  email: string,
  gameId: string
): string {
  const payload = {
    sessionId,
    email: email.toLowerCase(),
    gameId,
    issued: Date.now(),
    expires: Date.now() + 48 * 60 * 60 * 1000, // 48 hours
  };

  // Simple base64 encoding for now - in production, use JWT or similar
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}