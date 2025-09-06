import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Type definitions for our database
export type Database = {
  public: {
    Tables: {
      user_roles: {
        Row: {
          id: string
          user_id: string
          role: 'pilot' | 'admin' | 'inspector'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role: 'pilot' | 'admin' | 'inspector'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role?: 'pilot' | 'admin' | 'inspector'
          created_at?: string
          updated_at?: string
        }
      }
      pilots: {
        Row: {
          id: string
          user_id: string
          pilot_license: string
          first_name: string
          last_name: string
          email: string
          phone: string | null
          hire_date: string | null
          status: 'active' | 'inactive' | 'suspended'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          pilot_license: string
          first_name: string
          last_name: string
          email: string
          phone?: string | null
          hire_date?: string | null
          status?: 'active' | 'inactive' | 'suspended'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          pilot_license?: string
          first_name?: string
          last_name?: string
          email?: string
          phone?: string | null
          hire_date?: string | null
          status?: 'active' | 'inactive' | 'suspended'
          created_at?: string
          updated_at?: string
        }
      }
      documents: {
        Row: {
          id: string
          pilot_id: string
          document_type: 'noc' | 'medical_certificate' | 'alcohol_test' | 'license_certification' | 'training_records'
          title: string
          file_url: string
          file_size: number | null
          file_type: string | null
          upload_date: string
          expiry_date: string | null
          status: 'pending' | 'approved' | 'rejected' | 'expired'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          pilot_id: string
          document_type: 'noc' | 'medical_certificate' | 'alcohol_test' | 'license_certification' | 'training_records'
          title: string
          file_url: string
          file_size?: number | null
          file_type?: string | null
          upload_date?: string
          expiry_date?: string | null
          status?: 'pending' | 'approved' | 'rejected' | 'expired'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          pilot_id?: string
          document_type?: 'noc' | 'medical_certificate' | 'alcohol_test' | 'license_certification' | 'training_records'
          title?: string
          file_url?: string
          file_size?: number | null
          file_type?: string | null
          upload_date?: string
          expiry_date?: string | null
          status?: 'pending' | 'approved' | 'rejected' | 'expired'
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}