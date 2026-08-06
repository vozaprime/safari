import { prisma } from "@/lib/db";
import { PageHeader, AdminCard, inputClass, labelClass, Field } from "@/components/admin/ui";
import SubmitButton from "@/components/admin/SubmitButton";
import Uploader from "@/components/admin/Uploader";
import ConfirmButton from "@/components/admin/ConfirmButton";
import {
  updateSettingsAction,
  changePasswordAction,
  testSmtpAction,
  signOutEverywhereAction,
} from "../../actions";

export default async function SettingsPage() {
  const rows = await prisma.setting.findMany();
  const s: Record<string, string> = {};
  for (const row of rows) s[row.key] = row.value;
  const smtpConfigured = !!s.smtp_pass;

  return (
    <div className="max-w-2xl">
      <PageHeader title="Ayarlar" description="İletişim bilgileri, marka, SEO ve e-posta gönderim ayarları." />

      <form action={updateSettingsAction} className="space-y-6">
        <AdminCard title="İletişim Bilgileri">
          <div className="mt-4 space-y-4">
            <Field label="Sitede görünen e-posta" htmlFor="contact_email">
              <input id="contact_email" name="contact_email" type="email" defaultValue={s.contact_email ?? ""} className={inputClass} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Telefon" htmlFor="contact_phone">
                <input id="contact_phone" name="contact_phone" defaultValue={s.contact_phone ?? ""} className={inputClass} />
              </Field>
              <Field label="Adres" htmlFor="contact_address">
                <input id="contact_address" name="contact_address" defaultValue={s.contact_address ?? ""} className={inputClass} />
              </Field>
              <Field label="LinkedIn" htmlFor="linkedin_url">
                <input id="linkedin_url" name="linkedin_url" defaultValue={s.linkedin_url ?? ""} className={inputClass} />
              </Field>
              <Field label="Instagram" htmlFor="instagram_url">
                <input id="instagram_url" name="instagram_url" defaultValue={s.instagram_url ?? ""} className={inputClass} />
              </Field>
            </div>
          </div>
        </AdminCard>

        <AdminCard title="Marka & SEO">
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <div>
              <p className={labelClass}>Logo (opsiyonel)</p>
              <Uploader name="site_logo" defaultValue={s.site_logo ?? ""} label="Logo" aspect="aspect-[3/2]" />
            </div>
            <div>
              <p className={labelClass}>Favicon (opsiyonel)</p>
              <Uploader name="site_favicon" defaultValue={s.site_favicon ?? ""} label="Favicon" aspect="aspect-square" />
            </div>
          </div>
          <div className="mt-4 space-y-4">
            <Field label="SEO başlığı" htmlFor="seo_title">
              <input id="seo_title" name="seo_title" defaultValue={s.seo_title ?? ""} placeholder="SAFARI CONSULTING" className={inputClass} />
            </Field>
            <Field label="SEO açıklaması" htmlFor="seo_description">
              <textarea id="seo_description" name="seo_description" rows={2} defaultValue={s.seo_description ?? ""} className={inputClass} />
            </Field>
            <Field label="Google Analytics kimliği" htmlFor="ga_id" hint="(örn. G-XXXXXXX)">
              <input id="ga_id" name="ga_id" defaultValue={s.ga_id ?? ""} placeholder="G-XXXXXXX" className={inputClass} />
            </Field>
          </div>
        </AdminCard>

        <AdminCard title="E-posta Bildirimleri (SMTP)" description="İletişim formu talepleri panelde her zaman görünür. SMTP girilirse ayrıca e-posta bildirimi gönderilir.">
          <div className="mt-4 space-y-4">
            <Field label="Bildirimlerin gideceği e-posta" htmlFor="notify_email">
              <input id="notify_email" name="notify_email" type="email" defaultValue={s.notify_email ?? ""} className={inputClass} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="SMTP sunucusu" htmlFor="smtp_host">
                <input id="smtp_host" name="smtp_host" placeholder="smtp.example.com" defaultValue={s.smtp_host ?? ""} className={inputClass} />
              </Field>
              <Field label="Port" htmlFor="smtp_port">
                <input id="smtp_port" name="smtp_port" defaultValue={s.smtp_port ?? "587"} className={inputClass} />
              </Field>
              <Field label="Kullanıcı adı" htmlFor="smtp_user">
                <input id="smtp_user" name="smtp_user" defaultValue={s.smtp_user ?? ""} className={inputClass} />
              </Field>
              <Field label="Şifre" htmlFor="smtp_pass" hint={smtpConfigured ? "(kayıtlı — değiştirmek için yazın)" : ""}>
                <input id="smtp_pass" name="smtp_pass" type="password" placeholder={smtpConfigured ? "********" : ""} className={inputClass} />
              </Field>
            </div>
            <Field label="Gönderen adresi (From)" htmlFor="smtp_from">
              <input id="smtp_from" name="smtp_from" placeholder="no-reply@safariconsulting.com" defaultValue={s.smtp_from ?? ""} className={inputClass} />
            </Field>
          </div>
        </AdminCard>

        <div className="flex items-center gap-3">
          <SubmitButton pendingText="Kaydediliyor...">Ayarları kaydet</SubmitButton>
        </div>
      </form>

      <div className="mt-4">
        <form action={testSmtpAction}>
          <SubmitButton pendingText="Gönderiliyor..." variant="outline">
            SMTP testi gönder
          </SubmitButton>
        </form>
      </div>

      <AdminCard title="Şifre Değiştir" className="mt-8">
        <form action={changePasswordAction} className="mt-4 space-y-4">
          <Field label="Mevcut şifre" htmlFor="current_password">
            <input id="current_password" name="current_password" type="password" required autoComplete="current-password" className={inputClass} />
          </Field>
          <Field label="Yeni şifre (en az 8 karakter)" htmlFor="new_password">
            <input id="new_password" name="new_password" type="password" required minLength={8} autoComplete="new-password" className={inputClass} />
          </Field>
          <SubmitButton pendingText="Güncelleniyor..." variant="outline">Şifreyi güncelle</SubmitButton>
        </form>
      </AdminCard>

      <AdminCard title="Oturum güvenliği" description="Şüpheli bir durumda tüm cihazlardaki oturumları sonlandırın." className="mt-6">
        <form action={signOutEverywhereAction} className="mt-4">
          <ConfirmButton
            confirmText="Tüm cihazlardaki oturumlar kapatılacak ve yeniden giriş yapmanız gerekecek. Devam edilsin mi?"
            className="rounded-md border border-red-200 px-5 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            Tüm oturumları kapat
          </ConfirmButton>
        </form>
      </AdminCard>
    </div>
  );
}
