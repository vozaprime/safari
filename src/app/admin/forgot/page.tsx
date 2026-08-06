import Link from "next/link";
import Logo from "@/components/Logo";
import SubmitButton from "@/components/admin/SubmitButton";
import { inputClass } from "@/components/admin/ui";
import { requestPasswordResetAction } from "../actions";

export default function ForgotPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-forest px-5">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <form action={requestPasswordResetAction} className="rounded-xl border border-emerald-line bg-forest-deep p-8">
          <h1 className="font-display text-xl text-ivory">Şifre sıfırlama</h1>
          <p className="mt-1 text-xs text-mist">
            Hesabınızın e-posta adresini girin; size sıfırlama bağlantısı gönderelim. (E-posta gönderimi için SMTP
            ayarlarının yapılandırılmış olması gerekir.)
          </p>

          <label htmlFor="email" className="mt-6 block text-xs font-medium uppercase tracking-wider text-mist">
            E-posta
          </label>
          <input id="email" name="email" type="email" required className={`mt-1.5 ${inputClass} border-emerald-line bg-forest text-ivory`} />

          <div className="mt-6">
            <SubmitButton pendingText="Gönderiliyor..." className="w-full !bg-gold !text-gold-ink hover:!bg-gold-dark hover:!text-ivory">
              Bağlantı gönder
            </SubmitButton>
          </div>
          <div className="mt-4 text-center">
            <Link href="/admin/login" className="text-xs text-mist hover:text-gold">
              ← Girişe dön
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
