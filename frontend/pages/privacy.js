import Head from 'next/head';

export default function Privacy() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <Head>
        <title>Privacy Policy | Rently</title>
      </Head>
      <h1 className="text-4xl font-bold text-slate-900 mb-8">Privacy Policy</h1>
      <div className="prose prose-slate max-w-none">
        <p>Last updated: {new Date().toLocaleDateString()}</p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">1. Information We Collect</h2>
        <p>We collect information you provide directly to us, such as when you create an account, verify your identity, list an item, or communicate with other users.</p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">2. How We Use Your Information</h2>
        <p>We use the information we collect to provide, maintain, and improve our services, process transactions, and send you technical notices and support messages.</p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">3. Information Sharing</h2>
        <p>We share information with other users only as necessary to facilitate bookings (e.g., sharing your name and general location).</p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">4. Security</h2>
        <p>We implement reasonable security measures to protect your personal information from unauthorized access.</p>
      </div>
    </div>
  );
}
