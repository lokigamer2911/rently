# 🔧 Environment Variables — Deployment Guide

## Architecture

```
┌─────────────────────┐     ┌─────────────────────┐     ┌──────────────┐
│   Vercel (Frontend)  │────▶│   Render (Backend)   │────▶│ Neon.tech    │
│   Next.js + React    │     │   Express + Socket   │     │ PostgreSQL   │
└─────────────────────┘     └─────────────────────┘     └──────────────┘
```

---

## 1. Vercel — Frontend

Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

| Variable | Value | Notes |
|----------|-------|-------|
| `NEXT_PUBLIC_API_URL` | `https://your-app.onrender.com/api` | **CRITICAL** — Backend API URL |
| `NEXT_PUBLIC_SOCKET_URL` | `https://your-app.onrender.com` | Socket.IO URL (same as backend) |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `AIzaSy...` | Firebase Web API Key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `your-project.firebaseapp.com` | Firebase Auth Domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `your-project-id` | Firebase Project ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `1:123:web:abc` | Firebase App ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `your-project.appspot.com` | Firebase Storage |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `123456789` | FCM Sender ID |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | `G-XXXXXXX` | Analytics (optional) |

> ⚠️ `NEXT_PUBLIC_` prefix is required for Next.js to expose vars to the browser.

---

## 2. Render — Backend

Go to: **Render Dashboard → Your Service → Environment**

| Variable | Value | Notes |
|----------|-------|-------|
| `NODE_ENV` | `production` | Enables security hardening |
| `PORT` | `5050` | Render default, or let Render auto-assign |
| `DATABASE_URL` | `postgresql://user:pass@ep-xxx.neon.tech/db?sslmode=require` | **Neon pooled connection** |
| `JWT_SECRET` | `your-64-char-random-string` | Generate with: `openssl rand -base64 48` |
| `JWT_REFRESH_SECRET` | `another-64-char-random-string` | Separate secret for refresh tokens |
| `CSRF_SECRET` | `random-string` | Auto-generated if not set, but set one for multi-replica |
| `ACCESS_TOKEN_SECRET` | `another-64-char-random-string` | Separate from JWT_SECRET |
| `CLIENT_URL` | `https://rently-chi.vercel.app` | Frontend URL for CORS + emails |
| `RAZORPAY_KEY_ID` | `rzp_test_xxxxx` | Razorpay test/live keys |
| `RAZORPAY_KEY_SECRET` | `xxxxx` | Razorpay secret |
| `RAZORPAY_WEBHOOK_SECRET` | `xxxxx` | Razorpay webhook signing secret |
| `GEMINI_API_KEY` | `AIzaSy...` | Google Gemini (for AI suggestions) |
| `SENDGRID_API_KEY` | `SG.xxxx` | SendGrid email service |
| `EMAIL_FROM` | `noreply@rently.in` | Sender email address |
| `TWILIO_ACCOUNT_SID` | `ACxxxxx` | Twilio for SMS |
| `TWILIO_AUTH_TOKEN` | `xxxxx` | Twilio auth token |
| `TWILIO_PHONE_NUMBER` | `+91XXXXXXXXXX` | Twilio phone number |
| `FIREBASE_PROJECT_ID` | `your-project-id` | Firebase Admin SDK |
| `FIREBASE_CLIENT_EMAIL` | `firebase-adminsdk@...iam.gserviceaccount.com` | Firebase Admin |
| `FIREBASE_PRIVATE_KEY` | `"-----BEGIN PRIVATE KEY-----\n..."` | Firebase Admin (with escaped newlines) |
| `CLOUDINARY_CLOUD_NAME` | `xxxxx` | Cloudinary image uploads |
| `CLOUDINARY_API_KEY` | `xxxxx` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | `xxxxx` | Cloudinary API secret |
| `SNYK_TOKEN` | `xxxxx` | Snyk API token (for CI) |

---

## 3. Neon.tech — Database

Go to: **Neon Dashboard → Your Project → Connection Details**

### Connection String (use Pooled connection)

```
postgresql://neondb_owner:xxxxx@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

> ⚠️ **Always use the pooled connection string** from Neon (port 5432, not direct connection on 5432).
> The pooled endpoint uses pgbouncer and handles connection limits.

### Neon Free Tier Limits
- **Connections**: ~20 simultaneous (pooled)
- **Storage**: 0.5 GB
- **Compute**: 191.9 compute-hours/month
- **Branches**: 10

### Prisma Schema Note

Your `schema.prisma` already uses PostgreSQL:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

If Neon's pooled URL uses port `5432`, Prisma works out of the box. If you use the direct connection (for migrations), you may need to add `?pgbouncer=true` to the pooled URL.

---

## 4. GitHub Secrets (for CI/CD)

Go to: **GitHub → Repository → Settings → Secrets and Variables → Actions**

| Secret | Value | Notes |
|--------|-------|-------|
| `SNYK_TOKEN` | `xxxxx` | From snyk.io account settings |

---

## 🔐 Security Checklist

- [ ] `JWT_SECRET` is 48+ random characters (run `openssl rand -base64 48`)
- [ ] `JWT_REFRESH_SECRET` is set and different from `JWT_SECRET`
- [ ] `CSRF_SECRET` is set for production
- [ ] `DATABASE_URL` uses `sslmode=require`
- [ ] `CLIENT_URL` matches your exact Vercel deployment URL
- [ ] All `.env` files are in `.gitignore` (never committed)
- [ ] Razorpay keys are test keys until you're ready for production
- [ ] Firebase private key has escaped newlines (`\\n` not actual newlines)
- [ ] `NODE_ENV=production` is set on Render

---

## 🚀 Deployment Commands

### Render Build Command
```bash
cd backend && npm install && npx prisma generate && npx prisma migrate deploy
```

### Render Start Command
```bash
cd backend && node src/index.js
```

### Neon Migration (manual, from local)
```bash
cd backend
npx prisma migrate deploy
```

---

## 🐛 Common Issues

### "Cannot read properties of undefined (reading 'cookie')"
→ `CLIENT_URL` is not set or doesn't match your Vercel domain.

### CORS error in browser console
→ Add your Vercel URL to `allowedOrigins` in `backend/src/app.js`.

### "Too many connections" from Neon
→ Use the **pooled** connection string from Neon, not the direct one.

### Socket.IO not connecting
→ Set `NEXT_PUBLIC_SOCKET_URL` to your Render backend URL (without `/api`).

### Cold start takes 30+ seconds
→ The keep-alive ping runs every 14 minutes. First boot is still slow on Render free tier.
