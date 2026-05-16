export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      candidatos: {
        Row: {
          created_at: string
          email: string
          etapa: string
          id: string
          linkedin: string | null
          nome: string
          observacoes: string | null
          pontuacao: number
          proxima_acao: string
          status: Database["public"]["Enums"]["candidato_status"]
          telefone: string | null
          updated_at: string
          vaga_id: string | null
          vaga_nome: string
        }
        Insert: {
          created_at?: string
          email: string
          etapa?: string
          id?: string
          linkedin?: string | null
          nome: string
          observacoes?: string | null
          pontuacao?: number
          proxima_acao?: string
          status?: Database["public"]["Enums"]["candidato_status"]
          telefone?: string | null
          updated_at?: string
          vaga_id?: string | null
          vaga_nome?: string
        }
        Update: {
          created_at?: string
          email?: string
          etapa?: string
          id?: string
          linkedin?: string | null
          nome?: string
          observacoes?: string | null
          pontuacao?: number
          proxima_acao?: string
          status?: Database["public"]["Enums"]["candidato_status"]
          telefone?: string | null
          updated_at?: string
          vaga_id?: string | null
          vaga_nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidatos_vaga_id_fkey"
            columns: ["vaga_id"]
            isOneToOne: false
            referencedRelation: "vagas"
            referencedColumns: ["id"]
          },
        ]
      }
      custos: {
        Row: {
          categoria: Database["public"]["Enums"]["custo_categoria"]
          created_at: string
          data: string
          descricao: string
          fornecedor: string | null
          id: string
          observacoes: string | null
          status: Database["public"]["Enums"]["custo_status"]
          tipo: Database["public"]["Enums"]["custo_tipo"]
          updated_at: string
          vaga_id: string | null
          valor: number
        }
        Insert: {
          categoria: Database["public"]["Enums"]["custo_categoria"]
          created_at?: string
          data: string
          descricao: string
          fornecedor?: string | null
          id?: string
          observacoes?: string | null
          status?: Database["public"]["Enums"]["custo_status"]
          tipo: Database["public"]["Enums"]["custo_tipo"]
          updated_at?: string
          vaga_id?: string | null
          valor: number
        }
        Update: {
          categoria?: Database["public"]["Enums"]["custo_categoria"]
          created_at?: string
          data?: string
          descricao?: string
          fornecedor?: string | null
          id?: string
          observacoes?: string | null
          status?: Database["public"]["Enums"]["custo_status"]
          tipo?: Database["public"]["Enums"]["custo_tipo"]
          updated_at?: string
          vaga_id?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "custos_vaga_id_fkey"
            columns: ["vaga_id"]
            isOneToOne: false
            referencedRelation: "vagas"
            referencedColumns: ["id"]
          },
        ]
      }
      faturas: {
        Row: {
          cliente: string
          created_at: string
          id: string
          numero: string
          observacoes: string | null
          servico: string
          status: Database["public"]["Enums"]["fatura_status"]
          updated_at: string
          vaga_id: string | null
          valor: number
          vencimento: string
        }
        Insert: {
          cliente: string
          created_at?: string
          id?: string
          numero?: string
          observacoes?: string | null
          servico: string
          status?: Database["public"]["Enums"]["fatura_status"]
          updated_at?: string
          vaga_id?: string | null
          valor: number
          vencimento: string
        }
        Update: {
          cliente?: string
          created_at?: string
          id?: string
          numero?: string
          observacoes?: string | null
          servico?: string
          status?: Database["public"]["Enums"]["fatura_status"]
          updated_at?: string
          vaga_id?: string | null
          valor?: number
          vencimento?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id: string
          nome?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      vagas: {
        Row: {
          area: string
          briefing: Json | null
          candidatos: number
          cargo: string
          contrato: Json | null
          created_at: string
          descricao: string | null
          descritivo: Json | null
          empresa: string
          etapa: Database["public"]["Enums"]["pipeline_etapa"]
          garantia_inicio: string | null
          id: string
          prazo: string
          prazo_garantia: number
          regime: Database["public"]["Enums"]["regime_trabalho"] | null
          salario: string | null
          status: Database["public"]["Enums"]["vaga_status"]
          updated_at: string
        }
        Insert: {
          area: string
          briefing?: Json | null
          candidatos?: number
          cargo: string
          contrato?: Json | null
          created_at?: string
          descricao?: string | null
          descritivo?: Json | null
          empresa: string
          etapa?: Database["public"]["Enums"]["pipeline_etapa"]
          garantia_inicio?: string | null
          id?: string
          prazo: string
          prazo_garantia?: number
          regime?: Database["public"]["Enums"]["regime_trabalho"] | null
          salario?: string | null
          status?: Database["public"]["Enums"]["vaga_status"]
          updated_at?: string
        }
        Update: {
          area?: string
          briefing?: Json | null
          candidatos?: number
          cargo?: string
          contrato?: Json | null
          created_at?: string
          descricao?: string | null
          descritivo?: Json | null
          empresa?: string
          etapa?: Database["public"]["Enums"]["pipeline_etapa"]
          garantia_inicio?: string | null
          id?: string
          prazo?: string
          prazo_garantia?: number
          regime?: Database["public"]["Enums"]["regime_trabalho"] | null
          salario?: string | null
          status?: Database["public"]["Enums"]["vaga_status"]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      finalize_expired_garantias: { Args: never; Returns: undefined }
      generate_fatura_numero: { Args: never; Returns: string }
    }
    Enums: {
      candidato_status: "Triagem" | "Entrevista" | "Contratado" | "Reprovado"
      custo_categoria:
        | "Pessoal"
        | "Software"
        | "Marketing"
        | "Anúncios"
        | "Infraestrutura"
        | "Impostos"
        | "Operacional"
        | "Outros"
      custo_status: "Pago" | "Pendente" | "Atrasado"
      custo_tipo: "Fixo" | "Variável"
      fatura_status: "Pago" | "Pendente" | "Atrasado"
      pipeline_etapa:
        | "Briefing"
        | "Contrato"
        | "Descritivo publicado"
        | "Candidatos em triagem"
        | "Em Garantia"
        | "Finalizada"
      regime_trabalho: "CLT" | "PJ" | "Híbrido"
      vaga_status: "Aberta" | "Em processo" | "Fechada" | "Encerrada"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      candidato_status: ["Triagem", "Entrevista", "Contratado", "Reprovado"],
      custo_categoria: [
        "Pessoal",
        "Software",
        "Marketing",
        "Anúncios",
        "Infraestrutura",
        "Impostos",
        "Operacional",
        "Outros",
      ],
      custo_status: ["Pago", "Pendente", "Atrasado"],
      custo_tipo: ["Fixo", "Variável"],
      fatura_status: ["Pago", "Pendente", "Atrasado"],
      pipeline_etapa: [
        "Briefing",
        "Contrato",
        "Descritivo publicado",
        "Candidatos em triagem",
        "Em Garantia",
        "Finalizada",
      ],
      regime_trabalho: ["CLT", "PJ", "Híbrido"],
      vaga_status: ["Aberta", "Em processo", "Fechada", "Encerrada"],
    },
  },
} as const
