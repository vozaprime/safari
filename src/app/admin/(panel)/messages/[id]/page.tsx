import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PageHeader, AdminCard, StatusBadge, inputClass } from "@/components/admin/ui";
import SubmitButton from "@/components/admin/SubmitButton";
import ConfirmButton from "@/components/admin/ConfirmButton";
import AdminIcon from "@/components/admin/icons";
import { setMessageStatusAction, updateMessageNotesAction, deleteMessageAction } from "../../../actions";

const statusLabels: Record<string, string> = { new: "Yeni", read: "Okundu", replied: "Yanıtlandı" };

export default async function MessageDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const msg = await prisma.contactMessage.findUnique({ where: { id: Number(id) } });
  if (!msg) notFound();

  // auto-mark as read on open
  if (msg.status === "new") {
    await prisma.contactMessage.update({ where: { id: msg.id }, data: { status: "read" } });
    msg.status = "read";
  }

  const mailto = `mailto:${msg.email}?subject=${encodeURIComponent("SAFARI CONSULTING — Talebinize dair")}&body=${encodeURIComponent(`Sayın ${msg.name},\n\n`)}`;

  return (
    <div className="max-w-3xl">
      <Link href="/admin/messages" className="mb-4 inline-flex items-center gap-1.5 text-xs text-stone hover:text-forest">
        ← Tüm talepler
      </Link>
      <PageHeader title={msg.name}>
        <StatusBadge status={msg.status} label={statusLabels[msg.status] ?? msg.status} />
      </PageHeader>

      <div className="grid gap-6 md:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <AdminCard title="Mesaj">
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink">{msg.message}</p>
          </AdminCard>

          <AdminCard title="Dahili notlar" description="Sadece yönetim panelinde görünür.">
            <form action={updateMessageNotesAction.bind(null, msg.id)} className="mt-3">
              <textarea name="notes" rows={4} defaultValue={msg.notes} className={inputClass} placeholder="Bu talebe dair notlarınız..." />
              <div className="mt-3">
                <SubmitButton pendingText="Kaydediliyor..." variant="outline">
                  Notu kaydet
                </SubmitButton>
              </div>
            </form>
          </AdminCard>
        </div>

        <div className="space-y-6">
          <AdminCard title="İletişim">
            <dl className="mt-3 space-y-3 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-wider text-stone">E-posta</dt>
                <dd>
                  <a href={`mailto:${msg.email}`} className="text-gold-dark hover:underline">
                    {msg.email}
                  </a>
                </dd>
              </div>
              {msg.phone && (
                <div>
                  <dt className="text-xs uppercase tracking-wider text-stone">Telefon</dt>
                  <dd className="text-ink">{msg.phone}</dd>
                </div>
              )}
              {msg.company && (
                <div>
                  <dt className="text-xs uppercase tracking-wider text-stone">Şirket</dt>
                  <dd className="text-ink">{msg.company}</dd>
                </div>
              )}
              {msg.service && (
                <div>
                  <dt className="text-xs uppercase tracking-wider text-stone">İlgilenilen hizmet</dt>
                  <dd className="text-ink">{msg.service}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs uppercase tracking-wider text-stone">Tarih</dt>
                <dd className="text-ink">{new Date(msg.createdAt).toLocaleString("tr-TR")}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-stone">Dil</dt>
                <dd className="uppercase text-ink">{msg.locale}</dd>
              </div>
            </dl>
            <a
              href={mailto}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-gold px-4 py-2.5 text-sm font-medium text-gold-ink transition-colors hover:bg-gold-dark hover:text-ivory"
            >
              <AdminIcon name="mail" className="h-4 w-4" /> E-posta ile yanıtla
            </a>
          </AdminCard>

          <AdminCard title="Durum">
            <div className="mt-3 flex flex-wrap gap-2">
              {(["new", "read", "replied"] as const).map((s) => (
                <form key={s} action={setMessageStatusAction.bind(null, msg.id, s)}>
                  <button
                    className={`rounded-md border px-3 py-1.5 text-xs ${
                      msg.status === s ? "border-forest bg-forest text-ivory" : "border-sand text-stone hover:border-forest/40"
                    }`}
                  >
                    {statusLabels[s]}
                  </button>
                </form>
              ))}
            </div>
            <form action={deleteMessageAction.bind(null, msg.id)} className="mt-4 border-t border-sand pt-4">
              <ConfirmButton
                confirmText="Bu talebi kalıcı olarak silmek istediğinize emin misiniz?"
                className="text-xs text-red-500 hover:underline"
              >
                Talebi sil
              </ConfirmButton>
            </form>
          </AdminCard>
        </div>
      </div>
    </div>
  );
}
