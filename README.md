<div align="center">
  <img src="./frontend/public/logo.png" alt="Rently Logo" height="140" style="margin-bottom: 20px;" />
  <h1>Rently</h1>
  <p><strong>A modern peer-to-peer rental marketplace built for trust, convenience, and growth</strong></p>
  <p>
    <img src="https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" />
    <img src="https://img.shields.io/badge/Node.js-20-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
    <img src="https://img.shields.io/badge/PostgreSQL-16-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
    <img src="https://img.shields.io/badge/Prisma-5-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma" />
    <img src="https://img.shields.io/badge/Tailwind-3-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind" />
  </p>
</div>

---

## Overview

Rently is a full-stack peer-to-peer rental platform that enables individuals and businesses to list underused items and rent them securely to others. The product is designed to support a sharing economy with a polished user experience, robust authentication, protected booking workflows, and real-time collaboration.

From cameras and tools to larger equipment, Rently provides a practical way to monetize assets while helping renters access what they need without purchasing everything outright.

### What the platform does
- Lets users create, manage, and publish listings
- Enables renters to discover items, book them, and pay securely
- Supports real-time communication and booking updates
- Implements access control for private user and booking resources
- Provides a modern marketplace experience with responsive UI and rich interactions

---

## Core Features

### Marketplace experience
- Browse listings with rich cards, image previews, and location-aware discovery
- Search and filter items by category, city, price, and rating
- View detailed listing pages with availability and booking context

### Host and renter workflows
- Create and edit listings with images, pricing, deposits, and availability rules
- Submit booking requests and manage rental status transitions
- Track handover verification, timeline events, and dispute handling

### Trust and security
- JWT-based authenticated sessions
- Protected user-specific and booking-specific routes
- Signed access tokens for sensitive resource links
- Clear login and signup handling for registered and unregistered users

### Communication and payments
- Real-time notifications and chat support
- Payment flow integration with Razorpay
- Review and reputation signals for safer transactions

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | Next.js (Pages Router) | Responsive, production-ready user interface |
| Styling | Tailwind CSS | Utility-first styling for a polished design system |
| Backend | Node.js + Express | API layer, middleware, business logic, and route orchestration |
| Database | PostgreSQL | Persistent transactional data storage |
| ORM | Prisma | Type-safe database access and schema management |
| Authentication | JWT + Firebase integration | Secure session handling and modern identity flows |
| Payments | Razorpay | Checkout and payment verification |
| Media | Cloudinary | Image upload and media storage |
| Maps | Google Maps API | Geolocation and map-based experiences |
| Realtime | Socket.io | Live notifications and chat communication |

---

## Project Structure

```text
rently/
├── backend/
│   ├── prisma/
│   ├── src/
│   │   ├── config/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── sockets/
│   │   └── utils/
├── frontend/
│   ├── components/
│   ├── context/
│   ├── hooks/
│   ├── lib/
│   └── pages/
└── README.md
```

---

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL 14+
- npm or pnpm
- Optional: Firebase, Razorpay, Cloudinary, and Google Maps API credentials

### Backend setup

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

The API server will run on the configured backend port, typically 5050.

### Frontend setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at http://localhost:3000.

---

## Environment Variables

### Backend

```env
DATABASE_URL=postgresql://user:password@localhost:5432/rently
JWT_SECRET=your-secure-secret
PORT=5050
CLIENT_URL=http://localhost:3000

FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
```

### Frontend

```env
NEXT_PUBLIC_API_URL=http://localhost:5050/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5050

NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
NEXT_PUBLIC_RAZORPAY_KEY_ID=
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=
```

---

## Development Notes

- The application follows a modular full-stack architecture with clear separation between the API and UI layers.
- The backend handles authentication, booking logic, payments, notifications, and access protection.
- The frontend focuses on a user-friendly experience with modern marketplace interactions and responsive design.
- Security-conscious routing and signed resource access tokens are used for sensitive authenticated resources.

---

## Deployment

- Deploy the backend to a Node.js-compatible host such as Render, Railway, or Fly.io.
- Deploy the frontend to Vercel or a similar platform.
- Configure production environment variables for PostgreSQL, auth, payments, storage, and mapping services.
- Ensure your Razorpay webhook points to the backend payment endpoint.

---

<div align="center">
  <p><strong>Built to make renting simpler, safer, and more accessible.</strong></p>
</div>
