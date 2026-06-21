import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { FiUser, FiEdit3, FiCheckCircle, FiShield, FiPackage, FiCalendar, FiMail, FiPhone, FiUpload } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';
import Button from '../components/Button';
import Link from 'next/link';
import TiltCard from '../components/TiltCard';
import { auth } from '../lib/firebase';

export default function Profile() {
  const { user, refreshUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ name: '', bio: '', avatarUrl: '' });

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      return toast.error('Photo must be smaller than 8MB');
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('images', file);
      const { data } = await api.post('/upload', fd);
      if (data?.urls?.[0]) {
        setForm(prev => ({ ...prev, avatarUrl: data.urls[0] }));
        toast.success('Avatar uploaded successfully');
      } else {
        toast.error('Failed to get uploaded image URL');
      }
    } catch (err) {
      console.error(err);
      toast.error('Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  const useGooglePhoto = () => {
    if (auth?.currentUser?.photoURL) {
      setForm(prev => ({ ...prev, avatarUrl: auth.currentUser.photoURL }));
      toast.success('Switched to Google profile photo');
    }
  };

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        bio: user.bio || '',
        avatarUrl: user.avatarUrl || ''
      });
    }
  }, [user]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.patch('/users/me', form);
      await refreshUser();
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return <div className="py-20 text-center">Loading...</div>;
  if (!user) {
    if (typeof window !== 'undefined') router.push('/auth/login');
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="grid gap-8 md:grid-cols-[1fr_2fr]">
        {/* Sidebar / Photo */}
        <div className="space-y-6">
          <TiltCard max={10} glare={false} className="h-full">
            <div className="surface-card text-center p-8">
              <div className="relative inline-block mb-4">
                <div className="h-32 w-32 rounded-full overflow-hidden border-4 border-white shadow-xl mx-auto bg-brand-50 flex items-center justify-center">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
                  ) : (
                    <FiUser size={64} className="text-brand-300" />
                  )}
                </div>
                {user.isVerified && (
                  <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow-lg">
                    <div className="bg-emerald-500 text-white p-1.5 rounded-full">
                      <FiCheckCircle size={16} />
                    </div>
                  </div>
                )}
              </div>
              <h2 className="text-2xl font-bold text-slate-900">{user.name}</h2>
              <p className="text-sm text-slate-500 mt-1">{user.role}</p>
              
              <div className="mt-6 pt-6 border-t border-slate-50 space-y-4">
                <Button 
                  variant="secondary"
                  onClick={() => setIsEditing(!isEditing)} 
                  className="w-full flex items-center justify-center gap-2"
                >
                  <FiEdit3 size={16} />
                  {isEditing ? 'Cancel Editing' : 'Edit Profile'}
                </Button>
                
                {!user.isVerified && (
                  <Button href="/auth/verify" variant="primary" className="!bg-amber-600 hover:!bg-amber-700 w-full flex items-center justify-center gap-2">
                    <FiShield size={16} />
                    Get Verified
                  </Button>
                )}
              </div>
            </div>
          </TiltCard>

          <TiltCard max={10} glare={false} className="h-full">
            <div className="surface-card p-6 space-y-4">
              <h3 className="text-xs uppercase tracking-widest font-bold text-slate-400">Trust Signals</h3>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <FiCheckCircle className={user.isVerified ? 'text-emerald-500' : 'text-slate-300'} />
                <span>Identity Verified</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <FiCheckCircle className="text-emerald-500" />
                <span>Email Confirmed</span>
              </div>
              {user.phone && (
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <FiCheckCircle className="text-emerald-500" />
                  <span>Phone Linked</span>
                </div>
              )}
            </div>
          </TiltCard>

        {/* Main Content */}
        <div className="space-y-6">
          {isEditing ? (
            <div className="surface-card p-8">
              <h2 className="text-2xl font-bold mb-6">Edit Your Profile</h2>
              <form onSubmit={handleUpdate} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest font-bold text-slate-400">Full Name</label>
                  <input 
                    className="input" 
                    value={form.name}
                    onChange={(e) => setForm({...form, name: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest font-bold text-slate-400">Short Bio</label>
                  <textarea 
                    className="input min-h-[100px]" 
                    placeholder="Tell us about yourself..."
                    value={form.bio}
                    onChange={(e) => setForm({...form, bio: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest font-bold text-slate-400">Profile Picture</label>
                  <div className="flex flex-col sm:flex-row items-center gap-6 bg-slate-50 border border-slate-100 rounded-3xl p-6">
                    <div className="relative group cursor-pointer" onClick={() => document.getElementById('avatar-input').click()}>
                      <div className="h-20 w-20 rounded-full overflow-hidden border-2 border-slate-200 bg-white flex items-center justify-center transition-all group-hover:scale-105 group-hover:border-brand-500 group-hover:ring-4 group-hover:ring-brand-500/20">
                        {form.avatarUrl ? (
                          <img src={form.avatarUrl} alt="Avatar Preview" className="h-full w-full object-cover" />
                        ) : (
                          <FiUser size={36} className="text-slate-400" />
                        )}
                      </div>
                      <div className="absolute inset-0 bg-slate-900/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <FiUpload size={16} className="text-white animate-pulse" />
                      </div>
                    </div>
                    
                    <div className="flex-1 space-y-3 w-full text-center sm:text-left">
                      <p className="text-xs text-slate-500">
                        Upload a photo from your local device, or use your connected account's profile photo.
                      </p>
                      
                      <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                        <Button 
                          type="button" 
                          variant="secondary" 
                          className="!py-2 !px-4 text-xs font-bold"
                          onClick={() => document.getElementById('avatar-input').click()}
                          disabled={uploading}
                        >
                          {uploading ? 'Uploading...' : 'Choose File'}
                        </Button>

                        {auth?.currentUser?.photoURL && form.avatarUrl !== auth.currentUser.photoURL && (
                          <Button 
                            type="button" 
                            variant="secondary" 
                            className="!py-2 !px-4 text-xs font-bold !border-brand-200 !text-brand-700 hover:!bg-brand-50"
                            onClick={useGooglePhoto}
                          >
                            Use Google Photo
                          </Button>
                        )}
                      </div>
                    </div>

                    <input 
                      id="avatar-input"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                    />
                  </div>
                </div>
                <Button type="submit" variant="primary" disabled={loading} className="w-full !py-4">
                  {loading ? 'Saving Changes...' : 'Save Profile Update'}
                </Button>
              </form>
            </div>
          ) : (
            <>
              <div className="surface-card p-8">
                <h2 className="text-xs uppercase tracking-widest font-bold text-slate-400 mb-4">About Me</h2>
                <p className="text-slate-700 leading-relaxed text-lg italic">
                  {user.bio || "No bio added yet. Tell people about yourself to build more trust!"}
                </p>
                
                <div className="mt-8 grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl">
                    <FiMail className="text-brand-500 mb-2" size={20} />
                    <p className="text-[10px] uppercase font-bold text-slate-400">Email Address</p>
                    <p className="text-sm font-medium text-slate-900 truncate">{user.email || 'N/A'}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl">
                    <FiPhone className="text-brand-500 mb-2" size={20} />
                    <p className="text-[10px] uppercase font-bold text-slate-400">Phone Number</p>
                    <p className="text-sm font-medium text-slate-900">{user.phone || 'Not linked'}</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <Link href="/listings/mine" className="surface-card p-6 flex items-center gap-4 hover:border-brand-200 transition-colors group">
                  <div className="h-12 w-12 bg-brand-50 text-brand-600 rounded-xl flex items-center justify-center group-hover:bg-brand-100 transition-colors">
                    <FiPackage size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">My Items</h3>
                    <p className="text-xs text-slate-500">Manage your gear</p>
                  </div>
                </Link>
                <Link href="/bookings" className="surface-card p-6 flex items-center gap-4 hover:border-brand-200 transition-colors group">
                  <div className="h-12 w-12 bg-brand-50 text-brand-600 rounded-xl flex items-center justify-center group-hover:bg-brand-100 transition-colors">
                    <FiCalendar size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">Bookings</h3>
                    <p className="text-xs text-slate-500">Rental history</p>
                  </div>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
