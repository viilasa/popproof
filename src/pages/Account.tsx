import { useState, useEffect } from 'react';
import { ArrowLeft, User, CreditCard, Bell, Shield, Key, Trash2, LogOut, Eye, EyeOff, X, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Toast } from '../components/Toast';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../components/auth/AuthProvider';
import { Card, Button, Spinner, Badge, Avatar } from '../components/ui';

interface UserSettings {
  first_name: string;
  last_name: string;
  email: string;
  timezone: string;
  language: string;
  billing_first_name: string;
  billing_last_name: string;
  billing_country: string;
  billing_city: string;
  billing_state: string;
  billing_zip: string;
  billing_address: string;
  billing_company: string;
}

interface AccountProps {
  onNavigate: (section: string) => void;
}

export default function Account({ onNavigate }: AccountProps) {
  const [activeTab, setActiveTab] = useState<'account' | 'billing' | 'password'>('account');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast, success, error, hideToast } = useToast();
  const { updatePassword } = useAuth();
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [settings, setSettings] = useState<UserSettings>({
    first_name: '',
    last_name: '',
    email: '',
    timezone: 'UTC',
    language: 'en',
    billing_first_name: '',
    billing_last_name: '',
    billing_country: '',
    billing_city: '',
    billing_state: '',
    billing_zip: '',
    billing_address: '',
    billing_company: '',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return;
      }

      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSettings({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          email: data.email || user.email || '',
          timezone: data.timezone || 'UTC',
          language: data.language || 'en',
          billing_first_name: data.billing_first_name || '',
          billing_last_name: data.billing_last_name || '',
          billing_country: data.billing_country || '',
          billing_city: data.billing_city || '',
          billing_state: data.billing_state || '',
          billing_zip: data.billing_zip || '',
          billing_address: data.billing_address || '',
          billing_company: data.billing_company || '',
        });
      } else {
        setSettings(prev => ({ ...prev, email: user.email || '' }));
      }
    } catch (err) {
      console.error('Error loading settings:', err);
      error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          ...settings,
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      success('Settings saved successfully');
    } catch (err) {
      console.error('Error saving settings:', err);
      error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      error('New passwords do not match.');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      error('Password must be at least 8 characters long.');
      return;
    }

    // Check for password strength
    const hasUpperCase = /[A-Z]/.test(passwordData.newPassword);
    const hasLowerCase = /[a-z]/.test(passwordData.newPassword);
    const hasNumber = /[0-9]/.test(passwordData.newPassword);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(passwordData.newPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
      error('Password must contain uppercase, lowercase, number, and special character.');
      return;
    }

    setPasswordLoading(true);

    try {
      const { error: updateError } = await updatePassword(passwordData.newPassword);
      
      if (updateError) {
        error(updateError.message || 'Failed to update password.');
      } else {
        success('Password updated successfully!');
        setPasswordData({
          newPassword: '',
          confirmPassword: '',
        });
      }
    } catch (err) {
      error('Failed to update password. Please try again.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-50 flex flex-col items-center justify-center gap-4 lg:rounded-tl-3xl overflow-hidden">
        <Spinner size="lg" />
        <p className="text-sm font-medium text-surface-500">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50 lg:rounded-tl-3xl overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-surface-200 lg:rounded-tl-3xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => onNavigate('notifications')}
                className="p-2 hover:bg-surface-100 rounded-xl transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-surface-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-surface-900">Account Settings</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-12 gap-8">
          {/* Left Sidebar */}
          <div className="col-span-12 lg:col-span-3">
            <Card padding="md">
              {/* Profile Avatar */}
              <div className="text-center mb-6 pb-6 border-b border-surface-100">
                <Avatar 
                  name={settings.first_name || 'User'} 
                  size="xl" 
                  className="mx-auto mb-3"
                />
                <h3 className="font-semibold text-surface-900">
                  {settings.first_name || 'User'}
                </h3>
                <p className="text-sm text-surface-500 mt-1">Last login: {new Date().toLocaleDateString()}</p>
              </div>

              {/* Navigation Menu */}
              <nav className="space-y-1">
                <button
                  onClick={() => setActiveTab('account')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                    activeTab === 'account'
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-surface-600 hover:bg-surface-50 hover:text-surface-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4" />
                    <span>Account</span>
                  </div>
                  {activeTab === 'account' && <ChevronRight className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => setActiveTab('billing')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                    activeTab === 'billing'
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-surface-600 hover:bg-surface-50 hover:text-surface-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-4 h-4" />
                    <span>Billing</span>
                  </div>
                  {activeTab === 'billing' && <ChevronRight className="w-4 h-4" />}
                </button>

                <div className="pt-4 mt-4 border-t border-surface-100">
                  <button
                    onClick={() => setActiveTab('password')}
                    className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                      activeTab === 'password'
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-surface-600 hover:bg-surface-50 hover:text-surface-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Key className="w-4 h-4" />
                      <span>Password</span>
                    </div>
                    {activeTab === 'password' && <ChevronRight className="w-4 h-4" />}
                  </button>

                  {/* <button className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                    <span>Two-factor authentication</span>
                    <Shield className="w-4 h-4" />
                  </button> */}

                  {/* <button className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                    <span>Notifications</span>
                    <Bell className="w-4 h-4" />
                  </button> */}
                </div>

                <div className="pt-4 mt-4 border-t border-surface-100">
                  <button className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium text-danger-600 hover:bg-danger-50 rounded-xl transition-colors">
                    <div className="flex items-center gap-3">
                      <Trash2 className="w-4 h-4" />
                      <span>Delete account</span>
                    </div>
                  </button>
                </div>
              </nav>
            </Card>
          </div>

          {/* Main Content */}
          <div className="col-span-12 lg:col-span-9">
            <Card padding="lg">
              {activeTab === 'account' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Settings</h2>
                  <p className="text-sm text-gray-600 mb-6">Basic profile settings of your account.</p>

                  <div className="space-y-6">
                    {/* Name Fields */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          First Name
                        </label>
                        <input
                          type="text"
                          value={settings.first_name}
                          onChange={(e) => setSettings({ ...settings, first_name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="First Name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Last Name
                        </label>
                        <input
                          type="text"
                          value={settings.last_name}
                          onChange={(e) => setSettings({ ...settings, last_name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Last Name"
                        />
                      </div>
                    </div>

                    {/* Email and Timezone */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email
                        </label>
                        <input
                          type="email"
                          value={settings.email}
                          onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="email@example.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Timezone
                        </label>
                        <select
                          value={settings.timezone}
                          onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="UTC">UTC</option>
                          <option value="America/New_York">America/New York</option>
                          <option value="America/Los_Angeles">America/Los Angeles</option>
                          <option value="Europe/London">Europe/London</option>
                          <option value="Europe/Paris">Europe/Paris</option>
                          <option value="Europe/Istanbul">Europe/Istanbul</option>
                          <option value="Asia/Dubai">Asia/Dubai</option>
                          <option value="Asia/Kolkata">Asia/Kolkata</option>
                          <option value="Asia/Singapore">Asia/Singapore</option>
                          <option value="Asia/Tokyo">Asia/Tokyo</option>
                          <option value="Australia/Sydney">Australia/Sydney</option>
                        </select>
                      </div>
                    </div>

                    {/* Language */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Language
                      </label>
                      <select
                        value={settings.language}
                        onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                        className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="en">English</option>
                        <option value="es">Español</option>
                        <option value="fr">Français</option>
                        <option value="de">Deutsch</option>
                        <option value="it">Italiano</option>
                        <option value="pt">Português</option>
                        <option value="ja">日本語</option>
                        <option value="zh">中文</option>
                      </select>
                    </div>

                    {/* Save Button */}
                    <div className="pt-4">
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                      >
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'password' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Change Password</h2>
                  <p className="text-sm text-gray-600 mb-6">
                    Update your password to keep your account secure.
                  </p>

                  <div className="max-w-2xl">
                    <form onSubmit={handlePasswordChange} className="space-y-6">
                      {/* Password Requirements */}
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm font-medium text-blue-800 mb-2">
                          Password Requirements:
                        </p>
                        <ul className="text-xs text-blue-700 ml-4 list-disc space-y-1">
                          <li>At least 8 characters</li>
                          <li>One uppercase letter</li>
                          <li>One lowercase letter</li>
                          <li>One number</li>
                          <li>One special character (!@#$%^&* etc.)</li>
                        </ul>
                      </div>

                      {/* New Password */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          New Password
                        </label>
                        <div className="relative">
                          <input
                            type={showNewPassword ? 'text' : 'password'}
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter new password"
                            required
                            minLength={8}
                            disabled={passwordLoading}
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            tabIndex={-1}
                          >
                            {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      {/* Confirm Password */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Confirm New Password
                        </label>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Confirm new password"
                            required
                            disabled={passwordLoading}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            tabIndex={-1}
                          >
                            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex space-x-3 pt-4">
                        <button
                          type="submit"
                          disabled={passwordLoading}
                          className="inline-flex items-center space-x-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                        >
                          <Key className="w-4 h-4" />
                          <span>{passwordLoading ? 'Updating...' : 'Update Password'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPasswordData({ newPassword: '', confirmPassword: '' });
                            setShowNewPassword(false);
                            setShowConfirmPassword(false);
                          }}
                          disabled={passwordLoading}
                          className="inline-flex items-center space-x-2 px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                        >
                          <X className="w-4 h-4" />
                          <span>Clear</span>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {activeTab === 'billing' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Billing details</h2>
                  <p className="text-sm text-gray-600 mb-6">
                    These billing details are used when generating invoices after a successful payment.
                  </p>

                  <div className="space-y-6">
                    {/* Name Fields */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          First Name
                        </label>
                        <input
                          type="text"
                          value={settings.billing_first_name}
                          onChange={(e) => setSettings({ ...settings, billing_first_name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="First Name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Last Name
                        </label>
                        <input
                          type="text"
                          value={settings.billing_last_name}
                          onChange={(e) => setSettings({ ...settings, billing_last_name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Last Name"
                        />
                      </div>
                    </div>

                    {/* Company */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company
                      </label>
                      <input
                        type="text"
                        value={settings.billing_company}
                        onChange={(e) => setSettings({ ...settings, billing_company: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Company name (optional)"
                      />
                    </div>

                    {/* Address */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Address
                      </label>
                      <input
                        type="text"
                        value={settings.billing_address}
                        onChange={(e) => setSettings({ ...settings, billing_address: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Street address"
                      />
                    </div>

                    {/* Location Fields */}
                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Country
                        </label>
                        <input
                          type="text"
                          value={settings.billing_country}
                          onChange={(e) => setSettings({ ...settings, billing_country: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Country"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          City
                        </label>
                        <input
                          type="text"
                          value={settings.billing_city}
                          onChange={(e) => setSettings({ ...settings, billing_city: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="City"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          State
                        </label>
                        <input
                          type="text"
                          value={settings.billing_state}
                          onChange={(e) => setSettings({ ...settings, billing_state: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="State"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          ZIP
                        </label>
                        <input
                          type="text"
                          value={settings.billing_zip}
                          onChange={(e) => setSettings({ ...settings, billing_zip: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="ZIP"
                        />
                      </div>
                    </div>

                    {/* Save Button */}
                    <div className="pt-4">
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                      >
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isOpen={toast.isOpen}
        onClose={hideToast}
        duration={3000}
      />
    </div>
  );
}
