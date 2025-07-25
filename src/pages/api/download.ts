import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { getFileStorageAdapter, parseDownloadToken } from '../../lib/file-storage';
import { getStorageAdapter } from '../../lib/storage';
import { siteConfig } from '../../config/site';
import fs from 'fs';
import path from 'path';

// Explicitly mark this route as server-rendered
export const prerender = false;

export const GET: APIRoute = async ({ url, request }) => {
  try {
    const gameId = url.searchParams.get('gameId');
    const filename = url.searchParams.get('filename');
    const token = url.searchParams.get('token');

    if (!gameId || !filename) {
      return new Response('Missing gameId or filename', { status: 400 });
    }

    console.log('Download request for game:', gameId, 'file:', filename);

    // Validate download token if provided
    if (token) {
      const tokenData = validateDownloadToken(token);
      if (!tokenData) {
        console.log('❌ Invalid download token');
        return new Response('Invalid or expired download token', { status: 401 });
      }
      
      if (tokenData.gameId !== gameId) {
        console.log('❌ Token game ID mismatch');
        return new Response('Invalid download token for this game', { status: 401 });
      }
      
      console.log('✅ Valid download token for:', tokenData.email);
    } else {
      console.log('⚠️ No download token provided - allowing for development');
    }

    // Get game details
    const games = await getCollection('games');
    const game = games.find(g => g.id === gameId);

    if (!game) {
      console.log('Game not found:', gameId);
      return new Response('Game not found', { status: 404 });
    }

    // Find the specific file
    const fileData = game.data.files.find(f => f.filename === filename);
    if (!fileData) {
      console.log('File not found:', filename);
      return new Response('File not found', { status: 404 });
    }

    // Use cloud storage for both development and production
    // This ensures we test the real implementation locally
    const fileStorage = getFileStorageAdapter();
    
    if (!fileStorage.isConfigured()) {
      console.error('File storage not configured');
      
      // In development, provide helpful error message
      if (import.meta.env.DEV) {
        return new Response(
          `File storage not configured!\n\n` +
          `Make sure your .env.local has:\n` +
          `- R2_ACCESS_KEY_ID\n` +
          `- R2_SECRET_ACCESS_KEY\n` +
          `- R2_BUCKET_NAME\n` +
          `- R2_ACCOUNT_ID\n\n` +
          `Current provider: ${fileStorage.getServiceName()}`,
          { 
            status: 500,
            headers: { 'Content-Type': 'text/plain' }
          }
        );
      }
      
      return new Response('File storage not configured', { status: 500 });
    }

    try {
      console.log(`🔗 Generating signed URL via ${fileStorage.getServiceName()}`);
      console.log(`📁 File path: ${gameId}/${filename}`);
      
      // Generate signed download URL
      const signedUrl = await fileStorage.generateDownloadUrl(gameId, filename, 48);
      
      console.log('✅ Generated signed URL successfully');
      if (import.meta.env.DEV) {
        console.log('🌐 Signed URL (DEV):', signedUrl);
      }
      
      // Redirect to the signed URL
      return new Response(null, {
        status: 302,
        headers: {
          'Location': signedUrl,
        },
      });

    } catch (error) {
      console.error('❌ File storage error:', error);
      
      // In development, provide more detailed error info
      if (import.meta.env.DEV) {
        return new Response(
          `Failed to generate download URL\n\n` +
          `Error: ${error.message}\n\n` +
          `Game ID: ${gameId}\n` +
          `Filename: ${filename}\n` +
          `Expected R2 path: ${gameId}/${filename}\n\n` +
          `Make sure the file exists in your R2 bucket at this exact path.`,
          { 
            status: 500,
            headers: { 'Content-Type': 'text/plain' }
          }
        );
      }
      
      return new Response('Failed to generate download', { status: 500 });
    }

  } catch (error) {
    console.error('Download endpoint error:', error);
    return new Response('Internal server error', { status: 500 });
  }
};

// Validate download token
function validateDownloadToken(token: string): { sessionId: string; email: string; gameId: string; issued: number; expires: number } | null {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64url').toString());
    
    // Check if token has expired
    if (Date.now() > payload.expires) {
      console.log('❌ Download token expired');
      return null;
    }
    
    // Validate required fields
    if (!payload.sessionId || !payload.email || !payload.gameId) {
      console.log('❌ Download token missing required fields');
      return null;
    }
    
    return payload;
  } catch (error) {
    console.log('❌ Failed to parse download token:', error);
    return null;
  }
}

// Helper function to serve local files in development
async function serveLocalFile(filePath: string, gameTitle: string, fileName?: string): Promise<Response> {
  try {
    // In development, serve from public directory
    const publicPath = path.join(process.cwd(), 'public', filePath);
    
    // Check if file exists
    if (!fs.existsSync(publicPath)) {
      console.log('Local file not found:', publicPath);
      
      // Return a placeholder download for testing
      const placeholderContent = `
# ${gameTitle} - Demo Download

This is a placeholder file for testing purposes.

In production, this would be your actual game file served from:
${filePath}

To test with a real file:
1. Place your game file at: public${filePath}
2. Restart the dev server
3. Try the download again

File path: ${publicPath}
      `.trim();

      return new Response(placeholderContent, {
        headers: {
          'Content-Type': 'text/plain',
          'Content-Disposition': `attachment; filename="${gameTitle}-demo.txt"`,
        },
      });
    }

    // Serve the actual file
    const fileBuffer = fs.readFileSync(publicPath);
    const fileName = path.basename(filePath);
    
    return new Response(fileBuffer, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Local file serving error:', error);
    return new Response('Failed to serve local file', { status: 500 });
  }
}