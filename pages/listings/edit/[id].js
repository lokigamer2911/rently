import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiCamera, FiCheck, FiMapPin, FiType, FiTag, FiSave } from 'react-icons/fi';
import { useAuth } from '../../../hooks/useAuth';
import Link from 'next/link';
import { api } from '../../../lib/api';
import MapView from '../../../components/MapView';
import Button from '../../../components/Button';

export default function EditListing() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', pricePerDay: '', deposit: '', city: '',
    address: '', lat: null, lng: null, images: [], blockedDates: [], categoryId: '',
    depositNote: '',
  });
  const [newBlockedDate, setNewBlockedDate] = useState('');

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        const [catRes, listingRes] = await Promise.all([
          api.get('/categories'),
          api.get(`/listings/${id}`)
        ]);
        
        setCats(catRes.data);
        const l = listingRes.data;
        
        // Ensure user owns this listing
        if (user && l.ownerId !== user.id) {
          toast.error('You are not authorized to edit this listing');
          router.push('/listings/mine');
          return;
        }

        setForm({
          title: l.title,
          description: l.description,
          pricePerDay: (l.pricePerDay / 100).toString(),
          deposit: (l.deposit / 100).toString(),
          city: l.city,
          address: l.address || '',
          lat: l.lat,
          lng: l.lng,
          images: l.images || [],
          blockedDates: l.blockedDates || [],
          categoryId: l.categoryId,
          depositNote: l.depositNote || '',
        });
        setLoading(false);
      } catch (err) {
        toast.error('Failed to load listing details');
        router.push('/listings/mine');
      }
    };

    fetchData();
  }, [id, user]);

  const upload = async (e) => {
    try {
      const files = [...e.target.files];
      if (!files.length) return;
      
      setSaving(true);
      const fd = new FormData();
      files.forEach(f => fd.append('images', f));
      const { data } = await api.post('/upload', fd);
      setForm(f => ({ ...f, images: [...f.images, ...data.urls] }));
      toast.success('Images uploaded');
    } catch (err) {
      toast.error('Image upload failed');
    } finally {
      setSaving(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.lat || !form.lng) return toast.error('Please select the pickup location on the map');
    
    try {
      setSaving(true);
      const payload = { 
        ...form, 
        pricePerDay: Math.round(Number(form.pricePerDay) * 100), 
        deposit: Math.round(Number(form.deposit || 0) * 100) 
      };
      await api.patch(`/listings/${id}`, payload);
      toast.success('Listing updated!');
      router.push(`/listings/${id}`);
    } catch (err) { 
      toast.error(err.response?.data?.error || 'Failed to update'); 
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="py-20 text-center text-slate-500">Loading details...</div>;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <Link href="/listings/mine" className="btn-ghost">
          <FiArrowLeft size={16} />
          Back to my items
        </Link>
      </div>

      <header>
        <p className="eyebrow mb-3">Update your gear</p>
        <h1 className="section-title text-5xl">Edit Listing</h1>
      </header>

      <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <div className="space-y-6">
          <section className="surface-card">
            <div className="mb-6">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Core details</p>
              <h2 className="mt-2 text-2xl text-slate-900">Modify information</h2>
            </div>
            
            <div className="space-y-4">
              <div className="relative">
                <FiType className="absolute left-4 top-4 text-slate-400" size={18} />
                <input 
                  className="input !pl-12" 
                  placeholder="Listing Title" 
                  value={form.title} 
                  onChange={e=>setForm({...form,title:e.target.value})} 
                  required 
                />
              </div>

              <div className="relative">
                <FiTag className="absolute left-4 top-4 text-slate-400" size={18} />
                <select 
                  className="input !pl-12 appearance-none" 
                  value={form.categoryId} 
                  onChange={e=>setForm({...form,categoryId:e.target.value})} 
                  required
                >
                  <option value="">Select Category</option>
                  {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <textarea 
                className="input min-h-[120px]" 
                placeholder="Detailed description..." 
                value={form.description} 
                onChange={e=>setForm({...form,description:e.target.value})} 
                required 
              />
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
                  onChange={e=>setForm({...form,pricePerDay:e.target.value})} 
                  required 
                />
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
                      onChange={e=>setForm({...form,deposit:e.target.value})} 
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-slate-500">Security Requirement (if not cash)</p>
                  <textarea 
                    className="input min-h-[80px]" 
                    placeholder="e.g. Physical Aadhaar Card, Camera Lens, or a Professional Reference..." 
                    value={form.depositNote} 
                    onChange={e=>setForm({...form,depositNote:e.target.value})} 
                  />
                  <p className="text-[10px] text-slate-400">
                    What will you accept as collateral if the renter doesn't want to pay cash?
                  </p>
                </div>
              </div>
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
                  <button 
                    type="button"
                    onClick={() => setForm(f => ({ ...f, images: f.images.filter(img => img !== u) }))}
                    className="absolute top-1 right-1 h-6 w-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                  >
                    ×
                  </button>
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
            </div>

            <div className="space-y-4">
              <div className="relative">
                <FiMapPin className="absolute left-4 top-4 text-slate-400" size={18} />
                <input 
                  className="input !pl-12" 
                  placeholder="City (e.g. Mumbai)" 
                  value={form.city} 
                  onChange={e=>setForm({...form,city:e.target.value})} 
                  required 
                />
              </div>

              <div className="overflow-hidden rounded-[1.2rem] border border-slate-200 shadow-inner">
                <MapView 
                  lat={form.lat} 
                  lng={form.lng} 
                  height={340}
                  onClick={({lat,lng}) => setForm({...form,lat,lng})} 
                />
              </div>

              <Button 
                type="submit"
                variant="primary"
                disabled={saving}
                className="w-full !py-4 shadow-brand"
              >
                {saving ? 'Updating...' : (
                  <span className="flex items-center gap-2">
                    <FiSave size={18} />
                    Save Changes
                  </span>
                )}
              </Button>
            </div>
          </section>
        </div>
      </form>
    </div>
  );
}
