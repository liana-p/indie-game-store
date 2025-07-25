# 🎮 Indie Game Store Template

An open-source template for indie game developers to sell their games directly on their own website, independently of any larger gaming platform. Uses cloud services for hosting/payment that prioritize **free tiers** and **usage-based pricing** to minimize costs for small developers. It should be possible to host and run this store for free for small developers, with costs only incurred as sales grow.

See an example of this template in action on my test store selling a simple game: [Walk Through the Forest](https://walk-through-the-forest.ovh).

## Disclaimer

This template is provided as-is. It is software to help you run your own game store, but it does not come with any guarantees that it will function for your use case, or be compatible with your local legislations. You are responsible for ensuring compliance with local laws, taxes, and regulations regarding online sales, digital goods, and consumer rights.

You are also responsible for ensuring that you comply with the terms of service of the services used in this template, such as Stripe, Resend, Cloudflare R2, or any other service that you choose to use.

Understand that if you use this template to run your own game store, your are running a business and responsible for maintaining its operation, including customer support, refunds, legal compliance, or any other obligations that may arise from selling your games online.

This software is provided under the MIT license (which you must read at [LICENSE](LICENSE)).

## Note on adult content

Adult content may violate the terms of service of some services used in this template, such as Stripe and Resend. If you plan to sell adult content, please check the terms of service of each service you use to ensure compliance. This template does not include any specific features for handling adult content, and you are responsible for ensuring that your store complies with all applicable laws and regulations regarding adult content.

## Quick Start

If you want to deploy this straight to Vercel, use this button. You will need to create accounts with the other cloud services listed below and enter the relevant API key environment variables (also explained below)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fliana-p%2Findie-game-store&env=STRIPE_PUBLISHABLE_KEY,STRIPE_SECRET_KEY,STRIPE_WEBHOOK_SECRET,RESEND_API_KEY,R2_ACCESS_KEY_ID,R2_SECRET_ACCESS_KEY,R2_BUCKET_NAME,R2_ACCOUNT_ID,UPSTASH_REDIS_REST_URL,UPSTASH_REDIS_REST_TOKEN&envDescription=API%20keys%20needed%20to%20use%20the%20various%20services%20this%20template%20requires&envLink=https%3A%2F%2Fgithub.com%2Fliana-p%2Findie-game-store%3Ftab%3Dreadme-ov-file%23configure-environment-variables&project-name=my-game-store&repository-name=my-game-store&demo-title=Liana's%20Store&demo-description=My%20store%20using%20this%20template&demo-url=https%3A%2F%2Fwalk-through-the-forest.ovh%2F)

## 🌩️ Services Used

This template uses **free/cheap cloud services** to perform the following tasks:

- Web hosting: [Vercel](https://vercel.com) (free tier)
- Payment processing: [Stripe](https://stripe.com) (2.9% + $0.30 per transaction, 0.5% for VAT handling)
- Email delivery: [Resend](https://resend.com) (free for 3,000 emails/month, then $20/month for 50,000 emails)
- Purchase storage: [Upstash Redis](https://upstash.com) (free for 10,000 requests/day) - this is used to serve game downloads, and is integrated with Vercel
- File storage: [Cloudflare R2](https://www.cloudflare.com/products/r2/) (free for 30GB/month, then $0.015/GB) or [Bunny.net CDN](https://bunny.net) (free for 1TB transfer, then $0.01/GB)
- GitHub or Gitlab to host your repository (it has to be a public repository if you want to use the free tier on Vercel, so make sure to not include any sensitive information in your repository)
- You should also have a domain name for your store, which you can purchase from any domain registrar.

## Customisation

This template is meant to be easily customizable. Here are some easy ways to customize it:

- Look at the `src/content/games.yaml` file to add your games.
- Edit `src/config/site.ts` to change your studio name, email, and other site details.
- Change theme variables in `src/styles/variables.css` to match your branding, or edit other CSS files in there.
- Edit the general site layout in `src/layouts/Layout.astro` and the other files it uses to change the header, footer, and other common elements.
- Create new pages in `src/pages/` using markdown file or Astro components.
- Edit the astro files, typescript and any other code in the template for more advanced customization.

## Other Requirements

- Ability to follow instructions (going in control panels of various services, entering terminal commands, etc.)
- Some free time to create all the accounts and configure the services
- Ability to edit simple config files (I recommend opening this folder in [VS Code](https://code.visualstudio.com/) or similar editor)
- If you want to change the style of your website, understanding of basic HTML/CSS to customise this template
- A credit card to pay for services (even when using free tiers, you may need to enter a card for verification)
- An understanding of your local laws regarding online sales, digital goods, and consumer rights
- Acknowledgement that you are running your own online shop and that no support is provided for this template. If you use it, you are responsible for maintaining your store and ensuring it complies with all applicable laws and regulations.

## 💰 Example calculations of expected running costs

Those are example calculations based on published prices of the services used at time of writing. Actual costs may vary based on your usage, sales volume, and any changes to service pricing. Please check the service providers' websites for the most up-to-date pricing and make your own calculations to make sure you understand the costs involved.

| Scale       | Sales/Month | Revenue | Hosting | Email | Storage | File Delivery | Stripe Fees | **Total Cost** | **Total %** | Steam (30%) | itch.io (10%) |
| ----------- | ----------- | ------- | ------- | ----- | ------- | ------------- | ----------- | -------------- | ----------- | ----------- | ------------- |
| **Small**   | 10 @ $15    | $150    | Free    | Free  | Free    | Free          | $5.20       | **$5.20**      | **3.5%**    | $45         | $15           |
| **Growing** | 100 @ $15   | $1,500  | Free    | Free  | Free    | $3            | $52         | **$55**        | **3.7%**    | $450        | $150          |
| **Large**   | 1,000 @ $15 | $15,000 | Free    | $20   | Free    | $30           | $520        | **$570**       | **3.8%**    | $4,500      | $1,500        |

Detailed cost breakdown further below.

## 🚀 Setup Guide

This repository is a template, so you can download it as-is, configure it for your game, and then modify it as needed.

### Prerequisites

If you want to test locally before deploying (you probably should), you'll need:

- [Node.js](https://nodejs.org/) (v18+)
- [pnpm](https://pnpm.io/) package manager

You will also need to create accounts for all the services used.

### How I test this

Essentially you have a development environment on your local machine, a preview one on vercel, and the final production one.

In .env.local, your local development environment, you can use real API keys for Resend, Cloudflare R2, and Upstash redis. The few requests you'll send during development will not incur any costs, and you can test the full purchase flow locally. Only for Stripe you will want to use sandbox environment keys, so you can test purchases without real money (more on that later).

In Vercel, in the production environment you will want to fill the environment variables with all your live API keys, including the live Stripe ones. If you want to use a preview environment on Vercel for testing before the final production, you can make the preview environment use the sandbox keys for Stripe, and the live keys for Resend, Cloudflare R2, and Upstash redis. This way you can test purchases on the (almost) final deployed website.

Then the flow is:

1. Test the full flow and purchases locally in the sandbox
2. Deploy to Vercel preview, and test that flow (note: due to how Vercel handles URLs, you might have incorrect URLs in the emails sent when not in production, so you can edit the base url of the emails you receive to check they work)
3. Deploy to Vercel production, and test the full flow with real purchases

### Clone & Install

```bash
git clone https://github.com/your-username/indie-game-store
cd indie-game-store
pnpm install
```

(Or just download the ZIP version from GitHub).

### Configure Your Games

Edit `src/content/games.yaml`:

```yaml
- id: demo-game
  title: "My Game"
  # This is the price that will be charged, in the currency specified in the store config.
  price: 15.00
  description: "This is a game"
  # A wide banner image that will be used as the cover for the game.
  cover: "/images/demo-game/cover.jpg"
  # A smaller thumbnail that will be used as a small representation of the game
  thumbnail: "/images/demo-game/thumbnail.jpg"
  files:
    # This is an array, you can put whatever platforms and files you want in here
    - name: "Windows (64-bit)"
      filename: "my-game-win32-x64.zip"
      size_gb: 0.500
      description: "For Windows 10+ (64-bit)"
    - name: "Linux (64-bit)"
      filename: "my-game-linux-x64.zip"
      size_gb: 0.500
      description: "For Linux (64-bit)"
    - name: "MacOS (64-bit)"
      filename: "my-game-macos-x64.zip"
      size_gb: 0.500
      description: "For MacOS (64-bit)"
  release_date: "2023-10-01"
  # Featured games appear first
  featured: true
  # This is an array of high-res screenshots that will be shown when clicked on
  screenshots:
    - "/images/demo-game/screenshot-1.jpg"
    - "/images/demo-game/screenshot-2.jpg"
    - "/images/demo-game/screenshot-3.jpg"
    - "/images/demo-game/screenshot-4.jpg"
  # This is an array of smaller screenshot thumbnails that should correspond to the screenshots above
  small_screenshots:
    - "/images/demo-game/screenshot-1-small.jpg"
    - "/images/demo-game/screenshot-2-small.jpg"
    - "/images/demo-game/screenshot-3-small.jpg"
    - "/images/demo-game/screenshot-4-small.jpg"
  # This is an array of system requirements, you can put whatever platforms and requirements you want in here
  system_requirements:
    - platform: "Windows"
      requirements: "Windows 7, 4GB Ram"
    - platform: "Linux"
      requirements: "Linux 4.15, 4GB Ram"
    - platform: "MacOS"
      requirements: "MacOS 10.15, 4GB Ram"
```

Edit `content/landing.md` with your game's description and `src/config/site.ts` with your studio details.

### Set Up Stripe (Payments)

#### Create Stripe Account

1. Go to [stripe.com](https://stripe.com) and create an account
2. Complete account verification for your country

#### Enable Test Sandbox

1. In Stripe Dashboard, in the top left, switch to sandbox mode (create a test sandbox)
2. Go to **Developers → API Keys** (stripe might ask you to enable the new developer interface, and the developers button ends up being at the bottom left)
3. Copy your **Publishable key** (`pk_test_...`) and **Secret key** (`sk_test_...`)
4. Those keys are for the test sandbox (they don't charge real money). If you want to find your live production keys, exit the sandbox and copy those keys. The live production keys should only be entered in the Vercel environment variables, not in your `.env.local` file.

#### Enable Stripe Tax (Highly Recommended)

1. Go to **Settings → Tax** in Stripe Dashboard
2. Click **Enable Stripe Tax**
3. This adds 0.5% fee but handles all VAT automatically worldwide
4. Please check your local tax laws and regulations to ensure compliance

### Set Up Resend (Email Delivery)

#### Create Resend Account

1. Go to [resend.com](https://resend.com) and create an account
2. Verify your email address
3. Go to **API Keys** and create a new key
4. Copy the API key (starts with `re_`)

#### Domain Verification (Optional for Testing)

For production, add your domain in Resend Dashboard and verify via DNS. For testing, Resend works without domain verification.

### Set Up Cloudflare R2 (File Storage)

#### Create Cloudflare Account & R2 Bucket

1. Go to [cloudflare.com](https://cloudflare.com) and create an account
2. Navigate to **R2 Object Storage** in the dashboard
3. Click **Create bucket** and choose a name (e.g., `my-game-files`)

#### Create R2 API Token

4. In the R2 Object Storage overview, click the **API** button (next to "Create bucket")
5. Click **Manage API tokens**
6. Choose **Account API Tokens** (recommended for production - stays active even if you change organizations)
7. Click **Create API Token** and configure:
   - **Token name**: Something like "Game Store Downloads"
   - **Permissions**: **Object Read** (read-only is sufficient since the store only needs to serve files, not upload them)
   - **Bucket**: Select your specific bucket or "All buckets"
8. Click **Create** and copy these values:
   - **Access Key ID** → `R2_ACCESS_KEY_ID` in your `.env.local`
   - **Secret Access Key** → `R2_SECRET_ACCESS_KEY` in your `.env.local`
9. Get your **Account ID** from the endpoint URL shown at the bottom:
   - Look for "Use jurisdiction-specific endpoints for S3 clients:"
   - Copy the part before `.r2.cloudflarestorage.com`
   - Example: from `https://[your-account-id].r2.cloudflarestorage.com`, the Account ID is `[your-account-id]`
   - This goes to → `R2_ACCOUNT_ID` in your `.env.local`
10. Your bucket name → `R2_BUCKET_NAME` in your `.env.local`

**Note**: You only need **Read** permissions because the store downloads files but doesn't upload them. You'll upload your game files manually through the Cloudflare dashboard or separate tools.

#### Alternative: Bunny.net Setup

If you prefer Bunny.net instead:

1. Create account at [bunny.net](https://bunny.net)
2. Create a **Storage Zone**
3. Get your **API Key** from Account Settings
4. Note your **CDN URL** from the storage zone

### Create Environment File

**MAKE SURE TO NEVER COMMIT YOUR SECRET KEYS IN THE GIT REPOSITORY IF PUBLIC!!!**

Create `.env.local` in your project root:

```bash
# Copy this file to .env.local for development
# Add your actual keys to Vercel environment variables for production

# Stripe Keys (get from https://dashboard.stripe.com/apikeys)
STRIPE_PUBLISHABLE_KEY=pk_test_your_test_key_here
STRIPE_SECRET_KEY=sk_test_your_test_secret_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Email Service (Resend - get from https://resend.com/api-keys)
RESEND_API_KEY=re_your_resend_api_key_here

# File Storage Provider (set in src/config/site.ts or override here)
# FILE_STORAGE_PROVIDER=cloudflare-r2  # or "bunny-net" or "local"

# Cloudflare R2 (recommended for free tier)
R2_ACCESS_KEY_ID=your_r2_access_key_here
R2_SECRET_ACCESS_KEY=your_r2_secret_key_here
R2_BUCKET_NAME=your_r2_bucket_name
R2_ACCOUNT_ID=your_r2_account_id
# R2_CUSTOM_DOMAIN=https://your-custom-domain.com (optional)

# Bunny.net CDN (alternative)
# BUNNY_API_KEY=your_bunny_api_key_here
# BUNNY_STORAGE_ZONE=your_storage_zone_name
# BUNNY_CDN_URL=https://your-cdn-url.b-cdn.net

# Upstash Redis (for download recovery)
UPSTASH_REDIS_REST_URL=your_upstash_redis_rest_url_here
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_rest_token_here
```

### Set Up Webhooks (Important!)

#### For Local Development:

If you want to test the full purchase flow locally (again, you really should), you need to set up Stripe CLI to forward webhooks to your local machine for testing.

**Windows Users**:

1. **Download Stripe CLI**:
   - Go to [github.com/stripe/stripe-cli/releases](https://github.com/stripe/stripe-cli/releases)
   - Download `stripe_X.X.X_windows_x86_64.zip` (latest version)
   - Extract the ZIP file - you'll see `stripe.exe`
   - Create a folder `C:\stripe\` and move `stripe.exe` there (or somewhere else you prefer)
2. **Add to Windows PATH**:
   - Press `Windows + R`, type `sysdm.cpl`, press Enter
   - Click **Advanced** tab → **Environment Variables**
   - Under "User variables", find **Path** → click **Edit**
   - Click **New** → add `C:\stripe\` (or wherever you put `stripe.exe`)
   - Click **OK** on all dialogs, restart terminal
3. **Test**: `stripe --version` If it shows the version, you're good!

**macOS/Linux Users**:

- **macOS**: `brew install stripe/stripe-cli/stripe`
- **Linux**: Download from releases or use your package manager

##### Login to Stripe

- Run `stripe login` (or `.\stripe login` if using the simple method)
- This opens your browser to authenticate with Stripe

##### Forward webhooks

This is what makes your local test server receive events from Stripe when a purchase is made. Only required when you are testing locally.

- Run `stripe listen --forward-to localhost:4321/api/webhook`
- (or `.\stripe listen --forward-to localhost:4321/api/webhook`)
- **Keep this terminal window open** - it needs to stay running
- **Copy the webhook secret** from the output (starts with `whsec_`) and replace `whsec_your_webhook_secret_here` in your `.env.local` file

#### For Production:

1. In Stripe Dashboard, go to **Developers → Webhooks**
2. Click **Add endpoint**
3. Enter URL: `https://your-site.vercel.app/api/webhook` <-- Replace with your actual production URL
4. Select event: `checkout.session.completed`
5. Copy the webhook secret and add to Vercel environment variables

### Test Everything Locally (Test Mode)

#### Start the Development Server

```bash
pnpm dev
```

#### Test the Complete Flow

The testing environment simulates a real purchase flow without charging real money. As long as you use your Stripe sandbox environment, you won't incur any real charges.

1. **Visit** `http://localhost:4321`
2. **Click "Buy Now"** on a game
3. **Use test card**: `4242424242424242`
   - Any future expiry date (e.g., `12/34`)
   - Any 3-digit CVC (e.g., `123`)
   - Any postal code (e.g., `12345`)
   - For the email address, you need to use the email registered on your Resend account if you haven't setup your own domain yet (Resend only allows sending emails to that one email when using the onboarding email).
4. **Complete the purchase** - you should be redirected to success page
5. **Check your email** - you should receive a purchase confirmation
6. **Test download recovery** at `/recover-download`

#### Other Test Cards

- **Declined**: `4000000000000002`
- **3D Secure**: `4000000000003220`
- **Insufficient funds**: `4000000000009995`

#### Webhook Testing

In a separate terminal, run:

```bash
stripe listen --forward-to localhost:4321/api/webhook
```

Copy the webhook secret from the output and add it to your `.env.local` file.

### Deploy to Production

#### Setup Repository

1. If you haven't already, create your repo on github or gitlab (you can do this by forking this template repository if you want)
2. Push your local changes to the remote repository
3. Unfortunately Vercel doesn't allow private repositories on the free plan, so if you don't want to pay for Vercel you will need to make your repository public. Make sure to not include any sensitive information in your repository, such as the API keys, or builds of your game. You can add files and folders to `.gitignore` to prevent them from being committed.

#### Setup Vercel Account

1. Create account at [vercel.com](https://vercel.com)
2. Create a project
3. Connect your GitHub repository or some other Git provider to import your project
4. Add your domain to Vercel (buy one if you don't have one yet, you need it for Resend too)

#### Configure Environment Variables

In Vercel Dashboard → Settings → Environment Variables, add the following variables:

```
STRIPE_PUBLISHABLE_KEY=pk_live_your_live_key
STRIPE_SECRET_KEY=sk_live_your_live_secret
STRIPE_WEBHOOK_SECRET=whsec_your_production_webhook_secret
RESEND_API_KEY=re_your_resend_api_key
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_BUCKET_NAME=your_r2_bucket_name
R2_ACCOUNT_ID=your_r2_account_id
# Optional: R2_REGION=auto (or your specific region)
# Those upstash redis keys will be obtained in the next step
UPSTASH_REDIS_REST_URL=your_upstash_redis_rest_url_here
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_rest_token_here

```

#### Set Up Upstash Redis (For Download Recovery)

1. In Vercel Dashboard → Integrations → Browse Marketplace
2. Search for "Upstash" and install the Upstash integration
3. Create a new Redis database (free tier available)
4. Connect to your project
5. In the storage page you were in, the "Quickstart" section has a "TypeScript" button. Click it and look at the two tokens in the sample code. You can click "Show secret" and copy them to fill the `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in your Vercel environment variables (and in your local `.env.local` file if you want persistent storage for development testing).

#### Deploy

1. Push to GitHub
2. Vercel automatically deploys
3. Update Stripe webhook URL to your production domain

### Go Live with Real Payments

#### Switch to Stripe Live Mode

Only do this when you're ready to accept real payments:

1. In Stripe Dashboard, toggle to **Live Mode**
2. Update environment variables with live keys
3. Set up production webhook endpoint if not already done

#### Upload Your Game Files

**Important**: Upload your actual game files to match the structure in your `games.yaml` configuration.

**For Cloudflare R2**:

1. **Go to Cloudflare Dashboard** → **R2 Object Storage** → **Your Bucket**
2. **Create folder structure** for each game using the game ID:
   ```
   your-bucket/
   ├── demo-game/                          # Matches "id: demo-game" in games.yaml
   │   ├── demo-game-windows-v1.0.zip     # Matches filename in files array
   │   ├── demo-game-mac-v1.0.dmg
   │   ├── demo-game-linux-v1.0.tar.gz
   │   └── demo-game-source-v1.0.zip
   ├── another-game/                       # Another game's files
   │   ├── another-game-v2.1.zip
   │   └── another-game-mac-v2.1.dmg
   ```
3. **Match your config**: For each game in `games.yaml`, upload files to `{game_id}/{filename}` in your bucket

**Example**: If your `games.yaml` has:

```yaml
- id: my-game
  files:
    - name: "Windows"
      filename: "my-game-win.zip"
    - name: "macOS"
      filename: "my-game-mac.dmg"
```

Upload files to:

- `my-game/my-game-win.zip`
- `my-game/my-game-mac.dmg`

**For Bunny.net**:

Note: This template has been tested with Cloudflare R2. Please make sure you verify that the Bunny.net setup works for your use case.

1. **Go to Bunny.net** → **Storage** → **Your Storage Zone**
2. **Use the same folder structure** as described above

**Testing Your Uploads**:

- Make a test purchase to verify download links work
- Each game shows a selection page with all available files
- Download links are generated dynamically for each file

## 📁 Project Structure

```
indie-game-store/
├── src/
│   ├── content/
│   │   └── games.yaml          # Your games configuration
│   ├── pages/
│   │   ├── api/
│   │   │   ├── checkout.ts     # Stripe checkout creation
│   │   │   ├── webhook.ts      # Payment processing
│   │   │   └── recover-download.ts # Download recovery
│   │   ├── index.astro         # Main store page
│   │   ├── success.astro       # Purchase success page
│   │   └── recover-download.astro # Download recovery page
│   ├── config/
│   │   └── site.ts            # Site configuration
│   └── lib/
│       ├── storage.ts         # Storage abstraction layer
│       └── utils.ts           # Utility functions
├── content/
│   └── landing.md             # Your game's landing page content
└── public/
    └── images/                # Game images and assets
```

## 🛠️ Customization

### Adding Multiple Games

Add more entries to `src/content/games.yaml`:

```yaml
- id: first-game
  title: "My First Game"
  price: 10.00
  files:
    - name: "Windows"
      filename: "first-game-win.zip"
      size_gb: 1.5
    - name: "macOS"
      filename: "first-game-mac.dmg"
      size_gb: 1.6
  # ... other details

- id: second-game
  title: "My Second Game"
  price: 20.00
  files:
    - name: "Cross-Platform"
      filename: "second-game-universal.zip"
      size_gb: 3.2
      description: "Works on Windows, Mac, and Linux"
  # ... other details
```

### Styling

- Edit styles in `src/layouts/Layout.astro`
- Customize colors in the CSS variables
- Add your logo and branding

### Site Configuration

Edit `src/config/site.ts`:

```typescript
export const siteConfig = {
  developer: {
    name: "Your Studio Name",
    email: "hello@yourstudio.com",
    // ...
  },
  site: {
    title: "Your Game Store",
    url: "https://your-domain.com",
    // ...
  },
};
```

## 🧪 Testing

### Test Cards (Stripe Test Mode)

- **Successful payment**: `4242424242424242`
- **Declined payment**: `4000000000000002`
- **Requires 3D Secure**: `4000000000003220`
- **Insufficient funds**: `4000000000009995`

Use any future expiry date, any CVC, and any postal code.

### Testing Download Recovery

1. Make a test purchase with a real email
2. Visit `/recover-download`
3. Enter the email used for purchase
4. Check server logs for download links

### Custom Domain

1. Add domain in Vercel Dashboard
2. Update DNS settings
3. Update `siteConfig.site.url`
4. Update Resend domain settings

### Analytics

There is no analytics included. If you want to use analytics, you can add it yourself.

### Detailed Cost Breakdown

Again, this is just an indication based on simple calculations. Actual costs may vary based on your usage, sales volume, and any changes to service pricing.

**Very small developer (2GB game, 10 sales/month at $15):**

- Hosting: **Free** (Vercel)
- Email: **Free** (under 3k/month)
- Storage: **Free** (under Upstash free limits)
- File delivery: **Free** (under 30GB R2 limit)
- Stripe fees: 3.5% + $0.30 per transaction: **~$5.20**
- **Total: ~$5.20/month for $150 in sales (3.5% fees)**

**Growing developer (2GB game, 100 sales/month at $15):**

- Hosting: **Free** (Vercel)
- Email: **Free** (under 3k/month)
- Storage: **Free** (under Upstash free limits)
- File delivery: **~$3** (200GB R2 transfer)
- Stripe fees: **~$52**
- **Total: ~$55/month for $1,500 in sales (3.7% fees)**

**Established developer (2GB game, 1,000 sales/month at $15):**

- Hosting: **Free** (Vercel)
- Email: **$20** (over 3k emails/month)
- Storage: **Free** (under Upstash free limits)
- File delivery: **~$30** (2TB R2 transfer)
- Stripe fees: **~$520**
- **Total: ~$570/month for $15,000 in sales (3.8% fees)**

## 💬 Support

No support is provided.

## 📄 License

MIT License - see LICENSE file for details.

## 🙏 Contributing

Contributions are welcome! Especially if you are able to implement alternate service providers to give more choices to developers.
