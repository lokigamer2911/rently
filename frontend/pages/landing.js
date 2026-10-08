import React, { useRef, useState, useEffect } from 'react';
import { FiSearch } from 'react-icons/fi';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  FiArrowRight,
  FiCheckCircle,
  FiTrendingUp,
  FiUsers,
  FiShield,
  FiClock,
  FiZap,
  FiDollarSign,
  FiCamera,
  FiFileText,
  FiLock,
  FiCreditCard,
  FiUserCheck,
} from 'react-icons/fi';
import useSWR from 'swr';
import { fetcher } from '../lib/api';
import Button from '../components/Button';
import TiltCard from '../components/TiltCard';
import AnimatedIcon from '../components/AnimatedIcon';
import WebGLErrorBoundary from '../components/WebGLErrorBoundary';
import LandingPreloader from '../components/cinematic/LandingPreloader';
import ShaderBackground from '../components/cinematic/ShaderBackground';
import HorizontalGallery from '../components/cinematic/HorizontalGallery';
import { useCineReveals } from '../components/cinematic/Reveal';

// Dynamically load client-side WebGL elements to prevent hydration issues
const Hero3D = dynamic(() => import('../components/three/Hero3D'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-slate-50/50 rounded-2xl animate-pulse border border-slate-100" />,
});

const Feature3DIcon = dynamic(() => import('../components/three/Feature3DIcons'), {
  ssr: false,
  loading: () => <div className="w-16 h-16 rounded-2xl bg-slate-50 animate-pulse border border-slate-100" />,
});

const Process3DShowcase = dynamic(() => import('../components/three/Process3DShowcase'), {
  ssr: false,
  loading: () => <div className="w-full h-80 rounded-3xl bg-slate-50 animate-pulse border border-slate-100" />,
});

const Earnings3DChart = dynamic(() => import('../components/three/Earnings3DChart'), {
  ssr: false,
  loading: () => <div className="w-full h-96 rounded-3xl bg-slate-50 animate-pulse border border-slate-100" />,
});

const LandingPage = () => {
  const [hoveredFeature, setHoveredFeature] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  // Hover-driven preview step for right‑hand 3D showcase
  // null = nothing hovered → scroll-driven activeStep
  const [hoveredStep, setHoveredStep] = useState(null);
  const stepRefs = useRef([]);
  const howItWorksWrap = useRef(null);

  useCineReveals();

  // Featured items for landing-only horizontal CGI shelf
  const { data: featured } = useSWR('/listings?limit=8', fetcher, { revalidateOnFocus: false });

  // Scroll-progress driven active step (premium scroll cinema) + IO fallback
  useEffect(() => {
    const onScroll = () => {
      if (!howItWorksWrap.current) return;
      const rect = howItWorksWrap.current.getBoundingClientRect();
      const vh = window.innerHeight;
      // progress of section through viewport
      const total = rect.height - vh * 0.4;
      const passed = Math.min(Math.max(-rect.top + vh * 0.2, 0), Math.max(1, total));
      const p = total > 0 ? passed / total : 0;
      const idx = Math.min(3, Math.max(0, Math.floor(p * 4)));
      setActiveStep((prev) => (prev === idx ? prev : idx));
    };
    let raf = 0;
    const loop = () => {
      raf = 0;
      onScroll();
    };
    const handler = () => {
      if (!raf) raf = requestAnimationFrame(loop);
    };
    window.addEventListener('scroll', handler, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.dataset.idx);
            if (!Number.isNaN(idx) && hoveredStep === null) setActiveStep(idx);
          }
        });
      },
      { root: null, rootMargin: '0px', threshold: 0.4 }
    );

    stepRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Hover-driven preview step for right‑hand 3D showcase
  // null = nothing hovered → scroll-driven activeStep
  const previewStep = hoveredStep !== null ? hoveredStep : activeStep;

  const features = [
    {
      type: 'network',
      title: 'Local Network',
      description: 'Discover trusted neighbors in your community offering quality items for rent at fair prices.',
    },
    {
      type: 'safe',
      title: 'Verified & Safe',
      description: 'Verified profiles, secure in-app payments, and transparent booking terms for both sides.',
    },
    {
      type: 'speed',
      title: 'Quick & Easy',
      description: 'Browse, book, and pick up your item in minutes. Flexible rental periods from hours to months.',
    },
    {
      type: 'value',
      title: 'Save Money',
      description: 'Rent instead of buy. Access premium gear at a fraction of retail prices without storage hassles.',
    },
  ];

  const howItWorks = [
    {
      step: '01',
      title: 'Browse and search',
      description: 'Explore items near you. Filter by category, price, location and ratings.',
      icon: FiSearch,
    },
    {
      step: '02',
      title: 'Book and pay',
      description: 'Pick your dates and pay securely. The booking confirms once payment is verified.',
      icon: FiCheckCircle,
    },
    {
      step: '03',
      title: 'Meet and pick up',
      description: 'Chat with the host, arrange pickup and verify condition with photos.',
      icon: FiUsers,
    },
    {
      step: '04',
      title: 'Return and review',
      description: 'Return on time, get your deposit back and leave a review.',
      icon: FiTrendingUp,
    },
  ];

  const hostBenefits = [
    { text: 'Earn income from items you already own', icon: FiDollarSign },
    { text: 'Verify every renter before handover', icon: FiShield },
    { text: 'Flexible rental terms and pricing control', icon: FiClock },
    { text: 'Photo + signature evidence at handover', icon: FiCamera },
    { text: 'Message renters directly in the app', icon: FiUsers },
    { text: 'You approve every booking request', icon: FiCheckCircle },
  ];

  /**
   * Hero highlights. These describe things the product actually does, so they
   * can be shown without inflating them the way a user/listing counter would.
   */
  const heroHighlights = [
    { icon: FiShield, title: 'Verified handover', desc: 'Photo and OTP sign-off at pickup and return.' },
    { icon: FiCreditCard, title: 'Secure payments', desc: 'Pay securely via Razorpay — cards, UPI and netbanking.' },
    { icon: FiClock, title: 'Rent flexibly', desc: 'By the hour, the day, or the month — your call.' },
  ];

  /** Real, shipped safety features. */
  const trustFeatures = [
    {
      icon: FiUserCheck,
      title: 'Handover codes',
      desc: 'A one-time code is exchanged at pickup and return, so both sides have proof of handover.',
    },
    {
      icon: FiCamera,
      title: 'Condition reports',
      desc: 'Photos and signatures from handover stay on the booking for both parties.',
    },
    {
      icon: FiFileText,
      title: 'Rental agreement',
      desc: 'Every confirmed booking includes a downloadable agreement with dates and amounts.',
    },
    {
      icon: FiLock,
      title: 'Deposit options',
      desc: 'Cash deposit or agreed collateral, recorded on the booking before pickup.',
    },
  ];

  const galleryItems = (featured?.length ? featured : [
    { id: '', title: 'Sony FX3 Cinema Rig', pricePerDay: 350000, city: 'Mumbai', tag: 'Camera', emoji: '📷' },
    { id: '', title: 'DJI Mavic 3 Pro', pricePerDay: 220000, city: 'Delhi', tag: 'Drone', emoji: '🚁' },
    { id: '', title: 'Apple Vision Pro', pricePerDay: 500000, city: 'Bengaluru', tag: 'Spatial', emoji: '🥽' },
    { id: '', title: 'PS5 + 4K TV Bundle', pricePerDay: 120000, city: 'Pune', tag: 'Gaming', emoji: '🎮' },
    { id: '', title: 'Bosch Drill Set', pricePerDay: 45000, city: 'Jaipur', tag: 'Tools', emoji: '🛠️' },
  ]).slice(0, 8);

  return (
    <div className="space-y-10 sm:space-y-16 mobile-nav-spacer landing-cinema">
      <LandingPreloader />

      {/* Hero Section */}
      <section className="relative min-h-[70vh] sm:min-h-[85vh] flex items-center justify-center overflow-hidden py-6 sm:py-10">
        <ShaderBackground className="hero-shader" />
        <div data-parallax="0.12" className="hero-orb hero-orb-a" aria-hidden="true" />
        <div data-parallax="-0.1" className="hero-orb hero-orb-b" aria-hidden="true" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
          <div className="grid lg:grid-cols-12 gap-6 lg:gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-5 space-y-5 sm:space-y-8 text-left">
              <div>
                <span className="eyebrow mb-3 sm:mb-4 cine-reveal">
                  Peer-to-peer rentals
                </span>
                <h1 className="text-[2rem] sm:text-4xl md:text-5xl lg:text-6xl font-black text-slate-800 leading-[1.1] mb-4 sm:mb-6 tracking-tight">
                  <span className="cine-mask"><span className="cine-mask-line">Rent Smarter,</span></span>
                  <br />
                  <span className="cine-mask"><span className="cine-mask-line bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500 bg-clip-text text-transparent">
                    Live Better
                  </span></span>
                </h1>
                <p className="text-sm sm:text-base md:text-lg text-slate-500 leading-relaxed max-w-lg cine-reveal" data-delay="0.15">
                  Rent cameras, drones, consoles and tools from verified neighbours. Secure payments and documented handovers.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 cine-reveal" data-delay="0.2" data-cursor-label="Go">
                <Button href="/listings" variant="primary" className="!px-6 sm:!px-8 !py-3.5 sm:!py-4 text-sm sm:text-base group shadow-lg shadow-slate-900/10">
                  <FiSearch size={18} />
                  Start Browsing
                  <FiArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button
                  href="/listings/new"
                  requireAuth
                  authMessage="Please sign in first to list an item or start hosting."
                  variant="secondary"
                  className="!px-6 sm:!px-8 !py-3.5 sm:!py-4 text-sm sm:text-base border-slate-200"
                >
                  <FiZap size={18} />
                  Become a Host
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-5 sm:pt-6 border-t border-slate-200/60">
                {heroHighlights.map((item, idx) => {
                  return (
                    <div
                      key={item.title}
                      className="cine-reveal flex items-start gap-3 rounded-2xl bg-white/60 border border-slate-200/60 px-3.5 py-3 backdrop-blur-sm hover:border-blue-500/25 hover:shadow-lg hover:shadow-blue-500/5 hover:-translate-y-0.5 transition-all duration-300"
                      data-delay={(idx * 0.12 + 0.25).toFixed(2)}
                    >
                      <AnimatedIcon icon={item.icon} tone="blue" size="sm" delay={`${(idx * -0.9).toFixed(1)}s`} />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800">{item.title}</p>
                        <p className="text-[11px] text-slate-500 leading-snug mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right 3D Stage — hidden on very small screens, shown on sm+ */}
            <div className="hidden sm:block lg:col-span-7 relative h-[40vh] lg:h-[75vh] w-full cine-reveal" data-delay="0.1">
              <WebGLErrorBoundary>
                <Hero3D className="w-full h-full" />
              </WebGLErrorBoundary>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 animate-bounce hidden md:block">
          <div className="text-center opacity-40 hover:opacity-80 transition-opacity">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Scroll to explore</p>
            <FiArrowRight size={16} className="text-slate-400 rotate-90 mx-auto" />
          </div>
        </div>
      </section>

      {/* Landing-only marquee */}
      <div className="landing-marquee" aria-hidden="true">
        <div className="landing-marquee-track">
          {Array.from({ length: 2 }).map((_, k) => (
            <span key={k}>
              Verified handovers&nbsp;&nbsp;•&nbsp;&nbsp;Secure payments&nbsp;&nbsp;•&nbsp;&nbsp;Local hosts&nbsp;&nbsp;•&nbsp;&nbsp;Flexible rentals&nbsp;&nbsp;•&nbsp;&nbsp;Condition reports&nbsp;&nbsp;•&nbsp;&nbsp;
            </span>
          ))}
        </div>
      </div>

      {/* Features Grid */}
      <section className="py-10 sm:py-16 md:py-24 relative px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-16 cine-reveal">
            <span className="eyebrow mb-3 sm:mb-4">Why Rently</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-800 mb-4 sm:mb-6 tracking-tight">
              Everything you need, right nearby
            </h2>
            <p className="text-sm sm:text-lg text-slate-500 max-w-2xl mx-auto">
              Real items from verified hosts, with clear pricing and secure checkout.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {features.map((feature, idx) => (
              <TiltCard key={idx} max={8} className="h-full cine-reveal" data-delay={(idx * 0.08).toFixed(2)}>
                <div
                  onMouseEnter={() => setHoveredFeature(idx)}
                  onMouseLeave={() => setHoveredFeature(null)}
                  className="h-full p-5 sm:p-8 rounded-2xl sm:rounded-3xl bg-white/70 border border-slate-200/50 hover:border-blue-500/20 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 space-y-4 sm:space-y-6 backdrop-blur-md"
                >
                  <div className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center">
                    <WebGLErrorBoundary fallback={<div className="w-full h-full rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center text-lg">✨</div>}>
                      <Feature3DIcon type={feature.type} hovered={hoveredFeature === idx} />
                    </WebGLErrorBoundary>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-1 sm:mb-2">{feature.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{feature.description}</p>
                </div>
              </TiltCard>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works — sticky CGI showcase */}
      <section ref={howItWorksWrap} className="py-10 sm:py-16 md:py-24 relative px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-16 cine-reveal">
            <span className="eyebrow mb-3 sm:mb-4">How it works</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-800 mb-4 sm:mb-6 tracking-tight">
              Rent in four steps
            </h2>
            <p className="text-sm sm:text-lg text-slate-500 max-w-2xl mx-auto">
              Browse, book, pick up and return — all tracked in one place.
            </p>
            <div className="how-progress"><i style={{ transform: `scaleX(${(previewStep + 1) / 4})` }} /></div>
          </div>

          <div className="grid lg:grid-cols-12 gap-6 sm:gap-12 items-start">
            <div className="lg:col-span-6 space-y-3 sm:space-y-4">
              {howItWorks.map((item, idx) => {
                const isActive = previewStep === idx;
                return (
                  <div
                    key={item.step}
                    data-idx={idx}
                    ref={(el) => (stepRefs.current[idx] = el)}
                    onMouseEnter={() => setHoveredStep(idx)}
                    onMouseLeave={() => setHoveredStep(null)}
                    onClick={() => setHoveredStep(idx)}
                    className={`cine-reveal p-4 sm:p-6 rounded-xl sm:rounded-2xl border transition-all duration-300 cursor-pointer flex gap-3 sm:gap-4 items-start ${isActive
                      ? 'bg-white border-blue-500/30 shadow-[0_15px_30px_-15px_rgba(37,99,235,0.08)] sm:scale-105'
                      : 'bg-white/40 border-slate-200/50 hover:bg-white/60 hover:border-slate-300 sm:hover:scale-105'
                      }`}
                    data-delay={(idx * 0.05).toFixed(2)}
                  >
                    <div
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-xs sm:text-sm transition-all ${isActive ? 'bg-blue-600 text-white' : 'bg-slate-100/80 text-slate-500'}`}
                    >
                      {item.step}
                    </div>
                    <div>
                      <h3 className={`text-base sm:text-lg font-bold transition-colors ${isActive ? 'text-blue-600' : 'text-slate-800'}`}>
                        {item.title}
                      </h3>
                      <p className="text-slate-500 text-xs sm:text-sm mt-0.5 sm:mt-1 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 3D Showcase — sticky on desktop */}
            <div className="hidden lg:block lg:col-span-6">
              <div className="lg:sticky lg:top-24">
                <WebGLErrorBoundary fallback={<div className="w-full h-80 rounded-3xl bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center border border-slate-200/50"><p className="text-sm text-slate-400">Interactive demo unavailable</p></div>}>
                  <Process3DShowcase activeStep={previewStep} />
                </WebGLErrorBoundary>
                <div className="flex gap-2 mt-4 justify-center">
                  {howItWorks.map((s, i) => (
                    <button key={s.step} type="button" onClick={() => { setHoveredStep(i); setActiveStep(i); }} className={`how-dot ${previewStep === i ? 'is-active' : ''}`} aria-label={s.title} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Landing-only horizontal CGI shelf */}
      <HorizontalGallery items={galleryItems} />

      {/* Host Benefits */}
      <section className="py-10 sm:py-16 md:py-24 relative px-4 sm:px-6 lg:px-8 border-t border-b border-slate-200/30 bg-slate-50/20">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-8 sm:gap-12 items-center">
            <div className="lg:col-span-6 space-y-5 sm:space-y-8">
              <div className="cine-reveal">
                <span className="eyebrow !bg-emerald-50 !text-emerald-700 !border-emerald-200/60 mb-3 sm:mb-4">
                  For hosts
                </span>
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-800 mb-4 sm:mb-6 tracking-tight">
                  Earn from what you own
                </h2>
                <p className="text-sm sm:text-lg text-slate-500 leading-relaxed mb-4 sm:mb-6">
                  List cameras, tools, consoles and more. You set the price and approve every booking.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {hostBenefits.map((benefit, idx) => {
                  return (
                    <div key={idx} className="cine-reveal flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-100 shadow-sm hover:shadow transition-shadow" data-delay={(idx * 0.05).toFixed(2)}>
                      <AnimatedIcon icon={benefit.icon} tone="emerald" size="sm" delay={`${(idx * -0.8).toFixed(1)}s`} />
                      <p className="text-slate-700 text-xs sm:text-sm font-semibold leading-snug">{benefit.text}</p>
                    </div>
                  );
                })}
              </div>

              <div className="cine-reveal">
                <Button
                  href="/listings/new"
                  requireAuth
                  authMessage="Please sign in first to list your first item."
                  variant="primary"
                  className="!px-6 sm:!px-8 !py-3.5 sm:!py-4 text-sm sm:text-base !bg-emerald-600 hover:!bg-emerald-700 shadow-emerald-600/10"
                >
                  List Your First Item
                  <FiArrowRight size={18} />
                </Button>
              </div>
            </div>

            {/* 3D Chart — hidden on mobile, shown on lg+ */}
            <div className="hidden lg:block lg:col-span-6 w-full cine-reveal">
              <WebGLErrorBoundary fallback={<div className="w-full h-96 rounded-3xl bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center border border-slate-200/50"><p className="text-sm text-slate-400">Hosting flow unavailable</p></div>}>
                <Earnings3DChart />
              </WebGLErrorBoundary>
            </div>
          </div>
        </div>
      </section>

      {/* Trust / Safety — describes the checks that are actually built in */}
      <section className="py-10 sm:py-16 md:py-24 relative px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-16 cine-reveal">
            <span className="eyebrow !bg-purple-50 !text-purple-700 !border-purple-200/60 mb-3 sm:mb-4">
              Safety built in
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-800 mb-4 sm:mb-6 tracking-tight">
              Protected on both sides
            </h2>
            <p className="text-sm sm:text-lg text-slate-500 max-w-2xl mx-auto">
              OTP handovers, photo evidence and a written agreement on every booking.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {trustFeatures.map((item, idx) => {
              return (
                <div
                  key={item.title}
                  className="cine-reveal p-5 sm:p-7 rounded-2xl sm:rounded-3xl bg-white/70 border border-slate-200/50 hover:border-purple-500/25 hover:shadow-xl hover:shadow-purple-500/5 hover:-translate-y-1 transition-all duration-300 h-full flex flex-col backdrop-blur-md"
                  data-delay={(idx * 0.08).toFixed(2)}
                >
                  <div className="mb-4 sm:mb-5">
                    <AnimatedIcon icon={item.icon} tone="purple" size="md" delay={`${(idx * -0.7).toFixed(1)}s`} />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-2">{item.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed flex-grow">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Floating CTA Banner */}
      <section className="py-8 sm:py-12 md:py-20 relative px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="cine-reveal relative overflow-hidden rounded-2xl sm:rounded-[2.5rem] bg-gradient-to-r from-blue-600 via-cyan-600 to-emerald-600 p-8 sm:p-12 md:p-20 shadow-2xl shadow-blue-500/10 group">
            <div className="absolute inset-0 opacity-15">
              <div data-parallax="0.2" className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl" />
              <div data-parallax="-0.15" className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl" />
            </div>

            <div className="max-w-3xl mx-auto text-center relative z-10 space-y-4 sm:space-y-6">
              <h2 className="text-xl sm:text-3xl md:text-5xl font-black text-white leading-tight tracking-tight">
                Ready to start renting?
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-white/95 max-w-xl mx-auto leading-relaxed">
                Join in a minute — browse items or list your first one.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center pt-4 sm:pt-6">
                <Button href="/listings" variant="primary" className="!px-6 sm:!px-8 !py-3.5 sm:!py-4 text-sm sm:text-base !bg-white !text-blue-600 hover:!bg-slate-50 shadow-lg shadow-blue-900/10">
                  <FiSearch size={18} />
                  Find Items Now
                </Button>
                <Button href="/auth/signup" variant="secondary" className="!px-6 sm:!px-8 !py-3.5 sm:!py-4 text-sm sm:text-base !border-white/50 !text-white hover:!bg-white/10">
                  <FiZap size={18} />
                  Create Account
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Landing-only WebGL page-transition veil */}
      <div className="landing-veil" aria-hidden="true" />
    </div>
  );
};

export default LandingPage;
