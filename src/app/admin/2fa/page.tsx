import { redirect } from "next/navigation";
import Logo from "@/components/Logo";
import SubmitButton from "@/components/admin/SubmitButton";
import { inputClass } from "@/components/admin/ui";
import { getPending2FA } from "@/lib/auth";
import { verifyTwoFactorLoginAction, cancelTwoFactorLoginAction } from "../actions";

export default async function TwoFactorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  // Only reachable mid-login, after a correct password.
  const pending = await getPending2FA();
  if (!pending) redirect("/admin/login");

  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-forest px-5">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <form action={verifyTwoFactorLoginAction} className="rounded-xl border border-emerald-line bg-forest-deep p-8">
          <h1 className="font-display text-xl text-ivory">İki aşamalı doğrulama</h1>
          <p className="mt-1 text-xs text-mist">
            Doğrulama uygulamanızdaki 6 haneli kodu girin. Uygulamaya erişiminiz yoksa bir yedek kodu kullanabilirsiniz.
          </p>

          {error && (
            <p className="mt-4 rounded-md border border-red-400/40 bg-red-500/10 px-3 py-2 text-xs text-red-300" role="alert">
              Kod hatalı veya süresi dolmuş. Tekrar deneyin.
            </p>
          )}

          <label htmlFor="code" className="mt-6 block text-xs font-medium uppercase tracking-wider text-mist">
            Doğrulama kodu
          </label>
          <input
            id="code"
            name="code"
            inputMode="text"
            autoComplete="one-time-code"
            autoFocus
            required
            placeholder="123456"
            className={`mt-1.5 tracking-[0.3em] ${inputClass} border-emerald-line bg-forest text-ivory`}
          />

          <div className="mt-6">
            <SubmitButton pendingText="Doğrulanıyor..." className="w-full !bg-gold !text-gold-ink hover:!bg-gold-dark hover:!text-ivory">
              Doğrula ve giriş yap
            </SubmitButton>
          </div>
        </form>

        <form action={cancelTwoFactorLoginAction} className="mt-4 text-center">
          <button type="submit" className="text-xs text-mist hover:text-gold">
            İptal et ve girişe dön
          </button>
        </form>
      </div>
    </div>
  );
}
