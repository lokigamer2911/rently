import Head from 'next/head';

export default function Terms() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <Head>
        <title>Terms of Service | Rently</title>
      </Head>
      <h1 className="text-4xl font-bold text-slate-900 mb-8">Terms of Service</h1>
      <div className="prose prose-slate max-w-none">
        <p>Last updated: {new Date().toLocaleDateString()}</p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">1. Acceptance of Terms</h2>
        <p>By accessing and using Rently, you accept and agree to be bound by the terms and provision of this agreement.</p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">2. User Responsibilities</h2>
        <p>Users must provide accurate information, respect other users' property, and return items in their original condition.</p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">3. Bookings and Payments</h2>
        <p>All payments are processed securely. Rently holds deposits to protect owners against damage or loss.</p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">4. Liability</h2>
        <p>Rently acts as an intermediary. We are not liable for damages exceeding the deposit amount unless due to platform negligence.</p>
      </div>
    </div>
  );
}
