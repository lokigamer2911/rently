<div align="center">

<img src="./frontend/public/logo.png" alt="Rently Logo" height="140" />

<br/>

# Rently — Peer-to-Peer Rental Marketplace

### *Empowering the Sharing Economy. Rent anything, anywhere, securely.*

<br/>

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

<br/>

[![Socket.io](https://img.shields.io/badge/Socket.io-Real--Time-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io/)
[![Razorpay](https://img.shields.io/badge/Razorpay-Payments-02042B?style=for-the-badge&logo=razorpay&logoColor=white)](https://razorpay.com/)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-CDN-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)](https://cloudinary.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Google Maps](https://img.shields.io/badge/Google_Maps-API-4285F4?style=for-the-badge&logo=google-maps&logoColor=white)](https://developers.google.com/maps)

<br/>

[![CI/CD](https://github.com/lokigamer2911/rently/actions/workflows/ci.yml/badge.svg)](https://github.com/lokigamer2911/rently/actions)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg?style=flat-square)](./LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](https://github.com/lokigamer2911/rently/pulls)

<br/>

<a href="#-vision--overview">Overview</a> •
<a href="#️-system-architecture">Architecture</a> •
<a href="#-tech-stack">Tech Stack</a> •
<a href="#-feature-matrix">Features</a> •
<a href="#-local-development-setup">Setup</a> •
<a href="#-testing">Testing</a> •
<a href="#-directory-structure">Structure</a>

</div>

---

## 🚀 Vision & Overview

**Rently** is a production-grade, full-stack **peer-to-peer (P2P) rental marketplace** built for the modern sharing economy. It enables individuals and businesses to monetize underutilized assets — from camera gear and electronics to vehicles and heavy machinery — by safely renting them to their community.

The platform is engineered for trust, speed, and scale, combining:
- 🔐 **Secure identity & payments** via JWT authentication and Razorpay
- 💬 **Real-time communication** via Socket.io for live chat and notifications
- 🗺️ **Location-based discovery** powered by Google Maps API
- 📱 **PWA support** for native app-like experience on iOS & Android
- 🛡️ **Enterprise-grade security** via Helmet, CORS, and rate limiting

---

## 🏗️ System Architecture

Rently uses a **decoupled monorepo architecture** — a Next.js PWA on the client communicating with a Node.js/Express REST API and Socket.io real-time server on the backend.

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
│  Next.js 15 PWA  │  Tailwind CSS  │  SWR  │  React Context     │
│  Google Maps     │  Socket.io-client       │  Three.js          │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS REST + WebSockets
┌──────────────────────────▼──────────────────────────────────────┐
│                        API LAYER                                │
│  Node.js 20 + Express.js     │  Socket.io Server               │
│  JWT Auth + Middleware        │  Winston Logger                 │
│  Helmet + Rate Limiting       │  Zod Validation                 │
└──────────────────────────┬──────────────────────────────────────┘
                           │
          ┌────────────────┼──────────────────────┐
          │                │                      │
┌─────────▼──────┐  ┌──────▼────────┐  ┌─────────▼──────────┐
│  PostgreSQL 14 │  │  Razorpay     │  │  Cloudinary CDN    │
│  via Prisma ORM│  │  Payments     │  │  Image Uploads     │
└────────────────┘  └───────────────┘  └────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| **Next.js** | 15 | SSR/SSG framework with Pages Router |
| **React** | 19 | UI component library |
| **Tailwind CSS** | 3 | Utility-first responsive styling |
| **SWR** | 2 | Cache-first data fetching & revalidation |
| **Socket.io Client** | 4 | Real-time bidirectional communication |
| **Google Maps API** | Latest | Location-based listing discovery |
| **React Leaflet** | 4 | Interactive map rendering |
| **Three.js + R3F** | Latest | 3D product visualizations |
| **Recharts** | 3 | Dashboard analytics & charts |
| **next-pwa** | 5 | Progressive Web App (service workers) |
| **next-sitemap** | 4 | Automated XML sitemaps for SEO |
| **Firebase SDK** | 10 | Client-side authentication integration |
| **Axios** | 1 | HTTP client for API requests |
| **React Hot Toast** | 2 | In-app notification toasts |
| **jsPDF** | 4 | Client-side PDF generation (receipts) |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| **Node.js** | 20 | JavaScript runtime |
| **Express.js** | 4 | HTTP server & routing framework |
| **Prisma ORM** | 5 | Type-safe database access & migrations |
| **PostgreSQL** | 14+ | Primary relational database |
| **Socket.io** | 4 | Real-time WebSocket server |
| **JSON Web Token** | 9 | Stateless authentication |
| **bcryptjs** | 2 | Password hashing |
| **Zod** | 3 | Runtime request validation schemas |
| **Razorpay SDK** | 2 | Payment order creation & webhook handling |
| **Cloudinary SDK** | 2 | Image upload, transform & CDN delivery |
| **@sendgrid/mail** | 8 | Transactional email delivery |
| **Twilio** | 6 | SMS/OTP notifications |
| **Firebase Admin** | 12 | Server-side Firebase authentication |
| **Helmet.js** | 8 | Secure HTTP response headers |
| **express-rate-limit** | 8 | Brute-force & DDoS protection |
| **Winston** | 3 | Structured production logging |
| **Multer** | 1 | Multipart file upload handling |
| **cookie-parser** | 1 | HTTP cookie management |
| **dotenv** | 16 | Environment variable management |

### DevOps & Tooling
| Technology | Purpose |
|---|---|
| **GitHub Actions** | CI/CD pipeline (lint, build, test) |
| **Jest** | Unit & integration test runner |
| **Supertest** | HTTP assertion testing for Express |
| **Nodemon** | Hot-reload development server |
| **Vercel** | Frontend deployment & edge network |

---

## ✨ Feature Matrix

### 👤 For Renters
- **🔍 Smart Search Engine** — Filter by category, city, price range, and minimum rating
- **🗺️ Interactive Map Discovery** — Browse listings visually on a city map with clustered markers
- **📅 Seamless Booking Flow** — Select dates, view cost breakdowns (fee + deposit), and pay via Razorpay
- **💳 Secure Checkout** — Razorpay-powered payment with HMAC signature verification
- **📦 Live Order Tracking** — Track handover, active rental, and return states in real time
- **⭐ Reviews & Ratings** — Leave and receive two-way feedback after each completed booking
- **📄 PDF Receipts** — Download rental agreements and payment receipts as PDFs
- **📱 PWA Support** — Install Rently as a native app on iOS and Android

### 🏢 For Asset Owners (Lenders)
- **📸 Rich Listing Creation** — Multi-photo uploads, detailed descriptions, dynamic pricing
- **🏷️ Category & Tag Management** — Organize assets for maximum discoverability
- **✅ Booking Management Dashboard** — Approve or reject incoming booking requests
- **📊 Earnings Analytics** — View historical earnings, pending payouts, and ROI per asset
- **🔒 Security Deposit Management** — Automatic deposit capture and release workflows
- **🔔 Real-Time Notifications** — Instant alerts for new bookings, messages, and status changes

### 🛠️ Platform & Admin
- **💬 Live Chat** — Socket.io powered real-time messaging between renters and owners
- **⚖️ Dispute Resolution** — Admin endpoints to arbitrate security deposit conflicts
- **🔐 KYC Gating** — User verification status gates sensitive booking actions
- **📧 Email Notifications** — Transactional emails via SendGrid for bookings and alerts
- **📱 SMS/OTP** — Twilio-powered OTP verification for phone numbers
- **🌐 SEO Optimized** — OpenGraph metadata, dynamic sitemaps, canonical URLs
- **📋 Legal Framework** — Dynamic pages for Terms, Privacy Policy, Refund Policy, and Cookie Consent

---

## 🛡️ Security Highlights

| Layer | Mechanism |
|---|---|
| **Authentication** | JWT-based stateless sessions with `bcryptjs` password hashing |
| **HTTP Headers** | `Helmet.js` sets `Content-Security-Policy`, `X-Frame-Options`, HSTS, etc. |
| **Rate Limiting** | `express-rate-limit` prevents brute-force and DDoS attacks |
| **CORS** | Explicit whitelist of allowed client origins |
| **Payment Webhooks** | HMAC-SHA256 signature verification on every Razorpay webhook |
| **Input Validation** | `Zod` schema validation on all API request bodies |
| **File Uploads** | `Multer` with type and size constraints |
| **Secrets** | All credentials stored in `.env` files, never committed to git |

---

## 🧪 Testing

The backend includes integration tests powered by **Jest** and **Supertest**.

```bash
cd backend
npm test
```

### Test Coverage
| Suite | What it tests |
|---|---|
| `booking.test.js` | Booking state transitions (create → confirm → cancel) |
| `payment.test.js` | Razorpay webhook HMAC signature verification + idempotency |

Tests run against an **isolated SQLite database** (`backend/.env.test`) so they never touch development or production data.

The CI/CD pipeline (GitHub Actions) runs all tests automatically on every push to `main`.

---

## 🚀 Local Development Setup

### Prerequisites
- **Node.js** v20+
- **PostgreSQL** v14+ (local or via Docker)
- API keys for: **Razorpay**, **Cloudinary**, **Google Maps**, **Firebase**, **SendGrid**, **Twilio** *(optional for local dev)*

---

### 1. Clone the Repository

```bash
git clone https://github.com/lokigamer2911/rently.git
cd rently
```

---

### 2. Backend Setup

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
# Server
PORT=5050
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/rently

# Authentication
JWT_SECRET=your_super_secret_jwt_key

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Razorpay
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret

# SendGrid
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=no-reply@yourdomain.com

# Twilio (optional)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+1234567890

# Firebase Admin (optional)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY="your_private_key"
```

Initialize the database and start the server:

```bash
npx prisma generate
npx prisma db push      # or: npx prisma migrate dev
npm run dev             # starts on http://localhost:5050
```

---

### 3. Frontend Setup

```bash
cd frontend
npm install --legacy-peer-deps
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5050/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5050
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id
```

Start the development server:

```bash
npm run dev             # starts on http://localhost:3000
```

---

## 📂 Directory Structure

```
rently/
├── .github/
│   └── workflows/
│       └── ci.yml              # GitHub Actions CI/CD pipeline
│
├── backend/
│   ├── prisma/
│   │   └── schema.prisma       # Database schema & relations
│   ├── src/
│   │   ├── app.js              # Express app config & route registration
│   │   ├── index.js            # HTTP server entry point (imports app.js)
│   │   ├── config/
│   │   │   ├── prisma.js       # Prisma client singleton
│   │   │   ├── razorpay.js     # Razorpay instance (mock-safe)
│   │   │   └── cloudinary.js   # Cloudinary SDK config
│   │   ├── middleware/
│   │   │   └── auth.js         # JWT requireAuth middleware
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── listing.routes.js
│   │   │   ├── booking.routes.js
│   │   │   ├── payment.routes.js
│   │   │   ├── chat.routes.js
│   │   │   └── user.routes.js
│   │   ├── sockets/
│   │   │   └── chat.socket.js  # Socket.io event handlers
│   │   └── utils/
│   │       └── logger.js       # Winston structured logger
│   ├── tests/
│   │   ├── booking.test.js     # Booking state machine tests
│   │   └── payment.test.js     # Webhook HMAC + idempotency tests
│   ├── .env.test               # Isolated test environment config
│   └── package.json
│
└── frontend/
    ├── components/             # Reusable React UI components
    ├── context/                # React Context (Auth, Cart, Socket)
    ├── hooks/                  # Custom React hooks
    ├── lib/                    # Utility functions & API helpers
    ├── pages/                  # Next.js pages & API routes
    ├── public/                 # Static assets, PWA manifest, icons
    ├── styles/                 # Global CSS & Tailwind config
    ├── next.config.js          # Next.js, PWA & security headers config
    ├── next-sitemap.config.js  # Automated XML sitemap generator
    ├── tailwind.config.js      # Tailwind design tokens
    ├── .npmrc                  # npm config (legacy-peer-deps)
    └── package.json
```

---

## 🔄 CI/CD Pipeline

Every push to `main` triggers the **GitHub Actions** workflow:

```
Push to main
    │
    ├── Install frontend dependencies
    ├── Build Next.js app (checks for compile errors)
    ├── Install backend dependencies
    └── Run Jest test suite (booking + payment webhook tests)
```

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

<div align="center">

**Built with ❤️ to make renting simpler, safer, and highly scalable.**

[![GitHub](https://img.shields.io/badge/GitHub-lokigamer2911%2Frently-181717?style=for-the-badge&logo=github)](https://github.com/lokigamer2911/rently)

</div>
