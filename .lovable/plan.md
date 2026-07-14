# Auditoria do sistema — Recruit Flow → ERP completo

## 1. Diagnóstico atual

### O que já existe e funciona
- **Autenticação** (Supabase) com perfis e multi-empresa (`company_id`)
- **Módulos operacionais**: Vagas, Candidatos, Tarefas, Agenda, Reuniões, Chat
- **Comercial**: CRM, Clientes, Contatos, Ranking
- **Financeiro**: Transações, Categorias, Custos, Faturas
- **Configurações** + Dashboard + Relatórios
- **Design**: paleta Midnight Indigo + Space Grotesk / DM Sans já aplicada

### Problemas críticos encontrados

**A) Erros de tipagem (build quebrando)** — 32 erros TS
- Rotas TanStack: `to="/dashboard"` etc. rejeitados porque `routeTree.gen.ts` está desatualizado
- Sidebar.tsx: falta prop `search` no `<Link>`
- Consequência: tipos não confiáveis, autocomplete quebrado

**B) Tabelas referenciadas em código que NÃO existem no banco**
- `useFinanceiro.ts` usa `payroll_entries` → não existe
- `useSettings.ts` usa `invites`, `crm_stages` → não existem
- `useCrm.ts` provavelmente idem
- Consequência: telas de folha, convites e etapas do CRM quebram em runtime

**C) Gaps para ser um ERP completo**
Faltam módulos essenciais:
- **Estoque / Produtos** (SKU, entrada, saída, saldo)
- **Compras / Fornecedores** (pedidos, cotações)
- **Vendas / Pedidos** (orçamento → pedido → NF)
- **Contas a pagar / receber** separadas (hoje é tudo `transactions`)
- **Fluxo de caixa** projetado
- **DRE / Balanço** simplificado
- **RH**: folha de pagamento real (tabela + cálculo), férias, ponto
- **Documentos / Anexos** (Supabase Storage)
- **Notificações** in-app
- **Logs de auditoria** (quem alterou o quê)
- **Permissões por papel** (hoje só existe coluna `role`, sem enforcement)

**D) Design / UX**
- Sem tema escuro consistente (variáveis existem mas nem toda tela usa)
- Sidebar sem indicador de módulo ativo em subgrupos
- Falta command palette (⌘K) para navegação rápida
- Dashboard genérico — sem widgets por módulo/papel
- Tabelas sem: filtros salvos, exportar CSV, colunas customizáveis
- Falta breadcrumbs e page headers padronizados
- Formulários longos sem seções colapsáveis

## 2. Roadmap proposto (em fases)

### Fase 1 — Estabilização (obrigatória antes de tudo)
1. Regenerar `routeTree.gen.ts` e corrigir os 32 erros TS
2. Criar migrations para tabelas faltantes: `payroll_entries`, `invites`, `crm_stages`, `user_roles` (segurança), `audit_log`
3. Implementar `has_role()` + RLS baseada em papel real
4. Corrigir Sidebar (prop `search`) e padronizar `<Link>` tipados

### Fase 2 — Núcleo ERP faltante
5. **Produtos & Estoque**: tabelas `products`, `stock_movements`, tela CRUD + saldo
6. **Fornecedores & Compras**: `suppliers`, `purchase_orders`, `purchase_items`
7. **Vendas & Pedidos**: `sales_orders`, `sales_items`, ligação com clientes
8. **Financeiro reformulado**:
   - Separar contas a pagar/receber (view sobre `transactions` com filtros)
   - Fluxo de caixa projetado (gráfico 30/60/90 dias)
   - DRE mensal simplificado
9. **RH**: folha completa (holerite, encargos), controle de férias

### Fase 3 — Plataforma
10. **Storage**: bucket para anexos (candidatos, clientes, transações)
11. **Notificações** in-app com realtime
12. **Audit log** cross-módulo
13. **Exportação CSV/PDF** em todas as listagens
14. **Command palette** (⌘K) global

### Fase 4 — Polimento de design
15. Dashboard com widgets por papel (admin, recruiter, financial, viewer)
16. Padronizar PageHeader + Breadcrumbs em todas rotas
17. Tema escuro completo revisado
18. Tabelas com DataTable único (filtros salvos, colunas, densidade)
19. Empty states + skeletons consistentes

## 3. Detalhes técnicos

- Stack mantido: React 18 + Vite + TanStack Router/Query + Tailwind + shadcn + Supabase
- Nenhuma reescrita — reaproveitamento máximo dos hooks existentes
- Migrations com `GRANT` + `RLS` + policies por `company_id` e `has_role()`
- Novos módulos seguem padrão: `hooks/useX.ts` + `routes/_authenticated/x.tsx` + `components/x/XForm.tsx`

## 4. Decisão necessária

O escopo total é grande (4 fases, dezenas de migrations e telas). Como você quer prosseguir?

**Opção A — Só Fase 1 agora** (estabilizar erros + tabelas faltantes). Rápido, ~1 iteração.

**Opção B — Fase 1 + 2** (ERP funcional: adiciona Produtos/Estoque, Compras, Vendas, Financeiro reformulado). Várias iterações.

**Opção C — Roadmap completo** (todas as 4 fases, sequencial). Vários dias de trabalho, entregas incrementais.

**Opção D — Você escolhe módulos específicos** das listas acima (ex.: "quero só Produtos + Estoque + Notificações").

Me diga qual caminho seguir e eu começo pela Fase 1 imediatamente após confirmação.
