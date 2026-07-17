<div align="center">

<img src="./frontend/public/logo.png" alt="Rently Logo" height="140" />

# Rently
### Peer-to-Peer Rental Marketplace for the Modern Sharing Economy

A polished, secure, and scalable platform for listing, booking, paying for, and managing rentals in real time.

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

Rently is a full-stack rental marketplace that helps people rent and lend assets safely and efficiently. Whether it is consumer electronics, tools, vehicles, or specialized equipment, the platform supports the entire rental lifecycle from listing and booking to secure payment and post-rental review.

This release focuses on reliability and product maturity, including stronger backend stability, secure payment processing, live communication, and improved test coverage.

### Highlights

- Secure authentication and access control
- Real-time chat and notifications
- Razorpay-powered bookings and webhooks
- PWA-ready frontend with SEO support
- Structured dispute and booking lifecycle handling
- Production-focused backend hardening and automated tests

---

## Why Rently?

Rently combines the convenience of a marketplace with the trust and control of a modern platform.

| Area | What makes it strong |
|---|---|
| Trust | Secure auth, booking validation, dispute handling, and payment verification |
| Speed | Fast UI flows, real-time updates, and immediate notifications |
| Reliability | Stable startup flow, resilient payment processing, and backend safeguards |
| Experience | Clean marketplace journey for both renters and owners |
| Scale | Modular architecture built for future growth and integrations |

---

## Core Experience

### For Renters
- Discover listings through a polished marketplace experience
- Search and filter by category, location, and availability
- Book assets with transparent pricing and date validation
- Complete payments securely through Razorpay
- Receive real-time booking and message updates
- Leave reviews and track rental activity

### For Owners
- Create rich listings with images, pricing, and availability details
- Manage incoming booking requests and update booking statuses
- Receive real-time notifications for new activity
- Maintain trust through review history and secure handover flows

### Platform & Admin
- Real-time chat powered by Socket.io
- Notification system for booking lifecycle events
- Dispute workflow with structured validation
- Admin-ready routes for moderation and management
- PWA support, sitemap generation, and SEO optimization

---

## How It Works

Rently is designed as a smooth end-to-end experience for both sides of the marketplace:

1. **List** — Owners create attractive listings with pricing, availability, and media.
2. **Discover** — Renters browse listings, compare details, and choose a preferred option.
3. **Book** — Availability checks and booking rules ensure the request is valid.
4. **Pay** — Secure Razorpay flows handle order creation and payment confirmation.
5. **Manage** — Real-time notifications and chat keep both parties aligned throughout the rental lifecycle.
6. **Review** — Completed experiences end with feedback and trust-building history.

```mermaid
flowchart LR
    A[Owner Lists Item] --> B[Renters Discover Listings]
    B --> C[Booking Request Created]
    C --> D[Secure Payment]
    D --> E[Booking Confirmed]
    E --> F[Chat + Notifications]
    F --> G[Review & Reputation]
```

---

## Architecture

Rently follows a clean decoupled architecture:

- Frontend: Next.js PWA with Tailwind CSS, React Context, and interactive UI components
- Backend: Node.js + Express REST API with Socket.io for real-time communication
- Data layer: PostgreSQL managed through Prisma ORM
- Integrations: Razorpay, Cloudinary, Firebase, Google Maps, and more

```text
Client (Next.js PWA)
  └── API + WebSocket Server (Node.js / Express / Socket.io)
        └── PostgreSQL + Prisma
              └── Payments / Media / Auth / Maps
```

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

## Quick Start

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

Create a `backend/.env` file with the required values, for example:

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

The project includes automated backend tests for booking flows, payments, disputes, and socket authorization.

Run the suite locally:

```bash
cd backend
npm test
```

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

## Features at a Glance

Here is a quick snapshot of the product experience:

- 🔐 Secure authentication and access control
- 💬 Real-time chat and instant notifications
- 💳 Razorpay-backed booking and payment flow
- 📍 Location-aware listing discovery
- 🧠 Structured booking, review, and dispute handling
- 📱 PWA-ready frontend experience with SEO support

---

## Built For

Rently is designed for a wide range of use cases:

- **Individuals** who want to monetize unused items
- **Small businesses** that need flexible equipment access
- **Communities** that value shared ownership and lower costs
- **Local marketplaces** that want a trusted rental experience
- **Startups** building a modern peer-to-peer commerce platform

---

## Demo Preview

A polished product experience is already in place, with the following UI and workflow areas ready for showcase:

- Marketplace listing discovery
- Booking request and confirmation flow
- Secure payment and receipt experience
- Messaging and notification center
- Owner dashboard and rental management

> Add screenshots here later to turn this into a visual product showcase.

---

## Roadmap

Planned improvements include:
- Expanded marketplace search and recommendation intelligence
- Deeper analytics for owners and admins
- More advanced dispute and moderation workflows
- Broader payment and wallet capabilities
- Mobile-first usability refinements

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
