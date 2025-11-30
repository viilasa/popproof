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
  MessageSquare
} from 'lucide-react';

interface LandingPageProps {
  onShowLogin: () => void;
  onShowSignup: () => void;
}

// Custom Logo based on "Edge Checkmark" concept
const Logo = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M8 20L16 28L32 8" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16 28L16 34" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
  </svg>
);


// Mock Data for Dynamic Widgets
const RECENT_ACTIVITY = [
  { type: 'purchase', text: 'Alex from Austin purchased Premium Plan', time: '2 mins ago' },
  { type: 'visitor', text: '47 people are viewing this page right now', time: 'Live' },
  { type: 'review', text: '"Increased our conversions by 12%!" - Sarah J.', stars: 5 }
];

export default function LandingPage({ onShowLogin, onShowSignup }: LandingPageProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeWidgetIndex, setActiveWidgetIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

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
      document.head.removeChild(script);
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
      {/* Load Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
        
        .font-sans { font-family: 'Inter', sans-serif; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        
        .glass-nav {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(0,0,0,0.05);
        }

        .widget-shadow {
          box-shadow: 0 3px 12px rgba(0,0,0,0.08);
        }

        .fade-enter {
          opacity: 0;
          transform: translateY(10px);
        }
        .fade-enter-active {
          opacity: 1;
          transform: translateY(0);
          transition: opacity 400ms, transform 400ms;
        }
        .fade-exit {
          opacity: 1;
          transform: translateY(0);
        }
        .fade-exit-active {
          opacity: 0;
          transform: translateY(-10px);
          transition: opacity 400ms, transform 400ms;
        }

        /* Shine effect for AI button */
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
          background: linear-gradient(to bottom right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0) 100%);
          transform: rotate(45deg);
          animation: shine 3s infinite;
        }
        @keyframes shine {
          0% { transform: translateX(-100%) rotate(45deg); }
          100% { transform: translateX(100%) rotate(45deg); }
        }
      `}</style>

      {/* --- Navigation --- */}
      <nav className="fixed top-0 w-full z-50 glass-nav">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Logo Area */}
          <div className="flex items-center gap-3 cursor-pointer group">
            <div className="text-[#3E8BFF] group-hover:scale-105 transition-transform duration-300">
              <Logo />
            </div>
            <span className="font-semibold text-xl tracking-tight text-black">ProofEdge</span>
          </div>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-slate-600 hover:text-black transition-colors">Why ProofEdge</a>
            <a href="#results" className="text-sm font-medium text-slate-600 hover:text-black transition-colors">Results</a>
            <a href="#demo" className="text-sm font-medium text-slate-600 hover:text-black transition-colors">Demo</a>
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <button 
              onClick={onShowLogin}
              className="text-sm font-medium text-slate-900 hover:text-[#3E8BFF] transition-colors"
            >
              Log in
            </button>
            <button 
              onClick={onShowSignup}
              className="bg-black text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Get Started
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-slate-900">
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 absolute w-full p-6 flex flex-col gap-4 shadow-xl">
            <a href="#features" className="text-base font-medium text-slate-900">Features</a>
            <a href="#results" className="text-base font-medium text-slate-900">Results</a>
            <button 
              onClick={onShowLogin}
              className="w-full bg-white border border-gray-200 text-slate-900 py-3 rounded-lg font-medium"
            >
              Log in
            </button>
            <button 
              onClick={onShowSignup}
              className="w-full bg-black text-white py-3 rounded-lg font-medium mt-2"
            >
              Get Started
            </button>
          </div>
        )}
      </nav>

      {/* --- Hero Section --- */}
      <section className="pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Content */}
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-xs font-medium text-slate-600 mb-8 animate-fade-in">
              <span className="w-2 h-2 rounded-full bg-[#16E0A5]"></span>
              Not gimmicks. Not fake popups.
            </div>
            <h1 className="text-5xl md:text-7xl font-semibold tracking-tight text-black leading-[1.1] mb-6">
              Social Proof That Feels Real — <br />
              <span className="text-slate-400">Because It Is.</span>
            </h1>
            <p className="text-lg text-slate-600 mb-8 max-w-md leading-relaxed">
              ProofEdge shows real customer activity in real time — with dynamic timestamps, verified signals, and clean minimal UI that builds trust instantly.
            </p>
            
            {/* Bullet Boosters */}
            <div className="mb-8 flex items-center gap-4 text-sm text-slate-500 font-medium">
              <span className="flex items-center gap-1.5"><Check size={16} className="text-[#16E0A5]" /> Just real proof</span>
              <span className="flex items-center gap-1.5"><TrendingUp size={16} className="text-[#3E8BFF]" /> 12% increase reported</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={onShowSignup}
                className="bg-[#3E8BFF] text-white px-8 py-4 rounded-xl font-medium hover:bg-blue-600 transition-all shadow-[0_4px_14px_0_rgba(62,139,255,0.39)] flex items-center justify-center gap-2 group"
              >
                Get Started
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform"/>
              </button>
              <button 
                onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-transparent border border-[#1E1E1E] text-[#1E1E1E] px-8 py-4 rounded-xl font-medium hover:bg-slate-50 transition-all flex items-center justify-center"
              >
                Live Demo
              </button>
            </div>
            
            <div className="mt-10 flex items-center gap-4 text-sm text-slate-500">
               <div className="flex -space-x-2">
                {[1,2,3].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center overflow-hidden">
                    <img src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${i*12}`} alt="avatar" />
                  </div>
                ))}
              </div>
              <p>Trusted by modern brands to elevate credibility.</p>
            </div>
          </div>

          {/* Right Visual: Dynamic Demo */}
          <div className="relative h-[500px] bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center overflow-hidden group">
            {/* Background Grid */}
            <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#CBD5E1 1px, transparent 1px)', backgroundSize: '24px 24px', opacity: 0.3 }}></div>
            
            {/* Abstract UI Elements behind */}
            <div className="absolute top-12 left-12 right-12 h-full bg-white rounded-t-xl shadow-2xl border border-slate-200 opacity-80 transform translate-y-8 scale-95 transition-transform duration-700 group-hover:translate-y-4">
                <div className="h-14 border-b border-slate-100 flex items-center px-6 gap-4">
                    <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-400"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                        <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    </div>
                </div>
                <div className="p-8 space-y-6">
                    <div className="h-8 w-1/3 bg-slate-100 rounded"></div>
                    <div className="h-32 w-full bg-slate-50 rounded border border-slate-100"></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="h-24 bg-slate-100 rounded"></div>
                        <div className="h-24 bg-slate-100 rounded"></div>
                    </div>
                </div>
            </div>

            {/* Floating Dynamic Widget */}
            <div className={`absolute bottom-12 left-1/2 transform -translate-x-1/2 w-80 md:w-96 transition-all duration-500 ease-in-out ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
              <div className="bg-white rounded-xl p-4 flex items-center gap-4 widget-shadow border-l-4 border-[#3E8BFF]">
                {/* Icon Area */}
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0 text-[#3E8BFF]">
                  {currentWidget.type === 'purchase' && <ShoppingBag size={20} />}
                  {currentWidget.type === 'visitor' && <Eye size={20} />}
                  {currentWidget.type === 'review' && <Star size={20} fill="currentColor" />}
                </div>
                
                {/* Text Area */}
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900 leading-snug">
                    {currentWidget.text}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-slate-500">{currentWidget.time}</p>
                    {currentWidget.type === 'purchase' && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-[#16E0A5]/10 text-[#16E0A5] rounded font-semibold">Verified</span>
                    )}
                  </div>
                </div>
                
                {/* Close X */}
                <button className="text-slate-300 hover:text-slate-500"><X size={14}/></button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- Logos --- */}
      <section className="py-10 border-y border-slate-100 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-8">Proven increases without the hype</p>
          <div className="flex flex-wrap justify-center gap-12 md:gap-20 opacity-60 grayscale">
             {['Acme Corp', 'GlobalBank', 'Nebula', 'FocalPoint', 'Vertex'].map((brand) => (
               <span key={brand} className="text-xl font-bold text-slate-800">{brand}</span>
             ))}
          </div>
        </div>
      </section>

      {/* --- Why Fails Section (Features Grid) --- */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl md:text-4xl font-semibold text-black mb-4">Customers Can Spot Fake Proof Instantly.</h2>
            <p className="text-slate-600 text-lg">Traditional widgets break trust with fake popups and random numbers. ProofEdge is designed differently: authentic, verifiable, and clean.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group p-8 rounded-2xl border border-slate-100 bg-white hover:shadow-xl hover:border-slate-200 transition-all duration-300 cursor-default">
              <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform">
                <Check size={24} />
              </div>
              <h3 className="text-xl font-semibold text-black mb-3">Real Events Only</h3>
              <p className="text-slate-600 leading-relaxed">No fabricated notifications. We only display actual data to ensure your credibility never takes a hit.</p>
            </div>

            {/* Feature 2 */}
            <div className="group p-8 rounded-2xl border border-slate-100 bg-white hover:shadow-xl hover:border-slate-200 transition-all duration-300 cursor-default">
              <div className="w-12 h-12 bg-[#3E8BFF] rounded-lg flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform">
                <Clock size={24} />
              </div>
              <h3 className="text-xl font-semibold text-black mb-3">Dynamic Timestamps</h3>
              <p className="text-slate-600 leading-relaxed">"Purchased 5 minutes ago" builds instant trust. Timestamps update live, showing the momentum of your store.</p>
            </div>

            {/* Feature 3 */}
            <div className="group p-8 rounded-2xl border border-slate-100 bg-white hover:shadow-xl hover:border-slate-200 transition-all duration-300 cursor-default">
              <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-slate-800 mb-6 group-hover:scale-110 transition-transform">
                <Layout size={24} />
              </div>
              <h3 className="text-xl font-semibold text-black mb-3">Context-Aware</h3>
              <p className="text-slate-600 leading-relaxed">Optimized for checkout, pricing, and signup pages. Works best where decisions happen.</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- The Results Section (New) --- */}
      <section id="results" className="py-24 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
             <h2 className="text-3xl font-semibold text-black mb-4">Proven Increases Without the Hype.</h2>
             <p className="text-slate-600">ProofEdge doesn't promise magic. But it delivers meaningful, consistent lifts.</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
               <div className="text-[#16E0A5] mb-3"><TrendingUp size={24}/></div>
               <p className="font-medium text-slate-900">"We saw a 12% conversion lift in 3 months."</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
               <div className="text-[#3E8BFF] mb-3"><Clock size={24}/></div>
               <p className="font-medium text-slate-900">"Dynamic timestamps made the biggest difference."</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
               <div className="text-slate-800 mb-3"><Shield size={24}/></div>
               <p className="font-medium text-slate-900">"Small lift but real — credibility matters more than flashy widgets."</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
               <div className="text-slate-800 mb-3"><MessageSquare size={24}/></div>
               <p className="font-medium text-slate-900">"People felt more confident hitting checkout."</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- Modern Alternative / Dev Section --- */}
      <section className="py-24 bg-white overflow-hidden relative">
        
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center relative z-10">
          <div>
            <div className="flex items-center gap-2 text-[#16E0A5] mb-4 font-mono text-sm">
              <Code size={16} />
              <span className="text-slate-600">BUILT FOR MODERN STORES & SAAS</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-semibold mb-6 text-black">
              A Modern Alternative to Old Social Proof Tools.
            </h2>
            <p className="text-slate-600 text-lg mb-8">
              Clean design, smooth animations, instant loading — ProofEdge blends beautifully with your brand.
            </p>
            
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 text-slate-600">
                <div className="w-6 h-6 rounded-full bg-[#3E8BFF]/20 flex items-center justify-center text-[#3E8BFF]"><Zap size={14} /></div>
                <span>Lightning fast (&lt;2kb)</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <div className="w-6 h-6 rounded-full bg-[#3E8BFF]/20 flex items-center justify-center text-[#3E8BFF]"><Shield size={14} /></div>
                <span>Zero fake data & Verified only</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <div className="w-6 h-6 rounded-full bg-[#3E8BFF]/20 flex items-center justify-center text-[#3E8BFF]"><Layout size={14} /></div>
                <span>Minimal, premium UI</span>
              </div>
            </div>
          </div>

          {/* Code Block Mockup */}
          <div className="rounded-xl bg-[#1E1E1E] border border-slate-800 p-4 shadow-2xl font-mono text-sm overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/20"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/20"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/20"></div>
              </div>
              <span className="text-slate-500 text-xs">config.js</span>
            </div>
            <div className="space-y-2 text-slate-300">
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

      {/* --- What Actually Moves Conversions (Was Themes) --- */}
      <section id="demo" className="py-24 bg-slate-50">
        <div className="max-w-5xl mx-auto px-6 text-center">
           <h2 className="text-3xl font-semibold text-black mb-4">What Actually Moves Conversions</h2>
           <p className="text-slate-600 mb-16 max-w-2xl mx-auto">Reddit users, SaaS founders, and marketers all agree: authenticity beats flashiness. ProofEdge focuses on the things that actually move the needle.</p>
           
           <div className="grid md:grid-cols-3 gap-8 text-left">
               {/* Item 1 */}
               <div className="bg-white p-8 rounded-2xl border border-slate-100 flex flex-col items-center">
                   <div className="bg-white rounded-xl p-4 flex items-center gap-4 shadow-sm w-full border border-slate-100 mb-6">
                        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                            <ShoppingBag size={18} />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-black">Purchased Pro Plan</p>
                            <p className="text-[10px] text-slate-500">2 mins ago • Verified</p>
                        </div>
                   </div>
                   <h4 className="font-semibold text-black mb-2">Real-Time Purchase</h4>
                   <p className="text-sm text-slate-500 text-center">Show verified recent purchases with dynamic timestamps for maximum credibility.</p>
               </div>

               {/* Item 2 */}
               <div className="bg-white p-8 rounded-2xl border border-slate-100 flex flex-col items-center">
                   <div className="bg-white rounded-xl p-4 flex items-center gap-4 shadow-sm w-full border border-slate-100 mb-6">
                        <div className="w-10 h-10 rounded-full bg-green-50 text-green-500 flex items-center justify-center shrink-0">
                            <Eye size={18} />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-black">47 people viewing</p>
                            <p className="text-[10px] text-slate-500">Live Count</p>
                        </div>
                   </div>
                   <h4 className="font-semibold text-black mb-2">Live Visitor Count</h4>
                   <p className="text-sm text-slate-500 text-center">"47 people are viewing this page." Real-time reassurance reduces hesitation.</p>
               </div>

               {/* Item 3 */}
               <div className="bg-white p-8 rounded-2xl border border-slate-100 flex flex-col items-center">
                   <div className="bg-white rounded-xl p-4 flex items-center gap-4 shadow-sm w-full border border-slate-100 mb-6">
                        <div className="w-10 h-10 rounded-full bg-yellow-50 text-yellow-500 flex items-center justify-center shrink-0">
                            <Star size={18} fill="currentColor"/>
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-black">"Best tool ever"</p>
                            <p className="text-[10px] text-slate-500">5 stars on G2</p>
                        </div>
                   </div>
                   <h4 className="font-semibold text-black mb-2">Review Highlights</h4>
                   <p className="text-sm text-slate-500 text-center">Highlight your top-rated reviews from trusted sources with clean, premium UI.</p>
               </div>
           </div>
        </div>
      </section>

      {/* --- CTA Section --- */}
      <section className="py-24 bg-white border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-6">
          <div className="bg-black rounded-3xl p-10 md:p-16 text-center relative overflow-hidden">
            {/* Decoration */}
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#3E8BFF] rounded-full blur-3xl opacity-20"></div>
            
            <div className="relative z-10">
                <h2 className="text-3xl md:text-5xl font-semibold text-white mb-6">Ready to Build Trust the Right Way?</h2>
                <p className="text-slate-400 text-lg mb-10 max-w-2xl mx-auto">
                    Install ProofEdge in 2 minutes. No coding required. Start showing real proof — the kind that your buyers actually trust.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <button 
                      onClick={onShowSignup}
                      className="bg-[#3E8BFF] text-white px-8 py-4 rounded-xl font-medium hover:bg-blue-600 transition-all shadow-lg text-lg flex items-center justify-center gap-2"
                    >
                      Create Your Account
                      <ArrowRight size={20} />
                    </button>
                    <button 
                      onClick={onShowLogin}
                      className="bg-transparent border border-slate-700 text-white px-8 py-4 rounded-xl font-medium hover:bg-slate-900 transition-all text-lg"
                    >
                      Log in
                    </button>
                </div>
                <p className="mt-6 text-slate-500 text-sm">Not fake. Not flashy. Just authentic signals.</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- Footer --- */}
      <footer className="bg-white pt-16 pb-8 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                 <div className="text-black w-6 h-6"><Logo className="w-6 h-6"/></div>
                 <span className="font-bold text-lg">ProofEdge</span>
              </div>
              <p className="text-slate-500 text-sm leading-relaxed">
                Honest Marketing Promise: No fake data. Just authentic signals that build confidence.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-black mb-4">Platform</h4>
              <ul className="space-y-3 text-sm text-slate-500">
                <li className="hover:text-[#3E8BFF] cursor-pointer">Live Visitor</li>
                <li className="hover:text-[#3E8BFF] cursor-pointer">Purchase Activity</li>
                <li className="hover:text-[#3E8BFF] cursor-pointer">Integrations</li>
                <li className="hover:text-[#3E8BFF] cursor-pointer">Pricing</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-black mb-4">Company</h4>
              <ul className="space-y-3 text-sm text-slate-500">
                <li className="hover:text-[#3E8BFF] cursor-pointer">About Us</li>
                <li className="hover:text-[#3E8BFF] cursor-pointer">Manifesto</li>
                <li className="hover:text-[#3E8BFF] cursor-pointer">Contact</li>
                <li className="hover:text-[#3E8BFF] cursor-pointer">Privacy</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-black mb-4">Resources</h4>
              <ul className="space-y-3 text-sm text-slate-500">
                <li className="hover:text-[#3E8BFF] cursor-pointer">Documentation</li>
                <li className="hover:text-[#3E8BFF] cursor-pointer">Blog</li>
                <li className="hover:text-[#3E8BFF] cursor-pointer">Case Studies</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-400 text-sm">© 2025 ProofEdge Inc. All rights reserved.</p>
            <div className="flex gap-6">
               <div className="w-5 h-5 bg-slate-200 rounded-full hover:bg-slate-300 cursor-pointer"></div>
               <div className="w-5 h-5 bg-slate-200 rounded-full hover:bg-slate-300 cursor-pointer"></div>
               <div className="w-5 h-5 bg-slate-200 rounded-full hover:bg-slate-300 cursor-pointer"></div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
