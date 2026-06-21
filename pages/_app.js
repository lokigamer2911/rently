import '../styles/globals.css';
import '../styles/button.css';
import Layout from '../components/Layout';
import { CartProvider } from '../context/CartContext';
import { AuthProvider } from '../context/AuthContext';
import Head from 'next/head';

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Head>
        <title>Rently | Peer-to-Peer Rental Marketplace</title>
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="shortcut icon" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/favicon.png" />
      </Head>
      <CartProvider>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </CartProvider>
    </AuthProvider>
  );
}
