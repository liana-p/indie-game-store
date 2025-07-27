import type { APIRoute } from "astro";
import { getPaymentProvider } from "../../lib/payments";
import { getStorageAdapter } from "../../lib/storage";
import { getBaseUrl } from "../../lib/utils";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const { gameId, email, provider = "stripe" } = await request.json();

    if (!gameId || !email) {
      return new Response(JSON.stringify({ error: "Missing gameId or email" }), { status: 400 });
    }

    const storage = await getStorageAdapter();
    if (await storage.hasUserPurchased(email, gameId)) {
      return new Response(
        JSON.stringify({
          error: "You already own this game",
          recoveryUrl: `${getBaseUrl()}/recover-download`,
        }),
        { status: 409 }
      );
    }

    const paymentProvider = getPaymentProvider(provider);
    const session = await paymentProvider.createCheckoutSession({ gameId, email });

    return new Response(JSON.stringify({ sessionId: session.id, provider }), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Checkout error" }), { status: 500 });
  }
};
