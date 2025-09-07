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
      audit_logs: {
        Row: {
          id: string
          table_name: string
          record_id: string | null
          action_type: 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT' | 'UPLOAD' | 'DOWNLOAD' | 'LOGIN' | 'LOGOUT' | 'VIEW' | 'EXPORT'
          user_id: string | null
          user_email: string | null
          user_role: 'pilot' | 'admin' | 'inspector' | null
          old_values: Json | null
          new_values: Json | null
          changed_fields: string[] | null
          ip_address: string | null
          user_agent: string | null
          session_id: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          table_name: string
          record_id?: string | null
          action_type: 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT' | 'UPLOAD' | 'DOWNLOAD' | 'LOGIN' | 'LOGOUT' | 'VIEW' | 'EXPORT'
          user_id?: string | null
          user_email?: string | null
          user_role?: 'pilot' | 'admin' | 'inspector' | null
          old_values?: Json | null
          new_values?: Json | null
          changed_fields?: string[] | null
          ip_address?: string | null
          user_agent?: string | null
          session_id?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          table_name?: string
          record_id?: string | null
          action_type?: 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT' | 'UPLOAD' | 'DOWNLOAD' | 'LOGIN' | 'LOGOUT' | 'VIEW' | 'EXPORT'
          user_id?: string | null
          user_email?: string | null
          user_role?: 'pilot' | 'admin' | 'inspector' | null
          old_values?: Json | null
          new_values?: Json | null
          changed_fields?: string[] | null
          ip_address?: string | null
          user_agent?: string | null
          session_id?: string | null
          metadata?: Json
          created_at?: string
        }
      }
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
      log_custom_action: {
        Args: {
          p_table_name: string
          p_record_id: string
          p_action_type: string
          p_metadata?: Json
        }
        Returns: string
      }
      get_audit_logs: {
        Args: {
          p_table_name?: string
          p_action_type?: string
          p_user_id?: string
          p_start_date?: string
          p_end_date?: string
          p_limit?: number
          p_offset?: number
        }
        Returns: {
          id: string
          table_name: string
          record_id: string | null
          action_type: string
          user_id: string | null
          user_email: string | null
          user_role: string | null
          old_values: Json | null
          new_values: Json | null
          changed_fields: string[] | null
          ip_address: string | null
          user_agent: string | null
          metadata: Json
          created_at: string
        }[]
      }
      get_audit_statistics: {
        Args: {
          p_start_date?: string
          p_end_date?: string
        }
        Returns: {
          total_actions: number
          actions_by_type: Json
          actions_by_user: Json
          actions_by_table: Json
          daily_activity: Json
        }[]
      }
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