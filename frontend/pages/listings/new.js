import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiCamera, FiCheck, FiMapPin, FiType, FiTag, FiNavigation } from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import { useAuth } from '../../hooks/useAuth';
import Link from 'next/link';
import { api } from '../../lib/api';
import MapView from '../../components/MapView';
import Button from '../../components/Button';
import TermsModal from '../../components/TermsModal';

export default function NewListing() {
  const router = useRouter();
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [form, setForm] = useState({
    title: '', description: '', pricePerDay: '', deposit: '', city: '',
    address: '', lat: null, lng: null, images: [], blockedDates: [], categoryId: '',
    depositNote: '',
    requiresVerification: false,
  });
  const [newBlockedDate, setNewBlockedDate] = useState('');
  const [showTerms, setShowTerms] = useState(false);

  useEffect(() => {
    api.get('/categories')
      .then(r => setCats(r.data))
      .catch((err) => {
        console.error('Category load failed:', err);
        toast.error('Unable to load categories');
      });
  }, []);

  const generateWithAI = async () => {
    if (!form.title || form.title.trim().length < 3) {
      return toast.error('Please enter the item model name first');
    }

    try {
      setAiLoading(true);
      const { data } = await api.post('/listings/ai-suggest', { model: form.title });
      
      // Save suggestion for showing badges and price sliders
      setAiSuggestion(data);
      
      // Set simple fields
      setForm(f => ({
        ...f,
        categoryId: data.categoryId,
        pricePerDay: String(data.pricePerDay),
        deposit: String(data.deposit),
        depositNote: data.depositNote,
      }));

      // Typewriter effect for description
      if (data.description) {
        let currentIdx = 0;
        const text = data.description;
        const intervalTime = 12; // ms
        const stepSize = Math.max(1, Math.ceil(text.length / 120)); // ~120 steps
        
        const interval = setInterval(() => {
          currentIdx += stepSize;
          if (currentIdx >= text.length) {
            setForm(f => ({ ...f, description: text }));
            clearInterval(interval);
          } else {
            setForm(f => ({ ...f, description: text.substring(0, currentIdx) }));
          }
        }, intervalTime);
      }

      toast.success('Listing details auto-filled with AI recommendations!');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'AI autofill failed. Please enter details manually.');
    } finally {
      setAiLoading(false);
    }
  };

  const detectLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      return toast.error('Geolocation is not supported by your browser');
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude: lat, longitude: lng } = pos.coords;
      
      try {
        const { data } = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
        const city = data.address.city || data.address.town || data.address.village || data.address.suburb || '';
        setForm(f => ({ ...f, lat, lng, city }));
        toast.success(`Located: ${city}`);
      } catch (err) {
        setForm(f => ({ ...f, lat, lng }));
        toast.error('Coordinates detected, but unable to find city name');
      } finally {
        setLoading(false);
      }
    }, (err) => {
      setLoading(false);
      toast.error('Location access denied or unavailable');
    });
  };

  const geocodeCity = async (cityName) => {
    if (!cityName || cityName.length < 3) return;
    try {
      setLoading(true);
      const { data } = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityName)}&limit=1`);
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        setForm(f => ({ ...f, lat: parseFloat(lat), lng: parseFloat(lon) }));
        toast.success(`Map centered on ${cityName}`);
      }
    } catch (err) {
      console.error('Geocoding failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const upload = async (e) => {
    try {
      const files = [...e.target.files];
      if (!files.length) return;

      setLoading(true);
      const fd = new FormData();
      files.forEach(f => fd.append('images', f));
      const { data } = await api.post('/upload', fd);
      setForm(f => ({ ...f, images: [...f.images, ...data.urls] }));
      toast.success('Images uploaded');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Image upload failed');
    } finally {
      setLoading(false);
    }
  };

  const submit = async (e) => {
    if (e) e.preventDefault();
    if (!form.lat || !form.lng) return toast.error('Please select the pickup location on the map');
    
    if (!showTerms) {
      setShowTerms(true);
      return;
    }

    try {
      setLoading(true);
      const payload = {
        ...form,
        pricePerDay: Math.round(Number(form.pricePerDay) * 100),
        deposit: Math.round(Number(form.deposit || 0) * 100)
      };
      const { data } = await api.post('/listings', payload);
      toast.success('Listing published!');
      router.push(`/listings/${data.id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to publish');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <Link href="/listings" className="btn-ghost">
          <FiArrowLeft size={16} />
          Back to marketplace
        </Link>
      </div>

      <header>
        <p className="eyebrow mb-3">Host your gear</p>
        <h1 className="section-title text-5xl">Share your standout pieces.</h1>
        <p className="section-copy mt-4 max-w-xl">
          Provide high-conviction details, clear pricing, and the exact pickup location to help renters find your inventory.
        </p>
      </header>

      <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <div className="space-y-6">
          <section className="surface-card">
            <div className="mb-6">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Core details</p>
              <h2 className="mt-2 text-2xl text-slate-900">What are you listing?</h2>
            </div>

            <div className="space-y-4">
              <div className="relative flex items-center">
                <FiType className="absolute left-4 top-4 text-slate-400" size={18} />
                <input
                  className="input !pl-12 !pr-32"
                  placeholder="Listing Title / Model (e.g. Sony A7S III)"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  required
                />
                <button
                  type="button"
                  onClick={generateWithAI}
                  disabled={aiLoading || !form.title || form.title.trim().length < 3}
                  className="absolute right-2 px-3 py-1.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 disabled:from-slate-200 disabled:to-slate-200 text-white disabled:text-slate-400 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 disabled:scale-100 disabled:pointer-events-none group"
                >
                  <HiSparkles className={`w-3.5 h-3.5 transition-transform group-hover:rotate-12 ${aiLoading ? 'animate-spin' : ''}`} />
                  {aiLoading ? 'Thinking...' : 'AI Autofill ✨'}
                </button>
              </div>

              <div className="space-y-1">
                <div className="relative">
                  <FiTag className="absolute left-4 top-4 text-slate-400" size={18} />
                  <select
                    className="input !pl-12 appearance-none"
                    value={form.categoryId}
                    onChange={e => setForm({ ...form, categoryId: e.target.value })}
                    required
                  >
                    <option value="">Select Category</option>
                    {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                {aiSuggestion && form.categoryId === aiSuggestion.categoryId && (
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-brand-600 bg-brand-50 border border-brand-100 rounded-full px-2.5 py-1 w-fit animate-pulse shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-500"></span>
                    ✨ AI Suggested: {cats.find(c => c.id === aiSuggestion.categoryId)?.name}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <textarea
                  className="input min-h-[120px]"
                  placeholder="Detailed description, condition, and inclusions..."
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  required
                />
                {aiLoading && (
                  <p className="text-[10px] text-brand-600 animate-pulse font-medium">✨ AI is typing description...</p>
                )}
              </div>
            </div>
          </section>

          <section className="surface-card">
            <div className="mb-6">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Pricing signals</p>
              <h2 className="mt-2 text-2xl text-slate-900">Price Per Day & deposits</h2>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Price Per Day (Rs)</label>
                <input
                  className="input !text-2xl font-bold"
                  type="number"
                  placeholder="999"
                  value={form.pricePerDay}
                  onChange={e => setForm({ ...form, pricePerDay: e.target.value })}
                  required
                />
                {aiSuggestion && (
                  <div className="space-y-2 p-3 bg-brand-50/50 border border-brand-100 rounded-2xl animate-fadeIn">
                    <div className="flex justify-between items-center text-[10px] font-bold tracking-wider text-brand-700 uppercase">
                      <span>Min: Rs. {Math.round(aiSuggestion.pricePerDay * 0.5)}</span>
                      <span className="flex items-center gap-1 bg-brand-100/50 px-2.5 py-0.5 rounded-full animate-pulse shadow-sm">
                        ✨ Recommended: Rs. {aiSuggestion.pricePerDay}
                      </span>
                      <span>Max: Rs. {Math.round(aiSuggestion.pricePerDay * 2)}</span>
                    </div>
                    <input
                      type="range"
                      min={Math.round(aiSuggestion.pricePerDay * 0.5)}
                      max={Math.round(aiSuggestion.pricePerDay * 2)}
                      step="10"
                      value={Number(form.pricePerDay) || aiSuggestion.pricePerDay}
                      onChange={(e) => setForm(f => ({ ...f, pricePerDay: e.target.value }))}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-xs text-slate-500">Security Value (in Rs)</p>
                  <div className="relative">
                    <FiTag className="absolute left-4 top-4 text-slate-400" size={18} />
                    <input
                      className="input !pl-12"
                      type="number"
                      placeholder="e.g. 5000"
                      value={form.deposit}
                      onChange={e => setForm({ ...form, deposit: e.target.value })}
                      required
                    />
                  </div>
                  {aiSuggestion && (
                    <div className="space-y-2 p-3 bg-brand-50/50 border border-brand-100 rounded-2xl animate-fadeIn">
                      <div className="flex justify-between items-center text-[10px] font-bold tracking-wider text-brand-700 uppercase">
                        <span>Min: Rs. {Math.round(aiSuggestion.deposit * 0.5)}</span>
                        <span className="flex items-center gap-1 bg-brand-100/50 px-2.5 py-0.5 rounded-full animate-pulse shadow-sm">
                          ✨ Recommended: Rs. {aiSuggestion.deposit}
                        </span>
                        <span>Max: Rs. {Math.round(aiSuggestion.deposit * 2)}</span>
                      </div>
                      <input
                        type="range"
                        min={Math.round(aiSuggestion.deposit * 0.5)}
                        max={Math.round(aiSuggestion.deposit * 2)}
                        step="50"
                        value={Number(form.deposit) || aiSuggestion.deposit}
                        onChange={(e) => setForm(f => ({ ...f, deposit: e.target.value }))}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600 focus:outline-none"
                      />
                    </div>
                  )}
                  <p className="text-[10px] text-slate-400 mt-2">
                    This is the value Rentrex will protect. Renters can choose to pay this in cash or provide equivalent collateral.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <p className="text-xs text-slate-500">Security Requirement (if not cash)</p>
                  <textarea 
                    className="input min-h-[80px]" 
                    placeholder="e.g. Physical Aadhaar Card, Camera Lens, or a Professional Reference..." 
                    value={form.depositNote} 
                    onChange={e=>setForm({...form,depositNote:e.target.value})} 
                  />
                  {aiSuggestion && form.depositNote === aiSuggestion.depositNote && (
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-brand-600 bg-brand-50 border border-brand-100 rounded-full px-2.5 py-1 w-fit animate-pulse shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-500"></span>
                      ✨ AI Suggested Collateral Auto-filled
                    </div>
                  )}
                  <p className="text-[10px] text-slate-400">
                    What will you accept as collateral if the renter doesn't want to pay cash?
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="surface-card">
            <div className="mb-6">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Trust & Safety</p>
              <h2 className="mt-2 text-2xl text-slate-900">Advanced KYC</h2>
            </div>
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-900">Verified Renters Only</p>
                <p className="text-[10px] text-slate-500 max-w-[240px]">Recommended for high-value gear. Only users with a completed KYC profile can book this item.</p>
              </div>
              <button
                type="button"
                onClick={() => setForm({ ...form, requiresVerification: !form.requiresVerification })}
                className={`w-12 h-6 rounded-full transition-colors relative ${form.requiresVerification ? 'bg-brand-600' : 'bg-slate-200'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${form.requiresVerification ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
          </section>

          <section className="surface-card">
            <div className="mb-6">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Visual proof</p>
              <h2 className="mt-2 text-2xl text-slate-900">Imagery</h2>
            </div>

            <div className="flex flex-wrap gap-3">
              {form.images.map(u => (
                <div key={u} className="relative group">
                  <img src={u} alt="Listing preview" className="w-24 h-24 object-cover rounded-2xl border border-slate-200" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition rounded-2xl flex items-center justify-center">
                    <FiCheck className="text-white" size={20} />
                  </div>
                </div>
              ))}
              <label className="w-24 h-24 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl hover:border-brand-500 hover:bg-brand-50 transition cursor-pointer group">
                <FiCamera className="text-slate-400 group-hover:text-brand-600" size={24} />
                <span className="text-[10px] mt-2 text-slate-400 font-bold uppercase tracking-widest">Add</span>
                <input type="file" multiple accept="image/*" className="hidden" onChange={upload} />
              </label>
            </div>
          </section>

          <section className="surface-card">
            <div className="mb-6">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Availability</p>
              <h2 className="mt-2 text-2xl text-slate-900">Blocked Dates</h2>
              <p className="mt-1 text-sm text-slate-500">Prevent renters from booking on specific days.</p>
            </div>
            <div className="space-y-4">
              <div className="flex gap-2">
                <input 
                  type="date" 
                  className="input" 
                  value={newBlockedDate}
                  onChange={(e) => setNewBlockedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
                <button 
                  type="button" 
                  className="bg-brand-50 text-brand-700 px-4 py-2 rounded-xl border border-brand-200 font-semibold hover:bg-brand-100 transition"
                  onClick={() => {
                    if (newBlockedDate && !form.blockedDates.includes(newBlockedDate)) {
                      setForm(f => ({ ...f, blockedDates: [...f.blockedDates, newBlockedDate].sort() }));
                      setNewBlockedDate('');
                    }
                  }}
                >
                  Block Date
                </button>
              </div>
              {form.blockedDates.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {form.blockedDates.map(date => (
                    <div key={date} className="flex items-center gap-2 bg-red-50 text-red-700 px-3 py-1.5 rounded-lg border border-red-100 text-sm">
                      <span>{new Date(date).toLocaleDateString()}</span>
                      <button 
                        type="button"
                        className="hover:text-red-900 font-bold"
                        onClick={() => setForm(f => ({ ...f, blockedDates: f.blockedDates.filter(d => d !== date) }))}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="surface-card sticky top-28">
            <div className="mb-6">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Pickup signals</p>
              <h2 className="mt-2 text-2xl text-slate-900">Map location</h2>
              <p className="text-sm text-slate-500 mt-2">Click on the map or use the button below to set the exact pickup point.</p>
              
              <Button 
                type="button" 
                variant="secondary" 
                onClick={detectLocation}
                disabled={loading}
                className="w-full mt-4 !py-3 flex items-center justify-center gap-2 border-brand-200 text-brand-700 bg-brand-50/50 hover:bg-brand-50"
              >
                <FiNavigation size={16} />
                Detect My Location
              </Button>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <FiMapPin className="absolute left-4 top-4 text-slate-400" size={18} />
                <input
                  className="input !pl-12"
                  placeholder="City (e.g. Mumbai)"
                  value={form.city}
                  onChange={e => setForm({ ...form, city: e.target.value })}
                  onBlur={e => geocodeCity(e.target.value)}
                  required
                />
              </div>

              <div className="h-[250px] md:h-[340px] overflow-hidden rounded-[1.2rem] border border-slate-200 shadow-inner">
                <MapView
                  lat={form.lat}
                  lng={form.lng}
                  height="100%"
                  onClick={({ lat, lng }) => setForm({ ...form, lat, lng })}
                />
              </div>

              {form.lat && (
                <div className="flex items-center gap-2 text-xs font-medium text-brand-700 bg-brand-50 p-3 rounded-xl border border-brand-100">
                  <FiCheck size={14} />
                  Coordinates pinned: {form.lat.toFixed(4)}, {form.lng.toFixed(4)}
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                disabled={loading}
                className={`w-full !py-4 shadow-brand transition-all ${loading ? 'opacity-50 scale-[0.98]' : 'hover:scale-[1.01]'}`}
              >
                {loading ? 'Publishing...' : 'Publish Listing'}
              </Button>
            </div>
          </section>
        </div>
      </form>

      <TermsModal 
        isOpen={showTerms} 
        onClose={() => setShowTerms(false)} 
        type="host" 
        onAccept={() => {
          setShowTerms(false);
          submit();
        }} 
      />
    </div>
  );
}
