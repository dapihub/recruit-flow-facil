import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Star, Plus, Pencil, Trash2, Award, Building2 } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { PageKpis, KpiItem } from "@/components/layout/PageKpis";
import { EmptyState } from "@/components/ui/EmptyState";
import { RatingForm } from "@/components/ranking/RatingForm";
import { useClientRatings, useDeleteRating, type ClientRating } from "@/hooks/useRanking";
import { useClients } from "@/hooks/useClients";

export const Route = createFileRoute("/_authenticated/ranking")({
  component: RankingPage,
});

const CRITERIA_LABELS = {
  payment_timeliness: "Pontualidade",
  briefing_clarity: "Briefing",
  feedback_agility: "Feedback",
  volume_potential: "Volume",
  referral_potential: "Indicação",
};

function RankingPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<{
    id: string;
    name: string;
    existingRating?: ClientRating;
  } | null>(null);

  const { data: ratings = [], isLoading: ratingsLoading } = useClientRatings();
  const { data: clients = [], isLoading: clientsLoading } = useClients();
  const deleteRating = useDeleteRating();

  // Latest rating per client
  const latestRatingByClient = useMemo(() => {
    const map = new Map<string, ClientRating>();
    for (const r of ratings) {
      const existing = map.get(r.client_id);
      if (!existing || new Date(r.created_at) > new Date(existing.created_at)) {
        map.set(r.client_id, r);
      }
    }
    return map;
  }, [ratings]);

  // Merge clients with their ratings, sorted by score (desc) then name
  const rows = useMemo(() => {
    return clients
      .map((c) => ({
        client: c,
        rating: latestRatingByClient.get(c.id) ?? null,
      }))
      .sort((a, b) => {
        if (a.rating && b.rating)
          return b.rating.overall_score - a.rating.overall_score;
        if (a.rating) return -1;
        if (b.rating) return 1;
        return a.client.name.localeCompare(b.client.name);
      });
  }, [clients, latestRatingByClient]);

  const ratedCount = rows.filter((r) => r.rating).length;
  const avgScore =
    ratedCount > 0
      ? rows
          .filter((r) => r.rating)
          .reduce((s, r) => s + r.rating!.overall_score, 0) / ratedCount
      : 0;
  const topClient = rows.find((r) => r.rating);

  function openRating(clientId: string, clientName: string, existingRating?: ClientRating) {
    setSelectedClient({ id: clientId, name: clientName, existingRating });
    setFormOpen(true);
  }

  function handleClose() {
    setFormOpen(false);
    setSelectedClient(null);
  }

  const isLoading = ratingsLoading || clientsLoading;

  return (
    <div className="flex flex-col min-h-full">
      <Header
        title="Ranking de Clientes"
        subtitle="Avaliação de parceiros contratantes"
      />

      <PageKpis>
        <KpiItem label="Clientes Avaliados" value={`${ratedCount} / ${clients.length}`} accent />
        <KpiItem label="Score Médio" value={ratedCount > 0 ? avgScore.toFixed(1) : "—"} />
        <KpiItem
          label="Melhor Avaliado"
          value={topClient?.client.name.split(" ")[0] ?? "—"}
        />
      </PageKpis>

      <div className="flex-1 px-6 pb-6">
        {isLoading ? (
          <TableSkeleton />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="Nenhum cliente para avaliar"
            description="Cadastre clientes primeiro. Depois você pode atribuir notas de 1 a 10 em pontualidade, clareza de briefing, agilidade de feedback e potencial de indicação."
            action={
              <Link
                to="/clientes"
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium"
                style={{ background: "var(--accent)", color: "#fff" }}
              >
                <Plus className="w-4 h-4" /> Cadastrar clientes
              </Link>
            }
          />
        ) : (
          <div
            className="rounded-xl overflow-hidden"
            style={{ border: "1px solid var(--border)" }}
          >
            <table className="w-full text-sm">
              <thead>
                <tr
                  style={{
                    background: "var(--bg-card)",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <th
                    className="px-4 py-3 text-left text-xs font-medium w-8"
                    style={{ color: "var(--fg-muted)" }}
                  >
                    #
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium"
                    style={{ color: "var(--fg-muted)" }}
                  >
                    Cliente
                  </th>
                  {Object.values(CRITERIA_LABELS).map((l) => (
                    <th
                      key={l}
                      className="px-4 py-3 text-center text-xs font-medium hidden md:table-cell"
                      style={{ color: "var(--fg-muted)" }}
                    >
                      {l}
                    </th>
                  ))}
                  <th
                    className="px-4 py-3 text-center text-xs font-medium"
                    style={{ color: "var(--fg-muted)" }}
                  >
                    Score
                  </th>
                  <th className="px-4 py-3 w-24" />
                </tr>
              </thead>
              <tbody>
                {rows.map(({ client, rating }, i) => {
                  const rank = i + 1;
                  const scoreColor = rating
                    ? rating.overall_score >= 8
                      ? "#10b981"
                      : rating.overall_score >= 5
                      ? "#f59e0b"
                      : "#ef4444"
                    : "var(--fg-muted)";

                  return (
                    <tr
                      key={client.id}
                      style={{
                        background:
                          i % 2 === 0 ? "var(--bg)" : "var(--bg-card)",
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      <td className="px-4 py-3">
                        {rank <= 3 && rating ? (
                          <span
                            className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold"
                            style={{
                              background:
                                rank === 1
                                  ? "#f59e0b22"
                                  : rank === 2
                                  ? "#6b728022"
                                  : "#92400e22",
                              color:
                                rank === 1
                                  ? "#f59e0b"
                                  : rank === 2
                                  ? "#6b7280"
                                  : "#92400e",
                            }}
                          >
                            {rank}
                          </span>
                        ) : (
                          <span
                            className="text-xs"
                            style={{ color: "var(--fg-muted)" }}
                          >
                            {rank}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                            style={{
                              background: "var(--accent)22",
                              color: "var(--accent)",
                            }}
                          >
                            {client.name.charAt(0).toUpperCase()}
                          </div>
                          <span
                            className="font-medium"
                            style={{ color: "var(--fg)" }}
                          >
                            {client.name}
                          </span>
                        </div>
                      </td>
                      {(
                        Object.keys(CRITERIA_LABELS) as (keyof typeof CRITERIA_LABELS)[]
                      ).map((key) => (
                        <td
                          key={key}
                          className="px-4 py-3 text-center hidden md:table-cell"
                        >
                          {rating ? (
                            <ScorePip value={rating[key]} />
                          ) : (
                            <span style={{ color: "var(--border)" }}>—</span>
                          )}
                        </td>
                      ))}
                      <td className="px-4 py-3 text-center">
                        {rating ? (
                          <span
                            className="text-base font-bold tabular-nums"
                            style={{ color: scoreColor }}
                          >
                            {rating.overall_score.toFixed(1)}
                          </span>
                        ) : (
                          <span
                            className="text-xs italic"
                            style={{ color: "var(--fg-muted)" }}
                          >
                            Não avaliado
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            onClick={() =>
                              openRating(client.id, client.name, rating ?? undefined)
                            }
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium hover:opacity-80"
                            style={
                              rating
                                ? {
                                    color: "var(--fg-muted)",
                                    border: "1px solid var(--border)",
                                  }
                                : {
                                    background: "var(--accent)",
                                    color: "#fff",
                                  }
                            }
                          >
                            {rating ? (
                              <>
                                <Pencil className="w-3 h-3" /> Reavalia
                              </>
                            ) : (
                              <>
                                <Plus className="w-3 h-3" /> Avaliar
                              </>
                            )}
                          </button>
                          {rating && (
                            <button
                              onClick={() => {
                                if (!confirm("Remover avaliação?")) return;
                                deleteRating.mutate(rating.id);
                              }}
                              className="p-1.5 rounded-lg hover:opacity-80"
                              style={{ color: "#ef4444" }}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedClient && (
        <RatingForm
          key={selectedClient.id}
          open={formOpen}
          onClose={handleClose}
          clientId={selectedClient.id}
          clientName={selectedClient.name}
          existingRating={selectedClient.existingRating}
        />
      )}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────

function ScorePip({ value }: { value: number }) {
  const color =
    value >= 8 ? "#10b981" : value >= 5 ? "#f59e0b" : "#ef4444";
  return (
    <span
      className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold"
      style={{ background: color + "22", color }}
    >
      {value}
    </span>
  );
}

function TableSkeleton() {
  return (
    <div
      className="rounded-xl overflow-hidden animate-pulse"
      style={{ border: "1px solid var(--border)" }}
    >
      <div
        className="h-10"
        style={{
          background: "var(--bg-card)",
          borderBottom: "1px solid var(--border)",
        }}
      />
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex gap-3 px-4 py-3"
          style={{
            background: i % 2 === 0 ? "var(--bg)" : "var(--bg-card)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div
            className="h-4 w-6 rounded"
            style={{ background: "var(--border)" }}
          />
          <div
            className="h-4 flex-1 rounded"
            style={{ background: "var(--border)" }}
          />
          {Array.from({ length: 6 }).map((_, j) => (
            <div
              key={j}
              className="h-4 w-10 rounded"
              style={{ background: "var(--border)" }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
