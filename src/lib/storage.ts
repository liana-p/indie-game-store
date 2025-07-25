// Storage abstraction layer for purchase data and download links

import type { Redis } from "@upstash/redis";

export interface PurchaseData {
  sessionId: string;
  gameId: string;
  gameTitle: string;
  customerEmail: string;
  purchaseDate: string;
  downloadUrl: string;
  downloadExpires: string;
  maxDownloads: number;
  downloadCount: number;
}

export interface StorageAdapter {
  // Store a purchase record
  storePurchase(email: string, purchase: PurchaseData): Promise<void>;

  // Get all purchases for an email
  getPurchases(email: string): Promise<PurchaseData[]>;

  // Check if user has already purchased a specific game
  hasUserPurchased(email: string, gameId: string): Promise<boolean>;

  // Update download count
  incrementDownloadCount(sessionId: string): Promise<void>;

  // Check if storage is available
  isAvailable(): Promise<boolean>;
}

// Upstash Redis implementation
class UpstashAdapter implements StorageAdapter {
  private redis: Redis | null;

  constructor() {
    // Import Redis dynamically to avoid issues if not configured
    this.redis = null;
  }

  private async getRedis() {
    if (!this.redis) {
      try {
        const { Redis } = await import("@upstash/redis");
        this.redis = new Redis({
          url: import.meta.env.UPSTASH_REDIS_REST_URL,
          token: import.meta.env.UPSTASH_REDIS_REST_TOKEN,
        });
      } catch (error) {
        console.warn("Upstash Redis not available:", error);
        throw new Error("Upstash Redis not configured");
      }
    }
    return this.redis;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const redis = await this.getRedis();
      // Test with a simple ping
      await redis.set("health-check", "ok", { ex: 1 });
      return true;
    } catch {
      return false;
    }
  }

  async storePurchase(email: string, purchase: PurchaseData): Promise<void> {
    const redis = await this.getRedis();
    const key = `purchases:${email.toLowerCase()}`;

    // Get existing purchases
    const existing = (await redis.get<PurchaseData[]>(key)) || [];

    // Add new purchase
    existing.push(purchase);

    // Store back (expire after 1 year)
    await redis.set(key, existing, { ex: 365 * 24 * 60 * 60 });
  }

  async getPurchases(email: string): Promise<PurchaseData[]> {
    const redis = await this.getRedis();
    const key = `purchases:${email.toLowerCase()}`;
    return (await redis.get<PurchaseData[]>(key)) || [];
  }

  async hasUserPurchased(email: string, gameId: string): Promise<boolean> {
    const purchases = await this.getPurchases(email);
    return purchases.some(purchase => purchase.gameId === gameId);
  }

  async incrementDownloadCount(sessionId: string): Promise<void> {
    // For now, we'll search through all purchases to find the session
    // In a real database, this would be more efficient
    console.log(
      "TODO: Implement download count tracking for session:",
      sessionId
    );
  }
}

// In-memory fallback (for development)
class InMemoryAdapter implements StorageAdapter {
  private purchases: Map<string, PurchaseData[]> = new Map();

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async storePurchase(email: string, purchase: PurchaseData): Promise<void> {
    const key = email.toLowerCase();
    const existing = this.purchases.get(key) || [];
    existing.push(purchase);
    this.purchases.set(key, existing);
  }

  async getPurchases(email: string): Promise<PurchaseData[]> {
    return this.purchases.get(email.toLowerCase()) || [];
  }

  async hasUserPurchased(email: string, gameId: string): Promise<boolean> {
    const purchases = await this.getPurchases(email);
    return purchases.some(purchase => purchase.gameId === gameId);
  }

  async incrementDownloadCount(sessionId: string): Promise<void> {
    console.log("In-memory: TODO implement download count tracking");
  }
}

// Storage factory
const inMemoryAdapter = new InMemoryAdapter();
const upstashAdapter = new UpstashAdapter();
export async function getStorageAdapter(): Promise<StorageAdapter> {
  if (await upstashAdapter.isAvailable()) {
    return upstashAdapter;
  }

  // Only allow in-memory storage in development
  const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';
  
  if (!isDevelopment) {
    throw new Error(
      "Production deployment requires Upstash Redis to be configured. " +
      "Please set up Upstash Redis through Vercel marketplace or add " +
      "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN environment variables."
    );
  }

  console.warn(
    "Upstash Redis not available, falling back to in-memory storage (development only)"
  );
  return inMemoryAdapter;
}
