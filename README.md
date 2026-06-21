# Rently — Peer-to-Peer Rental Marketplace

A modern rental marketplace built with Next.js 14, Three.js, and React Three Fiber. Features immersive 3D animations, real-time chat, and a complete host/renter workflow.

## Stack
- **Next.js 14** — React framework with SSR/SSG
- **Three.js + React Three Fiber** — 3D animations and WebGL scenes
- **Tailwind CSS** — Utility-first styling
- **Firebase** — Auth and storage
- **Socket.io** — Real-time chat
- **Leaflet** — Map integration

## Setup

```bash
npm install
npm run dev
```

## Deploy on Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/lokigamer2911/rently)

Set these environment variables in Vercel:
- `NEXT_PUBLIC_API_URL` — your backend API URL
- `NEXT_PUBLIC_FIREBASE_*` — Firebase config values
