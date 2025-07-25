import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      vendors: {
        Row: {
          id: string
          email: string
          full_name: string
          phone: string | null
          profile_photo: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          email: string
          password_hash: string
          full_name: string
          phone?: string
          profile_photo?: string
        }
        Update: {
          full_name?: string
          phone?: string
          profile_photo?: string
        }
      }
      cars: {
        Row: {
          id: string
          vendor_id: string
          brand: string
          model: string
          year: number
          color: string
          fuel_type: string
          transmission: string
          mileage: number
          price: number
          description: string | null
          engine_capacity: string | null
          body_type: string | null
          condition: string | null
          registration_number: string | null
          chassis_number: string | null
          engine_number: string | null
          status: "available" | "sold"
          created_at: string
          updated_at: string
        }
        Insert: {
          vendor_id: string
          brand: string
          model: string
          year: number
          color: string
          fuel_type: string
          transmission: string
          mileage: number
          price: number
          description?: string
          engine_capacity?: string
          body_type?: string
          condition?: string
          registration_number?: string
          chassis_number?: string
          engine_number?: string
        }
        Update: {
          status?: "available" | "sold"
          price?: number
          description?: string
        }
      }
      car_images: {
        Row: {
          id: string
          car_id: string
          image_url: string
          is_primary: boolean
          created_at: string
        }
        Insert: {
          car_id: string
          image_url: string
          is_primary?: boolean
        }
      }
      car_documents: {
        Row: {
          id: string
          car_id: string
          document_name: string
          document_url: string
          document_type: string | null
          created_at: string
        }
        Insert: {
          car_id: string
          document_name: string
          document_url: string
          document_type?: string
        }
      }
      sales: {
        Row: {
          id: string
          car_id: string
          vendor_id: string
          client_name: string
          client_email: string
          client_phone: string | null
          client_address: string | null
          sale_date: string
          payment_method: string
          sale_price: number
          client_documents: string | null
          created_at: string
        }
        Insert: {
          car_id: string
          vendor_id: string
          client_name: string
          client_email: string
          client_phone?: string
          client_address?: string
          sale_date: string
          payment_method: string
          sale_price: number
          client_documents?: string
        }
      }
    }
  }
}
