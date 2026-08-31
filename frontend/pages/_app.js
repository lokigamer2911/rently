import '../styles/globals.css';
import '../styles/button.css';
import Layout from '../components/Layout';
import { CartProvider } from '../context/CartContext';
import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';
import Head from 'next/head';
import CookieConsent from '../components/CookieConsent';
import AppErrorBoundary from '../components/AppErrorBoundary';
import Script from 'next/script';

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export default function App({ Component, pageProps }) {
  return (
    <AppErrorBoundary>
    <ThemeProvider>
    <AuthProvider>
      <Head>
        <title>Rently | Peer-to-Peer Rental Marketplace</title>
        <meta name="description" content="A modern peer-to-peer rental marketplace built for trust, convenience, and growth." />
        <meta property="og:title" content="Rently | Peer-to-Peer Rental Marketplace" />
        <meta property="og:description" content="A modern peer-to-peer rental marketplace built for trust, convenience, and growth." />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/og-default.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Rently | Peer-to-Peer Rental Marketplace" />
        <meta name="twitter:description" content="A modern peer-to-peer rental marketplace built for trust, convenience, and growth." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="shortcut icon" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/favicon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#10b981" />
      </Head>

      {/* Google Analytics — only loads in production with valid ID */}
      {GA_MEASUREMENT_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_MEASUREMENT_ID}', {
                page_title: document.title,
                page_location: window.location.href,
              });
            `}
          </Script>
        </>
      )}

      <CartProvider>
        <Layout>
          <Component {...pageProps} />
        </Layout>
        <CookieConsent />
      </CartProvider>
    </AuthProvider>
    </ThemeProvider>
    </AppErrorBoundary>
  );
}
