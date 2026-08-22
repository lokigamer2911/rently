import '../styles/globals.css';
import '../styles/button.css';
import Layout from '../components/Layout';
import { CartProvider } from '../context/CartContext';
import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';
import Head from 'next/head';
import CookieConsent from '../components/CookieConsent';

export default function App({ Component, pageProps }) {
  return (
    <ThemeProvider>
    <AuthProvider>
      <Head>
        <title>Rently | Peer-to-Peer Rental Marketplace</title>
        <meta name="description" content="A modern peer-to-peer rental marketplace built for trust, convenience, and growth." />
        <meta property="og:title" content="Rently | Peer-to-Peer Rental Marketplace" />
        <meta property="og:description" content="A modern peer-to-peer rental marketplace built for trust, convenience, and growth." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="shortcut icon" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/favicon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#10b981" />
      </Head>
      <CartProvider>
        <Layout>
          <Component {...pageProps} />
        </Layout>
        <CookieConsent />
      </CartProvider>
    </AuthProvider>
    </ThemeProvider>
  );
}
