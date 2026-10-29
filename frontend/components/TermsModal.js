import { FiShield, FiX, FiCheck } from 'react-icons/fi';
import Button from './Button';

export default function TermsModal({ isOpen, onClose, onAccept, type }) {
  if (!isOpen) return null;

  const isHost = type === 'host';

  const hostTerms = [
    { title: "Ownership & Rights", content: "You certify that you are the legal owner of the item or have explicit permission from the owner to rent it out. Rentrex is not liable for any ownership disputes." },
    { title: "Item Condition", content: "You agree to provide the item in the exact condition described. You must document the condition using photos during handover for your own protection." },
    { title: "Safety & Compliance", content: "You ensure the item is safe to use and complies with all local safety regulations. You are responsible for any injuries caused by faulty equipment." },
    { title: "Platform Fees", content: "You agree to a 5% platform service fee deducted from your total rental earnings. This fee supports platform maintenance and secure payment processing." },
    { title: "Availability & Commitments", content: "Once a booking is confirmed, you are committed to providing the item. Frequent cancellations may lead to account suspension." }
  ];

  const renterTerms = [
    { title: "Care & Responsibility", content: "You are solely responsible for the item from the moment of pickup until it is returned and verified by the host." },
    { title: "Intended Usage", content: "You agree to use the item only for its intended purpose and in a legal manner. Sub-renting or lending the item to others is strictly prohibited." },
    { title: "Timely Return", content: "Items must be returned by the agreed-upon time. Late returns may incur additional daily charges as per the listing price." },
    { title: "Damages & Loss", content: "You are liable for any damages, theft, or loss of the item. You agree to pay for repairs or full replacement value as determined by the host/admin." },
    { title: "Security & Collateral", content: "You agree to provide the security deposit (cash or collateral) as requested by the host. This will be held until the item is returned in good condition." }
  ];

  const terms = isHost ? hostTerms : renterTerms;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="surface-card w-full max-w-2xl !p-0 shadow-2xl animate-in zoom-in-95 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-100 text-brand-600 flex items-center justify-center">
              <FiShield size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{isHost ? 'Host' : 'Renter'} Terms & Conditions</h2>
              <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mt-1">Please review and accept to proceed</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors shadow-sm">
            <FiX size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          <p className="text-sm text-slate-600 leading-relaxed">
            Welcome to Rentrex. By {isHost ? 'listing your item' : 'booking this rental'}, you agree to follow our community guidelines and the following specific terms:
          </p>
          
          <div className="space-y-6">
            {terms.map((term, i) => (
              <div key={i} className="flex gap-4 group">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center text-[10px] font-bold mt-1 group-hover:bg-brand-600 group-hover:text-white transition-colors">
                  {i + 1}
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-slate-900">{term.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{term.content}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 mt-4 text-[11px] text-slate-400 italic leading-relaxed">
            Note: Rentrex serves as a marketplace platform. We facilitate connections and payments but do not own or inspect the items listed. Always document condition during handover.
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row gap-3">
          <Button variant="ghost" className="flex-1 !py-4" onClick={onClose}>
            I Decline
          </Button>
          <Button 
            variant="primary" 
            className="flex-1 !py-4 shadow-brand flex items-center justify-center gap-2" 
            onClick={onAccept}
          >
            <FiCheck size={18} />
            I Accept the Terms
          </Button>
        </div>
      </div>
    </div>
  );
}
