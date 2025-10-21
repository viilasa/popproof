import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Copy, Eye, EyeOff, Trash2, Globe, Calendar, Activity } from 'lucide-react';

interface ApiKey {
  id: string;
  name: string;
  public_key: string;
  domain: string | null;
  is_active: boolean;
  usage_count: number;
  last_used: string | null;
  created_at: string;
}

interface ApiKeyManagerProps {
  userId: string;
}

export function ApiKeyManager({ userId }: ApiKeyManagerProps) {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyDomain, setNewKeyDomain] = useState('');
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchApiKeys();
  }, [userId]);

  const fetchApiKeys = async () => {
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApiKeys(data || []);
    } catch (error) {
      console.error('Error fetching API keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateApiKey = () => {
    return 'sp_' + Array.from(crypto.getRandomValues(new Uint8Array(24)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  };

  const createApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    try {
      const publicKey = generateApiKey();
      
      const { error } = await supabase
        .from('api_keys')
        .insert([{
          user_id: userId,
          name: newKeyName.trim(),
          public_key: publicKey,
          domain: newKeyDomain.trim() || null,
        }]);

      if (error) throw error;

      setNewKeyName('');
      setNewKeyDomain('');
      setShowCreateForm(false);
      fetchApiKeys();
    } catch (error) {
      console.error('Error creating API key:', error);
    }
  };

  const deleteApiKey = async (id: string) => {
    if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchApiKeys();
    } catch (error) {
      console.error('Error deleting API key:', error);
    }
  };

  const toggleKeyVisibility = (keyId: string) => {
    const newVisible = new Set(visibleKeys);
    if (newVisible.has(keyId)) {
      newVisible.delete(keyId);
    } else {
      newVisible.add(keyId);
    }
    setVisibleKeys(newVisible);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">API Keys</h2>
          <p className="text-gray-600 mt-1">Manage your API keys for widget integration</p>
        </div>
        
        <button
          onClick={() => setShowCreateForm(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create API Key
        </button>
      </div>

      {showCreateForm && (
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Create New API Key</h3>
          <form onSubmit={createApiKey} className="space-y-4">
            <div>
              <label htmlFor="keyName" className="block text-sm font-medium text-gray-700 mb-2">
                Key Name *
              </label>
              <input
                type="text"
                id="keyName"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="e.g., Production Website"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div>
              <label htmlFor="keyDomain" className="block text-sm font-medium text-gray-700 mb-2">
                Domain (optional)
              </label>
              <input
                type="text"
                id="keyDomain"
                value={newKeyDomain}
                onChange={(e) => setNewKeyDomain(e.target.value)}
                placeholder="e.g., example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-sm text-gray-500 mt-1">
                Restrict this key to a specific domain for added security
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Key
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {apiKeys.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No API Keys</h3>
          <p className="text-gray-600 mb-4">Create your first API key to start using the widget</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create API Key
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {apiKeys.map((apiKey) => (
            <div key={apiKey.id} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <h3 className="text-lg font-medium text-gray-900">{apiKey.name}</h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      apiKey.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {apiKey.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-700">API Key:</span>
                      <div className="flex items-center space-x-2">
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                          {visibleKeys.has(apiKey.id) 
                            ? apiKey.public_key 
                            : apiKey.public_key.substring(0, 8) + '••••••••••••••••••••••••••••••••••••••••••••'
                          }
                        </code>
                        <button
                          onClick={() => toggleKeyVisibility(apiKey.id)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          {visibleKeys.has(apiKey.id) ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => copyToClipboard(apiKey.public_key)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-6 text-sm text-gray-600">
                      {apiKey.domain && (
                        <div className="flex items-center space-x-1">
                          <Globe className="w-4 h-4" />
                          <span>{apiKey.domain}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-1">
                        <Activity className="w-4 h-4" />
                        <span>{apiKey.usage_count} requests</span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>Created {formatDate(apiKey.created_at)}</span>
                      </div>
                      
                      {apiKey.last_used && (
                        <div className="flex items-center space-x-1">
                          <span>Last used {formatDate(apiKey.last_used)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => deleteApiKey(apiKey.id)}
                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}