import Link from 'next/link';
import Head from 'next/head';

export default function CancellationPolicy() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-24 mobile-nav-spacer">
      <Head>
        <title>Cancellation & Refund Policy | Rently</title>
        <meta name="description" content="Rently Cancellation & Refund Policy — cancellation windows, refund eligibility, and how refunds are processed." />
      </Head>

      <nav className="mb-8">
        <Link href="/" className="text-slate-400 hover:text-slate-900 transition text-sm">&larr; Back to home</Link>
      </nav>

      <article className="surface-card p-6 sm:p-10">
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mb-6 sm:mb-8 tracking-tight">
          Cancellation &amp; Refund Policy
        </h1>
        <p className="text-slate-500 text-sm sm:text-base mb-4">
          Last updated: November 2026
        </p>

        <section className="mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3">1. Cancelling a Booking</h2>
          <p className="text-slate-600 leading-relaxed mb-3">
            You may cancel a booking before the host confirms it. Once confirmed, cancellations are subject to the host's approval.
          </p>
          <ul className="list-disc list-inside text-slate-600 leading-relaxed mb-3 space-y-2">
            <li><strong>Before confirmation:</strong> Full refund, including service fee.</li>
            <li><strong>After confirmation, before pickup:</strong> Refund of rental amount and deposit. The 5% platform service fee is non-refundable.</li>
            <li><strong>After pickup:</strong> No refund for unused days unless the host agrees to a partial refund.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3">2. Refund Eligibility</h2>
          <p className="text-slate-600 leading-relaxed mb-3">
            Refunds are issued when:
          </p>
          <ul className="list-disc list-inside text-slate-600 leading-relaxed mb-3 space-y-2">
            <li>The host cancels the booking.</li>
            <li>The item is not as described and a dispute is resolved in your favor.</li>
            <li>The item is not available at pickup.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3">3. Refund Processing Time</h2>
          <p className="text-slate-600 leading-relaxed mb-3">
            Approved refunds are processed within 5–10 business days to the original payment method. Razorpay refunds may appear immediately or within 7 days depending on your bank. UPI refunds typically reflect within 24–48 hours.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3">4. Deposits</h2>
          <p className="text-slate-600 leading-relaxed mb-3">
            Security deposits (cash or collateral) are held directly between renter and host and are returned at return. Rently does not hold deposits. Disputes over deposits are resolved through our dispute process using condition report evidence.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3">5. Non-Refundable Items</h2>
          <p className="text-slate-600 leading-relaxed mb-3">
            The 5% platform service fee is non-refundable once a booking is confirmed. Late returns or damage may result in additional charges deducted from the deposit.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3">6. Contact</h2>
          <p className="text-slate-600 leading-relaxed">
            Questions? Email us at <a href="mailto:support@rently.app" className="text-slate-900 underline">support@rently.app</a>.
          </p>
        </section>
      </article>
    </div>
  );
}
