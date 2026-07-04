import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase/client";

export const Route = createFileRoute("/_authenticated/seed")({
  component: SeedPage,
});

function SeedPage() {
  const { profile } = useAuth();
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle");
  const [log, setLog] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState("");

  const append = (msg: string) => setLog((prev) => [...prev, msg]);

  async function runSeed() {
    const companyId = profile?.company_id;
    const userId = profile?.id;
    if (!companyId || !userId) {
      setErrorMsg("Perfil ou empresa não encontrada. Faça login novamente.");
      setStatus("error");
      return;
    }

    setStatus("running");
    setLog([]);
    setErrorMsg("");

    try {
      // ── IDs pré-gerados ──────────────────────────────────────
      const c1 = crypto.randomUUID(); // TechBridge Soluções
      const c2 = crypto.randomUUID(); // Nexus Desenvolvimento
      const c3 = crypto.randomUUID(); // Meridian Consultoria
      const c4 = crypto.randomUUID(); // Grupo Formiga

      const st1 = crypto.randomUUID(); // Prospecção
      const st2 = crypto.randomUUID(); // Qualificação
      const st3 = crypto.randomUUID(); // Proposta Enviada
      const st4 = crypto.randomUUID(); // Negociação
      const st5 = crypto.randomUUID(); // Ganho (final/won)
      const st6 = crypto.randomUUID(); // Perdido (final/lost)

      const j1 = crypto.randomUUID(); // Head de Produto
      const j2 = crypto.randomUUID(); // Tech Lead
      const j3 = crypto.randomUUID(); // Gerente de Marketing
      const j4 = crypto.randomUUID(); // Dev Senior
      const j5 = crypto.randomUUID(); // Analista de RH (closed)
      const j6 = crypto.randomUUID(); // UX Designer

      // ── 1. Clientes ──────────────────────────────────────────
      append("Inserindo clientes...");
      const { error: eClients } = await supabase.from("clients").insert([
        {
          id: c1,
          company_id: companyId,
          name: "TechBridge Soluções",
          email: "rh@techbridge.com.br",
          phone: "(11) 3204-7800",
          cnpj: "12.345.678/0001-90",
          city: "São Paulo",
          state: "SP",
          website: "https://techbridge.com.br",
          notes: "Fintech em expansão acelerada. Contratações frequentes de tech e produto.",
          is_active: true,
          person_type: "pj",
        },
        {
          id: c2,
          company_id: companyId,
          name: "Nexus Desenvolvimento",
          email: "people@nexus.dev",
          phone: "(21) 2255-3400",
          cnpj: "98.765.432/0001-11",
          city: "Rio de Janeiro",
          state: "RJ",
          website: "https://nexus.dev",
          notes: "Software house especializada em projetos para o setor financeiro.",
          is_active: true,
          person_type: "pj",
        },
        {
          id: c3,
          company_id: companyId,
          name: "Meridian Consultoria",
          email: "operacoes@meridian.com.br",
          phone: "(11) 4007-2290",
          cnpj: "55.123.999/0001-44",
          city: "São Paulo",
          state: "SP",
          website: "https://meridian.com.br",
          notes: "Consultoria de gestão. Parceiro de longa data, sempre paga em dia.",
          is_active: true,
          person_type: "pj",
        },
        {
          id: c4,
          company_id: companyId,
          name: "Grupo Formiga",
          email: "rh@grupoformiga.com.br",
          phone: "(31) 3030-5500",
          cnpj: "44.222.111/0001-77",
          city: "Belo Horizonte",
          state: "MG",
          website: "https://grupoformiga.com.br",
          notes: "Varejo tradicional. Processo seletivo lento, briefing pouco claro.",
          is_active: true,
          person_type: "pj",
        },
      ]);
      if (eClients) throw new Error(`Clientes: ${eClients.message}`);
      append("✓ 4 clientes inseridos");

      // ── 2. Contatos ──────────────────────────────────────────
      append("Inserindo contatos...");
      const { error: eContacts } = await supabase.from("contacts").insert([
        { company_id: companyId, client_id: c1, name: "Renata Souza", role: "Head de People & Culture", email: "renata.souza@techbridge.com.br", phone: "(11) 98765-4321", linkedin: "linkedin.com/in/renata-souza" },
        { company_id: companyId, client_id: c1, name: "Bruno Alves", role: "CTO", email: "bruno.alves@techbridge.com.br", phone: "(11) 97654-3210", linkedin: "linkedin.com/in/brunoalves-cto" },
        { company_id: companyId, client_id: c2, name: "Patrícia Melo", role: "Gerente de RH", email: "patricia.melo@nexus.dev", phone: "(21) 99988-7766", linkedin: "linkedin.com/in/patriciamelo" },
        { company_id: companyId, client_id: c2, name: "Carlos Drummond", role: "Diretor de Engenharia", email: "carlos.drummond@nexus.dev", phone: "(21) 98877-6655" },
        { company_id: companyId, client_id: c3, name: "Fernanda Lima", role: "Sócia-Diretora", email: "fernanda.lima@meridian.com.br", phone: "(11) 99111-2233", linkedin: "linkedin.com/in/fernandalima-rh" },
        { company_id: companyId, client_id: c3, name: "Marcos Vinícius", role: "Coordenador de RH", email: "marcos.v@meridian.com.br", phone: "(11) 99222-3344" },
        { company_id: companyId, client_id: c4, name: "José Antônio Costa", role: "Diretor de RH", email: "jose.costa@grupoformiga.com.br", phone: "(31) 99333-4455" },
        { company_id: companyId, client_id: c4, name: "Cláudia Rocha", role: "Analista de RH Sênior", email: "claudia.rocha@grupoformiga.com.br", phone: "(31) 99444-5566" },
      ]);
      if (eContacts) throw new Error(`Contatos: ${eContacts.message}`);
      append("✓ 8 contatos inseridos");

      // ── 3. CRM Stages ────────────────────────────────────────
      append("Inserindo etapas do CRM...");
      const { error: eStages } = await supabase.from("crm_stages").insert([
        { id: st1, company_id: companyId, name: "Prospecção", color: "#6366f1", order: 1, probability: 10, is_final: false },
        { id: st2, company_id: companyId, name: "Qualificação", color: "#8b5cf6", order: 2, probability: 25, is_final: false },
        { id: st3, company_id: companyId, name: "Proposta Enviada", color: "#f59e0b", order: 3, probability: 50, is_final: false },
        { id: st4, company_id: companyId, name: "Negociação", color: "#f97316", order: 4, probability: 75, is_final: false },
        { id: st5, company_id: companyId, name: "Ganho", color: "#10b981", order: 5, probability: 100, is_final: true, outcome: "won" },
        { id: st6, company_id: companyId, name: "Perdido", color: "#6b7280", order: 6, probability: 0, is_final: true, outcome: "lost" },
      ]);
      if (eStages) throw new Error(`CRM Stages: ${eStages.message}`);
      append("✓ 6 etapas de CRM inseridas");

      // ── 4. Vagas ─────────────────────────────────────────────
      append("Inserindo vagas...");
      const today = new Date().toISOString().split("T")[0];
      const inTwoWeeks = new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0];
      const inThreeWeeks = new Date(Date.now() + 21 * 86400000).toISOString().split("T")[0];
      const nextMonth = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];
      const lastWeek = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];

      const { error: eJobs } = await supabase.from("jobs").insert([
        {
          id: j1,
          company_id: companyId,
          client_id: c1,
          title: "Head de Produto",
          status: "interviewing",
          priority: "urgent",
          seniority: "senior",
          department: "Produto",
          location: "São Paulo, SP",
          work_model: "hybrid",
          contract_type: "clt",
          salary_min: 18000,
          salary_max: 25000,
          fee_model: "salary_pct",
          fee_value: 20,
          headcount: 1,
          is_exclusive: true,
          deadline: inTwoWeeks,
          description: "Buscamos Head de Produto para liderar o roadmap de produtos financeiros. Experiência com metodologias ágeis e squads cross-funcionais.",
          required_skills: "Product Management, OKRs, Discovery, Roadmap, Dados",
          recruiter_id: userId,
        },
        {
          id: j2,
          company_id: companyId,
          client_id: c1,
          title: "Tech Lead (Back-end)",
          status: "screening",
          priority: "high",
          seniority: "senior",
          department: "Engenharia",
          location: "São Paulo, SP",
          work_model: "remote",
          contract_type: "pj",
          salary_min: 14000,
          salary_max: 18000,
          fee_model: "fixed",
          fee_value: 15000,
          headcount: 1,
          is_exclusive: false,
          deadline: inThreeWeeks,
          description: "Tech Lead para liderar squads de back-end em projetos de alta escala. Arquitetura de microsserviços.",
          required_skills: "Java, Kotlin, AWS, Kafka, Microsserviços",
          recruiter_id: userId,
        },
        {
          id: j3,
          company_id: companyId,
          client_id: c2,
          title: "Gerente de Marketing Digital",
          status: "open",
          priority: "medium",
          seniority: "mid",
          department: "Marketing",
          location: "Rio de Janeiro, RJ",
          work_model: "onsite",
          contract_type: "clt",
          salary_min: 9000,
          salary_max: 12000,
          fee_model: "salary_pct",
          fee_value: 18,
          headcount: 1,
          is_exclusive: false,
          deadline: nextMonth,
          description: "Gerente para conduzir estratégia de growth e performance. Experiência com equipes de 5+ pessoas.",
          required_skills: "Google Ads, Meta Ads, SEO, Analytics, Growth",
          recruiter_id: userId,
        },
        {
          id: j4,
          company_id: companyId,
          client_id: c3,
          title: "Desenvolvedor Full Stack Sênior",
          status: "interviewing",
          priority: "high",
          seniority: "senior",
          department: "Tecnologia",
          location: "São Paulo, SP",
          work_model: "remote",
          contract_type: "pj",
          salary_min: 12000,
          salary_max: 16000,
          fee_model: "fixed",
          fee_value: 12000,
          headcount: 2,
          is_exclusive: true,
          deadline: inTwoWeeks,
          description: "Desenvolvedor Sênior para projetos de consultoria em clientes de grande porte.",
          required_skills: "React, Node.js, TypeScript, PostgreSQL, Docker",
          recruiter_id: userId,
        },
        {
          id: j5,
          company_id: companyId,
          client_id: c4,
          title: "Analista de RH Pleno",
          status: "closed",
          priority: "low",
          seniority: "mid",
          department: "RH",
          location: "Belo Horizonte, MG",
          work_model: "onsite",
          contract_type: "clt",
          salary_min: 4500,
          salary_max: 6000,
          fee_model: "salary_pct",
          fee_value: 15,
          headcount: 1,
          is_exclusive: false,
          deadline: lastWeek,
          description: "Analista para suportar processos de recrutamento interno e rotinas de RH.",
          required_skills: "DP, Recrutamento, Excel, TOTVS",
          closed_at: lastWeek,
          recruiter_id: userId,
        },
        {
          id: j6,
          company_id: companyId,
          client_id: c1,
          title: "UX Designer Sênior",
          status: "proposal",
          priority: "medium",
          seniority: "senior",
          department: "Design",
          location: "São Paulo, SP",
          work_model: "hybrid",
          contract_type: "pj",
          salary_min: 10000,
          salary_max: 13000,
          fee_model: "fixed",
          fee_value: 9000,
          headcount: 1,
          is_exclusive: false,
          deadline: nextMonth,
          description: "Designer Sênior para redesenho da plataforma de crédito. Experiência em produtos financeiros.",
          required_skills: "Figma, Design System, Research, Prototipagem",
          recruiter_id: userId,
        },
      ]);
      if (eJobs) throw new Error(`Vagas: ${eJobs.message}`);
      append("✓ 6 vagas inseridas");

      // ── 5. Tarefas ───────────────────────────────────────────
      append("Inserindo tarefas...");
      const { error: eTasks } = await supabase.from("tasks").insert([
        { company_id: companyId, assignee_id: userId, job_id: j1, title: "Enviar shortlist para TechBridge — Head de Produto", status: "in_progress", priority: "urgent", due_date: inTwoWeeks, description: "Selecionar os 3 melhores perfis da triagem e enviar ao cliente com análise comparativa." },
        { company_id: companyId, assignee_id: userId, job_id: j2, title: "Publicar vaga de Tech Lead no LinkedIn", status: "done", priority: "high", due_date: today },
        { company_id: companyId, assignee_id: userId, job_id: j4, title: "Agendar entrevista técnica — Dev Full Stack #3", status: "in_review", priority: "high", due_date: inTwoWeeks },
        { company_id: companyId, assignee_id: userId, job_id: j3, title: "Briefing da vaga de Marketing com Patrícia Melo", status: "not_started", priority: "medium", due_date: inThreeWeeks },
        { company_id: companyId, assignee_id: userId, title: "Atualizar proposta comercial — Meridian", status: "not_started", priority: "medium", due_date: nextMonth },
        { company_id: companyId, assignee_id: userId, title: "Follow-up: cobrança parcela 2 — TechBridge (Head de Produto)", status: "not_started", priority: "high", due_date: nextMonth },
        { company_id: companyId, assignee_id: userId, job_id: j6, title: "Triagem de currículos — UX Designer", status: "in_progress", priority: "medium", due_date: inThreeWeeks },
        { company_id: companyId, assignee_id: userId, title: "Preparar relatório mensal de vagas — Junho 2026", status: "not_started", priority: "low", due_date: nextMonth },
      ]);
      if (eTasks) throw new Error(`Tarefas: ${eTasks.message}`);
      append("✓ 8 tarefas inseridas");

      // ── 6. Reuniões ──────────────────────────────────────────
      append("Inserindo reuniões...");
      const tomorrow = new Date(Date.now() + 86400000).toISOString();
      const in3Days = new Date(Date.now() + 3 * 86400000).toISOString();
      const in5Days = new Date(Date.now() + 5 * 86400000).toISOString();
      const yesterday = new Date(Date.now() - 86400000).toISOString();
      const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString();

      const { error: eMeetings } = await supabase.from("meetings").insert([
        { company_id: companyId, client_id: c1, title: "Entrevista final — Head de Produto (TechBridge)", type: "video_call", status: "scheduled", scheduled_at: tomorrow, duration_min: 90, video_link: "https://meet.google.com/abc-defg-hij", agenda: "Apresentação ao CEO e Head de Engenharia. Foco em visão de produto e liderança." },
        { company_id: companyId, client_id: c3, title: "Briefing — Dev Full Stack Sênior (Meridian)", type: "video_call", status: "scheduled", scheduled_at: in3Days, duration_min: 60, video_link: "https://meet.google.com/xyz-aaaa-bbb", agenda: "Alinhamento de perfil técnico, metodologia de trabalho e expectativas do time." },
        { company_id: companyId, client_id: c1, title: "Kick-off — Vaga UX Designer (TechBridge)", type: "video_call", status: "scheduled", scheduled_at: in5Days, duration_min: 45, video_link: "https://meet.google.com/kkk-llll-mmm" },
        { company_id: companyId, client_id: c4, title: "Apresentação shortlist — Analista de RH (Grupo Formiga)", type: "call", status: "completed", scheduled_at: twoDaysAgo, duration_min: 30, notes: "Cliente aprovou 2 dos 3 candidatos apresentados. Prosseguir com entrevistas na próxima semana." },
        { company_id: companyId, client_id: c2, title: "Alinhamento mensal — Nexus Desenvolvimento", type: "video_call", status: "completed", scheduled_at: yesterday, duration_min: 60, notes: "Discutida abertura de 2 novas vagas para Q3. Aguardando aprovação de budget interno." },
      ]);
      if (eMeetings) throw new Error(`Reuniões: ${eMeetings.message}`);
      append("✓ 5 reuniões inseridas");

      // ── 7. Transações ────────────────────────────────────────
      append("Inserindo transações financeiras...");
      const m1 = new Date(); m1.setDate(1); // início do mês atual
      const fmt = (d: Date) => d.toISOString().split("T")[0];
      const daysAgo = (n: number) => fmt(new Date(Date.now() - n * 86400000));
      const daysAhead = (n: number) => fmt(new Date(Date.now() + n * 86400000));

      const { error: eTx } = await supabase.from("transactions").insert([
        // Receitas pagas
        { company_id: companyId, client_id: c4, type: "income", status: "paid", amount: 5625, date: daysAgo(20), description: "Fee — Analista de RH (Grupo Formiga) — Parcela 1/1", paid_at: daysAgo(20) },
        { company_id: companyId, client_id: c3, type: "income", status: "paid", amount: 6000, date: daysAgo(15), description: "Fee — Dev Full Stack Sênior (Meridian) — Parcela 1/2", paid_at: daysAgo(15) },
        { company_id: companyId, client_id: c1, type: "income", status: "paid", amount: 18750, date: daysAgo(8), description: "Fee — Head de Produto (TechBridge) — Parcela 1/2", paid_at: daysAgo(8) },
        // Receitas pendentes
        { company_id: companyId, client_id: c1, type: "income", status: "pending", amount: 18750, date: today, description: "Fee — Head de Produto (TechBridge) — Parcela 2/2", due_date: daysAhead(30) },
        { company_id: companyId, client_id: c3, type: "income", status: "pending", amount: 6000, date: today, description: "Fee — Dev Full Stack Sênior (Meridian) — Parcela 2/2", due_date: daysAhead(45) },
        { company_id: companyId, client_id: c1, type: "income", status: "pending", amount: 9000, date: today, description: "Fee — UX Designer (TechBridge)", due_date: daysAhead(15) },
        // Receita vencida
        { company_id: companyId, client_id: c2, type: "income", status: "overdue", amount: 4320, date: daysAgo(35), description: "Fee — Gerente de Marketing (Nexus) — Parcela 1/1", due_date: daysAgo(5) },
        // Despesas pagas
        { company_id: companyId, type: "expense", status: "paid", amount: 3500, date: daysAgo(25), description: "Salário — Consultora Júnior (Marina)", paid_at: daysAgo(25) },
        { company_id: companyId, type: "expense", status: "paid", amount: 890, date: daysAgo(10), description: "LinkedIn Recruiter — Assinatura mensal", paid_at: daysAgo(10) },
        { company_id: companyId, type: "expense", status: "paid", amount: 320, date: daysAgo(12), description: "Software de triagem (ATS) — Junho 2026", paid_at: daysAgo(12) },
        // Despesas pendentes
        { company_id: companyId, type: "expense", status: "pending", amount: 3500, date: today, description: "Salário — Consultora Júnior (Marina) — Julho", due_date: daysAhead(5) },
        { company_id: companyId, type: "expense", status: "pending", amount: 890, date: today, description: "LinkedIn Recruiter — Assinatura mensal — Julho", due_date: daysAhead(5) },
      ]);
      if (eTx) throw new Error(`Transações: ${eTx.message}`);
      append("✓ 12 transações inseridas");

      // ── 8. CRM Oportunidades ─────────────────────────────────
      append("Inserindo oportunidades de CRM...");
      const { error: eOpps } = await supabase.from("crm_opportunities").insert([
        { company_id: companyId, client_id: c1, assignee_id: userId, stage_id: st4, title: "Contrato Anual — TechBridge (6 vagas)", value: 85000, probability: 75, expected_close: daysAhead(14), notes: "Cliente sinalizou aprovação por parte da diretoria. Aguardando assinatura do contrato." },
        { company_id: companyId, client_id: c2, assignee_id: userId, stage_id: st2, title: "Projeto RPO — Nexus Desenvolvimento", value: 42000, probability: 25, expected_close: daysAhead(45), notes: "Reunião de qualificação realizada. Nexus avalia RPO vs. contratação direta." },
        { company_id: companyId, client_id: c3, assignee_id: userId, stage_id: st3, title: "Retainer Mensal — Meridian Consultoria", value: 28000, probability: 50, expected_close: daysAhead(20), notes: "Proposta de R$ 7k/mês (4 meses mínimo) enviada em 20/06. Aguardando retorno." },
        { company_id: companyId, assignee_id: userId, stage_id: st1, title: "Expansão Operacional Q3 — Startup Fintech (lead frio)", value: 18000, probability: 10, expected_close: daysAhead(60), lead_name: "Felipe Mendes", lead_email: "felipe.mendes@nova-fintech.com.br", notes: "Lead captado via indicação da TechBridge. Primeira reunião a agendar." },
        { company_id: companyId, client_id: c1, assignee_id: userId, stage_id: st5, title: "Fee — Head de Produto (Ganho)", value: 37500, probability: 100, expected_close: daysAgo(8), notes: "Vaga fechada com sucesso. Fee recebido parcialmente." },
      ]);
      if (eOpps) throw new Error(`Oportunidades: ${eOpps.message}`);
      append("✓ 5 oportunidades inseridas");

      // ── 9. Avaliações de Clientes ────────────────────────────
      append("Inserindo avaliações de clientes...");
      const evalDate = daysAgo(10);
      const { error: eRatings } = await supabase.from("client_ratings").insert([
        { company_id: companyId, client_id: c1, evaluator_id: userId, payment_timeliness: 9, briefing_clarity: 9, feedback_agility: 9, volume_potential: 10, referral_potential: 9, overall_score: 9.2, evaluated_at: evalDate, notes: "Excelente cliente. Pagamentos sempre adiantados. Briefing muito detalhado. Indicaria para outros headhunters." },
        { company_id: companyId, client_id: c2, evaluator_id: userId, payment_timeliness: 7, briefing_clarity: 7, feedback_agility: 8, volume_potential: 8, referral_potential: 7, overall_score: 7.4, evaluated_at: evalDate, notes: "Processo de aprovação interno lento, mas equipe de RH bastante colaborativa." },
        { company_id: companyId, client_id: c3, evaluator_id: userId, payment_timeliness: 10, briefing_clarity: 8, feedback_agility: 9, volume_potential: 7, referral_potential: 9, overall_score: 8.6, evaluated_at: evalDate, notes: "Meridian é nosso melhor parceiro. Nunca houve atraso de pagamento em 2 anos de parceria." },
        { company_id: companyId, client_id: c4, evaluator_id: userId, payment_timeliness: 5, briefing_clarity: 4, feedback_agility: 5, volume_potential: 6, referral_potential: 4, overall_score: 4.8, evaluated_at: evalDate, notes: "Processo muito burocrático. Briefing vago, demora no retorno de entrevistas. Reavaliar manutenção da parceria." },
      ]);
      if (eRatings) throw new Error(`Avaliações: ${eRatings.message}`);
      append("✓ 4 avaliações de clientes inseridas");

      // ── 10. Folha de Pagamento ───────────────────────────────
      append("Inserindo lançamentos de folha...");
      const refMonth = fmt(m1).substring(0, 7); // YYYY-MM
      const { error: ePayroll } = await supabase.from("payroll_entries").insert([
        { company_id: companyId, person_name: "Marina Oliveira", role: "Consultora de Recrutamento", type: "salary", amount: 3500, reference_month: refMonth, status: "paid", payment_date: daysAgo(5) },
        { company_id: companyId, person_name: "Ana (você)", role: "Sócia-Fundadora", type: "commission", amount: 12000, reference_month: refMonth, status: "paid", payment_date: daysAgo(3), notes: "Comissão sobre fechamento — Head de Produto TechBridge" },
        { company_id: companyId, person_name: "Prestadora — Triagem Freelance", role: "Headhunter Freelance", type: "other", amount: 1800, reference_month: refMonth, status: "pending", notes: "Triagem das vagas de dev — NF pendente" },
      ]);
      if (ePayroll) throw new Error(`Folha: ${ePayroll.message}`);
      append("✓ 3 lançamentos de folha inseridos");

      append("");
      append("🎉 Seed concluído! Recarregue qualquer página para ver os dados.");
      setStatus("done");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
      setStatus("error");
    }
  }

  async function clearSeed() {
    const companyId = profile?.company_id;
    if (!companyId) return;
    if (!confirm("Isso vai apagar TODOS os dados da empresa. Continuar?")) return;

    setStatus("running");
    setLog(["Limpando dados..."]);

    const tables = [
      "client_ratings", "crm_opportunities", "crm_stages",
      "transactions", "payroll_entries", "meetings",
      "tasks", "contacts", "jobs", "clients",
    ] as const;

    for (const table of tables) {
      await (supabase.from(table) as any).delete().eq("company_id", companyId);
      append(`✓ ${table} limpo`);
    }
    append("✓ Dados apagados.");
    setStatus("idle");
  }

  return (
    <div className="flex flex-col min-h-full">
      <Header title="Seed de Dados" subtitle="Ferramenta de desenvolvimento — apenas para teste" />

      <div className="flex-1 p-6 max-w-xl">
        <div
          className="rounded-xl p-6 space-y-4"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          <div>
            <p className="text-sm font-semibold mb-1" style={{ color: "var(--fg)" }}>
              Dados fictícios para demonstração
            </p>
            <p className="text-xs" style={{ color: "var(--fg-muted)" }}>
              Insere clientes, vagas, tarefas, reuniões, transações, CRM e ranking realistas para a agência <strong>DAPI Hub</strong>.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={runSeed}
              disabled={status === "running"}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-opacity disabled:opacity-60"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              {status === "running" ? "Inserindo…" : "🚀 Inserir dados de demonstração"}
            </button>
            <button
              onClick={clearSeed}
              disabled={status === "running"}
              className="px-4 py-2.5 rounded-lg text-sm font-medium transition-opacity disabled:opacity-60"
              style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "#ef4444" }}
            >
              Limpar tudo
            </button>
          </div>

          {log.length > 0 && (
            <div
              className="rounded-lg p-3 font-mono text-xs space-y-0.5 max-h-72 overflow-y-auto"
              style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
            >
              {log.map((line, i) => (
                <p key={i} style={{ color: line.startsWith("✓") || line.startsWith("🎉") ? "#10b981" : line === "" ? "transparent" : "var(--fg-muted)" }}>
                  {line || "."}
                </p>
              ))}
            </div>
          )}

          {status === "error" && (
            <p className="text-xs rounded-lg px-3 py-2" style={{ color: "#ef4444", background: "#ef444410" }}>
              Erro: {errorMsg}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
