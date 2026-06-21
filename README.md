<div align="center">
  <img src="./frontend/public/logo.png" alt="Rentrex Logo" height="150" style="margin-bottom: 20px;" />
  <h1>Rently</h1>
  <p><strong>A Next-Generation Peer-to-Peer Rental Marketplace</strong></p>
  <p>
    <img src="https://img.shields.io/badge/Next.js-black?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" />
    <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
    <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
    <img src="https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma" />
    <img src="https://img.shields.io/badge/Tailwind-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind" />
  </p>
</div>

---

## 📖 About Rently

**Rently** is a full-stack, peer-to-peer (P2P) rental marketplace designed to help users monetize their underutilized assets. Whether it's high-end camera gear, power tools, electronics, or outdoor equipment, Rentrex provides a secure and seamless platform for users to list their items and for others to rent them. 

By empowering a sharing economy, Rently promotes sustainability and creates economic opportunities for everyday people.

### ✨ Key Features
- **Peer-to-Peer Renting:** Easily list your items for rent or browse available items nearby.
- **Secure Authentication:** Phone OTP and Google login powered by Firebase Auth.
- **Real-Time Chat:** Negotiate and communicate instantly using Socket.io.
- **Integrated Payments:** Seamless and secure payment processing via Razorpay.
- **Location-Based Search:** Find items close to you with Google Maps integration.
- **Trust & Safety:** User verification and a robust review system to ensure safe transactions.

---

## 🛠️ Tech Stack

Our robust architecture is built using modern, scalable technologies:

| Layer | Technology | Description |
|---|---|---|
| **Frontend** | Next.js 14 (Pages Router) | React framework for server-rendered UI |
| **Styling** | Tailwind CSS | Utility-first CSS framework for rapid UI development |
| **Backend** | Node.js + Express | Fast, unopinionated web framework for Node.js |
| **Database** | PostgreSQL | Powerful, open source object-relational database |
| **ORM** | Prisma | Next-generation Node.js and TypeScript ORM |
| **Auth** | Firebase Auth + JWT | Secure user identity and session management |
| **Payments** | Razorpay | Robust payment gateway for processing transactions |
| **Maps** | Google Maps JS API | Location services and map rendering |
| **Storage** | Cloudinary | Cloud-based media management for item images |
| **Realtime** | Socket.io | Bidirectional and low-latency communication |

---

## 📂 Project Structure

```text
rentrex/
├── backend/          # Express API + Prisma + Socket.io
├── frontend/         # Next.js + Tailwind
└── docs/             # Phase-by-phase build guides
    ├── PHASE-1-setup.md
    ├── PHASE-2-auth.md
    ├── PHASE-3-core.md
    ├── PHASE-4-bookings.md
    ├── PHASE-5-payments.md
    ├── PHASE-6-realtime.md
    ├── PHASE-7-polish.md
    └── PHASE-8-admin.md
```

---

## 🚀 Quick Start

### Prerequisites
Before you begin, ensure you have met the following requirements:
- **Node.js** (v20 or higher)
- **PostgreSQL** (v14+ running locally or a hosted URL)
- Accounts for third-party services: **Firebase**, **Razorpay**, **Cloudinary**, and **Google Cloud** (for Maps API).

### 1. Setting up the Backend

```bash
cd backend
# Create your environment variables file
cp .env.example .env
# Install dependencies
npm install
# Initialize the database schema
npx prisma migrate dev --name init
# Generate Prisma Client
npx prisma generate
# Start the development server
npm run dev
# Server runs on http://localhost:5000
```

### 2. Setting up the Frontend

```bash
cd frontend
# Create your environment variables file
cp .env.local.example .env.local
# Install dependencies
npm install
# Start the development server
npm run dev
# Client runs on http://localhost:3000
```

---

## ⚙️ Environment Variables

To run this project, you will need to add the following environment variables to your respective `.env` files.

<details>
<summary><strong>Backend (<code>backend/.env</code>)</strong></summary>

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/rentrex
JWT_SECRET=change-me-to-a-long-random-string
PORT=5000
CLIENT_URL=http://localhost:3000

# Firebase Service Account
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Razorpay
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
```
</details>

<details>
<summary><strong>Frontend (<code>frontend/.env.local</code>)</strong></summary>

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000

# Firebase Client config
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Third-party APIs
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
NEXT_PUBLIC_RAZORPAY_KEY_ID=
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=
```
</details>

---

## 📚 Documentation & Build Order

If you are contributing or building this from scratch, follow our detailed phase-by-phase documentation in order:
`docs/PHASE-1-setup.md` → `docs/PHASE-8-admin.md`. Each phase is independently testable.

---

## 🌐 Deployment

- **Backend**: Deploy on platforms like Railway, Render, or Fly.io. Set the necessary environment variables and point to a managed PostgreSQL instance (e.g., Neon, Supabase). Don't forget to run `npx prisma migrate deploy` during the build step.
- **Frontend**: Best deployed on **Vercel**. Set environment variables and use the default `next build` command.
- **Payments**: Set your Razorpay webhook to point to `https://<YOUR_BACKEND_URL>/api/payments/webhook`.
- **CORS**: Ensure the `CLIENT_URL` environment variable on your deployed backend is set to your production frontend URL.

---

<div align="center">
  <i>Built with ❤️ for a more sustainable future.</i>
</div>
