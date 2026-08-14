import Link from "next/link";
import Logo from "@/components/Logo";
import SubmitButton from "@/components/admin/SubmitButton";
import { getSettings } from "@/lib/content";
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

// Translucent field styling tuned for the glass card (dark backdrop, light text).
const glassInput =
  "mt-1.5 w-full rounded-lg border border-white/25 bg-white/10 px-3.5 py-2.5 text-sm text-ivory placeholder-ivory/40 outline-none transition-colors focus:border-gold focus:bg-white/15 focus:ring-2 focus:ring-gold/30";
const glassLabel = "block text-xs font-medium uppercase tracking-wider text-ivory/70";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; reset?: string }>;
}) {
  // Use the same admin-configured (transparent) brand logo as the public
  // site header/footer instead of the default plated /brand/logo.png.
  const [params, settings] = await Promise.all([searchParams, getSettings()]);
  const { error, reset } = params;
  const notice = error ? notices[error] : undefined;
  const resetMsg = reset ? resetNotices[reset] : undefined;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-forest-deep px-5 py-10">
      {/* Safari (lion) backdrop photo + contrast overlays.
          The project deliberately uses plain <img>/<picture> instead of
          next/image (see HeroSlider); webp is served first with a jpg
          fallback. object-position keeps the lion's head near the top. */}
      <div aria-hidden="true" className="absolute inset-0">
        <picture>
          <source srcSet="/images/heroes/admin-login.webp" type="image/webp" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/heroes/admin-login.jpg"
            alt=""
            fetchPriority="high"
            className="absolute inset-0 h-full w-full object-cover object-[66%_8%]"
          />
        </picture>
        <div className="absolute inset-0 bg-gradient-to-b from-forest-deep/75 via-forest-deep/45 to-forest-deep/85" />
        <div className="absolute inset-0 bg-forest-deep/15" />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-7 flex justify-center drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
          <Logo src={settings.site_logo || undefined} height={Number(settings.logo_height) || undefined} />
        </div>

        <form
          action={loginAction}
          className="rounded-2xl border border-white/20 bg-white/10 p-8 text-ivory shadow-2xl shadow-black/50 ring-1 ring-white/10 backdrop-blur-xl"
        >
          <h1 className="font-display text-2xl text-ivory">Yönetim Paneli</h1>
          <p className="mt-1 text-sm text-ivory/70">Devam etmek için giriş yapın.</p>

          {notice && (
            <p
              className="mt-5 rounded-lg border border-red-300/40 bg-red-500/15 px-3 py-2 text-xs text-red-100"
              role="alert"
            >
              {notice.text}
            </p>
          )}
          {resetMsg && (
            <p
              className="mt-5 rounded-lg border border-gold/50 bg-gold/15 px-3 py-2 text-xs text-amber-100"
              role="status"
            >
              {resetMsg}
            </p>
          )}

          <div className="mt-6">
            <label htmlFor="email" className={glassLabel}>
              E-posta
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="username"
              placeholder="ornek@safarict.com"
              className={glassInput}
            />
          </div>

          <div className="mt-4">
            <label htmlFor="password" className={glassLabel}>
              Şifre
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className={glassInput}
            />
          </div>

          <label className="mt-4 flex items-center gap-2 text-xs text-ivory/80">
            <input type="checkbox" name="remember" className="h-4 w-4 accent-gold" />
            Beni hatırla (30 gün)
          </label>

          <div className="mt-6">
            <SubmitButton
              pendingText="Giriş yapılıyor..."
              className="w-full !bg-gold !text-gold-ink shadow-lg shadow-black/25 hover:!bg-gold-dark hover:!text-ivory"
            >
              Giriş yap
            </SubmitButton>
          </div>

          <div className="mt-4 text-center">
            <Link href="/admin/forgot" className="text-xs text-ivory/70 underline-offset-4 hover:text-gold hover:underline">
              Şifremi unuttum
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
