import { useState, useEffect, useMemo } from 'react';
import { Eye, EyeOff, AlertCircle, CheckCircle, Loader2, Check, ArrowRight, ShoppingBag, Users } from 'lucide-react';
import { useAuth } from './AuthProvider';

// Widget notification data for the phone mockup - defined outside component to prevent re-creation
const DEMO_WIDGETS = [
  { 
    type: 'social', 
    icon: Users,
    text: '14 people bought this today',
    subtext: 'High demand',
    color: 'from-blue-500 to-indigo-500'
  },
  { 
    type: 'purchase', 
    icon: ShoppingBag,
    text: 'Sarah from NYC just purchased',
    subtext: 'Premium Sneakers • 2 mins ago',
    color: 'from-emerald-500 to-teal-500'
  },
];

// Password requirements - defined outside to prevent re-creation
const PASSWORD_CHECKS = [
  { label: '8+ chars', test: (p: string) => p.length >= 8 },
  { label: 'Lowercase', test: (p: string) => /[a-z]/.test(p) },
  { label: 'Uppercase', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Number', test: (p: string) => /\d/.test(p) },
  { label: 'Special', test: (p: string) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

interface PasswordStrength {
  score: number;
  feedback: string[];
  isValid: boolean;
}

export function RegisterForm({ onSwitchToLogin }: RegisterFormProps) {
  const { signUp, signInWithGoogle } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [activeWidget, setActiveWidget] = useState(0);
  const [widgetVisible, setWidgetVisible] = useState(false);
  
  // Widget animation loop - optimized with single interval
  useEffect(() => {
    const showTimer = setTimeout(() => setWidgetVisible(true), 500);
    
    const interval = setInterval(() => {
      setWidgetVisible(false);
      setTimeout(() => {
        setActiveWidget(prev => (prev + 1) % DEMO_WIDGETS.length);
        setWidgetVisible(true);
      }, 400);
    }, 3500);
    
    return () => {
      clearTimeout(showTimer);
      clearInterval(interval);
    };
  }, []);

  // Memoized password validation
  const passwordStrength = useMemo((): PasswordStrength => {
    const score = PASSWORD_CHECKS.filter(check => check.test(formData.password)).length;
    return {
      score,
      feedback: PASSWORD_CHECKS.filter(check => !check.test(formData.password)).map(c => c.label),
      isValid: score >= 4,
    };
  }, [formData.password]);

  // Memoized strength indicators
  const strengthColor = useMemo(() => {
    if (passwordStrength.score <= 2) return 'bg-red-500';
    if (passwordStrength.score <= 3) return 'bg-amber-500';
    return 'bg-emerald-500';
  }, [passwordStrength.score]);

  const strengthText = useMemo(() => {
    if (passwordStrength.score <= 2) return 'Weak';
    if (passwordStrength.score <= 3) return 'Fair';
    return 'Strong';
  }, [passwordStrength.score]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.acceptTerms) {
      setError('Please accept the terms and conditions to continue.');
      return;
    }

    if (!passwordStrength.isValid) {
      setError('Please ensure your password meets all requirements.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const { error } = await signUp(formData.email, formData.password, {
        first_name: formData.firstName,
        last_name: formData.lastName,
        full_name: `${formData.firstName} ${formData.lastName}`.trim(),
      });

      if (error) {
        switch (error.message) {
          case 'User already registered':
            setError('An account with this email already exists. Please sign in instead.');
            break;
          case 'Password should be at least 6 characters':
            setError('Password must be at least 6 characters long.');
            break;
          default:
            setError(error.message || 'An error occurred during registration. Please try again.');
        }
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (error) setError(null);
  };

  const handleGoogleSignUp = async () => {
    setError(null);
    setGoogleLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      setError(error.message || 'Failed to sign up with Google');
      setGoogleLoading(false);
    }
  };

  const currentWidget = DEMO_WIDGETS[activeWidget];
  const WidgetIcon = currentWidget.icon;

  if (success) {
    return (
      <div className="w-full max-w-6xl mx-auto px-4">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-blue-500/10 p-8 border border-white/20 text-center max-w-md mx-auto">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/30">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Check your email</h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            We've sent a confirmation link to <span className="font-semibold text-gray-900">{formData.email}</span>. 
            Click the link to activate your account.
          </p>
          <button
            onClick={onSwitchToLogin}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 px-6 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
          >
            Back to Sign In
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4">
      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
        
        {/* Left Side - Value Proposition + Phone Mockup */}
        <div className="hidden lg:flex items-center gap-10 xl:gap-12">
          {/* Text Content */}
          <div className="flex-1 min-w-0">
            <h1 className="text-4xl xl:text-5xl font-extrabold text-gray-900 leading-[1.15] mb-5">
              Real Activity.<br />
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Real Results.</span>
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed">
              Display live customer activity on your site — purchases, signups, and reviews. 
              Build instant credibility and watch your conversions grow.
            </p>
          </div>
          
          {/* Phone Mockup */}
          <div className="relative shrink-0">
            {/* Phone outer frame */}
            <div className="w-[240px] h-[480px] bg-gray-900 rounded-[2.5rem] p-2.5 shadow-2xl shadow-gray-900/40 relative">
              {/* Phone notch */}
              <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-20 h-5 bg-gray-900 rounded-b-xl z-20" />
              
              {/* Phone screen */}
              <div className="w-full h-full bg-white rounded-[2rem] overflow-hidden relative">
                {/* Status bar */}
                <div className="h-7 bg-gray-50 flex items-center justify-between px-5 text-[10px] text-gray-500">
                  <span className="font-medium">9:41</span>
                  <div className="w-4 h-2 border border-gray-400 rounded-sm">
                    <div className="w-3/4 h-full bg-gray-400 rounded-sm" />
                  </div>
                </div>
                
                {/* E-commerce site mockup */}
                <div className="p-3 space-y-3">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="w-16 h-4 bg-gray-200 rounded" />
                    <div className="flex gap-1.5">
                      <div className="w-4 h-4 bg-gray-100 rounded" />
                      <div className="w-4 h-4 bg-gray-100 rounded" />
                    </div>
                  </div>
                  
                  {/* Product image */}
                  <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-50 rounded-xl flex items-center justify-center">
                    <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-blue-50 rounded-lg flex items-center justify-center">
                      <ShoppingBag className="w-10 h-10 text-indigo-300" />
                    </div>
                  </div>
                  
                  {/* Product info */}
                  <div className="space-y-1.5">
                    <div className="w-3/4 h-3 bg-gray-200 rounded" />
                    <div className="w-1/2 h-2.5 bg-gray-100 rounded" />
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-14 h-5 bg-indigo-500 rounded-md" />
                      <div className="w-10 h-3 bg-gray-100 rounded line-through" />
                    </div>
                  </div>
                  
                  {/* Add to cart button */}
                  <div className="w-full h-10 bg-gray-900 rounded-lg mt-2" />
                </div>
                
                {/* Animated Widget Notification */}
                <div 
                  className={`absolute bottom-4 left-2.5 right-2.5 transition-all duration-500 ease-out ${
                    widgetVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                  }`}
                >
                  <div className="bg-white rounded-xl p-2.5 shadow-xl border border-gray-100 flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${currentWidget.color} flex items-center justify-center text-white shadow-md shrink-0`}>
                      <WidgetIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-900 leading-tight">{currentWidget.text}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">{currentWidget.subtext}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Floating elements - only 2 */}
            <div className="absolute -top-3 -right-4 bg-white rounded-lg p-2.5 shadow-lg border border-gray-100 animate-bounce" style={{ animationDuration: '3s' }}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-md bg-emerald-100 flex items-center justify-center">
                  <Check className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">+23%</p>
                  <p className="text-[10px] text-gray-500">Conversions</p>
                </div>
              </div>
            </div>
            
            <div className="absolute -bottom-3 -left-4 bg-white rounded-lg p-2 shadow-lg border border-gray-100 animate-pulse">
              <div className="flex items-center gap-1.5">
                <div className="flex -space-x-1">
                  {[1,2].map(i => (
                    <div key={i} className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 border-2 border-white" />
                  ))}
                </div>
                <p className="text-[10px] text-gray-600 font-medium">2.4k+ users</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Side - Registration Form */}
        <div className="w-full max-w-md mx-auto lg:mx-0 lg:ml-auto">
          {/* Mobile Header - Only visible on mobile */}
          <div className="lg:hidden text-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight mb-3">
              Real Activity. <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Real Results.</span>
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Display live customer activity and build instant credibility.
            </p>
          </div>
          
          <div className="bg-white rounded-2xl shadow-xl p-5 sm:p-8 border border-gray-100">
            {/* Header */}
            <div className="text-center mb-5 sm:mb-6">
              <img 
                src="https://res.cloudinary.com/ddhhlkyut/image/upload/v1765406050/Proofedge6_dxarbe.svg" 
                alt="ProofEdge Logo" 
                className="w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-3 sm:mb-4 object-contain"
              />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Create your account</h2>
              <p className="text-gray-500 text-sm">Start your social proof journey today</p>
            </div>

            {/* Google Sign Up Button */}
            <button
              onClick={handleGoogleSignUp}
              disabled={loading || googleLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 mb-5 group"
            >
              {googleLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              <span className="font-semibold text-gray-700 group-hover:text-gray-900 text-sm">
                {googleLoading ? 'Connecting...' : 'Continue with Google'}
              </span>
            </button>

            {/* Divider */}
            <div className="relative mb-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-100"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-4 bg-white text-xs text-gray-400 font-medium">or sign up with email</span>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-5 p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="firstName" className="block text-xs font-semibold text-gray-700 mb-1">First name</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all text-gray-900 placeholder-gray-400"
                    placeholder="John"
                    required
                    disabled={loading}
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-xs font-semibold text-gray-700 mb-1">Last name</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all text-gray-900 placeholder-gray-400"
                    placeholder="Doe"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-gray-700 mb-1">Email address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all text-gray-900 placeholder-gray-400"
                  placeholder="john@example.com"
                  required
                  disabled={loading}
                />
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-xs font-semibold text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 pr-10 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all text-gray-900 placeholder-gray-400"
                    placeholder="Create a strong password"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                
                {/* Password Strength Indicator */}
                {formData.password && (
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${strengthColor}`}
                          style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                        />
                      </div>
                      <span className={`text-[10px] font-semibold ${
                        passwordStrength.score <= 2 ? 'text-red-500' :
                        passwordStrength.score <= 3 ? 'text-amber-500' : 'text-emerald-500'
                      }`}>
                        {strengthText}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {PASSWORD_CHECKS.map((check) => {
                        const passed = check.test(formData.password);
                        return (
                          <span
                            key={check.label}
                            className={`inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded transition-colors ${
                              passed ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            {passed && <Check className="w-2.5 h-2.5" />}
                            {check.label}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div>
                <label htmlFor="confirmPassword" className="block text-xs font-semibold text-gray-700 mb-1">Confirm password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2.5 pr-10 bg-gray-50 border rounded-lg text-sm focus:ring-2 transition-all text-gray-900 placeholder-gray-400 ${
                      formData.confirmPassword && formData.password !== formData.confirmPassword
                        ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                        : 'border-gray-200 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white'
                    }`}
                    placeholder="Confirm your password"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    disabled={loading}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Passwords do not match
                  </p>
                )}
                {formData.confirmPassword && formData.password === formData.confirmPassword && formData.confirmPassword.length > 0 && (
                  <p className="mt-1 text-xs text-emerald-500 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Passwords match
                  </p>
                )}
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start gap-2">
                <div 
                  onClick={() => setFormData(prev => ({ ...prev, acceptTerms: !prev.acceptTerms }))}
                  className={`w-4 h-4 mt-0.5 rounded border-2 cursor-pointer transition-all flex items-center justify-center shrink-0 ${
                    formData.acceptTerms ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {formData.acceptTerms && <Check className="w-3 h-3 text-white" />}
                </div>
                <span className="text-xs text-gray-600 leading-relaxed">
                  I agree to the{' '}
                  <button 
                    type="button"
                    onClick={() => window.open('/terms', '_blank')} 
                    className="text-blue-600 hover:underline"
                  >
                    Terms of Service
                  </button>
                  {' '}and{' '}
                  <button 
                    type="button"
                    onClick={() => window.open('/privacy', '_blank')} 
                    className="text-blue-600 hover:underline"
                  >
                    Privacy Policy
                  </button>
                </span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !passwordStrength.isValid || formData.password !== formData.confirmPassword || !formData.acceptTerms}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 font-semibold text-sm shadow-lg shadow-blue-500/25"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Sign In Link */}
            <p className="mt-5 text-center text-gray-600 text-sm">
              Already have an account?{' '}
              <button
                onClick={onSwitchToLogin}
                className="text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-colors"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}