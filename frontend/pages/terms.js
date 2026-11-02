import Link from 'next/link';
import Head from 'next/head';

export default function TermsOfService() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-24 mobile-nav-spacer">
      <Head>
        <title>Terms of Service | Rently</title>
        <meta name="description" content="Rently Terms of Service — governing the use of the rental marketplace platform." />
      </Head>

      <nav className="mb-8">
        <Link href="/" className="text-slate-400 hover:text-slate-900 transition text-sm">&larr; Back to home</Link>
      </nav>

      <article className="surface-card p-6 sm:p-10">
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mb-6 sm:mb-8 tracking-tight">
          Terms of Service
        </h1>
        <p className="text-slate-500 text-sm sm:text-base mb-4">
          Last updated: November 2026 &nbsp;|&nbsp; Version 1.0
        </p>

        <section className="mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3">1. Acceptance of Terms</h2>
          <p className="text-slate-600 leading-relaxed mb-3">
            By accessing or using Rently (the "Site"), you agree to these Terms. If you do not agree, you may not use the Site. You must accept the Terms before creating your first booking.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3">2. Eligibility</h2>
          <p className="text-slate-600 leading-relaxed mb-3">
            You must be at least 18 years old. By using the Site, you represent that you meet this requirement and have the legal capacity to enter into these Terms.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3">3. Accounts</h2>
          <p className="text-slate-600 leading-relaxed mb-3">
            You are responsible for maintaining the confidentiality of your account credentials. Email verification is required before you can create bookings or listings.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3">4. Bookings & Payments</h2>
          <p className="text-slate-600 leading-relaxed mb-3">
            All bookings are subject to availability. A 5% platform service fee applies to each rental. Payments are processed through Razorpay or manual methods (UPI QR / Bank Transfer). You agree to pay the total amount shown before checkout.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3">5. Handover & Condition</h2>
          <p className="text-slate-600 leading-relaxed mb-3">
            Renters and hosts must complete OTP-based handover and condition reports with photos at pickup and return. These records serve as evidence in case of disputes.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3">6. Cancellations & Refunds</h2>
          <p className="text-slate-600 leading-relaxed mb-3">
            See our <Link href="/cancellation-policy" className="text-slate-900 underline">Cancellation &amp; Refund Policy</Link> for details on cancellation windows and refund eligibility.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3">7. Disputes</h2>
          <p className="text-slate-600 leading-relaxed mb-3">
            Either party may file a dispute for issues related to a booking. Our team reviews evidence (photos, OTP logs, messages) and issues a binding resolution.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3">8. Limitation of Liability</h2>
          <p className="text-slate-600 leading-relaxed mb-3">
            Rently is a platform connecting renters and hosts. We are not a party to the rental agreement and are not liable for damages, loss, or injury arising from transactions, except as required by law.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3">9. Termination</h2>
          <p className="text-slate-600 leading-relaxed mb-3">
            We may suspend or terminate accounts that violate these Terms, engage in fraud, or pose a safety risk.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3">10. Governing Law</h2>
          <p className="text-slate-600 leading-relaxed mb-3">
            These Terms are governed by the laws of India. Disputes are subject to the jurisdiction of courts in Mumbai, Maharashtra.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3">Contact</h2>
          <p className="text-slate-600 leading-relaxed">
            Questions about these Terms? Email us at <a href="mailto:legal@rently.app" className="text-slate-900 underline">legal@rently.app</a>.
          </p>
        </section>
      </article>
    </div>
  );
}
