import { useState } from "react";

export function useClipboardTable<T>() {
  const [copied, setCopied] = useState(false);

  const copyTable = (data: T[], columns: { key: string; label: string }[]) => {
    if (!data || data.length === 0) return;

    const htmlTable = `
      <table border="1" style="border-collapse: collapse; border: 1px solid black;">
        <thead>
          <tr style="background-color: #f3f4f6; text-align: left;">
            ${columns.map((col) => `<th style="padding: 8px; border: 1px solid black;">${col.label}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${data
            .map(
              (row) => `
            <tr>
              ${columns.map((col) => `<td style="padding: 8px; border: 1px solid black;">${row[col.key] || "-"}</td>`).join("")}
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    `;

    const textTable = [
      columns.map((col) => col.label).join("\t"),
      ...data.map((row) =>
        columns.map((col) => row[col.key] || "-").join("\t")
      ),
    ].join("\n");

    const htmlBlob = new Blob([htmlTable], { type: "text/html" });
    const textBlob = new Blob([textTable], { type: "text/plain" });

    navigator.clipboard
      .write([
        new ClipboardItem({
          "text/html": htmlBlob,
          "text/plain": textBlob,
        }),
      ])
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => console.error("Errore copia:", err));
  };

  return { copied, copyTable };
}
