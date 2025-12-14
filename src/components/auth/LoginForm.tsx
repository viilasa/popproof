import { useState, useEffect } from 'react';
import { Eye, EyeOff, AlertCircle, Loader2, ArrowRight, Check } from 'lucide-react';
import { useAuth } from './AuthProvider';

interface LoginFormProps {
  onSwitchToRegister: () => void;
  onSwitchToForgotPassword: () => void;
}

export function LoginForm({ onSwitchToRegister, onSwitchToForgotPassword }: LoginFormProps) {
  const { signIn, signInWithGoogle } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attemptCount, setAttemptCount] = useState(0);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Load saved email on mount if "Remember me" was checked previously
  useEffect(() => {
    const savedEmail = localStorage.getItem('proofedge_remember_email');
    if (savedEmail) {
      setFormData(prev => ({ ...prev, email: savedEmail }));
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Rate limiting - max 5 attempts per 15 minutes
    if (attemptCount >= 5) {
      setIsRateLimited(true);
      setError('Too many login attempts. Please wait 15 minutes before trying again.');
      setTimeout(() => {
        setIsRateLimited(false);
        setAttemptCount(0);
      }, 15 * 60 * 1000);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await signIn(formData.email, formData.password);
      
      if (error) {
        setAttemptCount(prev => prev + 1);
        
        switch (error.message) {
          case 'Invalid login credentials':
            setError('Invalid email or password. Please check your credentials and try again.');
            break;
          case 'Email not confirmed':
            setError('Please check your email and click the confirmation link before signing in.');
            break;
          case 'Too many requests':
            setError('Too many login attempts. Please wait a moment before trying again.');
            break;
          default:
            setError(error.message || 'An error occurred during login. Please try again.');
        }
      } else {
        if (rememberMe) {
          localStorage.setItem('proofedge_remember_email', formData.email);
        } else {
          localStorage.removeItem('proofedge_remember_email');
        }
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      setError(error.message || 'Failed to sign in with Google');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-4">
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-blue-500/10 p-8 border border-white/20">
        {/* Header */}
        <div className="text-center mb-8">
          <img 
            src="https://res.cloudinary.com/ddhhlkyut/image/upload/v1765406050/Proofedge6_dxarbe.svg" 
            alt="ProofEdge Logo" 
            className="w-14 h-14 mx-auto mb-4 object-contain"
          />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome back</h2>
          <p className="text-gray-500">Sign in to your account to continue</p>
        </div>

        {/* Google Sign In Button - Primary */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading || googleLoading || isRateLimited}
          className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-white border-2 border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 mb-6 group"
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
          <span className="font-semibold text-gray-700 group-hover:text-gray-900">
            {googleLoading ? 'Connecting...' : 'Continue with Google'}
          </span>
        </button>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="px-4 bg-white text-sm text-gray-400 font-medium">or sign in with email</span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5">
              Email address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all duration-200 text-gray-900 placeholder-gray-400"
              placeholder="john@example.com"
              required
              disabled={loading || isRateLimited}
            />
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all duration-200 text-gray-900 placeholder-gray-400"
                placeholder="Enter your password"
                required
                disabled={loading || isRateLimited}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                disabled={loading || isRateLimited}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="relative flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="peer sr-only"
                />
                <div 
                  onClick={() => setRememberMe(!rememberMe)}
                  className={`w-5 h-5 rounded-md border-2 cursor-pointer transition-all duration-200 flex items-center justify-center ${
                    rememberMe 
                      ? 'bg-blue-600 border-blue-600' 
                      : 'bg-white border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {rememberMe && <Check className="w-3.5 h-3.5 text-white" />}
                </div>
              </div>
              <label htmlFor="remember-me" className="text-sm text-gray-600 cursor-pointer select-none">
                Remember me
              </label>
            </div>
            <button
              type="button"
              onClick={onSwitchToForgotPassword}
              className="text-sm text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-colors"
            >
              Forgot password?
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || isRateLimited}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 px-6 rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-blue-600 disabled:hover:to-indigo-600 transition-all duration-200 flex items-center justify-center gap-2 font-semibold shadow-lg shadow-blue-500/25"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Sign Up Link */}
        <p className="mt-6 text-center text-gray-600">
          Don't have an account?{' '}
          <button
            onClick={onSwitchToRegister}
            className="text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-colors"
          >
            Sign up
          </button>
        </p>

        {/* Rate Limit Warning */}
        {attemptCount > 0 && attemptCount < 5 && (
          <div className="mt-4 text-center">
            <p className="text-sm text-amber-600 bg-amber-50 py-2 px-4 rounded-lg inline-block">
              {5 - attemptCount} attempts remaining
            </p>
          </div>
        )}
      </div>
    </div>
  );
}