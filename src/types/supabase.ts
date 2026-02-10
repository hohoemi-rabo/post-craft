export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      characters: {
        Row: {
          created_at: string | null
          description: string
          id: string
          image_url: string | null
          is_default: boolean | null
          name: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          image_url?: string | null
          is_default?: boolean | null
          name: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          image_url?: string | null
          is_default?: boolean | null
          name?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "characters_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      post_types: {
        Row: {
          id: string
          user_id: string
          name: string
          slug: string
          description: string | null
          icon: string
          template_structure: string
          placeholders: Json
          min_length: number | null
          max_length: number | null
          sort_order: number
          is_active: boolean
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          slug: string
          description?: string | null
          icon?: string
          template_structure: string
          placeholders?: Json
          min_length?: number | null
          max_length?: number | null
          sort_order?: number
          is_active?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          slug?: string
          description?: string | null
          icon?: string
          template_structure?: string
          placeholders?: Json
          min_length?: number | null
          max_length?: number | null
          sort_order?: number
          is_active?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          id: string
          user_id: string
          required_hashtags: string[]
          settings: Json
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          required_hashtags?: string[]
          settings?: Json
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          required_hashtags?: string[]
          settings?: Json
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      post_images: {
        Row: {
          aspect_ratio: string
          character_id: string | null
          created_at: string | null
          id: string
          image_url: string
          post_id: string | null
          prompt: string
          style: string
        }
        Insert: {
          aspect_ratio: string
          character_id?: string | null
          created_at?: string | null
          id?: string
          image_url: string
          post_id?: string | null
          prompt: string
          style: string
        }
        Update: {
          aspect_ratio?: string
          character_id?: string | null
          created_at?: string | null
          id?: string
          image_url?: string
          post_id?: string | null
          prompt?: string
          style?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_images_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_images_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          created_at: string | null
          generated_caption: string
          generated_hashtags: string[]
          id: string
          input_text: string
          instagram_media_id: string | null
          instagram_published: boolean
          instagram_published_at: string | null
          post_type: string
          post_type_id: string | null
          source_url: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          generated_caption: string
          generated_hashtags: string[]
          id?: string
          input_text: string
          instagram_media_id?: string | null
          instagram_published?: boolean
          instagram_published_at?: string | null
          post_type: string
          post_type_id?: string | null
          source_url?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          generated_caption?: string
          generated_hashtags?: string[]
          id?: string
          input_text?: string
          instagram_media_id?: string | null
          instagram_published?: boolean
          instagram_published_at?: string | null
          post_type?: string
          post_type_id?: string | null
          source_url?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          id: string
          name: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          id?: string
          name?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          id?: string
          name?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types for easier access
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Convenient type aliases
export type User = Tables<'users'>
export type Character = Tables<'characters'>
export type Post = Tables<'posts'>
export type PostImage = Tables<'post_images'>
export type PostTypeRow = Tables<'post_types'>
export type UserSettingsRow = Tables<'user_settings'>
