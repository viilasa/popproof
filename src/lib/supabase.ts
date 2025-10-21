import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'poproof-auth-token',
  },
});

export type Database = {
  public: {
    Tables: {
      social_proof_events: {
        Row: {
          id: string;
          client_id: string;
          event_type: string;
          user_name: string;
          product_name: string | null;
          location: string | null;
          value: number | null;
          timestamp: string;
          created_at: string;
        };
        Insert: {
      widgets: {
        Row: {
          id: string;
          user_id: string;
          site_id: string;
          name: string;
          type: string;
          config: any;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          site_id: string;
          name: string;
          type: string;
          config?: any;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          site_id?: string;
          name?: string;
          type?: string;
          config?: any;
          is_active?: boolean;
          created_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          widget_id: string;
          title: string;
          message: string;
          customer_avatar: string | null;
          timestamp: string;
          scheduled_at: string | null;
          is_active: boolean;
          created_at: string;
          type: string | null;
          customer_name: string | null;
          location: string | null;
          product_name: string | null;
          amount: number | null;
          currency: string | null;
          rating: number | null;
          user_id: string | null;
        };
        Insert: {
          id?: string;
          widget_id: string;
          title: string;
          message: string;
          customer_avatar?: string | null;
          timestamp?: string;
          scheduled_at?: string | null;
          is_active?: boolean;
          created_at?: string;
          type?: string | null;
          customer_name?: string | null;
          location?: string | null;
          product_name?: string | null;
          amount?: number | null;
          currency?: string | null;
          rating?: number | null;
          user_id?: string | null;
        };
        Update: {
          id?: string;
          widget_id?: string;
          title?: string;
          message?: string;
          customer_avatar?: string | null;
          timestamp?: string;
          scheduled_at?: string | null;
          is_active?: boolean;
          created_at?: string;
          type?: string | null;
          customer_name?: string | null;
          location?: string | null;
          product_name?: string | null;
          amount?: number | null;
          currency?: string | null;
          rating?: number | null;
          user_id?: string | null;
        };
      };
          id?: string;
          client_id: string;
          event_type: string;
          user_name: string;
          product_name?: string | null;
          location?: string | null;
          value?: number | null;
          timestamp?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          event_type?: string;
          user_name?: string;
          product_name?: string | null;
          location?: string | null;
          value?: number | null;
          timestamp?: string;
          created_at?: string;
        };
      };
      api_keys: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          public_key: string;
          domain: string | null;
          is_active: boolean;
          usage_count: number;
          last_used: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          public_key: string;
          domain?: string | null;
          is_active?: boolean;
          usage_count?: number;
          last_used?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          public_key?: string;
          domain?: string | null;
          is_active?: boolean;
          usage_count?: number;
          last_used?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};