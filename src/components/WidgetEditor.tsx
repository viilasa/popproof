import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Save, Eye, EyeOff, Loader2 } from 'lucide-react';

interface WidgetEditorProps {
  widgetId: string;
  onBack?: () => void;
}

interface Widget {
  id: string;
  name: string;
  type: string; // This is a database enum with values like 'recent_purchase'
  config: {
    template_id: string;
    original_type?: string; // The original template ID
    title: string;
    description: string;
    preview: any;
    color: string;
    bgColor: string;
    site_id?: string; // Site ID is stored in config
  };
  is_active: boolean;
  user_id: string;
  created_at: string;
}

export function WidgetEditor({ widgetId, onBack }: WidgetEditorProps) {
  const [widget, setWidget] = useState<Widget | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    content: '',
    isActive: true
  });

  useEffect(() => {
    fetchWidget();
  }, [widgetId]);

  const fetchWidget = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('widgets')
        .select('*')
        .eq('id', widgetId)
        .single();
        
      if (error) throw error;
      
      if (data) {
        setWidget(data);
        setFormData({
          name: data.name || '',
          title: data.config?.preview?.title || '',
          content: data.config?.preview?.content || '',
          isActive: data.is_active
        });
      }
    } catch (error) {
      console.error('Error fetching widget:', error);
      setError('Failed to load widget data');
    } finally {
      setLoading(false);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleToggleActive = () => {
    setFormData(prev => ({
      ...prev,
      isActive: !prev.isActive
    }));
  };
  
  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      if (!widget) throw new Error('Widget not found');
      
      // Create updated widget config
      const updatedConfig = {
        ...widget.config,
        preview: {
          ...widget.config.preview,
          title: formData.title,
          content: formData.content
        }
      };
      
      const { error } = await supabase
        .from('widgets')
        .update({
          name: formData.name,
          config: updatedConfig,
          is_active: formData.isActive
        })
        .eq('id', widgetId);
        
      if (error) throw error;
      
      setSuccess('Widget saved successfully');
      // Refresh widget data
      fetchWidget();
    } catch (error) {
      console.error('Error saving widget:', error);
      setError('Failed to save widget changes');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="mt-2 text-gray-600">Loading widget...</p>
        </div>
      </div>
    );
  }

  if (!widget) {
    return (
      <div className="flex-1 bg-gray-50 p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Widget not found or you don't have permission to edit it.</p>
          {onBack && (
            <button 
              onClick={onBack}
              className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Go Back
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {onBack && (
              <button 
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
            )}
            <h1 className="text-xl font-semibold text-gray-900">Edit Widget</h1>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Status:</span>
              <button
                onClick={handleToggleActive}
                className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1 ${
                  formData.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {formData.isActive ? (
                  <>
                    <Eye className="w-3 h-3" />
                    <span>Active</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="w-3 h-3" />
                    <span>Inactive</span>
                  </>
                )}
              </button>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-6">
        {/* Alerts */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800">{success}</p>
          </div>
        )}

        {/* Widget Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Widget Settings</h2>
            
            <div className="space-y-6">
              {/* Widget Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Widget Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter widget name"
                />
                <p className="mt-1 text-xs text-gray-500">
                  This name is for your reference only and won't be displayed to visitors.
                </p>
              </div>
              
              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter notification title"
                />
              </div>
              
              {/* Content */}
              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                  Content
                </label>
                <textarea
                  id="content"
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter notification content"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Preview</h2>
            
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-start space-x-3">
                <div className={`w-8 h-8 rounded-full ${widget.config?.bgColor || 'bg-blue-50'} flex items-center justify-center flex-shrink-0`}>
                  <div className={`w-4 h-4 ${widget.config?.color || 'text-blue-600'}`}>
                    {/* Icon placeholder */}
                    ✓
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm">
                    <span className={`font-medium ${widget.config?.color || 'text-blue-600'}`}>
                      {formData.title}
                    </span>
                    <span className="text-gray-700 ml-1">
                      {formData.content}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 mt-2">
                    <div className="flex items-center space-x-1">
                      <span className="text-xs text-gray-500">
                        {widget.config?.preview?.timestamp || 'Just now'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
