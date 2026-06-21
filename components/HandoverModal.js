import { useState } from 'react';
import { FiCamera, FiCheck, FiX, FiShield, FiArrowLeft } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import Button from './Button';
import SignaturePad from './SignaturePad';

export default function HandoverModal({ booking, type, onClose, onComplete }) {
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState('');
  const [photos, setPhotos] = useState([]);
  const [renterSig, setRenterSig] = useState(null);
  const [hostSig, setHostSig] = useState(null);
  const [loading, setLoading] = useState(false);

  const uploadPhotos = async (e) => {
    try {
      const files = [...e.target.files];
      if (!files.length) return;
      setLoading(true);
      const fd = new FormData();
      files.forEach(f => fd.append('images', f));
      const { data } = await api.post('/upload', fd);
      setPhotos(prev => [...prev, ...data.urls]);
      toast.success('Photos uploaded');
    } catch (err) {
      toast.error('Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handleNextStep = () => {
    if (otp.length !== 6) return toast.error('Please enter a valid 6-digit OTP');
    if (photos.length < 1) return toast.error('Please upload at least one photo of the item condition');
    setStep(2);
  };

  const submit = async () => {
    if (otp.length !== 6) return toast.error('Please enter a valid 6-digit OTP');
    if (photos.length < 1) return toast.error('Please upload at least one photo of the item condition');
    if (!renterSig) return toast.error("Renter's signature is required");
    if (!hostSig) return toast.error("Host's signature is required");

    try {
      setLoading(true);
      const endpoint = type === 'pickup' ? `/bookings/${booking.id}/pickup` : `/bookings/${booking.id}/return`;
      await api.patch(endpoint, { 
        otp, 
        photos,
        signatures: {
          renter: renterSig,
          host: hostSig
        }
      });
      toast.success(`${type === 'pickup' ? 'Pickup' : 'Return'} verified!`);
      onComplete();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className={`surface-card w-full ${step === 2 ? 'max-w-lg' : 'max-w-md'} !p-8 shadow-2xl transition-all duration-300 animate-in zoom-in-95`}>
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            {step === 2 && (
              <button 
                onClick={() => setStep(1)} 
                className="p-2 hover:bg-slate-100 rounded-full transition-colors -ml-2"
              >
                <FiArrowLeft size={18} className="text-slate-600" />
              </button>
            )}
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <FiShield size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 capitalize">
                {step === 1 ? `${type} Verification` : 'Sign Agreement'}
              </h2>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                {step === 1 ? 'Secure Handover Flow' : 'Step 2 of 2: Signatures'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <FiX size={20} className="text-slate-400" />
          </button>
        </div>

        {step === 1 ? (
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Enter OTP from Renter
              </label>
              <input 
                type="text" 
                maxLength={6}
                placeholder="000000"
                className="input text-center text-3xl font-black tracking-[0.5em] !py-4"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
              />
              <p className="text-[10px] text-center text-slate-400">
                Ask the renter for the {type} OTP shown on their screen.
              </p>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Condition Photos (Evidence)</label>
              <div className="grid grid-cols-3 gap-2">
                {photos.map(u => (
                  <div key={u} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                    <img src={u} alt="Condition" className="w-full h-full object-cover" />
                  </div>
                ))}
                {photos.length < 6 && (
                  <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl hover:border-brand-500 hover:bg-brand-50 transition cursor-pointer group">
                    <FiCamera className="text-slate-400 group-hover:text-brand-600" size={20} />
                    <span className="text-[9px] mt-1 text-slate-400 group-hover:text-brand-600 font-bold uppercase">Add Photo</span>
                    <input type="file" multiple accept="image/*" className="hidden" onChange={uploadPhotos} />
                  </label>
                )}
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed italic">
                <strong>Crucial Step:</strong> Capture clear photos of the item's current state. This serves as your primary evidence in case of any future disputes or damage claims.
              </p>
            </div>

            <Button 
              variant="primary" 
              className="w-full !py-4 shadow-brand" 
              disabled={loading}
              onClick={handleNextStep}
            >
              Continue to Signatures
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <p className="text-xs text-slate-500 leading-relaxed">
              Please inspect the item together. Both parties must draw their signatures on the panels below to legally confirm the handover and the item's condition.
            </p>

            <div className="space-y-4">
              <SignaturePad 
                label="Renter's Signature" 
                onSave={(sig) => setRenterSig(sig)} 
              />
              <SignaturePad 
                label="Host's Signature" 
                onSave={(sig) => setHostSig(sig)} 
              />
            </div>

            <Button 
              variant="primary" 
              className="w-full !py-4 shadow-brand" 
              disabled={loading || !renterSig || !hostSig}
              onClick={submit}
            >
              {loading ? 'Verifying & Signing...' : `Confirm & Sign ${type}`}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
