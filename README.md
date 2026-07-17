<div align="center">

<img src="./frontend/public/logo.png" alt="Rently Logo" height="140" />

# Rently
### Peer-to-Peer Rental Marketplace for the Modern Sharing Economy

A premium, secure, and scalable platform for listing, booking, paying for, and managing rentals in real time.

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

[![Socket.io](https://img.shields.io/badge/Socket.io-Real--Time-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io/)
[![Razorpay](https://img.shields.io/badge/Razorpay-Payments-02042B?style=for-the-badge&logo=razorpay&logoColor=white)](https://razorpay.com/)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-CDN-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)](https://cloudinary.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)

[![CI/CD](https://github.com/lokigamer2911/rently/actions/workflows/ci.yml/badge.svg)](https://github.com/lokigamer2911/rently/actions)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg?style=flat-square)](./LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](https://github.com/lokigamer2911/rently/pulls)

</div>

---

## Overview

Rently is a full-stack peer-to-peer rental marketplace designed to make renting assets simple, trustworthy, and efficient. It supports the complete rental lifecycle: listing, discovery, booking, secure payment, communication, handover, and review.

The platform is built to serve individuals, small businesses, and local communities who want to monetize underused assets or access equipment without ownership overhead.

This release focuses on reliability, security, and product maturity. Recent work includes hardened startup flow, secure webhook handling, authenticated real-time communication, stricter validation for bookings and disputes, and stronger regression coverage for the most critical user journeys.

---

## Why Rently?

Rently combines the convenience of an online marketplace with the trust and control of a modern commerce platform.

| Area | What makes it stand out |
|---|---|
| Trust | Secure authentication, validated bookings, dispute handling, and payment verification |
| Speed | Fast UI interactions, real-time updates, and instant notifications |
| Reliability | Stable startup flow, resilient payment processing, and hardened backend logic |
| Experience | Clean, polished flows for both renters and owners |
| Scale | Modular architecture built for future growth, integrations, and richer product features |

---

## Product Highlights

### For Renters
- Browse a polished marketplace experience with rich listing details
- Search and filter listings by category, availability, and location
- Book items with transparent pricing, date validation, and deposit logic
- Complete payments securely through Razorpay
- Receive real-time booking, payment, and message updates
- Leave reviews and build trust after completed rentals

### For Owners
- Create listings with media, pricing, availability, and booking context
- Review incoming booking requests and manage booking states
- Receive real-time notifications for new activity and updates
- Maintain trust with verified history, reviews, and clear rental workflows

### For Admins and Platform Operators
- Manage disputes and moderation workflows through dedicated routes
- Support notification and messaging services for platform engagement
- Provide a secure, resilient foundation for future marketplace features

---

## How It Works

Rently is designed to feel seamless from the first listing to the final review.

1. **List** — Owners publish detailed listings with availability and pricing.
2. **Discover** — Renters browse and compare listings through a modern marketplace experience.
3. **Book** — Availability checks and booking rules ensure the request is valid.
4. **Pay** — Secure payments are processed using Razorpay and verified safely.
5. **Manage** — Notifications and real-time messaging keep both parties aligned.
6. **Review** — Completed rentals end with feedback and trust-building history.

```mermaid
flowchart LR
    A[Owner lists item] --> B[Renters discover listings]
    B --> C[Booking request created]
    C --> D[Secure payment]
    D --> E[Booking confirmed]
    E --> F[Chat + notifications]
    F --> G[Review & reputation]
```

---

## Platform Architecture

Rently follows a decoupled monorepo structure with a modern product stack.

### High-level architecture

- **Frontend**: Next.js PWA with React, Tailwind CSS, and context-driven UI state
- **Backend**: Node.js and Express REST API with Socket.io real-time services
- **Data layer**: PostgreSQL managed through Prisma ORM
- **Integrations**: Razorpay payments, Cloudinary media handling, Firebase support, and Google Maps APIs

```text
Client (Next.js PWA)
  └── API + WebSocket Server (Node.js / Express / Socket.io)
        └── PostgreSQL + Prisma
              └── Payments / Media / Auth / Maps
```

### Runtime responsibilities

- The frontend provides the marketplace experience, navigation, dashboard views, and PWA capabilities.
- The backend exposes authenticated routes for listings, bookings, payments, disputes, chat, notifications, and uploads.
- The Prisma layer manages schema, migrations, and relational data access.
- Real-time communication is handled through Socket.io for messaging and notifications.

---

## Tech Stack

### Frontend
- Next.js 15
- React 19
- Tailwind CSS
- Socket.io Client
- Google Maps API
- Three.js, Recharts, and modern UI components
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

### Quality & Delivery
- Jest
- Supertest
- GitHub Actions CI workflow

---

## Security Model

Rently is built with a strong security posture across the application layer.

- **Authentication**: JWT-based access control with user identity verification
- **Session integrity**: Token-backed auth flow with clear middleware enforcement
- **Input validation**: Zod schemas validate request payloads for critical routes
- **HTTP protection**: Helmet, CORS, and rate limiting reduce common attack surfaces
- **Payments**: Razorpay webhooks are verified through signature checks and idempotency safeguards
- **Real-time channels**: Chat and notifications enforce participant authorization
- **Operational readiness**: Backend lifecycle logic and test coverage reduce startup and runtime regressions

---

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL 14+
- Optional credentials for Razorpay, Cloudinary, Firebase, Google Maps, SendGrid, and Twilio for full functionality

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

Create a `backend/.env` file with the required values:

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

Initialize Prisma and start the API:

```bash
npx prisma generate
npx prisma db push
npm run dev
```

The backend will run on `http://localhost:5050`.

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

Start the frontend app:

```bash
npm run dev
```

The frontend will run on `http://localhost:3000`.

---

## Environment Variables

| Variable | Purpose |
|---|---|
| `PORT` | Backend listening port |
| `NODE_ENV` | Runtime mode such as development or production |
| `CLIENT_URL` | Allowed frontend origin |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for JWT signing |
| `RAZORPAY_KEY_ID` | Razorpay public key |
| `RAZORPAY_KEY_SECRET` | Razorpay secret key |
| `RAZORPAY_WEBHOOK_SECRET` | Webhook signature validation secret |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary account cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `NEXT_PUBLIC_API_URL` | Frontend API base URL |
| `NEXT_PUBLIC_SOCKET_URL` | Frontend WebSocket server URL |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps API key |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Razorpay public key for the frontend |

---

## Testing

The project includes automated backend tests for the most important business flows, including bookings, payments, disputes, socket authorization, and booking cleanup behavior.

Run the test suite locally:

```bash
cd backend
npm test
```

### Current test coverage focus
- Booking lifecycle transitions
- Payment verification and webhook idempotency
- Dispute validation
- Socket authorization guards
- Cleanup of stale pending bookings

---

## CI/CD and Delivery

The repository includes a GitHub Actions workflow that helps validate changes automatically.

Typical pipeline steps include:
- installing frontend dependencies
- building the Next.js app
- installing backend dependencies
- running automated test suites

This ensures that merged changes remain consistent with the working product state.

---

## Project Structure

```text
rently/
├── .github/
│   └── workflows/
│       └── ci.yml
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.js
│   ├── src/
│   │   ├── app.js
│   │   ├── index.js
│   │   ├── config/
│   │   │   ├── cloudinary.js
│   │   │   ├── firebase.js
│   │   │   ├── prisma.js
│   │   │   └── razorpay.js
│   │   ├── middleware/
│   │   │   └── auth.js
│   │   ├── routes/
│   │   │   ├── admin.routes.js
│   │   │   ├── auth.routes.js
│   │   │   ├── booking.routes.js
│   │   │   ├── category.routes.js
│   │   │   ├── chat.routes.js
│   │   │   ├── dispute.routes.js
│   │   │   ├── listing.routes.js
│   │   │   ├── notification.routes.js
│   │   │   ├── payment.routes.js
│   │   │   ├── review.routes.js
│   │   │   ├── upload.routes.js
│   │   │   └── user.routes.js
│   │   ├── sockets/
│   │   │   └── index.js
│   │   └── utils/
│   │       ├── access.js
│   │       ├── bookingCleanup.js
│   │       ├── cookie.js
│   │       ├── jwt.js
│   │       ├── logger.js
│   │       ├── messaging.js
│   │       └── notifications.js
│   ├── tests/
│   │   ├── booking.test.js
│   │   ├── bookingCleanup.test.js
│   │   ├── dispute.test.js
│   │   ├── payment.test.js
│   │   └── socketAuth.test.js
│   ├── package.json
│   └── .env.test
├── frontend/
│   ├── components/
│   │   ├── Button.js
│   │   ├── ConditionTimeline.js
│   │   ├── CookieConsent.js
│   │   ├── HandoverModal.js
│   │   ├── Layout.js
│   │   ├── ListingCard.js
│   │   ├── MapContent.js
│   │   ├── MapView.js
│   │   ├── Navbar.js
│   │   ├── ReviewModal.js
│   │   ├── SignaturePad.js
│   │   ├── TermsModal.js
│   │   ├── TiltCard.js
│   │   └── three/
│   ├── context/
│   │   ├── AuthContext.js
│   │   └── CartContext.js
│   ├── hooks/
│   │   └── useAuth.js
│   ├── lib/
│   │   ├── api.js
│   │   ├── authToken.js
│   │   ├── firebase.js
│   │   ├── pdf.js
│   │   └── socket.js
│   ├── pages/
│   │   ├── _app.js
│   │   ├── cart.js
│   │   ├── dashboard.js
│   │   ├── earnings.js
│   │   ├── help.js
│   │   ├── index.js
│   │   ├── landing.js
│   │   ├── notifications.js
│   │   ├── privacy.js
│   │   ├── profile.js
│   │   ├── refund-policy.js
│   │   ├── terms.js
│   │   ├── admin/
│   │   ├── auth/
│   │   ├── bookings/
│   │   ├── chat/
│   │   └── listings/
│   ├── public/
│   │   ├── logo.png
│   │   ├── manifest.json
│   │   └── robots.txt
│   ├── styles/
│   │   ├── button.css
│   │   └── globals.css
│   ├── package.json
│   ├── next.config.js
│   ├── next-sitemap.config.js
│   ├── postcss.config.js
│   └── tailwind.config.js
├── README.md
└── project_structure.txt
```

---

## Deployment Notes

For production deployment, the project should be configured with:

- a PostgreSQL instance reachable from the backend
- environment variables populated securely
- proper CORS origins for the deployed frontend
- a deployed webhook endpoint for Razorpay
- public storage and CDN support for uploads and media assets

Recommended deployment targets include Vercel for the frontend and a Node-compatible host for the backend such as Render, Railway, or a VPS-based setup.

---

## Roadmap

Planned improvements include:
- richer search and recommendation intelligence
- deeper analytics for owners and admins
- stronger moderation and dispute workflows
- broader payment and wallet capabilities
- richer mobile-first experiences and onboarding

---

## Contributing

Contributions are welcome. To contribute:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run the relevant tests
5. Open a pull request

If you are working on a larger feature, it is a good idea to open an issue first so the scope and architecture can be discussed clearly.

---

<div align="center">

Built with care to make renting simpler, safer, and more scalable.

[![GitHub](https://img.shields.io/badge/GitHub-lokigamer2911%2Frently-181717?style=for-the-badge&logo=github)](https://github.com/lokigamer2911/rently)

</div>
