import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Database {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string;
          name: string;
          address: string;
          vat: string;
          phone: string;
          email: string;
          notes: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          address: string;
          vat: string;
          phone: string;
          email: string;
          notes?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          address?: string;
          vat?: string;
          phone?: string;
          email?: string;
          notes?: string | null;
          created_at?: string | null;
        };
      };
      items: {
        Row: {
          id: string;
          name: string;
          category: string;
          price: number;
          weight: number;
          picture_url: string | null;
          description: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          category: string;
          price: number;
          weight: number;
          picture_url?: string | null;
          description?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          category?: string;
          price?: number;
          weight?: number;
          picture_url?: string | null;
          description?: string | null;
          created_at?: string | null;
        };
      };
      orders: {
        Row: {
          id: string;
          client_id: string;
          delivery_date: string;
          status: string;
          notes: string | null;
          total: number;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          client_id: string;
          delivery_date: string;
          status?: string;
          notes?: string | null;
          total?: number;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          client_id?: string;
          delivery_date?: string;
          status?: string;
          notes?: string | null;
          total?: number;
          created_at?: string | null;
        };
      };
      order_items: {
        Row: {
          order_id: string;
          item_id: string;
          quantity: number;
          price: number;
          created_at: string | null;
        };
        Insert: {
          order_id: string;
          item_id: string;
          quantity: number;
          price: number;
          created_at?: string | null;
        };
        Update: {
          order_id?: string;
          item_id?: string;
          quantity?: number;
          price?: number;
          created_at?: string | null;
        };
      };
    };
  };
}