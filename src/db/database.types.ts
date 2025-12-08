export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      meals: {
        Row: {
          meal_id: number;
          user_id: string;
          week_id: number;
          day_of_week: Database["public"]["Enums"]["day_of_week_enum"];
          meal_type: Database["public"]["Enums"]["meal_type_enum"] | null;
          kcal: number | null;
          protein: number | null;
          image_path: string | null;
          source: "manual" | "ai_generated";
          ai_proposition: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          meal_id?: never;
          user_id: string;
          week_id: number;
          day_of_week: Database["public"]["Enums"]["day_of_week_enum"];
          meal_type?: Database["public"]["Enums"]["meal_type_enum"] | null;
          kcal?: number | null;
          protein?: number | null;
          image_path?: string | null;
          source: "manual" | "ai_generated";
          ai_proposition?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          meal_id?: never;
          user_id?: string;
          week_id?: number;
          day_of_week?: Database["public"]["Enums"]["day_of_week_enum"];
          meal_type?: Database["public"]["Enums"]["meal_type_enum"] | null;
          kcal?: number | null;
          protein?: number | null;
          image_path?: string | null;
          source?: "manual" | "ai_generated";
          ai_proposition?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "meals_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "meals_week_id_fkey";
            columns: ["week_id"];
            isOneToOne: false;
            referencedRelation: "weeks";
            referencedColumns: ["week_id"];
          },
        ];
      };
      user_goals: {
        Row: {
          goal_id: number;
          user_id: string;
          kcal_target: number;
          protein_target: number;
          valid_from: string;
          valid_to: string | null;
          created_at: string;
        };
        Insert: {
          goal_id?: never;
          user_id: string;
          kcal_target: number;
          protein_target: number;
          valid_from: string;
          valid_to?: string | null;
          created_at?: string;
        };
        Update: {
          goal_id?: never;
          user_id?: string;
          kcal_target?: number;
          protein_target?: number;
          valid_from?: string;
          valid_to?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_goals_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      weeks: {
        Row: {
          week_id: number;
          user_id: string;
          start_date: string;
          created_at: string;
        };
        Insert: {
          week_id?: never;
          user_id: string;
          start_date: string;
          created_at?: string;
        };
        Update: {
          week_id?: never;
          user_id?: string;
          start_date?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "weeks_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: {
      day_of_week_enum: "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";
      meal_type_enum: "breakfast" | "second_breakfast" | "lunch" | "snack" | "dinner";
    };
    CompositeTypes: Record<never, never>;
  };
}

type PublicSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] & PublicSchema["Views"]) | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    ? (PublicSchema["Tables"] & PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  PublicTableNameOrOptions extends keyof PublicSchema["Tables"] | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends keyof PublicSchema["Tables"] | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  PublicEnumNameOrOptions extends keyof PublicSchema["Enums"] | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never;
