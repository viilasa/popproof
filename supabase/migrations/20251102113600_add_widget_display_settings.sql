-- Adds display-focused columns so editor, preview, and live engine can persist animation, content, privacy, interaction, and responsive settings.
-- Safe to re-run thanks to IF NOT EXISTS checks.

BEGIN;

ALTER TABLE public.widgets
  ADD COLUMN IF NOT EXISTS display_duration integer DEFAULT 8,
  ADD COLUMN IF NOT EXISTS fade_in_duration integer DEFAULT 300,
  ADD COLUMN IF NOT EXISTS fade_out_duration integer DEFAULT 300,
  ADD COLUMN IF NOT EXISTS animation_type text DEFAULT 'slide',
  ADD COLUMN IF NOT EXISTS progress_bar boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS progress_bar_color text DEFAULT '#3B82F6',
  ADD COLUMN IF NOT EXISTS progress_bar_position text DEFAULT 'top',
  ADD COLUMN IF NOT EXISTS show_timestamp boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS timestamp_format text DEFAULT 'relative',
  ADD COLUMN IF NOT EXISTS timestamp_prefix text DEFAULT '• ',
  ADD COLUMN IF NOT EXISTS show_location boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS location_format text DEFAULT 'city',
  ADD COLUMN IF NOT EXISTS show_user_avatar boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_event_icon boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_value boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS value_format text DEFAULT 'currency',
  ADD COLUMN IF NOT EXISTS currency_code text DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS currency_position text DEFAULT 'before',
  ADD COLUMN IF NOT EXISTS anonymize_names boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS anonymization_style text DEFAULT 'first-initial',
  ADD COLUMN IF NOT EXISTS hide_emails boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS hide_phone_numbers boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS mask_ip_addresses boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS gdpr_compliant boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS clickable boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS click_action text DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS click_url text,
  ADD COLUMN IF NOT EXISTS click_url_target text DEFAULT '_blank',
  ADD COLUMN IF NOT EXISTS close_button boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS close_button_position text DEFAULT 'top-right',
  ADD COLUMN IF NOT EXISTS pause_on_hover boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS expand_on_hover boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS mobile_position text,
  ADD COLUMN IF NOT EXISTS mobile_max_width integer,
  ADD COLUMN IF NOT EXISTS hide_on_mobile boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS hide_on_desktop boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS stack_on_mobile boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS reduced_motion_support boolean DEFAULT true;

COMMIT;
