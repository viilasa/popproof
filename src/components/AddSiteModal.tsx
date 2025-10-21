import React, { useState } from 'react';
import { X, Globe } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ConfirmationModal } from './ConfirmationModal';

interface AddSiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSiteAdded: () => void;
  onPixelIntegrationRedirect: (site: any) => void;
  userId: string;
}

export function AddSiteModal({ isOpen, onClose, onSiteAdded, onPixelIntegrationRedirect, userId }: AddSiteModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    includeSubdomains: false,
    category: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const categories = [
    'E-commerce',
    'SaaS',
    'Blog',
    'Portfolio',
    'Business',
    'Education',
    'Healthcare',
    'Real Estate',
    'Other'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.domain.trim()) {
      setError('Name and domain are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Generate API key for the new site
      const apiKey = 'sp_' + Array.from(crypto.getRandomValues(new Uint8Array(24)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      // Create site record
      const { data: newSite, error: insertError } = await supabase
        .from('sites')
        .insert({
          user_id: userId,
          name: formData.name,
          public_key: apiKey,
          domain: formData.domain,
          is_active: true
        })
        .select()
        .single();

      if (insertError) throw insertError;

      if (!newSite) {
        throw new Error('Failed to create site and retrieve its data.');
      }

      // Reset form
      setFormData({
        name: '',
        domain: '',
        includeSubdomains: false,
        category: ''
      });

      // Show success message and redirect to pixel integration
      setSuccess('Site created successfully! Redirecting to pixel integration...');
      
      // Wait 2 seconds then redirect to pixel integration
      setTimeout(() => {
        onSiteAdded();
        onClose();
        // Trigger redirect to pixel integration with the new site data
        onPixelIntegrationRedirect(newSite);
      }, 2000);
    } catch (error) {
      console.error('Error creating site:', error);
      setError('Failed to create site. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Create a new site</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <span className="text-blue-500 mr-2">▶</span>
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="My Website"
              required
            />
          </div>

          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <Globe className="w-4 h-4 mr-2 text-gray-500" />
              Domain / Subdomain
            </label>
            <input
              type="text"
              value={formData.domain}
              onChange={(e) => setFormData(prev => ({ ...prev, domain: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="ex: domain.com or subdomain.domain.com"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              The domain name of the website where the site is going to run.
              Notifications will NOT work on other domains other than what you
              define here.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="includeSubdomains"
              checked={formData.includeSubdomains}
              onChange={(e) => setFormData(prev => ({ ...prev, includeSubdomains: e.target.checked }))}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="includeSubdomains" className="text-sm text-gray-700">
              <span className="font-medium">Include Subdomains</span> If you use a platform like
              ClickFunnels, SamCart, etc. you have to open the 'Include
              Subdomains' feature. All the subdomains will match on this
              site as well if checked.
            </label>
          </div>

          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <Globe className="w-4 h-4 mr-2 text-gray-500" />
              Site Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Choose Site Category</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
              {error}
            </div>
          )}

          {success && (
            <div className="text-green-600 text-sm bg-green-50 border border-green-200 rounded-lg p-3 flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
              <span>{success}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || success}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Creating...' : success ? 'Redirecting...' : 'Create'}
          </button>
        </form>
      </div>
    </div>
  );
}