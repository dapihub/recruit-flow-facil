export function exportCSV<T>(filename: string, rows: T[], columns: { header: string; get: (row: T) => string | number | null | undefined }[]) {
  const head = columns.map((c) => c.header);
  const lines = rows.map((r) =>
    columns
      .map((c) => {
        const v = c.get(r);
        return `"${String(v ?? "").replace(/"/g, '""')}"`;
      })
      .join(",")
  );
  const csv = [head.join(","), ...lines].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
