import Link from "next/link";
import Logo from "@/components/Logo";
import SubmitButton from "@/components/admin/SubmitButton";
import { inputClass } from "@/components/admin/ui";
import { prisma } from "@/lib/db";
import { performPasswordResetAction } from "../../actions";

export default async function ResetPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ toast?: string }>;
}) {
  const { token } = await params;
  const { toast } = await searchParams;

  const valid = await prisma.user.findFirst({
    where: { resetToken: token, resetTokenExpiry: { gt: new Date() } },
    select: { id: true },
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-forest px-5">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="rounded-xl border border-emerald-line bg-forest-deep p-8">
          <h1 className="font-display text-xl text-ivory">Yeni şifre belirle</h1>
          {!valid ? (
            <>
              <p className="mt-3 text-xs text-red-300">
                Bu sıfırlama bağlantısı geçersiz veya süresi dolmuş.
              </p>
              <Link href="/admin/forgot" className="mt-4 inline-block text-xs text-gold hover:underline">
                Yeni bağlantı iste →
              </Link>
            </>
          ) : (
            <form action={performPasswordResetAction.bind(null, token)}>
              {toast === "pwshort" && (
                <p className="mt-3 rounded-md border border-red-400/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                  Şifre en az 8 karakter olmalı.
                </p>
              )}
              <label htmlFor="new_password" className="mt-5 block text-xs font-medium uppercase tracking-wider text-mist">
                Yeni şifre
              </label>
              <input id="new_password" name="new_password" type="password" required minLength={8} autoComplete="new-password" className={`mt-1.5 ${inputClass} border-emerald-line bg-forest text-ivory`} />
              <div className="mt-6">
                <SubmitButton pendingText="Kaydediliyor..." className="w-full !bg-gold !text-gold-ink hover:!bg-gold-dark hover:!text-ivory">
                  Şifreyi güncelle
                </SubmitButton>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
