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
      profiles: {
        Row: {
          id: string
          updated_at: string | null
          store_info: Json | null
          settings: Json | null
        }
        Insert: {
          id: string
          updated_at?: string | null
          store_info?: Json | null
          settings?: Json | null
        }
        Update: {
          id?: string
          updated_at?: string | null
          store_info?: Json | null
          settings?: Json | null
        }
      }
      products: {
        Row: {
          id: string
          profile_id: string
          name: string
          price: number
          stock: number
          category: string | null
          description: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          profile_id: string
          name: string
          price: number
          stock: number
          category?: string | null
          description?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          profile_id?: string
          name?: string
          price?: number
          stock?: number
          category?: string | null
          description?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      orders: {
        Row: {
          id: string
          profile_id: string
          items: Json
          total: number
          payment_method: string
          status: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          profile_id: string
          items: Json
          total: number
          payment_method: string
          status: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          profile_id?: string
          items?: Json
          total?: number
          payment_method?: string
          status?: string
          created_at?: string | null
          updated_at?: string | null
        }
      }
    }
  }
}