const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    // 'unsafe-inline' is required by Next.js Pages Router for inline hydration scripts (__NEXT_DATA__).
    // Removing it requires nonce-based CSP + App Router migration. 'unsafe-eval' has been removed.
    value: "default-src 'self'; script-src 'self' 'unsafe-inline' https://js.stripe.com https://checkout.razorpay.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' blob: data: https://res.cloudinary.com https://lh3.googleusercontent.com https://raw.githubusercontent.com https://raw.githack.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' http://localhost:5050 https://*.onrender.com https://*.vercel.app wss://* https://raw.githubusercontent.com https://raw.githack.com;"
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()'
  }
];

module.exports = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { domains: ['res.cloudinary.com', 'lh3.googleusercontent.com'], unoptimized: true },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};
