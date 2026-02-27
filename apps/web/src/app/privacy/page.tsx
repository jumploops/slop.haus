import type { Metadata } from "next";
import { LegalDocumentPage } from "@/components/legal/LegalDocumentPage";
import { getLegalDocument } from "@/lib/legal-docs";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How slop.haus collects, uses, and protects personal information.",
};

export default async function PrivacyPage() {
  const document = await getLegalDocument("privacy");
  return <LegalDocumentPage document={document} />;
}

