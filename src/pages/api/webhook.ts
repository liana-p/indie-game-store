import type { APIRoute } from "astro";
import Stripe from "stripe";
import { getCollection } from "astro:content";
import { getStorageAdapter, type PurchaseData } from "../../lib/storage";
import { getBaseUrl } from "../../lib/utils";
import { getEmailService } from "../../lib/email";
import { siteConfig } from "../../config/site";

// Explicitly mark this route as server-rendered
export const prerender = false;

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY!);

export const POST: APIRoute = async ({ request }) => {
  console.log("🪝 Webhook endpoint called");

  const sig = request.headers.get("stripe-signature");
  const webhookSecret = import.meta.env.STRIPE_WEBHOOK_SECRET;

  console.log("🔑 Webhook secret configured:", !!webhookSecret);
  console.log("✍️ Stripe signature present:", !!sig);

  if (!sig || !webhookSecret) {
    console.error("❌ Missing stripe signature or webhook secret");
    console.error("Webhook secret exists:", !!webhookSecret);
    console.error("Stripe signature exists:", !!sig);
    return new Response("Webhook signature verification failed", {
      status: 400,
    });
  }

  try {
    const body = await request.text();

    // Verify the webhook signature
    const event = stripe.webhooks.constructEvent(body, sig, webhookSecret);

    console.log("Webhook event received:", event.type);

    // Handle successful payment
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      console.log("Processing completed checkout session:", session.id);

      // Get customer email
      const customerEmail =
        session.customer_email || session.customer_details?.email;
      if (!customerEmail) {
        console.error("No customer email found in session");
        return new Response("No customer email", { status: 400 });
      }

      // Get game ID from metadata
      const gameId = session.metadata?.game_id;
      if (!gameId) {
        console.error("No game ID found in session metadata");
        return new Response("No game ID in metadata", { status: 400 });
      }

      // Get game details
      const games = await getCollection("games");
      const game = games.find((g) => g.id === gameId);

      if (!game) {
        console.error("Game not found:", gameId);
        return new Response("Game not found", { status: 404 });
      }

      // Generate secure token for download verification
      const downloadToken = generateDownloadToken(
        session.id,
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
        sessionId: session.id,
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
