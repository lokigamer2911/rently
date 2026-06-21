import { useState } from 'react';
import useSWR from 'swr';
import toast from 'react-hot-toast';
import { FiFileText, FiStar, FiClock, FiDownload, FiInfo, FiMapPin, FiCamera, FiX, FiActivity } from 'react-icons/fi';
import { api, fetcher } from '../../lib/api';
import Button from '../../components/Button';
import HandoverModal from '../../components/HandoverModal';
import ReviewModal from '../../components/ReviewModal';
import ConditionTimeline from '../../components/ConditionTimeline';
import { generateAgreement } from '../../lib/pdf';
import { useAuth } from '../../hooks/useAuth';
import TiltCard from '../../components/TiltCard';

export default function Bookings() {
  const [tab, setTab] = useState('mine');
  const [disputeBooking, setDisputeBooking] = useState(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [handoverType, setHandoverType] = useState(null); // 'pickup' or 'return'
  const [activeBooking, setActiveBooking] = useState(null);
  const [viewPhotos, setViewPhotos] = useState(null); // { title: string, photos: string[] }
  const [reviewBooking, setReviewBooking] = useState(null);
  const [timelineBooking, setTimelineBooking] = useState(null); // { id, title }
  const { user } = useAuth();
  const { data: list, mutate } = useSWR(tab === 'mine' ? '/bookings/mine' : '/bookings/incoming', fetcher);

  const update = async (id, status) => {
    try {
      await api.patch(`/bookings/${id}/status`, { status });
      toast.success(`Booking ${status.toLowerCase()} successfully`);
      mutate();
    } catch (err) {
      toast.error('Update failed');
    }
  };

  const handleCancel = async (b) => {
    let msg = 'Are you sure you want to cancel this booking?';
    if (b.status === 'CONFIRMED') {
      const refund = (b.totalAmount - b.serviceFee) / 100;
      const fee = b.serviceFee / 100;
      msg = `Cancel this booking? You will be refunded Rs ${refund.toLocaleString()}. The platform fee of Rs ${fee.toLocaleString()} is non-refundable.`;
    }
    if (!window.confirm(msg)) return;
    update(b.id, 'CANCELLED');
  };



  const submitDispute = async (e) => {
    e.preventDefault();
    if (!disputeReason) return;
    try {
      await api.post(`/disputes/${disputeBooking.id}`, { reason: disputeReason });
      toast.success('Issue reported successfully. Admin will review it shortly.');
      setDisputeBooking(null);
      setDisputeReason('');
      mutate();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to report issue');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header>
        <p className="eyebrow mb-3">Rental Management</p>
        <h1 className="section-title text-5xl">Your Bookings</h1>
        <p className="section-copy mt-4">Track your gear rentals, confirm requests, and download official agreements.</p>
      </header>

      {/* Tabs */}
      <div className="flex p-1.5 bg-slate-100 rounded-2xl w-fit">
        <Button 
          variant={tab === 'mine' ? 'primary' : 'ghost'}
          onClick={() => setTab('mine')} 
          className={`!px-8 !py-2.5 !rounded-[0.9rem] !text-sm !font-bold transition-all ${tab === 'mine' ? '!bg-white !text-slate-900 shadow-sm' : '!text-slate-500 hover:!text-slate-700'}`}
        >
          My Rentals
        </Button>
        <Button 
          variant={tab === 'incoming' ? 'primary' : 'ghost'}
          onClick={() => setTab('incoming')} 
          className={`!px-8 !py-2.5 !rounded-[0.9rem] !text-sm !font-bold transition-all ${tab === 'incoming' ? '!bg-white !text-slate-900 shadow-sm' : '!text-slate-500 hover:!text-slate-700'}`}
        >
          Incoming Requests
        </Button>
      </div>

      <div className="space-y-4">
        {list?.length > 0 ? (
          list.map(b => (
            <div key={b.id} className="surface-card !p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-brand-100 transition-colors border-2 border-slate-50">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl overflow-hidden border border-slate-100 bg-slate-50">
                   {b.listing.images?.[0] ? (
                     <img src={b.listing.images[0]} alt={b.listing.title} className="w-full h-full object-cover" />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center text-slate-300"><FiFileText /></div>
                   )}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{b.listing.title}</h3>
                  <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                    <FiClock size={14} />
                    {new Date(b.startDate).toLocaleDateString()} — {new Date(b.endDate).toLocaleDateString()}
                  </p>
                  <p className="text-xs font-bold text-brand-700 mt-2 bg-brand-50 px-2 py-0.5 rounded-full w-fit">
                    Rs {(b.totalAmount / 100).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Status Badge */}
                <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full ${
                  b.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-700' : 
                  b.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 
                  b.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {b.status}
                </span>

                {/* Agreement Button */}
                {b.status === 'CONFIRMED' && (
                  <Button 
                    variant="secondary"
                    onClick={() => generateAgreement(b)}
                    className="!py-2.5 !px-4 flex items-center gap-2 border-brand-100 text-brand-700 bg-brand-50/50"
                  >
                    <FiDownload size={14} />
                    Agreement PDF
                  </Button>
                )}

                {/* View Condition Photos Button */}
                {(b.pickupPhotos !== '[]' || b.returnPhotos !== '[]') && (
                  <Button 
                    variant="ghost"
                    onClick={() => {
                      const photos = [];
                      if (b.pickupPhotos && b.pickupPhotos !== '[]') {
                        try { photos.push({ label: 'Pickup (Handover)', urls: JSON.parse(b.pickupPhotos) }); } catch(err){}
                      }
                      if (b.returnPhotos && b.returnPhotos !== '[]') {
                        try { photos.push({ label: 'Return', urls: JSON.parse(b.returnPhotos) }); } catch(err){}
                      }
                      
                      let pickupSigs = null;
                      if (b.pickupSignatures) {
                        try { pickupSigs = JSON.parse(b.pickupSignatures); } catch(err){}
                      }
                      let returnSigs = null;
                      if (b.returnSignatures) {
                        try { returnSigs = JSON.parse(b.returnSignatures); } catch(err){}
                      }
                      
                      setViewPhotos({ 
                        title: b.listing.title, 
                        data: photos,
                        pickupSignatures: pickupSigs,
                        returnSignatures: returnSigs
                      });
                    }}
                    className="!py-2.5 !px-4 flex items-center gap-2 text-slate-600 hover:bg-slate-50 border-slate-200"
                  >
                    <FiCamera size={14} />
                    View Evidence
                  </Button>
                )}

                {/* Item Condition Timeline Button */}
                {b.status !== 'PENDING' && (
                  <Button
                    variant="ghost"
                    id={`timeline-btn-${b.id}`}
                    onClick={() => setTimelineBooking({ id: b.id, title: b.listing.title })}
                    className="!py-2.5 !px-4 flex items-center gap-2 text-violet-700 hover:bg-violet-50 border-violet-200 bg-violet-50/50"
                  >
                    <FiActivity size={14} />
                    Timeline
                  </Button>
                )}

                {/* OTP Display for Renter */}
                {tab === 'mine' && b.status === 'CONFIRMED' && b.handoverOTP && (
                  <div className="flex items-center gap-3">
                    <div className="bg-brand-50 border border-brand-100 rounded-xl px-4 py-2 text-center">
                      <p className="text-[9px] uppercase tracking-widest font-bold text-brand-600 mb-1">Pickup OTP</p>
                      <p className="text-xl font-black tracking-widest text-brand-700">{b.handoverOTP}</p>
                    </div>
                    {b.listing.lat && b.listing.lng && (
                      <Button 
                        variant="secondary"
                        onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${b.listing.lat},${b.listing.lng}`, '_blank')}
                        className="!h-[52px] !w-[52px] !p-0 flex items-center justify-center border-brand-100 text-brand-700 bg-brand-50/50 hover:bg-brand-100"
                        title="Get Directions"
                      >
                        <FiMapPin size={20} />
                      </Button>
                    )}
                  </div>
                )}
                {tab === 'mine' && b.status === 'PICKED_UP' && b.returnOTP && (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2 text-center">
                    <p className="text-[9px] uppercase tracking-widest font-bold text-emerald-600 mb-1">Return OTP</p>
                    <p className="text-xl font-black tracking-widest text-emerald-700">{b.returnOTP}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 ml-2">
                  {tab === 'incoming' && b.status === 'PENDING' && (
                    <>
                      <Button variant="primary" className="!py-2.5 !px-6" onClick={() => update(b.id, 'CONFIRMED')}>Confirm</Button>
                      <Button variant="ghost" className="!py-2.5 !px-4 text-red-600 hover:bg-red-50" onClick={() => update(b.id, 'CANCELLED')}>Reject</Button>
                    </>
                  )}
                  {tab === 'incoming' && b.status === 'CONFIRMED' && (
                    <Button variant="primary" className="!py-2.5 !px-6" onClick={() => { setActiveBooking(b); setHandoverType('pickup'); }}>Verify Pickup</Button>
                  )}
                  {tab === 'incoming' && b.status === 'PICKED_UP' && (
                    <Button variant="primary" className="!py-2.5 !px-6" onClick={() => { setActiveBooking(b); setHandoverType('return'); }}>Verify Return</Button>
                  )}
                  {tab === 'mine' && b.status === 'CONFIRMED' && (
                    <Button variant="ghost" className="!py-2.5 !px-4 text-red-600 hover:bg-red-50" onClick={() => handleCancel(b)}>Cancel</Button>
                  )}
                  {tab === 'mine' && b.status === 'PENDING' && (
                    <Button variant="ghost" className="!py-2.5 !px-4 text-red-600 hover:bg-red-50" onClick={() => handleCancel(b)}>Cancel Request</Button>
                  )}
                  {b.status === 'COMPLETED' && (
                    <Button variant="ghost" className="!py-2.5 !px-4 flex items-center gap-2 border border-slate-200" onClick={() => setReviewBooking(b)}>
                      <FiStar size={14} className="text-brand-500" />
                      {tab === 'mine' ? 'Rate Experience' : 'Rate Renter'}
                    </Button>
                  )}
                  {['CONFIRMED', 'COMPLETED'].includes(b.status) && (
                    <Button variant="ghost" className="!py-2.5 !px-4 text-red-600 hover:bg-red-50" onClick={() => setDisputeBooking(b)}>
                      Report Issue
                    </Button>
                  )}
                  {b.status === 'DISPUTED' && (
                    <span className="text-xs font-bold text-red-500 uppercase px-4">Under Investigation</span>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="surface-card text-center py-24 space-y-4">
             <TiltCard max={12} glare={false} className="mx-auto w-fit">
               <div className="reveal-3d w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300 pop-layer">
                  <FiInfo size={36} />
               </div>
             </TiltCard>
             <h2 className="text-2xl font-bold text-slate-900">No bookings found</h2>
             <p className="text-slate-500 max-w-xs mx-auto text-sm leading-relaxed">
               {tab === 'mine' ? "You haven't rented any gear yet. Explore the marketplace to find standout pieces!" : "No incoming requests yet. Make sure your listing titles and photos are looking sharp!"}
             </p>
          </div>
        )}
      </div>

      {disputeBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="surface-card w-full max-w-md !p-8 animate-in zoom-in-95">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Report an Issue</h2>
            <p className="text-sm text-slate-500 mb-6">Describe the problem with your rental. This will notify our admin team.</p>
            <form onSubmit={submitDispute} className="space-y-4">
              <textarea 
                className="input min-h-[120px]" 
                placeholder="What went wrong?"
                value={disputeReason}
                onChange={e => setDisputeReason(e.target.value)}
                required
              />
              <div className="flex gap-3">
                <Button type="button" variant="ghost" className="flex-1" onClick={() => setDisputeBooking(null)}>Cancel</Button>
                <Button type="submit" variant="primary" className="flex-1 bg-red-600 hover:bg-red-700 !border-red-600 text-white">Submit Report</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {handoverType && activeBooking && (
        <HandoverModal 
          booking={activeBooking} 
          type={handoverType} 
          onClose={() => setHandoverType(null)} 
          onComplete={() => mutate()} 
        />
      )}

      {viewPhotos && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 overflow-y-auto">
          <div className="surface-card w-full max-w-2xl !p-8 animate-in zoom-in-95 my-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Condition Evidence</h2>
                <p className="text-sm text-slate-500 uppercase tracking-widest font-bold mt-1">{viewPhotos.title}</p>
              </div>
              <button onClick={() => setViewPhotos(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <FiX size={24} className="text-slate-400" />
              </button>
            </div>

            <div className="space-y-8">
              {viewPhotos.data.map((section, idx) => (
                <div key={idx} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-slate-100"></div>
                    <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{section.label}</span>
                    <div className="h-px flex-1 bg-slate-100"></div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {section.urls.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="relative aspect-square rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:ring-4 hover:ring-brand-500/20 transition-all cursor-zoom-in">
                        <img src={url} alt={`${section.label} ${i}`} className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              ))}

              {/* Signatures verification */}
              {((viewPhotos.pickupSignatures && (viewPhotos.pickupSignatures.renter || viewPhotos.pickupSignatures.host)) ||
                (viewPhotos.returnSignatures && (viewPhotos.returnSignatures.renter || viewPhotos.returnSignatures.host))) && (
                <div className="space-y-6 pt-6 border-t border-slate-100">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Verified Handover Signatures</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Pickup Signatures */}
                    {viewPhotos.pickupSignatures && (viewPhotos.pickupSignatures.renter || viewPhotos.pickupSignatures.host) && (
                      <div className="space-y-3 bg-slate-50 border border-slate-100 rounded-2xl p-4">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pickup Handover</p>
                        <div className="grid grid-cols-2 gap-2">
                          {viewPhotos.pickupSignatures.renter && (
                            <div className="text-center bg-slate-950 border border-white/5 rounded-xl p-2">
                              <p className="text-[9px] font-bold text-slate-400 uppercase">Renter</p>
                              <div className="h-16 flex items-center justify-center">
                                <img src={viewPhotos.pickupSignatures.renter} alt="Renter Pickup Signature" className="max-h-full max-w-full object-contain" />
                              </div>
                            </div>
                          )}
                          {viewPhotos.pickupSignatures.host && (
                            <div className="text-center bg-slate-950 border border-white/5 rounded-xl p-2">
                              <p className="text-[9px] font-bold text-slate-400 uppercase">Host</p>
                              <div className="h-16 flex items-center justify-center">
                                <img src={viewPhotos.pickupSignatures.host} alt="Host Pickup Signature" className="max-h-full max-w-full object-contain" />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Return Signatures */}
                    {viewPhotos.returnSignatures && (viewPhotos.returnSignatures.renter || viewPhotos.returnSignatures.host) && (
                      <div className="space-y-3 bg-slate-50 border border-slate-100 rounded-2xl p-4">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Return Handover</p>
                        <div className="grid grid-cols-2 gap-2">
                          {viewPhotos.returnSignatures.renter && (
                            <div className="text-center bg-slate-950 border border-white/5 rounded-xl p-2">
                              <p className="text-[9px] font-bold text-slate-400 uppercase">Renter</p>
                              <div className="h-16 flex items-center justify-center">
                                <img src={viewPhotos.returnSignatures.renter} alt="Renter Return Signature" className="max-h-full max-w-full object-contain" />
                              </div>
                            </div>
                          )}
                          {viewPhotos.returnSignatures.host && (
                            <div className="text-center bg-slate-950 border border-white/5 rounded-xl p-2">
                              <p className="text-[9px] font-bold text-slate-400 uppercase">Host</p>
                              <div className="h-16 flex items-center justify-center">
                                <img src={viewPhotos.returnSignatures.host} alt="Host Return Signature" className="max-h-full max-w-full object-contain" />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <Button 
              variant="primary" 
              className="w-full mt-8 !py-4" 
              onClick={() => setViewPhotos(null)}
            >
              Close Preview
            </Button>
          </div>
        </div>
      )}

      {reviewBooking && (
        <ReviewModal 
          booking={reviewBooking}
          onClose={() => setReviewBooking(null)}
          onSuccess={() => {
            setReviewBooking(null);
            mutate();
          }}
        />
      )}

      {timelineBooking && (
        <ConditionTimeline
          bookingId={timelineBooking.id}
          listingTitle={timelineBooking.title}
          onClose={() => setTimelineBooking(null)}
        />
      )}
    </div>
  );
}
