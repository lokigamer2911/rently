import { useState } from 'react';
import { FiX, FiStar, FiUploadCloud, FiLoader } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import Button from './Button';

export default function ReviewModal({ booking, onClose, onSuccess }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [photos, setPhotos] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append('files', file));
      const { data } = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPhotos((prev) => [...prev, ...data.urls]);
      toast.success('Photos uploaded successfully!');
    } catch (err) {
      toast.error('Failed to upload photos.');
    } finally {
      setIsUploading(false);
    }
  };

  const removePhoto = (urlToRemove) => {
    setPhotos((prev) => prev.filter((url) => url !== urlToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      return toast.error('Please select a rating.');
    }

    setIsSubmitting(true);
    try {
      await api.post('/reviews', {
        bookingId: booking.id,
        rating,
        comment,
        photos,
      });
      toast.success('Review submitted successfully!');
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-md overflow-y-auto py-10">
      <div className="surface-card w-full max-w-lg !p-8 animate-in zoom-in-95 my-auto relative">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
        >
          <FiX size={20} />
        </button>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Rate your experience</h2>
          <p className="text-sm text-slate-500 mt-2">
            Leave a review for booking <strong>{booking.listing.title}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs uppercase tracking-widest font-bold text-slate-400 mb-3">
              Overall Rating
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="focus:outline-none transition-transform hover:scale-110"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                >
                  <FiStar
                    size={36}
                    className={`transition-colors duration-200 ${
                      star <= (hoverRating || rating)
                        ? 'fill-brand-500 text-brand-500'
                        : 'text-slate-200'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest font-bold text-slate-400 mb-2">
              Written Review
            </label>
            <textarea
              className="input min-h-[120px] resize-none"
              placeholder="What went well? Any issues?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest font-bold text-slate-400 mb-2">
              Photo Evidence (Optional)
            </label>
            <p className="text-xs text-slate-500 mb-3">Upload photos to show the condition or your experience.</p>
            
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-3">
              {photos.map((url, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden group border border-slate-100 shadow-sm">
                  <img src={url} alt={`Review photo ${i}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(url)}
                    className="absolute top-1 right-1 p-1 bg-white/90 rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-red-500 shadow-sm"
                  >
                    <FiX size={14} />
                  </button>
                </div>
              ))}
              <label className="relative aspect-square rounded-xl border-2 border-dashed border-slate-200 hover:border-brand-300 hover:bg-brand-50/50 transition-colors flex flex-col items-center justify-center cursor-pointer text-slate-400 hover:text-brand-500">
                {isUploading ? (
                  <FiLoader size={20} className="animate-spin" />
                ) : (
                  <>
                    <FiUploadCloud size={24} className="mb-1" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Add</span>
                  </>
                )}
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  disabled={isUploading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              disabled={isSubmitting || rating === 0}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2 justify-center">
                  <FiLoader className="animate-spin" /> Submitting
                </span>
              ) : (
                'Submit Review'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
