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
  FiSmile,
  FiTarget,
} from 'react-icons/fi';
import Button from '../components/Button';
import TiltCard from '../components/TiltCard';

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
  const stepRefs = useRef([]);

  // IntersectionObserver to update active step on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.dataset.idx);
            setActiveStep(idx);
          }
        });
      },
      { root: null, rootMargin: '0px', threshold: 0.4 }
    );

    stepRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  // Hover-driven preview step for right‑hand 3D showcase
  // null = nothing hovered → default to step 0
  const [hoveredStep, setHoveredStep] = useState(null);
  const previewStep = hoveredStep !== null ? hoveredStep : 0;

  const features = [
    {
      type: 'network',
      title: 'Local Network',
      description: 'Discover trusted neighbors in your community offering quality items for rent at fair prices.',
    },
    {
      type: 'safe',
      title: 'Verified & Safe',
      description: 'Every host is verified. Secure payments, insurance coverage, and transparent booking terms.',
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
      title: 'Browse & Search',
      description: 'Explore thousands of items in your city. Filter by category, price, location, and ratings.',
      icon: FiSearch,
    },
    {
      step: '02',
      title: 'Book Instantly',
      description: 'Select dates, add to cart, and complete payment securely. Get instant confirmation.',
      icon: FiCheckCircle,
    },
    {
      step: '03',
      title: 'Connect & Pickup',
      description: 'Chat with host, arrange pickup, and collect your item. Verify condition with photos.',
      icon: FiUsers,
    },
    {
      step: '04',
      title: 'Return & Earn',
      description: 'Return item in agreed condition. Get refund and help host earn. Leave a review.',
      icon: FiTrendingUp,
    },
  ];

  const hostBenefits = [
    { text: 'Earn passive income from items you own', icon: FiDollarSign },
    { text: 'Maximum security with verified renters', icon: FiShield },
    { text: 'Flexible rental terms and pricing control', icon: FiClock },
    { text: 'Build your superhost reputation', icon: FiTrendingUp },
    { text: 'Access to local community of 10k+ users', icon: FiUsers },
    { text: 'Insurance coverage for all rentals', icon: FiCheckCircle },
  ];

  const stats = [
    { value: '10K+', label: 'Active Users', icon: FiUsers },
    { value: '5000+', label: 'Items Listed', icon: FiTarget },
    { value: '₹2Cr+', label: 'Transaction Value', icon: FiTrendingUp },
    { value: '4.8★', label: 'Avg Rating', icon: FiSmile },
  ];

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-5 space-y-8 text-left">
              <div>
                <span className="eyebrow mb-4">
                  🚀 Welcome to the Future of Rentals
                </span>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-800 leading-[1.1] mb-6 tracking-tight">
                  Rent Smarter,<br />
                  <span className="bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500 bg-clip-text text-transparent">
                    Live Better
                  </span>
                </h1>
                <p className="text-base md:text-lg text-slate-500 leading-relaxed max-w-lg">
                  Join thousands of people saving money and accessing premium gear through our peer-to-peer rental marketplace. Secured by trust, optimized for your convenience.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button href="/listings" variant="primary" className="!px-8 !py-4 text-base group shadow-lg shadow-slate-900/10">
                  <FiSearch size={18} />
                  Start Browsing
                  <FiArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button
                  href="/listings/new"
                  requireAuth
                  authMessage="Please sign in first to list an item or start hosting."
                  variant="secondary"
                  className="!px-8 !py-4 text-base border-slate-200"
                >
                  <FiZap size={18} />
                  Become a Host
                </Button>
              </div>

              <div className="grid grid-cols-4 gap-4 pt-6 border-t border-slate-200/60">
                {stats.map((stat) => (
                  <div key={stat.label} className="text-left">
                    <p className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                      {stat.value}
                    </p>
                    <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mt-1 leading-none">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right 3D Stage */}
            <div className="lg:col-span-7 relative h-[50vh] lg:h-[75vh] w-full">
              <Hero3D className="w-full h-full" />
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

      {/* Features Grid */}
      <section className="py-16 md:py-24 relative px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="eyebrow mb-4">Why Choose Rentrex</span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-800 mb-6 tracking-tight">
              Designed for Your Lifestyle
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              Experience the new way to own and share. Community-driven, technology-enabled, and completely transparent.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, idx) => (
              <TiltCard key={idx} max={8} className="h-full">
                <div
                  onMouseEnter={() => setHoveredFeature(idx)}
                  onMouseLeave={() => setHoveredFeature(null)}
                  className="h-full p-8 rounded-3xl bg-white/70 border border-slate-200/50 hover:border-blue-500/20 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 space-y-6 backdrop-blur-md"
                >
                  <div className="w-16 h-16 flex items-center justify-center">
                    <Feature3DIcon type={feature.type} hovered={hoveredFeature === idx} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">{feature.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{feature.description}</p>
                </div>
              </TiltCard>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - Side-by-Side Interactive Showcase */}
      <section className="py-16 md:py-24 relative px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="eyebrow mb-4">Simple Process</span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-800 mb-6 tracking-tight">
              4 Steps to Get Started
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              From browsing to booking, complete your rental journey in minutes.
            </p>
          </div>

          <div className="grid lg:grid-cols-12 gap-12 items-center">
            {/* Left Steps List */}
            <div className="lg:col-span-6 space-y-4">
              {howItWorks.map((item, idx) => {
                const isActive = previewStep === idx;
                return (
                  <div
                    key={item.step}
                    data-idx={idx}
                    ref={(el) => (stepRefs.current[idx] = el)}
                    onMouseEnter={() => setHoveredStep(idx)}
                    onMouseLeave={() => setHoveredStep(null)}
                    className={`p-6 rounded-2xl border transition-all duration-300 cursor-pointer flex gap-4 items-start ${isActive
                      ? 'bg-white border-blue-500/30 shadow-[0_15px_30px_-15px_rgba(37,99,235,0.08)] scale-105'
                      : 'bg-white/40 border-slate-200/50 hover:bg-white/60 hover:border-slate-300 hover:scale-105'
                      }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm transition-all ${isActive ? 'bg-blue-600 text-white' : 'bg-slate-100/80 text-slate-500'
                        }`}
                    >
                      {item.step}
                    </div>
                    <div>
                      <h3 className={`text-lg font-bold transition-colors ${isActive ? 'text-blue-600' : 'text-slate-800'}`}>
                        {item.title}
                      </h3>
                      <p className="text-slate-500 text-sm mt-1 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right Interactive 3D Showcase */}
            <div className="lg:col-span-6">
              <Process3DShowcase activeStep={previewStep} />
            </div>
          </div>
        </div>
      </section>

      {/* Host Benefits */}
      <section className="py-16 md:py-24 relative px-4 sm:px-6 lg:px-8 border-t border-b border-slate-200/30 bg-slate-50/20">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-6 space-y-8">
              <div>
                <span className="eyebrow !bg-emerald-50 !text-emerald-700 !border-emerald-200/60 mb-4">
                  For Hosts
                </span>
                <h2 className="text-4xl md:text-5xl font-extrabold text-slate-800 mb-6 tracking-tight">
                  Turn Your Gear Into Income
                </h2>
                <p className="text-lg text-slate-500 leading-relaxed mb-6">
                  Your items are sitting idle. Why not earn from them? Host on Rentrex and build passive income while helping your community access quality gear at affordable prices.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {hostBenefits.map((benefit, idx) => {
                  const Icon = benefit.icon;
                  return (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-100 shadow-sm hover:shadow transition-shadow">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                        <Icon size={16} />
                      </div>
                      <p className="text-slate-700 text-sm font-semibold truncate">{benefit.text}</p>
                    </div>
                  );
                })}
              </div>

              <Button
                href="/listings/new"
                requireAuth
                authMessage="Please sign in first to list your first item."
                variant="primary"
                className="!px-8 !py-4 text-base !bg-emerald-600 hover:!bg-emerald-700 shadow-emerald-600/10"
              >
                List Your First Item
                <FiArrowRight size={18} />
              </Button>
            </div>

            {/* Right 3D Chart */}
            <div className="lg:col-span-6 w-full">
              <Earnings3DChart />
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof / Trust Section */}
      <section className="py-16 md:py-24 relative px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="eyebrow !bg-purple-50 !text-purple-700 !border-purple-200/60 mb-4">
              Trusted Community
            </span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-800 mb-6 tracking-tight">
              Loved by Our Community
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              Real stories from real users saving money and earning income.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: 'Priya Kumar',
                role: 'Camera Host',
                testimonial: 'I was skeptical at first, but Rentrex made it so easy. Earned ₹15k in my first month just renting out my DSLR camera!',
                rating: 5,
              },
              {
                name: 'Arjun Singh',
                role: 'Frequent Renter',
                testimonial: 'No more buying expensive equipment I use occasionally. Found a professional camera setup for just ₹500/day. Amazing!',
                rating: 5,
              },
              {
                name: 'Meera Patel',
                role: 'Host & Renter',
                testimonial: 'The security measures and verified community give me full confidence. Both as a host and renter, I feel protected.',
                rating: 5,
              },
            ].map((testimonial, idx) => (
              <TiltCard key={idx} max={6}>
                <div className="p-8 rounded-3xl bg-white/70 border border-slate-200/50 hover:border-purple-500/20 hover:shadow-xl hover:shadow-purple-500/5 transition-all duration-300 h-full flex flex-col backdrop-blur-md">
                  <div className="mb-4">
                    {Array(testimonial.rating)
                      .fill(0)
                      .map((_, i) => (
                        <span key={i} className="text-yellow-400 text-base">
                          ★
                        </span>
                      ))}
                  </div>
                  <p className="text-slate-600 flex-grow mb-6 leading-relaxed italic text-sm">
                    "{testimonial.testimonial}"
                  </p>
                  <div className="border-t border-slate-100 pt-4">
                    <p className="font-bold text-slate-800 text-sm">{testimonial.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{testimonial.role}</p>
                  </div>
                </div>
              </TiltCard>
            ))}
          </div>
        </div>
      </section>

      {/* Floating CTA Banner */}
      <section className="py-12 md:py-20 relative px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-blue-600 via-cyan-600 to-emerald-600 p-12 md:p-20 shadow-2xl shadow-blue-500/10">
            {/* Animated Background */}
            <div className="absolute inset-0 opacity-15">
              <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl" />
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl" />
            </div>

            <div className="max-w-3xl mx-auto text-center relative z-10 space-y-6">
              <h2 className="text-3xl md:text-5xl font-black text-white leading-tight tracking-tight">
                Ready to Transform Your Rental Experience?
              </h2>
              <p className="text-base md:text-lg text-white/95 max-w-xl mx-auto leading-relaxed">
                Join thousands of renters and hosts in your community. Start today and save money or earn income.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
                <Button href="/listings" variant="primary" className="!px-8 !py-4 text-base !bg-white !text-blue-600 hover:!bg-slate-50 shadow-lg shadow-blue-900/10 hover:scale-[1.03] transition-transform">
                  <FiSearch size={18} />
                  Find Items Now
                </Button>
                <Button href="/auth/signup" variant="secondary" className="!px-8 !py-4 text-base !border-white/50 !text-white hover:!bg-white/10 hover:scale-[1.03] transition-transform">
                  <FiZap size={18} />
                  Create Account
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
