const isDev = process.env.NODE_ENV !== 'production';
const scriptSources = [
  "'self'",
  "'unsafe-inline'",
  'https://js.stripe.com',
  'https://checkout.razorpay.com',
  'https://apis.google.com',
  'https://accounts.google.com',
  'https://www.google.com',
  'https://www.gstatic.com',
  'https://*.googleusercontent.com',
  'https://*.gstatic.com',
];

if (isDev) {
  scriptSources.push("'unsafe-eval'");
}

// Render backend URL from env (for CSP connect-src)
const renderBackendUrl = process.env.NEXT_PUBLIC_API_URL || '';
// Extract just the origin (https://your-app.onrender.com) from the full API URL
const renderOrigin = renderBackendUrl ? new URL(renderBackendUrl).origin : '';

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    // 'unsafe-inline' is required by Next.js Pages Router for inline hydration scripts (__NEXT_DATA__).
    // 'unsafe-eval' is enabled only during development for React Refresh.
    value: `default-src 'self'; script-src ${scriptSources.join(' ')}; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' blob: data: https://res.cloudinary.com https://lh3.googleusercontent.com https://raw.githubusercontent.com https://raw.githack.com https://*.googleusercontent.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' ${isDev ? 'http://localhost:5050' : ''} ${renderOrigin} wss://${renderOrigin ? new URL(renderOrigin).host : ''} https://raw.githubusercontent.com https://raw.githack.com https://apis.google.com https://www.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://*.googleapis.com; frame-src 'self' https://accounts.google.com https://*.google.com https://*.firebaseapp.com;`
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

const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
});

module.exports = withPWA({
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
});
