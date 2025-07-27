export interface CheckoutSession {
  id: string;
  url?: string;
}

export interface PurchaseDetails {
  gameId: string;
  email: string;
}

export interface WebhookResult {
  sessionId: string;
  email: string;
  gameId: string;
}

export interface PaymentProvider {
  createCheckoutSession(details: PurchaseDetails): Promise<CheckoutSession>;
  handleWebhook(request: Request): Promise<WebhookResult | null>;
  getName(): string;
}
