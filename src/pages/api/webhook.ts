import type { APIRoute } from "astro";
import { getPaymentProvider } from "../../lib/payments";
import { getCollection } from "astro:content";
import { getStorageAdapter } from "../../lib/storage";
import { getEmailService } from "../../lib/email";
import { getBaseUrl } from "../../lib/utils";
import { siteConfig } from "../../config/site";

export const prerender = false;

export const POST: APIRoute = async ({ request, url }) => {
  const providerName = url.searchParams.get("provider") || "stripe";
  const paymentProvider = getPaymentProvider(providerName);

  try {
    const result = await paymentProvider.handleWebhook(request);
    if (!result) return new Response("No action needed", { status: 200 });

    const { sessionId, email, gameId } = result;

    const games = await getCollection("games");
    const game = games.find((g) => g.id === gameId);
    if (!game) return new Response("Game not found", { status: 404 });

    const downloadToken = Buffer.from(
      JSON.stringify({
        sessionId,
        email,
        gameId,
        issued: Date.now(),
        expires: Date.now() + 48 * 60 * 60 * 1000,
      })
    ).toString("base64url");

    const downloadUrl = `${getBaseUrl()}/download/${gameId}?token=${downloadToken}`;

    const expirationDate = new Date();
    expirationDate.setHours(
      expirationDate.getHours() + siteConfig.file_storage.download_expires_hours
    );

    const purchaseData = {
      sessionId,
      gameId,
      gameTitle: game.data.title,
      customerEmail: email,
      purchaseDate: new Date().toISOString(),
      downloadUrl,
      downloadExpires: expirationDate.toISOString(),
      maxDownloads: 5,
      downloadCount: 0,
    };

    const storage = await getStorageAdapter();
    await storage.storePurchase(email, purchaseData);

    const emailService = getEmailService();
    if (emailService.isConfigured()) {
      await emailService.sendDownloadEmail(purchaseData);
    }

    return new Response("Webhook processed", { status: 200 });
  } catch (err) {
    console.error("Webhook handler error:", err);
    return new Response("Webhook error", { status: 400 });
  }
};
