import Link from 'next/link';
import Head from 'next/head';

export default function ContactSupport() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-24 mobile-nav-spacer">
      <Head>
        <title>Contact & Support | Rently</title>
        <meta name="description" content="Contact Rently support — help with bookings, listings, payments, and account issues." />
      </Head>

      <nav className="mb-8">
        <Link href="/" className="text-slate-400 hover:text-slate-900 transition text-sm">&larr; Back to home</Link>
      </nav>

      <article className="surface-card p-6 sm:p-10">
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mb-6 sm:mb-8 tracking-tight">
          Contact &amp; Support
        </h1>
        <p className="text-slate-500 text-sm sm:text-base mb-4">
          Need help? We're here for you.
        </p>

        <section className="mb-10">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3">Get in Touch</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <span className="text-slate-900 font-medium">Email (General)</span>
              <a href="mailto:support@rently.app" className="text-slate-600 underline hover:text-slate-900">support@rently.app</a>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-slate-900 font-medium">Legal &amp; Privacy</span>
              <a href="mailto:legal@rently.app" className="text-slate-600 underline hover:text-slate-900">legal@rently.app</a>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-slate-900 font-medium">Trust &amp; Safety</span>
              <a href="mailto:safety@rently.app" className="text-slate-600 underline hover:text-slate-900">safety@rently.app</a>
            </div>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3">Help Center</h2>
          <p className="text-slate-600 leading-relaxed mb-3">
            Common questions are answered in our <Link href="/help" className="text-slate-900 underline">Help Center</Link>.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3">Report an Issue</h2>
          <p className="text-slate-600 leading-relaxed mb-3">
            To report a listing, user, or safety concern, use the flag button on the listing or message thread. Our team reviews reports within 24 hours.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3">Emergency</h2>
          <p className="text-slate-600 leading-relaxed mb-3">
            For urgent safety issues during a handover, contact local authorities first, then notify us at <a href="mailto:safety@rently.app" className="text-slate-900 underline">safety@rently.app</a>.
          </p>
        </section>
      </article>
    </div>
  );
}
