import type { Metadata } from "next";
import { LegalDocumentPage } from "@/components/legal/LegalDocumentPage";
import { getLegalDocument } from "@/lib/legal-docs";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms governing use of slop.haus.",
};

export default async function TermsPage() {
  const document = await getLegalDocument("terms");
  return <LegalDocumentPage document={document} />;
}

