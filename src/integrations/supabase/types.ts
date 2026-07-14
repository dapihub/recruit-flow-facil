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
      audit_log: {
        Row: {
          action: string
          company_id: string | null
          created_at: string
          entity: string
          entity_id: string | null
          id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          action: string
          company_id?: string | null
          created_at?: string
          entity: string
          entity_id?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string
          company_id?: string | null
          created_at?: string
          entity?: string
          entity_id?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
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
      client_ratings: {
        Row: {
          category: string | null
          client_id: string
          comment: string | null
          company_id: string
          created_at: string
          id: string
          rated_by: string | null
          score: number
        }
        Insert: {
          category?: string | null
          client_id: string
          comment?: string | null
          company_id: string
          created_at?: string
          id?: string
          rated_by?: string | null
          score: number
        }
        Update: {
          category?: string | null
          client_id?: string
          comment?: string | null
          company_id?: string
          created_at?: string
          id?: string
          rated_by?: string | null
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "client_ratings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_ratings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_ratings_rated_by_fkey"
            columns: ["rated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      contacts: {
        Row: {
          client_id: string | null
          company_id: string
          created_at: string
          deleted_at: string | null
          email: string | null
          id: string
          is_active: boolean
          linkedin: string | null
          name: string
          notes: string | null
          phone: string | null
          role: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          client_id?: string | null
          company_id: string
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          linkedin?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          role?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          client_id?: string | null
          company_id?: string
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          linkedin?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          role?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_opportunities: {
        Row: {
          assignee_id: string | null
          client_id: string | null
          company_id: string
          contact_id: string | null
          created_at: string
          deleted_at: string | null
          expected_close: string | null
          id: string
          lead_email: string | null
          lead_name: string | null
          lost_reason: string | null
          notes: string | null
          probability: number
          stage_id: string
          title: string
          updated_at: string
          value: number | null
        }
        Insert: {
          assignee_id?: string | null
          client_id?: string | null
          company_id: string
          contact_id?: string | null
          created_at?: string
          deleted_at?: string | null
          expected_close?: string | null
          id?: string
          lead_email?: string | null
          lead_name?: string | null
          lost_reason?: string | null
          notes?: string | null
          probability?: number
          stage_id: string
          title: string
          updated_at?: string
          value?: number | null
        }
        Update: {
          assignee_id?: string | null
          client_id?: string | null
          company_id?: string
          contact_id?: string | null
          created_at?: string
          deleted_at?: string | null
          expected_close?: string | null
          id?: string
          lead_email?: string | null
          lead_name?: string | null
          lost_reason?: string | null
          notes?: string | null
          probability?: number
          stage_id?: string
          title?: string
          updated_at?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_opportunities_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_opportunities_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_opportunities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_opportunities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_opportunities_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "crm_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_stages: {
        Row: {
          color: string
          company_id: string
          created_at: string
          id: string
          is_final: boolean
          name: string
          order: number
          outcome: string | null
          probability: number
          updated_at: string
        }
        Insert: {
          color?: string
          company_id: string
          created_at?: string
          id?: string
          is_final?: boolean
          name: string
          order?: number
          outcome?: string | null
          probability?: number
          updated_at?: string
        }
        Update: {
          color?: string
          company_id?: string
          created_at?: string
          id?: string
          is_final?: boolean
          name?: string
          order?: number
          outcome?: string | null
          probability?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_stages_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
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
      invites: {
        Row: {
          accepted_at: string | null
          company_id: string
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          role: Database["public"]["Enums"]["app_role"]
          token: string
        }
        Insert: {
          accepted_at?: string | null
          company_id: string
          created_at?: string
          email: string
          expires_at: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          token: string
        }
        Update: {
          accepted_at?: string | null
          company_id?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invites_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invites_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      meetings: {
        Row: {
          client_id: string | null
          company_id: string
          contact_id: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          ends_at: string | null
          id: string
          location: string | null
          meeting_url: string | null
          notes: string | null
          organizer_id: string | null
          participants: Json
          starts_at: string
          status: string
          title: string
          updated_at: string
          vaga_id: string | null
        }
        Insert: {
          client_id?: string | null
          company_id: string
          contact_id?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          location?: string | null
          meeting_url?: string | null
          notes?: string | null
          organizer_id?: string | null
          participants?: Json
          starts_at: string
          status?: string
          title: string
          updated_at?: string
          vaga_id?: string | null
        }
        Update: {
          client_id?: string | null
          company_id?: string
          contact_id?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          location?: string | null
          meeting_url?: string | null
          notes?: string | null
          organizer_id?: string | null
          participants?: Json
          starts_at?: string
          status?: string
          title?: string
          updated_at?: string
          vaga_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meetings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_vaga_id_fkey"
            columns: ["vaga_id"]
            isOneToOne: false
            referencedRelation: "vagas"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          company_id: string
          created_at: string
          id: string
          link: string | null
          message: string | null
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          link?: string | null
          message?: string | null
          read_at?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          link?: string | null
          message?: string | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      payroll_entries: {
        Row: {
          amount: number
          company_id: string
          created_at: string
          deleted_at: string | null
          id: string
          notes: string | null
          payment_date: string | null
          person_name: string
          reference_month: string
          role: string | null
          status: string
          type: Database["public"]["Enums"]["payroll_type"]
          updated_at: string
        }
        Insert: {
          amount: number
          company_id: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          notes?: string | null
          payment_date?: string | null
          person_name: string
          reference_month: string
          role?: string | null
          status?: string
          type?: Database["public"]["Enums"]["payroll_type"]
          updated_at?: string
        }
        Update: {
          amount?: number
          company_id?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          notes?: string | null
          payment_date?: string | null
          person_name?: string
          reference_month?: string
          role?: string | null
          status?: string
          type?: Database["public"]["Enums"]["payroll_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_entries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string | null
          company_id: string
          cost_price: number
          created_at: string
          current_stock: number
          deleted_at: string | null
          description: string | null
          id: string
          is_active: boolean
          min_stock: number
          name: string
          sale_price: number
          sku: string
          unit: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          company_id: string
          cost_price?: number
          created_at?: string
          current_stock?: number
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          min_stock?: number
          name: string
          sale_price?: number
          sku: string
          unit?: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          company_id?: string
          cost_price?: number
          created_at?: string
          current_stock?: number
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          min_stock?: number
          name?: string
          sale_price?: number
          sku?: string
          unit?: string
          updated_at?: string
        }
        Relationships: []
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
      purchase_items: {
        Row: {
          company_id: string
          created_at: string
          description: string
          id: string
          order_id: string
          product_id: string | null
          quantity: number
          subtotal: number
          unit_cost: number
        }
        Insert: {
          company_id: string
          created_at?: string
          description: string
          id?: string
          order_id: string
          product_id?: string | null
          quantity?: number
          subtotal?: number
          unit_cost?: number
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string
          id?: string
          order_id?: string
          product_id?: string | null
          quantity?: number
          subtotal?: number
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          company_id: string
          created_at: string
          deleted_at: string | null
          expected_date: string | null
          id: string
          notes: string | null
          number: string
          order_date: string
          status: string
          supplier_id: string | null
          total: number
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          deleted_at?: string | null
          expected_date?: string | null
          id?: string
          notes?: string | null
          number: string
          order_date?: string
          status?: string
          supplier_id?: string | null
          total?: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          deleted_at?: string | null
          expected_date?: string | null
          id?: string
          notes?: string | null
          number?: string
          order_date?: string
          status?: string
          supplier_id?: string | null
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_items: {
        Row: {
          company_id: string
          created_at: string
          description: string
          id: string
          order_id: string
          product_id: string | null
          quantity: number
          subtotal: number
          unit_price: number
        }
        Insert: {
          company_id: string
          created_at?: string
          description: string
          id?: string
          order_id: string
          product_id?: string | null
          quantity?: number
          subtotal?: number
          unit_price?: number
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string
          id?: string
          order_id?: string
          product_id?: string | null
          quantity?: number
          subtotal?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_orders: {
        Row: {
          client_id: string | null
          company_id: string
          created_at: string
          deleted_at: string | null
          discount: number
          id: string
          notes: string | null
          number: string
          order_date: string
          status: string
          total: number
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          company_id: string
          created_at?: string
          deleted_at?: string | null
          discount?: number
          id?: string
          notes?: string | null
          number: string
          order_date?: string
          status?: string
          total?: number
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          company_id?: string
          created_at?: string
          deleted_at?: string | null
          discount?: number
          id?: string
          notes?: string | null
          number?: string
          order_date?: string
          status?: string
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_orders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          id: string
          movement_date: string
          product_id: string
          quantity: number
          reason: string | null
          reference: string | null
          type: string
          unit_cost: number | null
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          movement_date?: string
          product_id: string
          quantity: number
          reason?: string | null
          reference?: string | null
          type: string
          unit_cost?: number | null
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          movement_date?: string
          product_id?: string
          quantity?: number
          reason?: string | null
          reference?: string | null
          type?: string
          unit_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          company_id: string
          contact_name: string | null
          created_at: string
          deleted_at: string | null
          document: string | null
          email: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          company_id: string
          contact_name?: string | null
          created_at?: string
          deleted_at?: string | null
          document?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          company_id?: string
          contact_name?: string | null
          created_at?: string
          deleted_at?: string | null
          document?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assignee_id: string | null
          client_id: string | null
          company_id: string
          completed_at: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          due_date: string | null
          id: string
          priority: Database["public"]["Enums"]["task_priority"]
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
          vaga_id: string | null
        }
        Insert: {
          assignee_id?: string | null
          client_id?: string | null
          company_id: string
          completed_at?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"]
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
          vaga_id?: string | null
        }
        Update: {
          assignee_id?: string | null
          client_id?: string | null
          company_id?: string
          completed_at?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"]
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
          vaga_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_vaga_id_fkey"
            columns: ["vaga_id"]
            isOneToOne: false
            referencedRelation: "vagas"
            referencedColumns: ["id"]
          },
        ]
      }
      timesheet: {
        Row: {
          break_minutes: number
          check_in: string | null
          check_out: string | null
          company_id: string
          created_at: string
          id: string
          notes: string | null
          person_name: string
          profile_id: string | null
          total_hours: number | null
          updated_at: string
          work_date: string
        }
        Insert: {
          break_minutes?: number
          check_in?: string | null
          check_out?: string | null
          company_id: string
          created_at?: string
          id?: string
          notes?: string | null
          person_name: string
          profile_id?: string | null
          total_hours?: number | null
          updated_at?: string
          work_date: string
        }
        Update: {
          break_minutes?: number
          check_in?: string | null
          check_out?: string | null
          company_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          person_name?: string
          profile_id?: string | null
          total_hours?: number | null
          updated_at?: string
          work_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "timesheet_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      user_roles: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      vacations: {
        Row: {
          company_id: string
          created_at: string
          days: number
          deleted_at: string | null
          end_date: string
          id: string
          notes: string | null
          person_name: string
          profile_id: string | null
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          days: number
          deleted_at?: string | null
          end_date: string
          id?: string
          notes?: string | null
          person_name: string
          profile_id?: string | null
          start_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          days?: number
          deleted_at?: string | null
          end_date?: string
          id?: string
          notes?: string | null
          person_name?: string
          profile_id?: string | null
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vacations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "recruiter" | "financial" | "viewer"
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
      payroll_type: "salary" | "commission" | "bonus" | "other"
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
      task_priority: "low" | "medium" | "high" | "urgent"
      task_status: "todo" | "doing" | "done" | "cancelled"
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
      app_role: ["admin", "recruiter", "financial", "viewer"],
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
      payroll_type: ["salary", "commission", "bonus", "other"],
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
      task_priority: ["low", "medium", "high", "urgent"],
      task_status: ["todo", "doing", "done", "cancelled"],
      transaction_type: ["income", "expense"],
      user_role: ["admin", "recruiter", "financial", "viewer"],
      vaga_status: ["Aberta", "Em processo", "Fechada", "Encerrada"],
      work_model: ["onsite", "hybrid", "remote"],
    },
  },
} as const
