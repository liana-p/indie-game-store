import type { APIRoute } from 'astro';
import { getStorageAdapter } from '../../lib/storage';
import { getEmailService } from '../../lib/email';

// Explicitly mark this route as server-rendered
export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.text();
    const data = body ? JSON.parse(body) : {};
    const { email } = data;

    if (!email || typeof email !== 'string') {
      return new Response(JSON.stringify({ error: 'Email address is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({ error: 'Please enter a valid email address' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('Looking up purchases for email:', email);

    // Get storage adapter
    const storage = await getStorageAdapter();
    
    // Look up purchases for this email
    const purchases = await storage.getPurchases(email);
    
    if (purchases.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'No purchases found for this email address. Please check your email or contact support.' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Filter out expired downloads
    const now = new Date();
    const validPurchases = purchases.filter(purchase => {
      const expiryDate = new Date(purchase.downloadExpires);
      return expiryDate > now;
    });

    if (validPurchases.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'All download links for this email have expired. Please contact support for assistance.' 
      }), {
        status: 410, // Gone
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${validPurchases.length} valid purchases for ${email}`);

    // Send email with download links
    try {
      const emailService = getEmailService();
      await emailService.sendRecoveryEmail(email, validPurchases);
      console.log('Recovery email sent to:', email);
    } catch (emailError) {
      console.error('Failed to send recovery email:', emailError);
      return new Response(JSON.stringify({ 
        error: 'Found your purchases but failed to send email. Please try again or contact support.' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: `Found ${validPurchases.length} purchase(s). Download links have been sent to your email.`,
      // Remove in production - for testing only
      debug: import.meta.env.DEV ? {
        purchases: validPurchases.map(p => ({
          gameTitle: p.gameTitle,
          purchaseDate: p.purchaseDate,
          downloadExpires: p.downloadExpires,
        }))
      } : undefined
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Download recovery error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error. Please try again later.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};