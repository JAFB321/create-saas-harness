// Hand-authored to match supabase/migrations. Regenerate with `pnpm db:types` once your Supabase
// project is connected (it overwrites this file with the real generated types).
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          role: string;
          plan: Database["public"]["Enums"]["plan"];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          role?: string;
          plan?: Database["public"]["Enums"]["plan"];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          role?: string;
          plan?: Database["public"]["Enums"]["plan"];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      items: {
        Row: {
          id: string;
          owner_id: string;
          title: string;
          description: string;
          status: Database["public"]["Enums"]["item_status"];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          title: string;
          description?: string;
          status?: Database["public"]["Enums"]["item_status"];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          title?: string;
          description?: string;
          status?: Database["public"]["Enums"]["item_status"];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          user_id: string | null;
          amount_cents: number;
          currency: string;
          status: Database["public"]["Enums"]["order_status"];
          payment_method: string | null;
          provider_ref: string | null;
          idempotency_key: string | null;
          fee_cents: number | null;
          metadata: Json;
          paid_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          amount_cents: number;
          currency?: string;
          status?: Database["public"]["Enums"]["order_status"];
          payment_method?: string | null;
          provider_ref?: string | null;
          idempotency_key?: string | null;
          fee_cents?: number | null;
          metadata?: Json;
          paid_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          amount_cents?: number;
          currency?: string;
          status?: Database["public"]["Enums"]["order_status"];
          payment_method?: string | null;
          provider_ref?: string | null;
          idempotency_key?: string | null;
          fee_cents?: number | null;
          metadata?: Json;
          paid_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan: Database["public"]["Enums"]["plan"];
          status: string;
          provider_ref: string | null;
          current_period_end: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan: Database["public"]["Enums"]["plan"];
          status?: string;
          provider_ref?: string | null;
          current_period_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plan?: Database["public"]["Enums"]["plan"];
          status?: string;
          provider_ref?: string | null;
          current_period_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      payment_events: {
        Row: {
          id: string;
          order_id: string | null;
          type: string;
          raw: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id?: string | null;
          type: string;
          raw?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string | null;
          type?: string;
          raw?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: {
      plan: "free" | "pro" | "business";
      order_status: "pending" | "paid" | "failed" | "expired";
      item_status: "draft" | "active" | "archived";
    };
    CompositeTypes: Record<never, never>;
  };
}

type PublicSchema = Database["public"];

export type Tables<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Row"];
export type TablesInsert<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Update"];
export type Enums<T extends keyof PublicSchema["Enums"]> = PublicSchema["Enums"][T];

export const Constants = {
  public: {
    Enums: {
      plan: ["free", "pro", "business"],
      order_status: ["pending", "paid", "failed", "expired"],
      item_status: ["draft", "active", "archived"],
    },
  },
} as const;
