import Link from "next/link";
import Logo from "@/components/Logo";
import SubmitButton from "@/components/admin/SubmitButton";
import { inputClass } from "@/components/admin/ui";
import { loginAction } from "../actions";

const notices: Record<string, { kind: "error" | "info"; text: string }> = {
  "1": { kind: "error", text: "E-posta veya şifre hatalı." },
  locked: { kind: "error", text: "Çok fazla başarısız deneme. Lütfen birkaç dakika sonra tekrar deneyin." },
};
const resetNotices: Record<string, string> = {
  sent: "Eğer bu e-posta kayıtlıysa, sıfırlama bağlantısı gönderildi.",
  done: "Şifreniz güncellendi. Yeni şifrenizle giriş yapabilirsiniz.",
  invalid: "Sıfırlama bağlantısı geçersiz veya süresi dolmuş.",
  "1": "Şifreniz güncellendi. Lütfen tekrar giriş yapın.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; reset?: string }>;
}) {
  const { error, reset } = await searchParams;
  const notice = error ? notices[error] : undefined;
  const resetMsg = reset ? resetNotices[reset] : undefined;

  return (
    <div className="flex min-h-screen items-center justify-center bg-forest px-5">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <form action={loginAction} className="rounded-xl border border-emerald-line bg-forest-deep p-8">
          <h1 className="font-display text-xl text-ivory">Yönetim Paneli</h1>
          <p className="mt-1 text-xs text-mist">Devam etmek için giriş yapın.</p>

          {notice && (
            <p className="mt-4 rounded-md border border-red-400/40 bg-red-500/10 px-3 py-2 text-xs text-red-300" role="alert">
              {notice.text}
            </p>
          )}
          {resetMsg && (
            <p className="mt-4 rounded-md border border-gold/40 bg-gold/10 px-3 py-2 text-xs text-gold" role="status">
              {resetMsg}
            </p>
          )}

          <label htmlFor="email" className="mt-6 block text-xs font-medium uppercase tracking-wider text-mist">
            E-posta
          </label>
          <input id="email" name="email" type="email" required autoComplete="username" className={`mt-1.5 ${inputClass} border-emerald-line bg-forest text-ivory`} />

          <label htmlFor="password" className="mt-4 block text-xs font-medium uppercase tracking-wider text-mist">
            Şifre
          </label>
          <input id="password" name="password" type="password" required autoComplete="current-password" className={`mt-1.5 ${inputClass} border-emerald-line bg-forest text-ivory`} />

          <label className="mt-4 flex items-center gap-2 text-xs text-ivory/80">
            <input type="checkbox" name="remember" className="h-4 w-4 accent-gold" />
            Beni hatırla (30 gün)
          </label>

          <div className="mt-6">
            <SubmitButton pendingText="Giriş yapılıyor..." className="w-full !bg-gold !text-gold-ink hover:!bg-gold-dark hover:!text-ivory">
              Giriş yap
            </SubmitButton>
          </div>

          <div className="mt-4 text-center">
            <Link href="/admin/forgot" className="text-xs text-mist hover:text-gold">
              Şifremi unuttum
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
