import Link from 'next/link';
import Head from 'next/head';

export default function PrivacyPolicy() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-24 mobile-nav-spacer">
      <Head>
        <title>Privacy Policy | Rently</title>
        <meta name="description" content="Rently Privacy Policy — how we collect, use, and protect your personal information." />
      </Head>

      <nav className="mb-8">
        <Link href="/" className="text-slate-400 hover:text-slate-900 transition text-sm">&larr; Back to home</Link>
      </nav>

      <article className="surface-card p-6 sm:p-10">
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mb-6 sm:mb-8 tracking-tight">
          Privacy Policy
        </h1>
        <p className="text-slate-500 text-sm sm:text-base mb-4">
          Last updated: November 2026
        </p>

        <section className="mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3">1. Information We Collect</h2>
          <p className="text-slate-600 leading-relaxed mb-3">
            We collect information you provide directly to us, such as when you create an account, list an item, or make a booking. This may include your name, email address, phone number, profile photo, government ID (for verification), bank details (for payouts), and location.
          </p>
          <p className="text-slate-600 leading-relaxed mb-3">
            We also automatically collect certain information when you use the Site, including IP address, browser type, device information, and usage data through cookies and similar technologies.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3">2. How We Use Your Information</h2>
          <p className="text-slate-600 leading-relaxed mb-3">
            We use your information to: operate and improve the Site; process bookings and payments; verify your identity; send service-related communications; prevent fraud; and comply with legal obligations.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3">3. Sharing Your Information</h2>
          <p className="text-slate-600 leading-relaxed mb-3">
            We may share your information with: other users (limited to name, profile photo, and booking details relevant to a transaction); payment processors (Razorpay) to process payments; service providers (hosting, analytics, email); and as required by law.
          </p>
          <p className="text-slate-600 font-semibold text-slate-900 mb-1">
            We do not sell your personal data.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3">4. Data Security</h2>
          <p className="text-slate-600 leading-relaxed mb-3">
            We use industry-standard encryption (TLS in transit, AES-256 at rest) and access controls to protect your information. Passwords are hashed. However, no internet transmission is 100% secure.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3">5. Your Rights</h2>
          <p className="text-slate-600 leading-relaxed mb-3">
            You may: access, correct, or delete your personal data; withdraw consent where applicable; opt out of marketing emails; and lodge a complaint with a supervisory authority. Contact us at privacy@rently.app to exercise these rights.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3">6. Children</h2>
          <p className="text-slate-600 leading-relaxed mb-3">
            The Site is not intended for individuals under 18. We do not knowingly collect personal data from children.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3">7. Contact Us</h2>
          <p className="text-slate-600 leading-relaxed">
            Questions about this policy? Email us at <a href="mailto:privacy@rently.app" className="text-slate-900 underline">privacy@rently.app</a>.
          </p>
        </section>
      </article>
    </div>
  );
}
