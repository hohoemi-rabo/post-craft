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
      competitor_analyses: {
        Row: {
          id: string
          user_id: string
          source_type: string
          source_identifier: string
          source_display_name: string | null
          raw_data: Json | null
          analysis_result: Json | null
          status: string
          data_source: string
          post_count: number | null
          error_message: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          source_type: string
          source_identifier: string
          source_display_name?: string | null
          raw_data?: Json | null
          analysis_result?: Json | null
          status?: string
          data_source?: string
          post_count?: number | null
          error_message?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          source_type?: string
          source_identifier?: string
          source_display_name?: string | null
          raw_data?: Json | null
          analysis_result?: Json | null
          status?: string
          data_source?: string
          post_count?: number | null
          error_message?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "competitor_analyses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
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
      generated_configs: {
        Row: {
          id: string
          user_id: string
          analysis_id: string
          generated_profile_id: string | null
          generated_post_type_ids: string[]
          generation_config: Json | null
          status: string
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          analysis_id: string
          generated_profile_id?: string | null
          generated_post_type_ids?: string[]
          generation_config?: Json | null
          status?: string
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          analysis_id?: string
          generated_profile_id?: string | null
          generated_post_type_ids?: string[]
          generation_config?: Json | null
          status?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "generated_configs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_configs_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "competitor_analyses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_configs_generated_profile_id_fkey"
            columns: ["generated_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          id: string
          user_id: string
          name: string
          icon: string
          description: string | null
          system_prompt_memo: string | null
          system_prompt: string | null
          required_hashtags: string[]
          is_default: boolean
          sort_order: number
          source_analysis_id: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          icon?: string
          description?: string | null
          system_prompt_memo?: string | null
          system_prompt?: string | null
          required_hashtags?: string[]
          is_default?: boolean
          sort_order?: number
          source_analysis_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          icon?: string
          description?: string | null
          system_prompt_memo?: string | null
          system_prompt?: string | null
          required_hashtags?: string[]
          is_default?: boolean
          sort_order?: number
          source_analysis_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_source_analysis_id_fkey"
            columns: ["source_analysis_id"]
            isOneToOne: false
            referencedRelation: "competitor_analyses"
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
          user_memo: string | null
          type_prompt: string | null
          input_mode: string
          profile_id: string | null
          source_analysis_id: string | null
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
          user_memo?: string | null
          type_prompt?: string | null
          input_mode?: string
          profile_id?: string | null
          source_analysis_id?: string | null
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
          user_memo?: string | null
          type_prompt?: string | null
          input_mode?: string
          profile_id?: string | null
          source_analysis_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_types_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_types_source_analysis_id_fkey"
            columns: ["source_analysis_id"]
            isOneToOne: false
            referencedRelation: "competitor_analyses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          id: string
          user_id: string
          required_hashtags: string[]
          settings: Json
          system_prompt_memo: string | null
          system_prompt: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          required_hashtags?: string[]
          settings?: Json
          system_prompt_memo?: string | null
          system_prompt?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          required_hashtags?: string[]
          settings?: Json
          system_prompt_memo?: string | null
          system_prompt?: string | null
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
          profile_id: string | null
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
          profile_id?: string | null
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
          profile_id?: string | null
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
          {
            foreignKeyName: "posts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
export type ProfileRow = Tables<'profiles'>
export type PostTypeRow = Tables<'post_types'>
export type UserSettingsRow = Tables<'user_settings'>
export type CompetitorAnalysis = Tables<'competitor_analyses'>
export type GeneratedConfig = Tables<'generated_configs'>
