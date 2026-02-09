import { useState, useEffect } from 'react';
import {
  Shield,
  Zap,
  Check,
  TrendingUp,
  Code,
  ArrowRight,
  Star,
  Menu,
  X,
  ShoppingBag,
  Eye,
  Clock,
  Layout,
  Sparkles,
  Users,
  BarChart3,
  Play,
  MousePointer,
  Rocket
} from 'lucide-react';

// Pricing tier options
const PRO_TIERS = [
  { slug: 'pro-6k', visitors: '6,000', price: 9 },
  { slug: 'pro-10k', visitors: '10,000', price: 12 },
  { slug: 'pro-15k', visitors: '15,000', price: 16 },
  { slug: 'pro-25k', visitors: '25,000', price: 21 },
  { slug: 'pro-50k', visitors: '50,000', price: 36 },
];

const GROWTH_TIERS = [
  { slug: 'growth-100k', visitors: '100,000', price: 59 },
  { slug: 'growth-200k', visitors: '200,000', price: 79 },
  { slug: 'growth-400k', visitors: '400,000', price: 120 },
  { slug: 'growth-600k', visitors: '600,000', price: 180 },
  { slug: 'growth-1m', visitors: '1,000,000', price: 210 },
];

interface LandingPageProps {
  onShowLogin: () => void;
  onShowSignup: (planSlug?: string) => void;
  onShowTerms?: () => void;
  onShowPrivacy?: () => void;
  onShowRefund?: () => void;
}

// Logo component using Cloudinary image
const Logo = ({ className = "w-8 h-8" }: { className?: string }) => (
  <img
    src="https://res.cloudinary.com/ddhhlkyut/image/upload/v1765406050/Proofedge6_dxarbe.svg"
    alt="ProofEdge logo"
    className={className}
  />
);


// Mock Data for Dynamic Widgets
const RECENT_ACTIVITY = [
  { type: 'purchase', text: 'Alex from Austin purchased Premium Plan', time: '2 mins ago' },
  { type: 'visitor', text: '47 people are viewing this page right now', time: 'Live' },
  { type: 'review', text: '"Increased our conversions by 12%!" - Sarah J.', stars: 5 }
];

export default function LandingPage({ onShowLogin, onShowSignup, onShowTerms, onShowPrivacy, onShowRefund }: LandingPageProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeWidgetIndex, setActiveWidgetIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [selectedProTier, setSelectedProTier] = useState(0);
  const [selectedGrowthTier, setSelectedGrowthTier] = useState(0);

  // Widget rotation logic for the demo
  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setActiveWidgetIndex((prev) => (prev + 1) % RECENT_ACTIVITY.length);
        setIsVisible(true);
      }, 500);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // ProofPop Pixel Code - only loads on LandingPage
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://ghiobuubmnvlaukeyuwe.supabase.co/functions/v1/pixel-loader';
    script.setAttribute('data-site-id', '3b15fc29-47c4-4900-865a-834640458e19');
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    return () => {
      // Cleanup: remove script when leaving LandingPage
      try {
        document.head.removeChild(script);
      } catch (e) {
        // Script may already be removed
      }

      // Remove the specific widget container created by widget.js
      const spWidgetContainer = document.querySelector('.sp-widget-container');
      if (spWidgetContainer) spWidgetContainer.remove();

      // Remove the widget styles
      const widgetStyles = document.getElementById('social-proof-widget-styles');
      if (widgetStyles) widgetStyles.remove();

      // Remove all ProofEdge/ProofPop widget elements from the DOM
      const widgetContainers = document.querySelectorAll('[id^="proofedge"], [id^="proof-edge"], [id^="proofpop"], [class*="proofedge"], [class*="proof-edge"], [class*="proofpop"], .sp-notification');
      widgetContainers.forEach(el => el.remove());

      // Also remove any widget containers with common patterns
      const genericWidgets = document.querySelectorAll('[data-proofedge], [data-widget-id], .social-proof-widget, .notification-widget');
      genericWidgets.forEach(el => el.remove());

      // Clear any global ProofEdge state and intervals
      if (typeof window !== 'undefined') {
        // @ts-ignore - Clear widget instance
        if (window.ProofEdge) {
          // @ts-ignore
          if (window.ProofEdge.fetchInterval) clearInterval(window.ProofEdge.fetchInterval);
          // @ts-ignore
          if (window.ProofEdge.verificationInterval) clearInterval(window.ProofEdge.verificationInterval);
          // @ts-ignore
          delete window.ProofEdge;
        }
        // @ts-ignore
        if (window.proofedge) delete window.proofedge;
        // @ts-ignore
        if (window.ProofPop) {
          // @ts-ignore
          if (window.ProofPop.fetchInterval) clearInterval(window.ProofPop.fetchInterval);
          // @ts-ignore
          if (window.ProofPop.verificationInterval) clearInterval(window.ProofPop.verificationInterval);
          // @ts-ignore
          delete window.ProofPop;
        }
        // @ts-ignore
        if (window.SocialProofWidget) delete window.SocialProofWidget;
      }
    };
  }, []);

  // Microsoft Clarity - only loads on LandingPage
  useEffect(() => {
    const clarityScript = document.createElement('script');
    clarityScript.type = 'text/javascript';
    clarityScript.innerHTML = `
      (function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
      })(window, document, "clarity", "script", "venkwhdiqk");
    `;
    document.head.appendChild(clarityScript);

    return () => {
      document.head.removeChild(clarityScript);
      // @ts-ignore
      if (window.clarity) delete window.clarity;
    };
  }, []);

  // Google Analytics - only loads on LandingPage
  useEffect(() => {
    // Load gtag.js script
    const gtagScript = document.createElement('script');
    gtagScript.src = 'https://www.googletagmanager.com/gtag/js?id=G-LRM0590QHM';
    gtagScript.async = true;
    document.head.appendChild(gtagScript);

    // Initialize gtag
    const initScript = document.createElement('script');
    initScript.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-LRM0590QHM');
    `;
    document.head.appendChild(initScript);

    return () => {
      // Cleanup: remove scripts when leaving LandingPage
      document.head.removeChild(gtagScript);
      document.head.removeChild(initScript);
    };
  }, []);

  const currentWidget = RECENT_ACTIVITY[activeWidgetIndex];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased selection:bg-blue-100">
      {/* Load Fonts & Modern Styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap');
        
        .font-sans { font-family: 'Inter', sans-serif; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        
        .glass-nav {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(24px) saturate(180%);
          -webkit-backdrop-filter: blur(24px) saturate(180%);
          border-bottom: 1px solid rgba(0,0,0,0.05);
        }

        .widget-shadow {
          box-shadow: 0 4px 24px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04);
        }

        .hero-gradient {
          background: linear-gradient(180deg, #ffffff 0%, #f0f4ff 40%, #e8efff 100%);
          position: relative;
        }
        
        .hero-gradient::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99, 102, 241, 0.15), transparent);
          pointer-events: none;
        }

        .text-gradient {
          background: linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #4f46e5 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .text-gradient-subtle {
          background: linear-gradient(135deg, #1e40af 0%, #5b21b6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .card-glow {
          box-shadow: 0 0 80px rgba(99, 102, 241, 0.2), 0 0 0 1px rgba(99, 102, 241, 0.08);
        }
        
        .card-hover {
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .card-hover:hover {
          transform: translateY(-8px);
          box-shadow: 0 24px 48px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04);
        }

        .floating {
          animation: floating 6s ease-in-out infinite;
        }
        
        .floating-slow {
          animation: floating 8s ease-in-out infinite;
        }
        
        .floating-delayed {
          animation: floating 6s ease-in-out infinite;
          animation-delay: 2s;
        }

        @keyframes floating {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-16px); }
        }

        .pulse-ring {
          animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes pulse-ring {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.05); }
        }
        
        .pulse-dot {
          animation: pulse-dot 2s ease-in-out infinite;
        }
        
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        .fade-up {
          animation: fadeUp 1s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        
        .fade-up-delay-1 {
          animation: fadeUp 1s cubic-bezier(0.4, 0, 0.2, 1) 0.1s forwards;
          opacity: 0;
        }
        
        .fade-up-delay-2 {
          animation: fadeUp 1s cubic-bezier(0.4, 0, 0.2, 1) 0.2s forwards;
          opacity: 0;
        }
        
        .fade-up-delay-3 {
          animation: fadeUp 1s cubic-bezier(0.4, 0, 0.2, 1) 0.3s forwards;
          opacity: 0;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .scale-in {
          animation: scaleIn 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }

        .shine-effect {
          position: relative;
          overflow: hidden;
        }
        .shine-effect::after {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(to bottom right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0) 100%);
          transform: rotate(45deg);
          animation: shine 4s infinite;
        }
        @keyframes shine {
          0% { transform: translateX(-100%) rotate(45deg); }
          100% { transform: translateX(100%) rotate(45deg); }
        }
        
        .gradient-border {
          position: relative;
          background: white;
          border-radius: 24px;
        }
        
        .gradient-border::before {
          content: '';
          position: absolute;
          inset: -2px;
          border-radius: 26px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899);
          z-index: -1;
          opacity: 0;
          transition: opacity 0.3s;
        }
        
        .gradient-border:hover::before {
          opacity: 1;
        }
        
        .mesh-gradient {
          background: 
            radial-gradient(at 40% 20%, rgba(99, 102, 241, 0.1) 0px, transparent 50%),
            radial-gradient(at 80% 0%, rgba(139, 92, 246, 0.1) 0px, transparent 50%),
            radial-gradient(at 0% 50%, rgba(59, 130, 246, 0.08) 0px, transparent 50%),
            radial-gradient(at 80% 50%, rgba(236, 72, 153, 0.08) 0px, transparent 50%),
            radial-gradient(at 0% 100%, rgba(99, 102, 241, 0.1) 0px, transparent 50%);
        }
        
        .noise-overlay {
          position: relative;
        }
        
        .noise-overlay::after {
          content: '';
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
          opacity: 0.02;
          pointer-events: none;
        }

        .stat-card {
          background: linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.8) 100%);
          backdrop-filter: blur(12px);
        }

        .feature-icon {
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
        }

        .testimonial-card {
          background: linear-gradient(135deg, #ffffff 0%, #fafbff 100%);
        }
        
        .glow-blue {
          box-shadow: 0 0 40px rgba(59, 130, 246, 0.3);
        }
        
        .glow-purple {
          box-shadow: 0 0 40px rgba(139, 92, 246, 0.3);
        }
        
        .btn-primary {
          background: linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .btn-primary:hover {
          background: linear-gradient(135deg, #2d2d2d 0%, #3d3d3d 100%);
          transform: translateY(-2px);
          box-shadow: 0 12px 24px rgba(0,0,0,0.2);
        }
        
        .btn-secondary {
          background: rgba(255,255,255,0.9);
          backdrop-filter: blur(8px);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .btn-secondary:hover {
          background: rgba(255,255,255,1);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.1);
        }
      `}</style>

      {/* --- Navigation --- */}
      <nav className="fixed top-0 w-full z-50 glass-nav" role="navigation" aria-label="Main navigation">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo Area */}
          <a href="#" className="flex items-center gap-3 cursor-pointer group" aria-label="ProofEdge home">
            <div className="text-blue-600 group-hover:scale-105 transition-transform duration-300" aria-hidden="true">
              <Logo />
            </div>
            <span className="font-bold text-xl tracking-tight text-gray-900">ProofEdge</span>
          </a>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-10">
            <a href="#features" className="text-base font-medium text-gray-600 hover:text-gray-900 transition-colors">Features</a>
            <a href="#how-it-works" className="text-base font-medium text-gray-600 hover:text-gray-900 transition-colors">How It Works</a>
            <a href="#pricing" className="text-base font-medium text-gray-600 hover:text-gray-900 transition-colors">Pricing</a>
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-5">
            <button
              onClick={onShowLogin}
              className="text-base font-semibold text-gray-700 hover:text-blue-600 transition-colors px-4 py-2"
              aria-label="Log in to your account"
            >
              Log in
            </button>
            <button
              onClick={() => onShowSignup()}
              className="bg-gray-900 text-white px-6 py-3 rounded-xl text-base font-semibold hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-gray-500/20"
              aria-label="Get started with ProofEdge"
            >
              Get Started
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-900 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-expanded={isMenuOpen}
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMenuOpen ? <X size={26} aria-hidden="true" /> : <Menu size={26} aria-hidden="true" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200 absolute w-full p-6 flex flex-col gap-5 shadow-xl">
            <a href="#features" className="text-lg font-semibold text-gray-900 py-2">Features</a>
            <a href="#how-it-works" className="text-lg font-semibold text-gray-900 py-2">How It Works</a>
            <a href="#pricing" className="text-lg font-semibold text-gray-900 py-2">Pricing</a>
            <hr className="border-gray-200 my-2" />
            <button
              onClick={onShowLogin}
              className="w-full bg-white border-2 border-gray-200 text-gray-900 py-4 rounded-xl font-semibold text-lg hover:bg-gray-50 transition-colors"
              aria-label="Log in to your account"
            >
              Log in
            </button>
            <button
              onClick={() => onShowSignup()}
              className="w-full bg-gray-900 text-white py-4 rounded-xl font-semibold text-lg hover:bg-gray-800 transition-colors"
              aria-label="Get started with ProofEdge"
            >
              Get Started
            </button>
          </div>
        )}
      </nav>

      {/* --- Hero Section --- */}
      <section className="pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden hero-gradient relative noise-overlay">
        {/* Background decorations */}
        <div className="absolute top-20 left-10 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] floating-slow" aria-hidden="true"></div>
        <div className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-[120px] floating-delayed" aria-hidden="true"></div>
        <div className="absolute top-1/3 left-1/3 w-72 h-72 bg-indigo-400/10 rounded-full blur-[80px]" aria-hidden="true"></div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" aria-hidden="true"></div>

        <div className="max-w-7xl mx-auto px-6 lg:px-8 grid lg:grid-cols-2 gap-16 items-center relative z-10">

          {/* Left Content */}
          <div className="relative z-10 fade-up">
            {/* Badge */}
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-indigo-100 text-sm font-semibold text-indigo-700 mb-8 shadow-sm" role="status">
              <Sparkles size={16} className="text-indigo-500" aria-hidden="true" />
              <span>Trusted by 2,000+ brands worldwide</span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-gray-900 leading-[1.1] mb-6">
              Turn Visitors Into
              <span className="block text-gradient">Customers</span>
            </h1>

            <p className="text-xl text-gray-600 mb-8 max-w-xl leading-relaxed">
              Show real-time social proof notifications that build trust and boost conversions by up to 15%. No fake popups — just authentic customer activity.
            </p>

            {/* Stats row */}
            <div className="flex flex-wrap gap-8 mb-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <TrendingUp size={24} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">+15%</p>
                  <p className="text-sm text-gray-500">Avg. conversion lift</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Users size={24} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">2M+</p>
                  <p className="text-sm text-gray-500">Notifications shown</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => onShowSignup()}
                className="bg-gray-900 text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-gray-800 transition-all shadow-xl shadow-gray-900/20 flex items-center justify-center gap-3 group focus:outline-none focus:ring-4 focus:ring-gray-500/30 shine-effect"
                aria-label="Get started with ProofEdge for free"
              >
                Start Free Trial
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" aria-hidden="true" />
              </button>
              <button
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-white/80 backdrop-blur-sm border border-gray-200 text-gray-700 px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-white hover:border-gray-300 transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-4 focus:ring-gray-500/20"
                aria-label="Watch demo video"
              >
                <Play size={18} className="text-gray-500" />
                See How It Works
              </button>
            </div>

            {/* Trust indicators */}
            <div className="mt-10 flex items-center gap-4">
              <div className="flex -space-x-2" role="group" aria-label="Customer avatars">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="w-9 h-9 rounded-full border-2 border-white bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center overflow-hidden shadow-md">
                    <img
                      src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${i * 12}`}
                      alt={`Customer ${i} avatar`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(i => (
                  <Star key={i} size={16} className="text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-sm text-gray-600 font-medium">Rated 4.9/5 by 500+ users</p>
            </div>
          </div>

          {/* Right Visual: Dynamic Demo */}
          <div
            className="relative h-[500px] lg:h-[560px] rounded-3xl flex items-center justify-center overflow-hidden group"
            role="img"
            aria-label="Interactive demo showing ProofEdge social proof notifications"
          >
            {/* Glassmorphic card background */}
            <div className="absolute inset-4 bg-white/60 backdrop-blur-xl rounded-2xl border border-white/50 shadow-2xl card-glow"></div>

            {/* Browser mockup */}
            <div className="relative w-[90%] h-[85%] bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
              {/* Browser header */}
              <div className="h-10 bg-gray-100 border-b border-gray-200 flex items-center px-4 gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <div className="flex-1 mx-4">
                  <div className="bg-white rounded-md px-3 py-1 text-xs text-gray-400 border border-gray-200 max-w-xs">
                    yourstore.com/checkout
                  </div>
                </div>
              </div>

              {/* Page content mockup */}
              <div className="p-6 space-y-4 bg-gradient-to-b from-gray-50 to-white h-full">
                <div className="flex gap-4">
                  <div className="w-24 h-24 bg-gray-100 rounded-lg"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                    <div className="h-3 w-1/2 bg-gray-100 rounded"></div>
                    <div className="h-6 w-20 bg-indigo-100 rounded mt-2"></div>
                  </div>
                </div>
                <div className="h-10 w-full bg-indigo-500 rounded-lg"></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="h-16 bg-gray-100 rounded-lg"></div>
                  <div className="h-16 bg-gray-100 rounded-lg"></div>
                </div>
              </div>
            </div>

            {/* Floating Dynamic Widget */}
            <div className={`absolute bottom-8 left-6 w-72 md:w-80 transition-all duration-500 ease-out floating ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
              <div className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-2xl border border-gray-100">
                {/* Icon Area */}
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${currentWidget.type === 'purchase' ? 'bg-gradient-to-br from-indigo-500 to-purple-500 text-white' :
                  currentWidget.type === 'visitor' ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white' :
                    'bg-gradient-to-br from-amber-500 to-orange-500 text-white'
                  }`}>
                  {currentWidget.type === 'purchase' && <ShoppingBag size={18} />}
                  {currentWidget.type === 'visitor' && <Eye size={18} />}
                  {currentWidget.type === 'review' && <Star size={18} fill="currentColor" />}
                </div>

                {/* Text Area */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 leading-snug truncate">
                    {currentWidget.text}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <p className="text-xs text-gray-500">{currentWidget.time}</p>
                    {currentWidget.type === 'purchase' && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded-full font-medium">Verified</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Stats floating card */}
            <div className="absolute top-8 right-6 bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-gray-100 floating" style={{ animationDelay: '1s' }}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <BarChart3 size={16} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Conversions</p>
                  <p className="text-sm font-bold text-gray-900">+23% <span className="text-emerald-500">↑</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- Logos --- */}
      <section className="py-16 border-y border-slate-200 bg-slate-50" aria-label="Trusted by leading companies">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-10">Proven increases without the hype</p>
          <div className="flex flex-wrap justify-center items-center gap-x-16 gap-y-8">
            {['Acme Corp', 'GlobalBank', 'Nebula', 'FocalPoint', 'Vertex'].map((brand) => (
              <span key={brand} className="text-2xl font-bold text-gray-400 hover:text-gray-600 transition-colors cursor-default">{brand}</span>
            ))}
          </div>
        </div>
      </section>

      {/* --- Why Fails Section (Features Grid) --- */}
      <section id="features" className="py-28 bg-white mesh-gradient relative" aria-labelledby="features-heading">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 text-indigo-600 text-sm font-semibold mb-6">
              <Shield size={16} />
              <span>Built Different</span>
            </div>
            <h2 id="features-heading" className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 leading-tight">Customers Can Spot <span className="text-gradient">Fake Proof</span> Instantly.</h2>
            <p className="text-gray-600 text-xl leading-relaxed">Traditional widgets break trust with fake popups and random numbers. ProofEdge is designed differently: authentic, verifiable, and clean.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <article className="group p-10 rounded-3xl bg-white border border-gray-100 card-hover cursor-default relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true"></div>
              <div className="w-14 h-14 bg-gradient-to-br from-gray-900 to-gray-700 rounded-2xl flex items-center justify-center text-white mb-8 group-hover:scale-110 group-hover:rotate-3 transition-all shadow-lg" aria-hidden="true">
                <Check size={28} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Real Events Only</h3>
              <p className="text-gray-600 text-lg leading-relaxed">No fabricated notifications. We only display actual data to ensure your credibility never takes a hit.</p>
            </article>

            {/* Feature 2 */}
            <article className="group p-10 rounded-3xl bg-white border border-gray-100 card-hover cursor-default relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true"></div>
              <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white mb-8 group-hover:scale-110 group-hover:rotate-3 transition-all shadow-lg" aria-hidden="true">
                <Clock size={28} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Dynamic Timestamps</h3>
              <p className="text-gray-600 text-lg leading-relaxed">"Purchased 5 minutes ago" builds instant trust. Timestamps update live, showing the momentum of your store.</p>
            </article>

            {/* Feature 3 */}
            <article className="group p-10 rounded-3xl bg-white border border-gray-100 card-hover cursor-default relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-500/10 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true"></div>
              <div className="w-14 h-14 bg-gradient-to-br from-violet-600 to-purple-600 rounded-2xl flex items-center justify-center text-white mb-8 group-hover:scale-110 group-hover:rotate-3 transition-all shadow-lg" aria-hidden="true">
                <Layout size={28} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Context-Aware</h3>
              <p className="text-gray-600 text-lg leading-relaxed">Optimized for checkout, pricing, and signup pages. Works best where decisions happen.</p>
            </article>
          </div>
        </div>
      </section>

      {/* --- How It Works Section --- */}
      <section id="how-it-works" className="py-28 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden" aria-labelledby="how-it-works-heading">
        {/* Background decoration */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-indigo-100/50 to-transparent rounded-full blur-3xl" aria-hidden="true"></div>

        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-600 text-sm font-semibold mb-6">
              <Zap size={16} />
              <span>Quick Setup</span>
            </div>
            <h2 id="how-it-works-heading" className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-5">Get Started in <span className="text-gradient">3 Simple Steps</span></h2>
            <p className="text-gray-600 text-xl">No coding required. Install in under 2 minutes.</p>
          </div>

          {/* Steps with connecting line */}
          <div className="relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-24 left-[16.67%] right-[16.67%] h-0.5 bg-gradient-to-r from-blue-200 via-indigo-300 to-emerald-200" aria-hidden="true"></div>

            <div className="grid md:grid-cols-3 gap-8">
              <article className="group bg-white p-10 rounded-3xl border border-gray-100 shadow-lg text-center card-hover relative">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl group-hover:scale-110 transition-transform" aria-hidden="true">
                  <Users size={32} />
                </div>
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg">1</div>
                <h3 className="font-bold text-gray-900 mb-4 text-xl">Create Your Account</h3>
                <p className="text-gray-600 text-lg leading-relaxed">Sign up for free and add your website in seconds.</p>
              </article>
              <article className="group bg-white p-10 rounded-3xl border border-gray-100 shadow-lg text-center card-hover relative">
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl group-hover:scale-110 transition-transform" aria-hidden="true">
                  <MousePointer size={32} />
                </div>
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg">2</div>
                <h3 className="font-bold text-gray-900 mb-4 text-xl">Copy & Paste the Pixel</h3>
                <p className="text-gray-600 text-lg leading-relaxed">Add one line of code to your site header. Works with Shopify, WordPress, and more.</p>
              </article>
              <article className="group bg-white p-10 rounded-3xl border border-gray-100 shadow-lg text-center card-hover relative">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-500 text-white rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl group-hover:scale-110 transition-transform" aria-hidden="true">
                  <Rocket size={32} />
                </div>
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg">3</div>
                <h3 className="font-bold text-gray-900 mb-4 text-xl">Watch Conversions Grow</h3>
                <p className="text-gray-600 text-lg leading-relaxed">Real social proof starts showing automatically. Track results in your dashboard.</p>
              </article>
            </div>
          </div>
        </div>
      </section>

      {/* --- Modern Alternative / Dev Section --- */}
      <section className="py-28 bg-white overflow-hidden relative" aria-labelledby="modern-section-heading">
        {/* Subtle background decoration */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 via-transparent to-indigo-50/50" aria-hidden="true"></div>

        <div className="max-w-7xl mx-auto px-6 lg:px-8 grid lg:grid-cols-2 gap-20 items-center relative z-10">
          <div>
            <div className="flex items-center gap-3 text-emerald-600 mb-6 font-mono text-sm font-semibold">
              <Code size={18} aria-hidden="true" />
              <span className="text-gray-600 uppercase tracking-wider">Built for Modern Stores & SaaS</span>
            </div>
            <h2 id="modern-section-heading" className="text-4xl md:text-5xl font-bold mb-8 text-gray-900 leading-tight">
              A Modern Alternative to Old Social Proof Tools.
            </h2>
            <p className="text-gray-600 text-xl mb-10 leading-relaxed">
              Clean design, smooth animations, instant loading — ProofEdge blends beautifully with your brand.
            </p>

            <ul className="flex flex-col gap-5" role="list">
              <li className="flex items-center gap-4 text-gray-700 text-lg">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600" aria-hidden="true"><Zap size={20} /></div>
                <span className="font-medium">Lightning fast (&lt;2kb)</span>
              </li>
              <li className="flex items-center gap-4 text-gray-700 text-lg">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600" aria-hidden="true"><Shield size={20} /></div>
                <span className="font-medium">Zero fake data & Verified only</span>
              </li>
              <li className="flex items-center gap-4 text-gray-700 text-lg">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600" aria-hidden="true"><Layout size={20} /></div>
                <span className="font-medium">Minimal, premium UI</span>
              </li>
            </ul>
          </div>

          {/* Code Block Mockup */}
          <div className="rounded-2xl bg-gray-900 border border-gray-700 p-6 shadow-2xl font-mono text-sm overflow-hidden" role="img" aria-label="Example code configuration">
            <div className="flex items-center justify-between border-b border-gray-700 pb-5 mb-5">
              <div className="flex gap-2.5" aria-hidden="true">
                <div className="w-3.5 h-3.5 rounded-full bg-red-500"></div>
                <div className="w-3.5 h-3.5 rounded-full bg-yellow-500"></div>
                <div className="w-3.5 h-3.5 rounded-full bg-green-500"></div>
              </div>
              <span className="text-gray-400 text-sm font-medium">config.js</span>
            </div>
            <div className="space-y-3 text-gray-300 text-base">
              <div className="flex gap-4">
                <span className="text-slate-600 select-none">1</span>
                <span>const <span className="text-[#3E8BFF]">widgetConfig</span> = {'{'}</span>
              </div>
              <div className="flex gap-4">
                <span className="text-slate-600 select-none">2</span>
                <span className="pl-4">theme: <span className="text-[#CE9178]">'minimal_dark'</span>,</span>
              </div>
              <div className="flex gap-4">
                <span className="text-slate-600 select-none">3</span>
                <span className="pl-4">verifyData: <span className="text-[#16E0A5]">true</span>,</span>
              </div>
              <div className="flex gap-4">
                <span className="text-slate-600 select-none">4</span>
                <span className="pl-4">position: <span className="text-[#CE9178]">'bottom-left'</span>,</span>
              </div>
              <div className="flex gap-4">
                <span className="text-slate-600 select-none">5</span>
                <span className="pl-4">pages: <span className="text-[#CE9178]">['/checkout', '/pricing']</span></span>
              </div>
              <div className="flex gap-4">
                <span className="text-slate-600 select-none">6</span>
                <span>{'}'};</span>
              </div>
              <div className="flex gap-4">
                <span className="text-slate-600 select-none">7</span>
                <span></span>
              </div>
              <div className="flex gap-4">
                <span className="text-slate-600 select-none">8</span>
                <span><span className="text-[#569CD6]">export default</span> widgetConfig;</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- What Actually Moves Conversions --- */}
      <section className="py-28 bg-gradient-to-b from-white to-slate-50" aria-labelledby="conversions-heading">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 text-center">
          <h2 id="conversions-heading" className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">What Actually Moves Conversions</h2>
          <p className="text-gray-600 text-xl mb-20 max-w-3xl mx-auto leading-relaxed">Reddit users, SaaS founders, and marketers all agree: authenticity beats flashiness. ProofEdge focuses on the things that actually move the needle.</p>

          <div className="grid md:grid-cols-3 gap-10 text-left">
            {/* Item 1 */}
            <article className="bg-white p-10 rounded-3xl border-2 border-slate-100 flex flex-col items-center shadow-lg hover:shadow-xl transition-shadow">
              <div className="bg-slate-50 rounded-2xl p-5 flex items-center gap-5 shadow-sm w-full border border-slate-100 mb-8">
                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0" aria-hidden="true">
                  <ShoppingBag size={22} />
                </div>
                <div>
                  <p className="text-base font-bold text-gray-900">Purchased Pro Plan</p>
                  <p className="text-sm text-gray-500">2 mins ago • Verified</p>
                </div>
              </div>
              <h4 className="font-bold text-gray-900 mb-3 text-xl">Real-Time Purchase</h4>
              <p className="text-base text-gray-600 text-center leading-relaxed">Show verified recent purchases with dynamic timestamps for maximum credibility.</p>
            </article>

            {/* Item 2 */}
            <article className="bg-white p-10 rounded-3xl border-2 border-slate-100 flex flex-col items-center shadow-lg hover:shadow-xl transition-shadow">
              <div className="bg-slate-50 rounded-2xl p-5 flex items-center gap-5 shadow-sm w-full border border-slate-100 mb-8">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0" aria-hidden="true">
                  <Eye size={22} />
                </div>
                <div>
                  <p className="text-base font-bold text-gray-900">47 people viewing</p>
                  <p className="text-sm text-gray-500">Live Count</p>
                </div>
              </div>
              <h4 className="font-bold text-gray-900 mb-3 text-xl">Live Visitor Count</h4>
              <p className="text-base text-gray-600 text-center leading-relaxed">"47 people are viewing this page." Real-time reassurance reduces hesitation.</p>
            </article>

            {/* Item 3 */}
            <article className="bg-white p-10 rounded-3xl border-2 border-slate-100 flex flex-col items-center shadow-lg hover:shadow-xl transition-shadow">
              <div className="bg-slate-50 rounded-2xl p-5 flex items-center gap-5 shadow-sm w-full border border-slate-100 mb-8">
                <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0" aria-hidden="true">
                  <Star size={22} fill="currentColor" />
                </div>
                <div>
                  <p className="text-base font-bold text-gray-900">"Best tool ever"</p>
                  <p className="text-sm text-gray-500">5 stars on G2</p>
                </div>
              </div>
              <h4 className="font-bold text-gray-900 mb-3 text-xl">Review Highlights</h4>
              <p className="text-base text-gray-600 text-center leading-relaxed">Highlight your top-rated reviews from trusted sources with clean, premium UI.</p>
            </article>
          </div>
        </div>
      </section>

      {/* --- Pricing Section --- */}
      <section id="pricing" className="py-28 bg-gradient-to-b from-white to-gray-50 relative overflow-hidden" aria-labelledby="pricing-heading">
        {/* Background decoration */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-gradient-to-r from-blue-100/30 via-indigo-100/30 to-violet-100/30 rounded-full blur-3xl" aria-hidden="true"></div>

        <div className="max-w-6xl mx-auto px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-600 text-sm font-semibold mb-6">
              <Check size={16} />
              <span>No Hidden Fees</span>
            </div>
            <h2 id="pricing-heading" className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6">Simple, <span className="text-gradient">Transparent</span> Pricing</h2>
            <p className="text-gray-600 text-xl">Start free. Upgrade when you're ready.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Starter Plan */}
            <article className="bg-white p-10 rounded-3xl border border-gray-200 hover:border-gray-300 hover:shadow-xl transition-all card-hover">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Starter</h3>
              <p className="text-gray-500 text-sm mb-6">Very small sites, testing, early-stage blogs/shops</p>
              <div className="mb-6">
                <span className="text-5xl font-extrabold text-gray-900">$0</span>
                <span className="text-gray-500 text-lg">/month</span>
              </div>
              <ul className="space-y-3 mb-8" role="list">
                <li className="flex items-center gap-3 text-base text-gray-700">
                  <Check size={18} className="text-emerald-500 shrink-0" aria-hidden="true" /> <span>1 Website</span>
                </li>
                <li className="flex items-center gap-3 text-base text-gray-700">
                  <Check size={18} className="text-emerald-500 shrink-0" aria-hidden="true" /> <span>1,000 visitors/month</span>
                </li>
                <li className="flex items-center gap-3 text-base text-gray-700">
                  <Check size={18} className="text-emerald-500 shrink-0" aria-hidden="true" /> <span>Basic widget styles</span>
                </li>
                <li className="flex items-center gap-3 text-base text-gray-700">
                  <Check size={18} className="text-emerald-500 shrink-0" aria-hidden="true" /> <span>ProofEdge branding</span>
                </li>
                <li className="flex items-center gap-3 text-base text-gray-700">
                  <Check size={18} className="text-emerald-500 shrink-0" aria-hidden="true" /> <span>Basic support</span>
                </li>
              </ul>
              <button
                onClick={() => onShowSignup()}
                className="w-full py-4 rounded-xl border-2 border-gray-200 text-gray-900 font-semibold text-lg hover:bg-gray-50 hover:border-gray-300 transition-all focus:outline-none focus:ring-4 focus:ring-gray-500/20"
                aria-label="Get started with Starter plan for free"
              >
                Get Started Free
              </button>
            </article>

            {/* Pro Plan */}
            <article className="bg-gray-900 p-10 rounded-3xl border-2 border-gray-700 relative transform md:scale-105 shadow-2xl opacity-75">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold px-5 py-2 rounded-full shadow-lg">COMING SOON</div>
              <h3 className="text-2xl font-bold text-white mb-2 mt-2">Pro</h3>
              <p className="text-gray-400 text-sm mb-5">For growing businesses & active stores</p>

              {/* Price Display */}
              <div className="mb-5">
                <span className="text-5xl font-extrabold text-white">${PRO_TIERS[selectedProTier].price}</span>
                <span className="text-gray-400 text-lg">/month</span>
              </div>

              {/* Visitor Tier Selector */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-400 text-sm font-medium">Monthly visitors</span>
                  <span className="text-blue-400 text-sm font-semibold">{PRO_TIERS[selectedProTier].visitors}</span>
                </div>
                <div className="grid grid-cols-5 gap-1 p-1 bg-gray-800/50 rounded-xl">
                  {PRO_TIERS.map((tier, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedProTier(index)}
                      className={`py-2 px-1 rounded-lg text-xs font-semibold transition-all ${selectedProTier === index
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                        : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                        }`}
                    >
                      {tier.visitors.replace(',000', 'k')}
                    </button>
                  ))}
                </div>
              </div>
              <ul className="space-y-3 mb-8" role="list">
                <li className="flex items-center gap-3 text-base text-gray-200">
                  <Check size={18} className="text-emerald-400 shrink-0" aria-hidden="true" /> <span>3 Websites</span>
                </li>
                <li className="flex items-center gap-3 text-base text-gray-200">
                  <Check size={18} className="text-emerald-400 shrink-0" aria-hidden="true" /> <span>{PRO_TIERS[selectedProTier].visitors} visitors/month</span>
                </li>
                <li className="flex items-center gap-3 text-base text-gray-200">
                  <Check size={18} className="text-emerald-400 shrink-0" aria-hidden="true" /> <span>All widget styles</span>
                </li>
                <li className="flex items-center gap-3 text-base text-gray-200">
                  <Check size={18} className="text-emerald-400 shrink-0" aria-hidden="true" /> <span>Remove branding</span>
                </li>
                <li className="flex items-center gap-3 text-base text-gray-200">
                  <Check size={18} className="text-emerald-400 shrink-0" aria-hidden="true" /> <span>Priority support</span>
                </li>
              </ul>
              <button
                disabled
                className="w-full py-4 rounded-xl bg-gray-700 text-gray-400 font-semibold text-lg cursor-not-allowed"
                aria-label="Pro plan coming soon"
              >
                Coming Soon
              </button>
            </article>

            {/* Growth Plan */}
            <article className="bg-white p-10 rounded-3xl border border-gray-200 relative opacity-75">
              <div className="absolute -top-3 right-6 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">COMING SOON</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Growth</h3>
              <p className="text-gray-500 text-sm mb-5">For high-traffic sites & scaling businesses</p>

              {/* Price Display */}
              <div className="mb-5">
                <span className="text-5xl font-extrabold text-gray-900">${GROWTH_TIERS[selectedGrowthTier].price}</span>
                <span className="text-gray-500 text-lg">/month</span>
              </div>

              {/* Visitor Tier Selector */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-500 text-sm font-medium">Monthly visitors</span>
                  <span className="text-violet-600 text-sm font-semibold">{GROWTH_TIERS[selectedGrowthTier].visitors}</span>
                </div>
                <div className="grid grid-cols-5 gap-1 p-1 bg-gray-100 rounded-xl">
                  {GROWTH_TIERS.map((tier, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedGrowthTier(index)}
                      className={`py-2 px-1 rounded-lg text-xs font-semibold transition-all ${selectedGrowthTier === index
                        ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg'
                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200'
                        }`}
                    >
                      {tier.visitors.replace(',000', 'k').replace('1,000k', '1M')}
                    </button>
                  ))}
                </div>
              </div>
              <ul className="space-y-3 mb-8" role="list">
                <li className="flex items-center gap-3 text-base text-gray-700">
                  <Check size={18} className="text-emerald-500 shrink-0" aria-hidden="true" /> <span>Unlimited Websites</span>
                </li>
                <li className="flex items-center gap-3 text-base text-gray-700">
                  <Check size={18} className="text-emerald-500 shrink-0" aria-hidden="true" /> <span>{GROWTH_TIERS[selectedGrowthTier].visitors} visitors/month</span>
                </li>
                <li className="flex items-center gap-3 text-base text-gray-700">
                  <Check size={18} className="text-emerald-500 shrink-0" aria-hidden="true" /> <span>All widget styles</span>
                </li>
                <li className="flex items-center gap-3 text-base text-gray-700">
                  <Check size={18} className="text-emerald-500 shrink-0" aria-hidden="true" /> <span>Remove branding</span>
                </li>
                <li className="flex items-center gap-3 text-base text-gray-700">
                  <Check size={18} className="text-emerald-500 shrink-0" aria-hidden="true" /> <span>Dedicated support</span>
                </li>
                <li className="flex items-center gap-3 text-base text-gray-700">
                  <Check size={18} className="text-emerald-500 shrink-0" aria-hidden="true" /> <span>SLA guarantee</span>
                </li>
              </ul>
              <button
                disabled
                className="w-full py-4 rounded-xl bg-gray-200 text-gray-500 font-semibold text-lg cursor-not-allowed"
                aria-label="Growth plan coming soon"
              >
                Coming Soon
              </button>
            </article>
          </div>
        </div>
      </section>

      {/* --- CTA Section --- */}
      <section className="py-28 bg-gray-950 relative overflow-hidden" aria-labelledby="cta-heading">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:24px_24px]" aria-hidden="true"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px]" aria-hidden="true"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-[120px]" aria-hidden="true"></div>

        <div className="max-w-5xl mx-auto px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white/80 text-sm font-semibold mb-8 border border-white/10">
              <Sparkles size={16} className="text-amber-400" />
              <span>Join 2,000+ brands using ProofEdge</span>
            </div>
            <h2 id="cta-heading" className="text-4xl md:text-6xl font-extrabold text-white mb-8 leading-tight">Ready to Build Trust<br /><span className="text-gradient">the Right Way?</span></h2>
            <p className="text-gray-400 text-xl mb-12 max-w-2xl mx-auto leading-relaxed">
              Install ProofEdge in 2 minutes. No coding required. Start showing real proof — the kind that your buyers actually trust.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-5">
              <button
                onClick={() => onShowSignup()}
                className="bg-white text-gray-900 px-10 py-5 rounded-2xl font-bold hover:bg-gray-100 transition-all shadow-2xl shadow-white/20 text-lg flex items-center justify-center gap-3 focus:outline-none focus:ring-4 focus:ring-white/30 shine-effect"
                aria-label="Create your ProofEdge account"
              >
                Start Free Trial
                <ArrowRight size={22} aria-hidden="true" />
              </button>
              <button
                onClick={onShowLogin}
                className="bg-transparent border-2 border-white/20 text-white px-10 py-5 rounded-2xl font-semibold hover:bg-white/10 hover:border-white/30 transition-all text-lg focus:outline-none focus:ring-4 focus:ring-white/20"
                aria-label="Log in to your account"
              >
                Log in
              </button>
            </div>
            <p className="mt-12 text-gray-500 text-base flex items-center justify-center gap-2">
              <Check size={16} className="text-emerald-400" />
              No credit card required
              <span className="mx-2">•</span>
              <Check size={16} className="text-emerald-400" />
              Setup in 2 minutes
            </p>
          </div>
        </div>
      </section>

      {/* --- Footer --- */}
      <footer className="bg-gray-950 py-12 border-t border-white/10" role="contentinfo">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            {/* Logo & Copyright */}
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="text-blue-500 w-8 h-8" aria-hidden="true"><Logo className="w-8 h-8" /></div>
                <span className="font-bold text-xl text-white">ProofEdge</span>
              </div>
              <p className="text-gray-500 text-base">© 2025 ProofEdge. All rights reserved.</p>
            </div>

            {/* Essential Links */}
            <nav className="flex items-center gap-6 sm:gap-8 text-sm sm:text-base" aria-label="Footer navigation">
              <a href="#pricing" className="text-gray-400 hover:text-white transition-colors font-medium">Pricing</a>
              <a href="mailto:support@proofedge.io" className="text-gray-400 hover:text-white transition-colors font-medium">Contact</a>
              <button onClick={onShowPrivacy} className="text-gray-400 hover:text-white transition-colors font-medium">Privacy</button>
              <button onClick={onShowTerms} className="text-gray-400 hover:text-white transition-colors font-medium">Terms</button>
              <button onClick={onShowRefund} className="text-gray-400 hover:text-white transition-colors font-medium">Refund Policy</button>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
