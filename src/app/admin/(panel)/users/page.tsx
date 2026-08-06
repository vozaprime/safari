import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getVerifiedSession } from "@/lib/auth";
import { PageHeader, AdminCard, inputClass } from "@/components/admin/ui";
import SubmitButton from "@/components/admin/SubmitButton";
import ConfirmButton from "@/components/admin/ConfirmButton";
import {
  createUserAction,
  updateUserAction,
  deleteUserAction,
  resetUserPasswordAction,
  disableUserTwoFactorAction,
} from "../../actions";

export default async function UsersPage() {
  const session = await getVerifiedSession();
  if (session?.role !== "admin") redirect("/admin");

  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div className="max-w-3xl">
      <PageHeader title="Kullanıcılar" description="Panel erişimi olan hesapları ve rollerini yönetin." />

      <div className="space-y-4">
        {users.map((u) => (
          <AdminCard key={u.id}>
            <form action={updateUserAction.bind(null, u.id)} className="flex flex-wrap items-end gap-3">
              <div className="min-w-40 flex-1">
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-stone">Ad</label>
                <input name="name" defaultValue={u.name} className={inputClass} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-stone">E-posta</label>
                <p className="rounded-md border border-transparent px-1 py-2.5 text-sm text-stone">{u.email}</p>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-stone">Rol</label>
                <select name="role" defaultValue={u.role} className={inputClass} disabled={u.id === session.userId}>
                  <option value="admin">Yönetici</option>
                  <option value="editor">Editör</option>
                </select>
              </div>
              <SubmitButton pendingText="..." variant="outline">Kaydet</SubmitButton>
            </form>

            <div className="mt-3 flex flex-wrap items-end gap-3 border-t border-sand pt-3">
              <form action={resetUserPasswordAction.bind(null, u.id)} className="flex items-end gap-2">
                <div>
                  <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-stone">Yeni şifre belirle</label>
                  <input name="password" type="text" minLength={8} placeholder="En az 8 karakter" className={`${inputClass} w-48`} />
                </div>
                <SubmitButton pendingText="..." variant="ghost">Şifre ata</SubmitButton>
              </form>

              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-medium ${
                    u.twoFactorEnabled ? "bg-emerald/10 text-emerald" : "bg-sand/60 text-stone"
                  }`}
                >
                  2FA {u.twoFactorEnabled ? "açık" : "kapalı"}
                </span>
                {u.twoFactorEnabled && (
                  <form action={disableUserTwoFactorAction.bind(null, u.id)}>
                    <ConfirmButton
                      confirmText={`"${u.email}" kullanıcısının iki aşamalı doğrulaması sıfırlansın mı? Kullanıcı yeniden kurana kadar yalnızca şifreyle giriş yapar.`}
                      className="text-xs text-red-500 hover:underline"
                    >
                      2FA sıfırla
                    </ConfirmButton>
                  </form>
                )}
              </div>

              {u.id !== session.userId && users.length > 1 && (
                <form action={deleteUserAction.bind(null, u.id)} className="ml-auto">
                  <ConfirmButton confirmText={`"${u.email}" kullanıcısını silmek istediğinize emin misiniz?`} className="text-xs text-red-500 hover:underline">
                    Kullanıcıyı sil
                  </ConfirmButton>
                </form>
              )}
            </div>
          </AdminCard>
        ))}
      </div>

      <AdminCard title="Yeni kullanıcı ekle" className="mt-6">
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
    </div>
  );
}
