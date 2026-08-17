import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getVerifiedSession } from "@/lib/auth";
import {
  PageHeader,
  AdminCard,
  EmptyState,
  RoleBadge,
  inputClass,
  menuItemClass,
  menuItemDanger,
  iconBtnClass,
  iconBtnDanger,
} from "@/components/admin/ui";
import SubmitButton from "@/components/admin/SubmitButton";
import ConfirmButton from "@/components/admin/ConfirmButton";
import RowActions from "@/components/admin/RowActions";
import ViewToolbar from "@/components/admin/ViewToolbar";
import KanbanBoard, { KanbanCard } from "@/components/admin/Kanban";
import AdminIcon from "@/components/admin/icons";
import {
  createUserAction,
  updateUserAction,
  deleteUserAction,
  resetUserPasswordAction,
  disableUserTwoFactorAction,
  setUserRoleAction,
  archiveUserAction,
  restoreUserAction,
} from "../../actions";

type UserRow = Awaited<ReturnType<typeof prisma.user.findMany>>[number];

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}
const fmtDate = (d: Date) =>
  new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "short", year: "numeric" }).format(d);

function Avatar({ name, size = "md" }: { name: string; size?: "md" | "sm" }) {
  const cls = size === "sm" ? "h-8 w-8 text-[11px]" : "h-10 w-10 text-xs";
  return (
    <span className={`grid ${cls} shrink-0 place-items-center rounded-full bg-forest/10 font-semibold text-forest`} aria-hidden="true">
      {initials(name)}
    </span>
  );
}

function TwoFABadge({ on }: { on: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
        on ? "bg-emerald/10 text-emerald" : "bg-sand/60 text-stone"
      }`}
    >
      2FA {on ? "açık" : "kapalı"}
    </span>
  );
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; archived?: string }>;
}) {
  const session = await getVerifiedSession();
  if (session?.role !== "admin") redirect("/admin");
  const me = session;

  const { view: viewRaw, archived: archivedRaw } = await searchParams;
  const view = viewRaw === "kanban" ? "kanban" : "list";
  const archived = archivedRaw === "1";

  const users = await prisma.user.findMany({
    where: { archivedAt: archived ? { not: null } : null },
    orderBy: { createdAt: "asc" },
  });
  const activeCount = await prisma.user.count({ where: { archivedAt: null } });

  // ---- per-user action menu (list view) ----
  const listMenu = (u: UserRow) => {
    const isSelf = u.id === me.userId;
    if (archived) {
      return (
        <RowActions>
          <form action={restoreUserAction.bind(null, u.id)}>
            <button type="submit" className={menuItemClass}>
              <AdminIcon name="restore" className="h-4 w-4" /> Arşivden çıkar
            </button>
          </form>
          {!isSelf && activeCount >= 1 && (
            <form action={deleteUserAction.bind(null, u.id)}>
              <ConfirmButton confirmText={`"${u.email}" kalıcı olarak silinsin mi?`} className={menuItemDanger}>
                <AdminIcon name="trash" className="h-4 w-4" /> Kalıcı sil
              </ConfirmButton>
            </form>
          )}
        </RowActions>
      );
    }
    return (
      <RowActions>
        <form action={resetUserPasswordAction.bind(null, u.id)} className="px-2.5 py-2">
          <label className="mb-1 block text-[10px] uppercase tracking-wider text-stone">Yeni şifre belirle</label>
          <div className="flex gap-1.5">
            <input name="password" type="text" minLength={8} placeholder="En az 8 karakter" className="w-full rounded border border-sand px-2 py-1.5 text-sm outline-none focus:border-gold" />
            <SubmitButton pendingText="..." variant="ghost" className="!px-2.5 !py-1.5">Ata</SubmitButton>
          </div>
        </form>
        {u.twoFactorEnabled && (
          <>
            <div className="my-1 border-t border-sand" />
            <form action={disableUserTwoFactorAction.bind(null, u.id)}>
              <ConfirmButton
                confirmText={`"${u.email}" kullanıcısının iki aşamalı doğrulaması sıfırlansın mı?`}
                className={menuItemClass}
              >
                <AdminIcon name="settings" className="h-4 w-4" /> 2FA sıfırla
              </ConfirmButton>
            </form>
          </>
        )}
        {!isSelf && (
          <>
            <div className="my-1 border-t border-sand" />
            <form action={archiveUserAction.bind(null, u.id)}>
              <button type="submit" className={menuItemClass}>
                <AdminIcon name="archive" className="h-4 w-4" /> Arşivle
              </button>
            </form>
            {activeCount > 1 && (
              <form action={deleteUserAction.bind(null, u.id)}>
                <ConfirmButton confirmText={`"${u.email}" kullanıcısını silmek istediğinize emin misiniz?`} className={menuItemDanger}>
                  <AdminIcon name="trash" className="h-4 w-4" /> Sil
                </ConfirmButton>
              </form>
            )}
          </>
        )}
      </RowActions>
    );
  };

  // ---- list card ----
  const listCard = (u: UserRow) => {
    const isSelf = u.id === me.userId;
    return (
      <div key={u.id} className="rounded-xl border border-sand bg-white p-4">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar name={u.name} />
          <div className="min-w-0 flex-1">
            {archived ? (
              <div className="flex items-center gap-2">
                <span className="truncate font-semibold text-forest">{u.name}</span>
                <RoleBadge role={u.role} />
              </div>
            ) : (
              <form action={updateUserAction.bind(null, u.id)} className="flex flex-wrap items-center gap-2">
                <input name="name" defaultValue={u.name} aria-label="Ad" className="min-w-40 flex-1 rounded-md border border-sand px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-gold focus:ring-2 focus:ring-gold/20" />
                <select name="role" defaultValue={u.role} disabled={isSelf} aria-label="Rol" className="rounded-md border border-sand bg-white px-3 py-2 text-sm text-ink outline-none focus:border-gold disabled:opacity-60">
                  <option value="admin">Yönetici</option>
                  <option value="editor">Editör</option>
                </select>
                <SubmitButton pendingText="..." variant="outline">Kaydet</SubmitButton>
              </form>
            )}
            <p className="mt-1.5 text-xs text-stone">
              {u.email}
              {isSelf && <span className="ml-1.5 rounded bg-gold/15 px-1.5 py-0.5 text-[10px] font-medium text-gold-dark">Siz</span>}
              <span className="text-stone/60"> · Kayıt: {fmtDate(u.createdAt)}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <TwoFABadge on={u.twoFactorEnabled} />
            {listMenu(u)}
          </div>
        </div>
      </div>
    );
  };

  // ---- kanban card (by role) ----
  const kanbanCard = (u: UserRow) => {
    const isSelf = u.id === me.userId;
    const otherRole = u.role === "admin" ? "editor" : "admin";
    const otherLabel = otherRole === "admin" ? "Yönetici" : "Editör";
    return (
      <KanbanCard key={u.id}>
        <div className="flex items-start gap-2.5">
          <Avatar name={u.name} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-forest">
              {u.name}
              {isSelf && <span className="ml-1 text-[10px] font-normal text-gold-dark">(Siz)</span>}
            </p>
            <p className="truncate text-xs text-stone">{u.email}</p>
          </div>
          <TwoFABadge on={u.twoFactorEnabled} />
        </div>
        <div className="mt-2.5 flex items-center gap-1 border-t border-sand pt-2">
          {archived ? (
            <form action={restoreUserAction.bind(null, u.id)}>
              <button type="submit" className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-forest hover:bg-ivory">
                <AdminIcon name="restore" className="h-3.5 w-3.5" /> Arşivden çıkar
              </button>
            </form>
          ) : (
            !isSelf && (
              <form action={setUserRoleAction.bind(null, u.id, otherRole)}>
                <button type="submit" className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-forest hover:bg-ivory">
                  <AdminIcon name="external" className="h-3.5 w-3.5" /> {otherLabel} yap
                </button>
              </form>
            )
          )}
          {!isSelf && (
            <div className="ml-auto flex items-center gap-0.5">
              {!archived && (
                <form action={archiveUserAction.bind(null, u.id)}>
                  <button type="submit" className={iconBtnClass} title="Arşivle" aria-label="Arşivle">
                    <AdminIcon name="archive" className="h-4 w-4" />
                  </button>
                </form>
              )}
              {activeCount > 1 && (
                <form action={deleteUserAction.bind(null, u.id)}>
                  <ConfirmButton confirmText={`"${u.email}" silinsin mi?`} className={iconBtnDanger} ariaLabel="Sil">
                    <AdminIcon name="trash" className="h-4 w-4" />
                  </ConfirmButton>
                </form>
              )}
            </div>
          )}
        </div>
      </KanbanCard>
    );
  };

  return (
    <div className="max-w-4xl">
      <PageHeader title="Kullanıcılar" description="Panel erişimi olan hesapları ve rollerini yönetin." />

      <ViewToolbar basePath="/admin/users" params={{ view: viewRaw, archived: archivedRaw }} />

      {users.length === 0 ? (
        <EmptyState text={archived ? "Arşivlenmiş kullanıcı yok." : "Kullanıcı bulunamadı."} />
      ) : view === "kanban" ? (
        <KanbanBoard
          columns={[
            { key: "admin", label: "Yönetici", dot: "bg-forest", count: users.filter((u) => u.role === "admin").length, cards: users.filter((u) => u.role === "admin").map(kanbanCard) },
            { key: "editor", label: "Editör", dot: "bg-gold", count: users.filter((u) => u.role === "editor").length, cards: users.filter((u) => u.role === "editor").map(kanbanCard) },
          ]}
        />
      ) : (
        <div className="space-y-3">{users.map(listCard)}</div>
      )}

      {!archived && (
        <AdminCard title="Yeni kullanıcı ekle" className="mt-8">
          <form action={createUserAction} className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-stone">Ad Soyad</label>
              <input name="name" required className={inputClass} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-stone">E-posta</label>
              <input name="email" type="email" required className={inputClass} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-stone">Rol</label>
              <select name="role" defaultValue="editor" className={inputClass}>
                <option value="editor">Editör</option>
                <option value="admin">Yönetici</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-stone">Şifre (en az 8)</label>
              <input name="password" type="text" required minLength={8} className={inputClass} />
            </div>
            <div className="sm:col-span-2">
              <SubmitButton pendingText="Ekleniyor...">Kullanıcı ekle</SubmitButton>
            </div>
          </form>
          <p className="mt-3 text-[11px] text-stone/60">
            Editör; hizmet, içerik, referans ve talepleri yönetebilir. Ayarlar, kullanıcılar ve aktivite yalnızca yöneticilere açıktır.
          </p>
        </AdminCard>
      )}
    </div>
  );
}
