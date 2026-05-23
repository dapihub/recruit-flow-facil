import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Settings, Save, Building2, Phone, Mail, MapPin, CreditCard, Gavel, FileText } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useConfiguracoes, saveConfiguracoes, type Configuracoes } from "@/lib/store";

export const Route = createFileRoute("/_authenticated/configuracoes")({
  head: () => ({
    meta: [{ title: "Configurações — DAPI HUB" }],
  }),
  component: ConfiguracoesPage,
});

function ConfiguracoesPage() {
  const saved = useConfiguracoes();
  const [form, setForm] = useState<Configuracoes>({ ...saved });
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof Configuracoes>(k: K, v: Configuracoes[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveConfiguracoes(form);
      toast.success("Configurações salvas com sucesso.");
    } catch {
      toast.error("Erro ao salvar configurações.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Configurações"
        subtitle="Dados da empresa usados nos contratos e documentos"
        action={
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Salvando…" : "Salvar"}
          </Button>
        }
      />

      <div className="p-8 max-w-3xl space-y-8">

        <Section icon={Building2} title="Dados da Empresa (Contratada)">
          <Field label="Razão Social">
            <Input
              value={form.razaoSocial}
              onChange={(e) => set("razaoSocial", e.target.value)}
              placeholder="Ex.: 66.475.894 ANA CAROLINA DE CAMPOS"
            />
          </Field>
          <Field label="CNPJ">
            <Input
              value={form.cnpj}
              onChange={(e) => set("cnpj", e.target.value)}
              placeholder="00.000.000/0001-00"
            />
          </Field>
          <Field label="Nome do Representante">
            <Input
              value={form.representante}
              onChange={(e) => set("representante", e.target.value)}
              placeholder="Nome completo"
            />
          </Field>
          <Field label="Endereço Completo">
            <Textarea
              value={form.endereco}
              onChange={(e) => set("endereco", e.target.value)}
              placeholder="Rua, número, bairro, cidade/UF, CEP"
              rows={2}
            />
          </Field>
        </Section>

        <Section icon={Phone} title="Contato">
          <Field label="Telefone / WhatsApp">
            <Input
              value={form.telefone}
              onChange={(e) => set("telefone", e.target.value)}
              placeholder="(00) 00000-0000"
            />
          </Field>
          <Field label="E-mail">
            <Input
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="contato@empresa.com.br"
            />
          </Field>
        </Section>

        <Section icon={CreditCard} title="Dados de Pagamento">
          <Field label="Chave PIX (CNPJ)">
            <Input
              value={form.chavePix}
              onChange={(e) => set("chavePix", e.target.value)}
              placeholder="00.000.000/0001-00"
            />
          </Field>
        </Section>

        <Section icon={MapPin} title="Localização">
          <Field label="Local de Assinatura (contratos)">
            <Input
              value={form.localAssinatura}
              onChange={(e) => set("localAssinatura", e.target.value)}
              placeholder="Ex.: Rio de Janeiro/RJ"
            />
          </Field>
          <Field label="Foro de Eleição">
            <Input
              value={form.foro}
              onChange={(e) => set("foro", e.target.value)}
              placeholder="Ex.: Comarca da Capital do Rio de Janeiro/RJ"
            />
          </Field>
        </Section>

        <Section icon={FileText} title="Padrões de Contrato">
          <Field label="Prazo de Garantia Padrão">
            <Input
              value={form.prazoGarantiaPadrao}
              onChange={(e) => set("prazoGarantiaPadrao", e.target.value)}
              placeholder="Ex.: 90 (noventa) dias corridos"
            />
          </Field>
          <Field label="Máximo de Reposições Padrão">
            <Input
              value={form.maxReposicoesPadrao}
              onChange={(e) => set("maxReposicoesPadrao", e.target.value)}
              placeholder="Ex.: 3 (três) reposições"
            />
          </Field>
          <Field label="Prazo de Escolha Padrão">
            <Input
              value={form.prazoEscolhaPadrao}
              onChange={(e) => set("prazoEscolhaPadrao", e.target.value)}
              placeholder="Ex.: 30 (trinta) dias"
            />
          </Field>
        </Section>

      </div>
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card p-6 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground font-medium">{label}</Label>
      {children}
    </div>
  );
}
