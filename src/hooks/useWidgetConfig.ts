import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { WidgetConfig, PartialWidgetConfig } from '../types/widget-config';
import { mergeWithDefaults } from '../lib/widgetConfigDefaults';

interface UseWidgetConfigOptions {
  widgetId: string;
  onSaveSuccess?: () => void;
  onSaveError?: (error: string) => void;
}

interface UseWidgetConfigReturn {
  config: WidgetConfig | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  updateConfig: (updates: PartialWidgetConfig) => void;
  saveConfig: () => Promise<void>;
  resetConfig: () => void;
  isDirty: boolean;
}

export function useWidgetConfig({
  widgetId,
  onSaveSuccess,
  onSaveError,
}: UseWidgetConfigOptions): UseWidgetConfigReturn {
  const [config, setConfig] = useState<WidgetConfig | null>(null);
  const [originalConfig, setOriginalConfig] = useState<WidgetConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Fetch widget configuration
  const fetchConfig = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('widgets')
        .select('*')
        .eq('id', widgetId)
        .single();

      if (fetchError) throw fetchError;

      if (data) {
        // Transform database format to WidgetConfig format
        const widgetConfig: PartialWidgetConfig = {
          id: data.id,
          name: data.name,
          type: data.type,
          isActive: data.is_active,
          version: data.version || 1,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
          // Only spread config if it exists and has the new structure
          ...(data.config && typeof data.config === 'object' ? data.config : {}),
        };

        // Merge with defaults to ensure all fields are present
        const fullConfig = mergeWithDefaults(widgetConfig);
        setConfig(fullConfig);
        setOriginalConfig(fullConfig);
      }
    } catch (err) {
      console.error('Error fetching widget config:', err);
      setError('Failed to load widget configuration');
    } finally {
      setLoading(false);
    }
  }, [widgetId]);

  // Initial fetch
  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  // Update configuration (local state only)
  const updateConfig = useCallback((updates: PartialWidgetConfig) => {
    setConfig(prev => {
      if (!prev) return prev;
      
      const updated = {
        ...prev,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      
      // Check if dirty
      setIsDirty(JSON.stringify(updated) !== JSON.stringify(originalConfig));
      
      return updated;
    });
  }, [originalConfig]);

  // Save configuration to database
  const saveConfig = useCallback(async () => {
    if (!config) {
      setError('No configuration to save');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Extract the config parts that go into the jsonb column
      const { id, name, type, isActive, createdAt, updatedAt, version, ...configData } = config;

      // Extract design settings to save as individual columns (like notification_rules!)
      const design = config.design || {};
      const position = design.position || {};
      const layout = design.layout || {};
      const border = design.border || {};
      const shadow = design.shadow || {};
      const background = design.background || {};

      const display = config.display || {};
      const duration = display.duration || {};
      const content = display.content || {};
      const privacy = display.privacy || {};
      const interaction = display.interaction || {};
      const responsive = display.responsive || {};

      const { error: saveError } = await supabase
        .from('widgets')
        .update({
          name: name,
          is_active: isActive,
          config: configData,
          version: version + 1,
          // Save design settings as individual columns
          position: position.position || 'bottom-left',
          offset_x: position.offsetX || 20,
          offset_y: position.offsetY || 20,
          layout_style: layout.layout || 'card',
          max_width: layout.maxWidth || 320,
          min_width: layout.minWidth || 280,
          border_radius: border.borderRadius || 12,
          border_width: border.borderWidth || 1,
          border_color: border.borderColor || 'rgba(59, 130, 246, 0.2)',
          border_left_accent: border.borderLeftAccent ?? true,
          border_left_accent_width: border.borderLeftAccentWidth || 4,
          border_left_accent_color: border.borderLeftAccentColor || '#3B82F6',
          shadow_enabled: shadow.shadowEnabled ?? true,
          shadow_size: shadow.shadowSize || 'lg',
          glassmorphism: shadow.glassmorphism ?? true,
          backdrop_blur: shadow.backdropBlur || 16,
          background_color: background.backgroundColor || 'rgba(255, 255, 255, 0.95)',
          background_gradient: background.backgroundGradient ?? false,
          gradient_start: background.gradientStart || '#ffffff',
          gradient_end: background.gradientEnd || '#f3f4f6',
          gradient_direction: background.gradientDirection || 'to-br',
          // Save display settings as individual columns for live engine consumption
          display_duration: duration.displayDuration || 8,
          fade_in_duration: duration.fadeInDuration || 300,
          fade_out_duration: duration.fadeOutDuration || 300,
          animation_type: duration.animationType || 'slide',
          progress_bar: duration.progressBar ?? true,
          progress_bar_color: duration.progressBarColor || '#3B82F6',
          progress_bar_position: duration.progressBarPosition || 'top',
          show_timestamp: content.showTimestamp ?? true,
          timestamp_format: content.timestampFormat || 'relative',
          timestamp_prefix: content.timestampPrefix || '• ',
          show_location: content.showLocation ?? true,
          location_format: content.locationFormat || 'city',
          show_user_avatar: content.showUserAvatar ?? false,
          show_event_icon: content.showEventIcon ?? true,
          show_value: content.showValue ?? true,
          value_format: content.valueFormat || 'currency',
          currency_code: content.currency || 'USD',
          currency_position: content.currencyPosition || 'before',
          notification_time_range: content.notificationTimeRange ?? 168,
          custom_time_range_hours: content.customTimeRangeHours || null,
          anonymize_names: privacy.anonymizeNames ?? false,
          anonymization_style: privacy.anonymizationStyle || 'first-initial',
          hide_emails: privacy.hideEmails ?? true,
          hide_phone_numbers: privacy.hidePhoneNumbers ?? true,
          mask_ip_addresses: privacy.maskIpAddresses ?? true,
          gdpr_compliant: privacy.gdprCompliant ?? true,
          clickable: interaction.clickable ?? false,
          click_action: interaction.clickAction || 'none',
          click_url: interaction.clickUrl || null,
          click_url_target: interaction.clickUrlTarget || '_blank',
          close_button: interaction.closeButton ?? false,
          close_button_position: interaction.closeButtonPosition || 'top-right',
          pause_on_hover: interaction.pauseOnHover ?? true,
          expand_on_hover: interaction.expandOnHover ?? false,
          mobile_position: responsive.mobilePosition || null,
          mobile_max_width: responsive.mobileMaxWidth || null,
          hide_on_mobile: responsive.hideOnMobile ?? false,
          hide_on_desktop: responsive.hideOnDesktop ?? false,
          stack_on_mobile: responsive.stackOnMobile ?? true,
          reduced_motion_support: responsive.reducedMotionSupport ?? true,
        })
        .eq('id', widgetId);

      if (saveError) throw saveError;

      // Refetch to get the updated data
      await fetchConfig();
      setIsDirty(false);
      
      if (onSaveSuccess) {
        onSaveSuccess();
      }
    } catch (err: any) {
      console.error('Error saving widget config:', err);
      const errorMessage = err.message || 'Failed to save widget configuration';
      setError(errorMessage);
      
      if (onSaveError) {
        onSaveError(errorMessage);
      }
    } finally {
      setSaving(false);
    }
  }, [config, widgetId, fetchConfig, onSaveSuccess, onSaveError]);

  // Reset configuration to original state
  const resetConfig = useCallback(() => {
    if (originalConfig) {
      setConfig(originalConfig);
      setIsDirty(false);
    }
  }, [originalConfig]);

  return {
    config,
    loading,
    saving,
    error,
    updateConfig,
    saveConfig,
    resetConfig,
    isDirty,
  };
}

// Helper hook for updating nested config properties
export function useNestedConfigUpdate<T>(
  config: WidgetConfig | null,
  updateConfig: (updates: PartialWidgetConfig) => void
) {
  return useCallback(
    (category: keyof Omit<WidgetConfig, 'id' | 'name' | 'type' | 'isActive' | 'createdAt' | 'updatedAt' | 'version'>) =>
      (updates: Partial<T>) => {
        if (!config) return;
        
        updateConfig({
          [category]: {
            ...config[category],
            ...updates,
          },
        });
      },
    [config, updateConfig]
  );
}
