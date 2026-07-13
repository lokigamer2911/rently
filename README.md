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

## 🚀 About Rently

**Rently** is a modern, high-performance peer-to-peer (P2P) rental marketplace designed to bridge the gap between asset owners and temporary renters. Whether it's heavy machinery, high-end camera gear, or weekend camping equipment, Rently provides a secure, intuitive, and seamless platform to monetize underutilized assets.

Our mission is to foster a sustainable sharing economy by providing a trusted environment for local rentals, reducing waste, and empowering individuals to earn passive income.

---

## 🏗️ System Architecture

Rently is built on a scalable, modern web architecture optimized for high performance, real-time interactions, and enterprise-grade security.

### 💻 Frontend (Client Layer)
- **Framework**: **Next.js** (Pages Router) for server-side rendering (SSR) and optimized SEO.
- **Styling & UI**: **Tailwind CSS** for a responsive, utility-first design system.
- **Maps & Location**: **Google Maps API** for geolocation and interactive map-based asset discovery.
- **Progressive Web App (PWA)**: Installable on mobile devices for a native app-like experience.
- **SEO & Discoverability**: Dynamically generated OpenGraph tags, XML sitemaps, and robots.txt.

### ⚙️ Backend (API Layer)
- **Runtime & Framework**: **Node.js** with **Express.js** providing a robust RESTful API.
- **Database & ORM**: **PostgreSQL** database managed seamlessly through **Prisma ORM** for type-safe queries.
- **Real-Time Engine**: **Socket.io** powering live chat, instant notifications, and real-time booking updates.
- **Authentication**: Stateful session management using **JWTs** and Firebase integration.
- **Payments**: **Razorpay** integration for secure checkout, deposits, and refunds.
- **Storage**: **Cloudinary** for optimized image storage and delivery.

### 🛡️ Security & DevOps
- **Security Middleware**: **Helmet.js** for HTTP headers, **Express Rate Limit** to prevent DDoS/brute-force attacks, and strict **CORS** configurations.
- **Logging & Monitoring**: Structured production logging powered by **Winston**.
- **CI/CD Pipeline**: Automated testing and builds handled by **GitHub Actions**.

---

## ✨ Core Features

1. **Smart Discovery**: Location-aware search, category filtering, and an interactive Map View.
2. **Secure Bookings**: End-to-end booking workflows with real-time status transitions.
3. **Instant Communication**: In-app real-time messaging between owners and renters.
4. **Trust & Verification**: Review systems, user reputation scores, and deposit handling.
5. **Admin Dashboard**: Comprehensive analytics, dispute resolution, and platform management tools.
6. **Legal & Compliance**: Built-in Terms of Service, Privacy Policies, Refund Policies, and GDPR Cookie Consent.

---

## 🛠️ Getting Started

### Prerequisites
- **Node.js**: v20+
- **PostgreSQL**: v14+
- API Keys for Google Maps, Razorpay, Cloudinary, and Firebase.

### 1. Backend Setup

```bash
cd backend
npm install
npx prisma generate
npx prisma db push # Sync schema
npm run dev
```
*The backend API will start on `http://localhost:5050`.*

### 2. Frontend Setup

```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
```
*The frontend application will be available at `http://localhost:3000`.*

---

## 📈 Roadmap
- [x] Launch Minimum Viable Product (MVP)
- [x] Integrate Real-Time Chat & Notifications
- [x] Implement Startup Launch Requirements (PWA, SEO, Winston, Legal Pages)
- [ ] AI-Powered Listing Suggestions
- [ ] Advanced Identity Verification (KYC)
- [ ] Multi-currency Support

---

<div align="center">
  <p><strong>Built with ❤️ by the Rently Team.</strong></p>
</div>
