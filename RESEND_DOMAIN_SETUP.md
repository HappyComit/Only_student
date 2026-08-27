# 📧 Resend Custom Domain Setup Guide — OnlyStudents

## Current Status

| Provider | Role | Status |
|---|---|---|
| **Gmail SMTP** | Primary email sender | ✅ Working — sends OTPs to `@cuchd.in` |
| **Resend API** | Fallback (disabled without verified domain) | ⏳ Waiting for custom domain |

> **Right now:** Gmail SMTP handles all OTP emails. It works, but emails *may* occasionally land in spam for some university accounts.

---

## Why You Need a Custom Domain on Resend

- Resend's free sandbox domain (`@resend.dev`) can **only email the Resend account owner** — not students
- A verified custom domain adds **DKIM, SPF, and DMARC** records to your DNS
- These records prove to email providers (Gmail, Outlook) that **you are a legitimate sender**
- Result: **emails land in inbox, never spam** ✅

---

## Step-by-Step Setup (5–10 minutes)

### Step 1 — Buy a Domain

Buy a domain from any registrar:

| Registrar | Suggested Domain | Price |
|---|---|---|
| [Cloudflare](https://dash.cloudflare.com) | `onlystudents.in` | ~₹150/yr |
| [Namecheap](https://namecheap.com) | `onlystudents.app` | ~₹800/yr |
| [GoDaddy](https://godaddy.com) | `onlystudents.co.in` | ~₹99/yr |

> 💡 **Tip:** You'll use this same domain for your website later. No conflict.

---

### Step 2 — Add Domain on Resend

1. Go to **[resend.com/domains](https://resend.com/domains)**
2. Click **"Add Domain"**
3. Enter your domain (e.g., `onlystudents.in`)
4. Resend will show you **3 DNS records** to add:

| Type | Name | Value | Purpose |
|---|---|---|---|
| **MX** | `send._domainkey` | Resend's MX value | Mail routing |
| **TXT** | `@` or `_domainkey` | `v=spf1 include:...` | SPF — authorizes Resend to send on your behalf |
| **CNAME** | `resend._domainkey` | `resend.domainkey...` | DKIM — email signature verification |

---

### Step 3 — Add DNS Records

Go to your domain registrar's **DNS settings** and paste the records Resend gave you.

- **Cloudflare:** Dashboard → DNS → Add Record
- **Namecheap:** Domain List → Manage → Advanced DNS → Add New Record
- **GoDaddy:** My Products → DNS → Add Record

> ⚠️ DNS propagation can take **5 minutes to 48 hours** (usually under 30 minutes).

---

### Step 4 — Verify on Resend

1. Go back to [resend.com/domains](https://resend.com/domains)
2. Click **"Verify"** next to your domain
3. Wait for green ✅ checkmarks on all records

---

### Step 5 — Update Backend Environment Variables

Once verified, update these values:

#### Local `.env` file (`Backend/.env`)

```env
RESEND_API_KEY="re_YOUR_RESEND_API_KEY"
RESEND_FROM_EMAIL="OnlyStudents <verify@onlystudents.in>"
```

> Replace `onlystudents.in` with your actual domain.

#### Render Dashboard

Go to your Render service → **Environment** tab → update:

| Variable | New Value |
|---|---|
| `RESEND_API_KEY` | `re_YOUR_RESEND_API_KEY` |
| `RESEND_FROM_EMAIL` | `OnlyStudents <verify@onlystudents.in>` |

---

### Step 6 — Swap Resend Back to Primary (Optional)

Once Resend is working with your verified domain, you can swap it back to primary in `Backend/routes/auth.js` inside the `sendOtpEmail()` function.

Change the order so **Resend is tried first**, Gmail SMTP is fallback:

```js
// 1. Primary: Resend API (verified domain — best deliverability)
// 2. Fallback: Gmail SMTP
```

---

## Resend Free Tier Limits

| Feature | Limit |
|---|---|
| Emails per day | **100** |
| Emails per month | **3,000** |
| Custom domains | **1** |
| API keys | Unlimited |

> 100 emails/day is plenty for a campus app. If you grow beyond that, Resend Pro is $20/month for 50,000 emails.

---

## Quick Test After Setup

Run this curl to verify Resend works with your domain:

```bash
curl -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer re_YOUR_RESEND_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "OnlyStudents <verify@onlystudents.in>",
    "to": "your-email@cuchd.in",
    "subject": "Test OTP",
    "html": "<p>Your code: <b>123456</b></p>"
  }'
```

If you get a `200` with an email `id`, you're all set! 🎉

---

## Checklist

- [ ] Buy domain (any registrar)
- [ ] Add domain on Resend dashboard
- [ ] Add DNS records (MX, SPF, DKIM)
- [ ] Verify domain on Resend (green checkmarks)
- [ ] Update `RESEND_FROM_EMAIL` in `.env`
- [ ] Update `RESEND_FROM_EMAIL` on Render env vars
- [ ] Test sending an email to `@cuchd.in`
- [ ] (Optional) Swap Resend back to primary in `auth.js`

---

*Last updated: August 18, 2026*
