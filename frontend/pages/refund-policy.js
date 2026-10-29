import Head from 'next/head';

export default function RefundPolicy() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <Head>
        <title>Refund Policy | Rently</title>
      </Head>
      <h1 className="text-4xl font-bold text-slate-900 mb-8">Refund Policy</h1>
      <div className="prose prose-slate max-w-none">
        <p>Last updated: {new Date().toLocaleDateString()}</p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">1. Cancellations by Renters</h2>
        <p>Renters can cancel a booking for a full refund up to 24 hours before the rental start time. Cancellations made within 24 hours may be subject to a fee.</p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">2. Cancellations by Owners</h2>
        <p>If an owner cancels an accepted booking, the renter will receive a 100% full refund immediately.</p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">3. Item Not As Described</h2>
        <p>If the rented item is significantly not as described or non-functional at handover, the renter can reject the item and receive a full refund.</p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">4. Deposits</h2>
        <p>Security deposits are fully refunded upon the successful return of the item in its original condition. If a dispute arises, Rently will hold the deposit until resolved.</p>
      </div>
    </div>
  );
}
