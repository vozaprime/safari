import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/admin/ui";
import SubmitButton from "@/components/admin/SubmitButton";
import ContentEditor from "@/components/admin/ContentEditor";
import AdminIcon from "@/components/admin/icons";
import { updateContentAction } from "../../actions";

export default async function ContentPage() {
  const rows = await prisma.pageContent.findMany();
  const content: Record<string, Record<string, string>> = {};
  for (const row of rows) {
    content[row.key] ??= {};
    content[row.key][row.locale] = row.value;
  }

  return (
    <div className="max-w-4xl">
      <PageHeader title="Sayfa İçerikleri" description="Dil sekmesini seçin, ilgili bölümdeki metinleri düzenleyin ve kaydedin.">
        <Link href="/tr" target="_blank" className="inline-flex items-center gap-1.5 rounded-md border border-sand px-3 py-2 text-xs text-forest hover:border-gold/60">
          <AdminIcon name="external" className="h-4 w-4" /> Siteyi önizle
        </Link>
      </PageHeader>

      <form action={updateContentAction}>
        <ContentEditor content={content} />
        <div className="mt-6">
          <SubmitButton pendingText="Kaydediliyor...">Tüm dillerde kaydet</SubmitButton>
        </div>
      </form>
    </div>
  );
}
