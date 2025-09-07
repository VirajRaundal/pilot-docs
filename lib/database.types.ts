export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
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
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'pilot' | 'admin' | 'inspector'
      pilot_status: 'active' | 'inactive' | 'suspended'
      document_type: 'noc' | 'medical_certificate' | 'alcohol_test' | 'license_certification' | 'training_records'
      document_status: 'pending' | 'approved' | 'rejected' | 'expired'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}