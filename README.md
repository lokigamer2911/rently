<div align="center">

<img src="./frontend/public/logo.png" alt="Rently Logo" height="140" />

<br/>

# Rently — Peer-to-Peer Rental Marketplace

### Empowering the sharing economy with a secure, modern, and scalable rental platform.

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

</div>

---

## Overview

Rently is a full-stack peer-to-peer rental marketplace designed to make renting assets simple, trustworthy, and efficient. From everyday items to high-value equipment, the platform allows owners to list items and renters to book them securely with built-in payments, messaging, and review flows.

The current version is focused on reliability and production-readiness, with improved auth handling, secure payment processing, real-time communication, and stronger backend safeguards.

### What’s new in this release

- Stable backend startup with the cleanup scheduler initialized correctly
- Secure Razorpay webhook handling with signature verification and idempotency protection
- Real-time chat and notification safeguards with participant authorization
- Stricter dispute validation and booking lifecycle handling
- Better test coverage for booking, payment, disputes, and socket authorization
- Progressive Web App support and SEO-ready frontend assets

---

## Core Features

### For Renters
- Discover listings through a polished marketplace experience
- Search and filter products by category, location, and availability
- Book items with date-based availability checks and transparent pricing
- Pay securely through Razorpay with order verification
- Receive real-time updates for bookings, payments, and messages
- Leave reviews and track rental activity

### For Owners
- Create rich listings with images, pricing, and availability details
- Manage incoming booking requests and update booking status
- Receive notifications for new requests and important updates
- Maintain trust through review history and secure handover flows

### Platform & Admin
- Real-time chat powered by Socket.io
- Notification system for booking lifecycle events
- Dispute workflow with structured validation
- Admin-ready routes for moderation and management
- PWA support, sitemap generation, and SEO optimization

---

## Architecture

Rently uses a decoupled monorepo architecture:

- Frontend: Next.js PWA with Tailwind CSS, React Context, and interactive UI components
- Backend: Node.js + Express REST API with Socket.io for real-time communication
- Data layer: PostgreSQL managed through Prisma ORM
- Integrations: Razorpay payments, Cloudinary media uploads, Firebase auth support, Google Maps APIs

```text
Client (Next.js PWA)
  └── API + WebSocket Server (Node.js / Express / Socket.io)
        └── PostgreSQL + Prisma
              └── Razorpay / Cloudinary / Firebase / Maps
```

---

## Tech Stack

### Frontend
- Next.js 15
- React 19
- Tailwind CSS
- Socket.io Client
- Google Maps API
- Three.js / Recharts for richer UI experiences
- next-pwa and next-sitemap for PWA and SEO support

### Backend
- Node.js 20
- Express.js
- Prisma ORM
- PostgreSQL
- Socket.io
- JWT + bcryptjs
- Zod validation
- Razorpay SDK
- Cloudinary SDK
- Helmet, CORS, rate limiting, and Winston logging

### Testing & DevOps
- Jest
- Supertest
- GitHub Actions CI workflow

---

## Local Development Setup

### Prerequisites
- Node.js 20+
- PostgreSQL 14+
- Optional: Razorpay, Cloudinary, Firebase, Google Maps, SendGrid, and Twilio credentials for full functionality

### 1. Clone the repository

```bash
git clone https://github.com/lokigamer2911/rently.git
cd rently
```

### 2. Backend setup

```bash
cd backend
npm install
```

Create a `backend/.env` file with the required environment variables, including:

```env
PORT=5050
NODE_ENV=development
CLIENT_URL=http://localhost:3000
DATABASE_URL=postgresql://postgres:password@localhost:5432/rently
JWT_SECRET=your_super_secret_jwt_key
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Then initialize Prisma and start the API:

```bash
npx prisma generate
npx prisma db push
npm run dev
```

### 3. Frontend setup

```bash
cd frontend
npm install --legacy-peer-deps
```

Create a `frontend/.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:5050/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5050
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id
```

Start the app:

```bash
npm run dev
```

---

## Testing

The project includes automated backend tests for core flows such as booking transitions, payment verification, dispute validation, and socket authorization.

Run tests locally:

```bash
cd backend
npm test
```

---

## Project Structure

```text
rently/
├── backend/
│   ├── prisma/
│   ├── src/
│   │   ├── app.js
│   │   ├── index.js
│   │   ├── config/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── sockets/
│   │   └── utils/
│   └── tests/
├── frontend/
│   ├── components/
│   ├── context/
│   ├── hooks/
│   ├── lib/
│   ├── pages/
│   ├── public/
│   └── styles/
└── README.md
```

---

## Contributing

Contributions are welcome. To contribute:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run the relevant tests
5. Open a pull request

---

<div align="center">

Built with care to make renting simpler, safer, and more scalable.

[![GitHub](https://img.shields.io/badge/GitHub-lokigamer2911%2Frently-181717?style=for-the-badge&logo=github)](https://github.com/lokigamer2911/rently)

</div>
