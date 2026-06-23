import { createFileRoute } from "@tanstack/react-router";
import { MessageSquare } from "lucide-react";
import { Header } from "@/components/layout/Header";

export const Route = createFileRoute("/_authenticated/chat")({
  component: ChatPage,
});

function ChatPage() {
  return (
    <div className="flex flex-col min-h-full">
      <Header title="Chat" />
      <div className="flex-1 p-6 flex flex-col items-center justify-center py-20 text-center">
        <MessageSquare className="w-10 h-10 mb-4 opacity-20" style={{ color: "var(--fg-muted)" }} />
        <h3 className="text-base font-semibold mb-2" style={{ color: "var(--fg)" }}>Chat em breve</h3>
        <p className="text-sm max-w-xs" style={{ color: "var(--fg-muted)" }}>Comunicação em tempo real entre a equipe, com canais por vaga. Disponível na Fase 4.</p>
      </div>
    </div>
  );
}
