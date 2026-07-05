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
          proxima_acao_data: string | null
          status: Database["public"]["Enums"]["candidato_status"]
          telefone: string | null
          updated_at: string
          user_id: string
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
          proxima_acao_data?: string | null
          status?: Database["public"]["Enums"]["candidato_status"]
          telefone?: string | null
          updated_at?: string
          user_id?: string
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
          proxima_acao_data?: string | null
          status?: Database["public"]["Enums"]["candidato_status"]
          telefone?: string | null
          updated_at?: string
          user_id?: string
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
      categories: {
        Row: {
          color: string
          company_id: string
          created_at: string
          deleted_at: string | null
          id: string
          is_default: boolean
          name: string
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string
        }
        Insert: {
          color?: string
          company_id: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_default?: boolean
          name: string
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
        }
        Update: {
          color?: string
          company_id?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_default?: boolean
          name?: string
          type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          city: string | null
          cnpj: string | null
          company_id: string
          country: string | null
          created_at: string
          deleted_at: string | null
          email: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          person_type: Database["public"]["Enums"]["person_type"]
          phone: string | null
          state: string | null
          street: string | null
          updated_at: string
          website: string | null
          zip_code: string | null
        }
        Insert: {
          city?: string | null
          cnpj?: string | null
          company_id: string
          country?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          person_type?: Database["public"]["Enums"]["person_type"]
          phone?: string | null
          state?: string | null
          street?: string | null
          updated_at?: string
          website?: string | null
          zip_code?: string | null
        }
        Update: {
          city?: string | null
          cnpj?: string | null
          company_id?: string
          country?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          person_type?: Database["public"]["Enums"]["person_type"]
          phone?: string | null
          state?: string | null
          street?: string | null
          updated_at?: string
          website?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          city: string | null
          cnpj: string | null
          created_at: string
          email: string | null
          id: string
          logo_url: string | null
          name: string
          phone: string | null
          plan: Database["public"]["Enums"]["plan_type"]
          slug: string
          state: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          city?: string | null
          cnpj?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          name: string
          phone?: string | null
          plan?: Database["public"]["Enums"]["plan_type"]
          slug: string
          state?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          city?: string | null
          cnpj?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          plan?: Database["public"]["Enums"]["plan_type"]
          slug?: string
          state?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      configuracoes: {
        Row: {
          created_at: string
          data_inicio_operacao: string
          id: string
          meta_anual_lucro: number
          moeda: string
          nome_empresa: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data_inicio_operacao?: string
          id?: string
          meta_anual_lucro?: number
          moeda?: string
          nome_empresa?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data_inicio_operacao?: string
          id?: string
          meta_anual_lucro?: number
          moeda?: string
          nome_empresa?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
          user_id: string
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
          user_id?: string
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
          user_id?: string
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
          user_id: string
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
          user_id?: string
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
          user_id?: string
          vaga_id?: string | null
          valor?: number
          vencimento?: string
        }
        Relationships: []
      }
      interacoes: {
        Row: {
          candidato_id: string
          created_at: string | null
          data: string
          descricao: string
          id: string
          tipo: string
          user_id: string
        }
        Insert: {
          candidato_id: string
          created_at?: string | null
          data: string
          descricao: string
          id?: string
          tipo: string
          user_id: string
        }
        Update: {
          candidato_id?: string
          created_at?: string | null
          data?: string
          descricao?: string
          id?: string
          tipo?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interacoes_candidato_id_fkey"
            columns: ["candidato_id"]
            isOneToOne: false
            referencedRelation: "candidatos"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          benefits: string | null
          client_id: string | null
          closed_at: string | null
          company_id: string
          contract_type: Database["public"]["Enums"]["contract_type"] | null
          created_at: string
          deadline: string | null
          deleted_at: string | null
          department: string | null
          description: string | null
          desired_skills: string | null
          fee_model: Database["public"]["Enums"]["fee_model"] | null
          fee_value: number | null
          headcount: number
          id: string
          is_exclusive: boolean
          location: string | null
          opened_at: string
          priority: Database["public"]["Enums"]["priority_level"]
          recruiter_id: string | null
          required_skills: string | null
          responsibilities: string | null
          salary_max: number | null
          salary_min: number | null
          seniority: Database["public"]["Enums"]["seniority_level"] | null
          status: Database["public"]["Enums"]["job_status"]
          title: string
          updated_at: string
          work_model: Database["public"]["Enums"]["work_model"] | null
        }
        Insert: {
          benefits?: string | null
          client_id?: string | null
          closed_at?: string | null
          company_id: string
          contract_type?: Database["public"]["Enums"]["contract_type"] | null
          created_at?: string
          deadline?: string | null
          deleted_at?: string | null
          department?: string | null
          description?: string | null
          desired_skills?: string | null
          fee_model?: Database["public"]["Enums"]["fee_model"] | null
          fee_value?: number | null
          headcount?: number
          id?: string
          is_exclusive?: boolean
          location?: string | null
          opened_at?: string
          priority?: Database["public"]["Enums"]["priority_level"]
          recruiter_id?: string | null
          required_skills?: string | null
          responsibilities?: string | null
          salary_max?: number | null
          salary_min?: number | null
          seniority?: Database["public"]["Enums"]["seniority_level"] | null
          status?: Database["public"]["Enums"]["job_status"]
          title: string
          updated_at?: string
          work_model?: Database["public"]["Enums"]["work_model"] | null
        }
        Update: {
          benefits?: string | null
          client_id?: string | null
          closed_at?: string | null
          company_id?: string
          contract_type?: Database["public"]["Enums"]["contract_type"] | null
          created_at?: string
          deadline?: string | null
          deleted_at?: string | null
          department?: string | null
          description?: string | null
          desired_skills?: string | null
          fee_model?: Database["public"]["Enums"]["fee_model"] | null
          fee_value?: number | null
          headcount?: number
          id?: string
          is_exclusive?: boolean
          location?: string | null
          opened_at?: string
          priority?: Database["public"]["Enums"]["priority_level"]
          recruiter_id?: string | null
          required_skills?: string | null
          responsibilities?: string | null
          salary_max?: number | null
          salary_min?: number | null
          seniority?: Database["public"]["Enums"]["seniority_level"] | null
          status?: Database["public"]["Enums"]["job_status"]
          title?: string
          updated_at?: string
          work_model?: Database["public"]["Enums"]["work_model"] | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_recruiter_id_fkey"
            columns: ["recruiter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_id: string | null
          created_at: string
          email: string
          id: string
          is_active: boolean
          name: string
          nome: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string
          email?: string
          id: string
          is_active?: boolean
          name?: string
          nome?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          name?: string
          nome?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          category_id: string | null
          client_id: string | null
          company_id: string
          created_at: string
          date: string
          deleted_at: string | null
          description: string
          due_date: string | null
          id: string
          notes: string | null
          paid_at: string | null
          status: Database["public"]["Enums"]["payment_status"]
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string
        }
        Insert: {
          amount: number
          category_id?: string | null
          client_id?: string | null
          company_id: string
          created_at?: string
          date: string
          deleted_at?: string | null
          description: string
          due_date?: string | null
          id?: string
          notes?: string | null
          paid_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
        }
        Update: {
          amount?: number
          category_id?: string | null
          client_id?: string | null
          company_id?: string
          created_at?: string
          date?: string
          deleted_at?: string | null
          description?: string
          due_date?: string | null
          id?: string
          notes?: string | null
          paid_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
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
          user_id: string
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
          user_id?: string
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
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_company_id: { Args: never; Returns: string }
      finalize_expired_garantias: { Args: never; Returns: undefined }
      generate_fatura_numero: { Args: never; Returns: string }
    }
    Enums: {
      candidato_status: "Triagem" | "Entrevista" | "Contratado" | "Reprovado"
      contract_type: "clt" | "pj" | "internship" | "temporary" | "freelance"
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
      fee_model: "salary_pct" | "fixed" | "fixed_plus_success"
      job_status:
        | "open"
        | "screening"
        | "interviewing"
        | "proposal"
        | "closed"
        | "cancelled"
        | "paused"
      payment_status: "pending" | "paid" | "overdue" | "cancelled"
      person_type: "pf" | "pj"
      pipeline_etapa:
        | "Briefing"
        | "Contrato"
        | "Descritivo publicado"
        | "Candidatos em triagem"
        | "Em Garantia"
        | "Finalizada"
      plan_type: "free" | "starter" | "professional" | "enterprise"
      priority_level: "low" | "medium" | "high" | "urgent"
      regime_trabalho: "CLT" | "PJ" | "Híbrido"
      seniority_level:
        | "intern"
        | "junior"
        | "mid"
        | "senior"
        | "specialist"
        | "lead"
      transaction_type: "income" | "expense"
      user_role: "admin" | "recruiter" | "financial" | "viewer"
      vaga_status: "Aberta" | "Em processo" | "Fechada" | "Encerrada"
      work_model: "onsite" | "hybrid" | "remote"
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
      contract_type: ["clt", "pj", "internship", "temporary", "freelance"],
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
      fee_model: ["salary_pct", "fixed", "fixed_plus_success"],
      job_status: [
        "open",
        "screening",
        "interviewing",
        "proposal",
        "closed",
        "cancelled",
        "paused",
      ],
      payment_status: ["pending", "paid", "overdue", "cancelled"],
      person_type: ["pf", "pj"],
      pipeline_etapa: [
        "Briefing",
        "Contrato",
        "Descritivo publicado",
        "Candidatos em triagem",
        "Em Garantia",
        "Finalizada",
      ],
      plan_type: ["free", "starter", "professional", "enterprise"],
      priority_level: ["low", "medium", "high", "urgent"],
      regime_trabalho: ["CLT", "PJ", "Híbrido"],
      seniority_level: [
        "intern",
        "junior",
        "mid",
        "senior",
        "specialist",
        "lead",
      ],
      transaction_type: ["income", "expense"],
      user_role: ["admin", "recruiter", "financial", "viewer"],
      vaga_status: ["Aberta", "Em processo", "Fechada", "Encerrada"],
      work_model: ["onsite", "hybrid", "remote"],
    },
  },
} as const
