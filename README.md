<div align="center">
  <img src="./frontend/public/logo.png" alt="Rently Logo" height="120" style="margin-bottom: 20px;" />
  
  <h1>Rently — Peer-to-Peer Rental Marketplace</h1>
  <p><strong>Empowering the Sharing Economy. Rent anything, anywhere, securely.</strong></p>

  <p>
    <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Frontend-Next.js_15-black?style=for-the-badge&logo=next.js" alt="Next.js" /></a>
    <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Backend-Node.js_20-339933?style=for-the-badge&logo=node.js" alt="Node.js" /></a>
    <a href="https://www.postgresql.org/"><img src="https://img.shields.io/badge/Database-PostgreSQL-316192?style=for-the-badge&logo=postgresql" alt="PostgreSQL" /></a>
    <a href="https://www.prisma.io/"><img src="https://img.shields.io/badge/ORM-Prisma-2D3748?style=for-the-badge&logo=prisma" alt="Prisma" /></a>
    <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Styling-Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css" alt="Tailwind" /></a>
  </p>
</div>

<br />

## 🚀 Vision & Overview

**Rently** is a high-performance, full-stack peer-to-peer (P2P) rental marketplace. Built for scale, it enables individuals and businesses to list underutilized assets—from professional camera gear to heavy machinery—and safely rent them to locals in their community. 

By prioritizing trust, real-time communication, and a frictionless booking experience, Rently serves as the technological foundation for a sustainable, community-driven sharing economy.

---

## 🏗️ Comprehensive Architecture

Rently utilizes a modern decoupled architecture, separating the client-side presentation layer from the robust REST API and WebSocket servers.

```mermaid
graph TD;
    Client[Next.js PWA Client] <-->|REST API / HTTPS| LoadBalancer(API Gateway / Load Balancer);
    Client <-->|WebSockets| WSServer[Socket.io Real-Time Server];
    
    LoadBalancer --> NodeAPI[Node.js / Express API];
    NodeAPI --> Auth[JWT Authentication];
    NodeAPI --> Controllers[Business Logic];
    Controllers --> Prisma[Prisma ORM];
    
    Prisma <--> PostgreSQL[(PostgreSQL Database)];
    
    NodeAPI <--> External1(Razorpay Payment Gateway);
    NodeAPI <--> External2(Cloudinary CDN);
    Client <--> External3(Google Maps API);
```

### 💻 Frontend (Client Layer)
- **Framework**: **Next.js 15 (Pages Router)** delivering fast Server-Side Rendered (SSR) pages and optimized static assets.
- **Styling**: **Tailwind CSS** implementing a bespoke, responsive design system.
- **State Management & Fetching**: **SWR** for highly reactive, cache-first data fetching and **React Context API** for global state (Auth, Cart).
- **Progressive Web App (PWA)**: Fully configured `manifest.json` and service workers allow users to install the app on iOS/Android natively.
- **Maps & Discovery**: Deep integration with **Google Maps API** and `@react-google-maps/api` for location-based asset discovery and clustering.
- **SEO Optimization**: Next-SEO configurations, dynamically generated OpenGraph metadata, and automated XML sitemaps.

### ⚙️ Backend (API Layer)
- **Runtime**: **Node.js 20** running **Express.js**.
- **Database**: **PostgreSQL 14+** managed efficiently via **Prisma ORM**, ensuring type-safe queries and seamless schema migrations.
- **Real-Time Engine**: **Socket.io** enables live chat between users and instant push notifications for booking state changes.
- **Authentication**: Custom stateful session management using **JSON Web Tokens (JWTs)**.
- **Payments**: End-to-end integration with **Razorpay** covering checkout sessions, security deposits, and automated refunds.
- **Storage**: **Cloudinary** for image uploads, on-the-fly transformations, and CDN delivery.

### 🛡️ Security, DevOps, & Compliance
- **Application Security**: **Helmet.js** for secure HTTP headers, **Express Rate Limit** to prevent brute-force and DDoS attacks, and explicit **CORS** whitelisting.
- **Logging & Monitoring**: Enterprise-grade structured logging implemented via **Winston**.
- **CI/CD**: Fully automated **GitHub Actions** workflows that install dependencies and build the application on every push to `main`.
- **Legal Compliance**: Pre-configured dynamic pages for Terms of Service, Privacy Policy, Refund Policy, and GDPR-compliant Cookie Consent logic.

---

## ✨ Detailed Feature Matrix

### 👤 For Renters
- **Smart Search Engine**: Filter assets by category, city, price range, and minimum rating.
- **Interactive Map Discovery**: Browse listings visually across a city using clustered map markers.
- **Seamless Booking Flow**: Select dates, calculate costs (rental fee + deposit), and pay securely via Razorpay.
- **Live Order Tracking**: Track item handover, active rental periods, and return completions.

### 🏢 For Asset Owners
- **Listing Management**: Create rich listings with multiple photos, custom dynamic pricing, and categorical tagging.
- **Booking Dashboard**: Approve/Reject incoming booking requests and manage inventory availability.
- **Earnings & Analytics**: View historical earnings, track pending payouts, and evaluate asset ROI.

### 🛠️ Platform & Admin
- **Live Chat**: Instant messaging system connecting renters and owners to coordinate handovers.
- **Review & Reputation System**: Two-way feedback loop establishing user trust scores.
- **Dispute Resolution**: Dedicated endpoints for admins to arbitrate conflicts over security deposits.

---

## 🛠️ Local Development Guide

Follow these instructions to set up the Rently ecosystem on your local machine.

### Prerequisites
- **Node.js** (v20 or higher)
- **PostgreSQL** (v14 or higher) running locally or via Docker
- API Credentials for: **Google Maps**, **Razorpay**, **Cloudinary**, and **Firebase** (optional).

### 1. Database & Backend Setup

1. **Clone the repository and enter the backend directory:**
   ```bash
   git clone https://github.com/lokigamer2911/rently.git
   cd rently/backend
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Configure Environment Variables:**
   Create a `.env` file in the `backend/` directory:
   ```env
   DATABASE_URL=postgresql://postgres:password@localhost:5432/rently
   JWT_SECRET=your_super_secret_jwt_key
   PORT=5050
   CLIENT_URL=http://localhost:3000
   
   # External Services
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   
   RAZORPAY_KEY_ID=your_razorpay_key
   RAZORPAY_KEY_SECRET=your_razorpay_secret
   ```
4. **Initialize Database:**
   ```bash
   npx prisma generate
   npx prisma db push
   ```
5. **Start the API Server:**
   ```bash
   npm run dev
   ```
   *The server will start on `http://localhost:5050` and the Winston logger will initialize.*

### 2. Frontend Setup

1. **Enter the frontend directory:**
   ```bash
   cd ../frontend
   ```
2. **Install dependencies (using legacy peer deps for React 19 compatibility):**
   ```bash
   npm install --legacy-peer-deps
   ```
3. **Configure Environment Variables:**
   Create a `.env.local` file in the `frontend/` directory:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5050/api
   NEXT_PUBLIC_SOCKET_URL=http://localhost:5050
   
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   ```
4. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   *The client will be accessible at `http://localhost:3000`.*

---

## 📂 Core Directory Structure

```text
rently-main/
├── .github/workflows/       # CI/CD Automation pipelines
├── backend/
│   ├── prisma/              # Database schema models (schema.prisma)
│   ├── src/
│   │   ├── config/          # 3rd party integrations (Cloudinary, Razorpay)
│   │   ├── controllers/     # API Business Logic
│   │   ├── routes/          # Express route definitions
│   │   ├── sockets/         # Socket.io event listeners
│   │   └── utils/           # Winston logger, JWT helpers, Middleware
│   └── package.json
└── frontend/
    ├── components/          # Reusable React components (UI, Modals, Maps)
    ├── context/             # React Context Providers (Auth, Cart)
    ├── pages/               # Next.js Page Routes (Listings, Dashboard, Checkout)
    ├── public/              # Static assets, PWA manifest, and favicons
    ├── styles/              # Global Tailwind CSS and custom stylesheets
    ├── next.config.js       # Next.js rules, PWA, and security headers
    └── next-sitemap.config.js # Automated XML sitemap generator
```

---

## 📈 Roadmap & Future Upgrades

- [x] **V1.0:** Core Marketplace Loop, Payments, Google Maps, and JWT Auth.
- [x] **V1.1:** Real-time Chat, Notification Engine, and Security Hardening.
- [x] **V1.2:** Startup Optimization (PWA Installability, Automated SEO Sitemaps, Legal Framework, CI/CD).
- [ ] **V1.3:** AI-Powered Listing Generators (Auto-fill descriptions based on image uploads).
- [ ] **V2.0:** Multi-currency / Global Market support.
- [ ] **V2.1:** KYC / Identity Verification Integration (e.g., Onfido or Stripe Identity).

---

<div align="center">
  <p><strong>Rently is built with ❤️ to make renting simpler, safer, and highly scalable.</strong></p>
</div>
