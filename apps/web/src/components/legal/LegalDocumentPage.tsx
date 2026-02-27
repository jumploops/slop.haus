import { MarkdownDocument } from "./MarkdownDocument";
import type { LegalDocument } from "@/lib/legal-docs";

interface LegalDocumentPageProps {
  document: LegalDocument;
}

export function LegalDocumentPage({ document }: LegalDocumentPageProps) {
  return (
    <div className="mx-auto max-w-3xl border-2 border-dashed border-border bg-card p-6 sm:p-8">
      <header className="mb-6 border-b border-border pb-4">
        <h1 className="font-mono text-2xl font-black text-foreground">{document.title}</h1>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {document.effectiveDate && <span>Effective: {document.effectiveDate}</span>}
          {document.lastUpdated && <span>Last Updated: {document.lastUpdated}</span>}
          {document.version && <span>Version: {document.version}</span>}
        </div>
      </header>

      <MarkdownDocument markdown={document.body} />
    </div>
  );
}
