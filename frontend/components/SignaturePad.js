import { useRef, useState, useEffect } from 'react';
import { FiRotateCcw, FiCheck } from 'react-icons/fi';

export default function SignaturePad({ label, onSave }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set standard drawing context configurations
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Handle high DPI screens
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Resize listener to prevent stretching
    const handleResize = () => {
      const currentRect = canvas.getBoundingClientRect();
      const tempImage = canvas.toDataURL();
      
      canvas.width = currentRect.width * window.devicePixelRatio;
      canvas.height = currentRect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Restore image
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, currentRect.width, currentRect.height);
      };
      img.src = tempImage;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const triggerHaptic = (ms = 10) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(ms);
      } catch (e) {
        // Ignore haptic errors on unsupported/permission-blocked systems
      }
    }
  };

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if (e.touches && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }

    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e) => {
    if (isSaved) return;
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
    triggerHaptic(15);
  };

  const draw = (e) => {
    if (!isDrawing || isSaved) return;
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsSaved(false);
    setHasDrawn(false);
    onSave(null);
    triggerHaptic(20);
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn) return;
    const dataUrl = canvas.toDataURL('image/png');
    setIsSaved(true);
    onSave(dataUrl);
    triggerHaptic(30);
  };

  return (
    <div className="space-y-2 relative overflow-hidden rounded-2xl bg-slate-900/90 border border-white/10 p-4 shadow-xl backdrop-blur-md">
      <div className="flex justify-between items-center px-1">
        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
          {label}
        </label>
        {isSaved && (
          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider animate-pulse">
            Locked
          </span>
        )}
      </div>

      <div className="relative aspect-[2.5/1] rounded-xl overflow-hidden bg-slate-950/60 border border-white/5 cursor-crosshair">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="absolute inset-0 w-full h-full"
        />
        {!hasDrawn && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-xs text-slate-500 font-medium uppercase tracking-wider select-none opacity-60">
              Draw Signature Here
            </span>
          </div>
        )}
      </div>

      <div className="flex gap-2 justify-end">
        <button
          onClick={clearCanvas}
          type="button"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-all"
        >
          <FiRotateCcw size={12} />
          Clear
        </button>
        <button
          onClick={saveSignature}
          type="button"
          disabled={!hasDrawn || isSaved}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            isSaved
              ? 'bg-emerald-500/10 text-emerald-400 cursor-not-allowed'
              : hasDrawn
              ? 'bg-brand-500 text-white hover:bg-brand-600'
              : 'bg-white/5 text-slate-500 cursor-not-allowed'
          }`}
        >
          <FiCheck size={12} />
          {isSaved ? 'Saved' : 'Confirm'}
        </button>
      </div>
    </div>
  );
}
