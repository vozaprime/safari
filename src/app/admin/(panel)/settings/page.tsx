import { prisma } from "@/lib/db";
import { PageHeader, AdminCard, inputClass, labelClass, Field } from "@/components/admin/ui";
import SubmitButton from "@/components/admin/SubmitButton";
import Uploader from "@/components/admin/Uploader";
import ConfirmButton from "@/components/admin/ConfirmButton";
import SettingsTabs, { type SettingsTab } from "@/components/admin/SettingsTabs";
import { getVerifiedSession } from "@/lib/auth";
import { decryptSecret } from "@/lib/crypto";
import { otpauthQrDataUrl, backupCodesRemaining } from "@/lib/totp";
import {
  updateSettingsAction,
  changePasswordAction,
  testSmtpAction,
  signOutEverywhereAction,
  startTwoFactorSetupAction,
  confirmTwoFactorAction,
  disableTwoFactorAction,
  readStashedBackupCodes,
} from "../../actions";

export default async function SettingsPage() {
  const rows = await prisma.setting.findMany();
  const s: Record<string, string> = {};
  for (const row of rows) s[row.key] = row.value;
  const smtpConfigured = !!s.smtp_pass;

  // Two-factor state for the current account
  const session = await getVerifiedSession();
  const me = session ? await prisma.user.findUnique({ where: { id: session.userId } }) : null;
  const twoFAEnabled = !!me?.twoFactorEnabled;
  const twoFAPending = !!me?.twoFactorSecret && !twoFAEnabled;
  const backupRemaining = backupCodesRemaining(me?.twoFactorBackupCodes);
  const stashedCodes = await readStashedBackupCodes();
  let qrDataUrl = "";
  let manualKey = "";
  if (twoFAPending && me?.twoFactorSecret) {
    const secret = decryptSecret(me.twoFactorSecret);
    manualKey = secret.replace(/(.{4})/g, "$1 ").trim();
    qrDataUrl = await otpauthQrDataUrl(secret, me.email);
  }

  // Right-aligned save bar shared by the settings forms. updateSettingsAction is
  // partial-safe (only updates keys present in the submitted form), so each tab
  // can save on its own without clearing the others.
  const SaveBar = (
    <div className="flex justify-end">
      <SubmitButton pendingText="Kaydediliyor...">Ayarları kaydet</SubmitButton>
    </div>
  );

  const tabs: SettingsTab[] = [
    {
      id: "iletisim",
      label: "İletişim",
      content: (
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
              </div>
            </div>
          </AdminCard>

          <AdminCard title="Sosyal Medya" description="Doldurulan platformlar iletişim sayfasında ve alt bilgide ikon olarak gösterilir. Boş bırakılanlar gizlenir.">
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="LinkedIn" htmlFor="linkedin_url">
                <input id="linkedin_url" name="linkedin_url" defaultValue={s.linkedin_url ?? ""} placeholder="https://linkedin.com/company/..." className={inputClass} />
              </Field>
              <Field label="Instagram" htmlFor="instagram_url">
                <input id="instagram_url" name="instagram_url" defaultValue={s.instagram_url ?? ""} placeholder="https://instagram.com/..." className={inputClass} />
              </Field>
              <Field label="X (Twitter)" htmlFor="twitter_url">
                <input id="twitter_url" name="twitter_url" defaultValue={s.twitter_url ?? ""} placeholder="https://x.com/..." className={inputClass} />
              </Field>
              <Field label="Facebook" htmlFor="facebook_url">
                <input id="facebook_url" name="facebook_url" defaultValue={s.facebook_url ?? ""} placeholder="https://facebook.com/..." className={inputClass} />
              </Field>
              <Field label="YouTube" htmlFor="youtube_url">
                <input id="youtube_url" name="youtube_url" defaultValue={s.youtube_url ?? ""} placeholder="https://youtube.com/@..." className={inputClass} />
              </Field>
              <Field label="WhatsApp" htmlFor="whatsapp_url" hint="(tam bağlantı, örn. https://wa.me/90...)">
                <input id="whatsapp_url" name="whatsapp_url" defaultValue={s.whatsapp_url ?? ""} placeholder="https://wa.me/90..." className={inputClass} />
              </Field>
            </div>
          </AdminCard>

          {SaveBar}
        </form>
      ),
    },
    {
      id: "marka",
      label: "Marka & SEO",
      content: (
        <form action={updateSettingsAction} className="space-y-6">
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
              <Field label="Logo yüksekliği (px)" htmlFor="logo_height" hint="(varsayılan 48 · 28–64 arası)">
                <input id="logo_height" name="logo_height" type="number" min={28} max={64} step={1} defaultValue={s.logo_height ?? "48"} className={inputClass} />
              </Field>
              <Field label="SEO başlığı" htmlFor="seo_title">
                <input id="seo_title" name="seo_title" defaultValue={s.seo_title ?? ""} placeholder="SAFARI CONSULTING" className={inputClass} />
              </Field>
              <Field label="SEO açıklaması" htmlFor="seo_description">
                <textarea id="seo_description" name="seo_description" rows={2} defaultValue={s.seo_description ?? ""} className={inputClass} />
              </Field>
              <Field label="Google Analytics kimliği" htmlFor="ga_id" hint="(örn. G-XXXXXXX · ziyaretçi onayından sonra yüklenir)">
                <input id="ga_id" name="ga_id" defaultValue={s.ga_id ?? ""} placeholder="G-XXXXXXX" className={inputClass} />
              </Field>
            </div>
          </AdminCard>

          {SaveBar}
        </form>
      ),
    },
    {
      id: "eposta",
      label: "E-posta",
      content: (
        <div className="space-y-4">
          <form action={updateSettingsAction} className="space-y-6">
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

            {SaveBar}
          </form>

          <form action={testSmtpAction}>
            <SubmitButton pendingText="Gönderiliyor..." variant="outline">
              SMTP testi gönder
            </SubmitButton>
          </form>
        </div>
      ),
    },
    {
      id: "guvenlik",
      label: "Güvenlik",
      content: (
        <div className="space-y-6">
          <AdminCard title="Şifre Değiştir">
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

          <div id="twofa" className="scroll-mt-24">
            <AdminCard
              title="İki Aşamalı Doğrulama (2FA)"
              description="Girişte şifreye ek olarak doğrulama uygulamasından 6 haneli kod ister."
            >
              {twoFAEnabled ? (
                <div className="mt-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-emerald">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    İki aşamalı doğrulama etkin.
                  </div>
                  <p className="mt-1.5 text-xs text-stone">
                    Kalan yedek kod: <strong>{backupRemaining}</strong>. Uygulamanıza ve yedek kodlarınıza erişiminizi
                    kaybederseniz bir yönetici hesabınızın 2FA&apos;sını sıfırlayabilir.
                  </p>
                  <form action={disableTwoFactorAction} className="mt-4 space-y-3">
                    <Field label="Kapatmak için şifreniz" htmlFor="twofa_pw">
                      <input id="twofa_pw" name="password" type="password" required autoComplete="current-password" className={inputClass} />
                    </Field>
                    <SubmitButton pendingText="Kapatılıyor..." variant="outline" className="!border-red-200 !text-red-600 hover:!bg-red-50">
                      2FA&apos;yı kapat
                    </SubmitButton>
                  </form>
                </div>
              ) : twoFAPending ? (
                <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-start">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrDataUrl} alt="2FA QR kodu" width={180} height={180} className="shrink-0 self-center rounded-lg border border-sand bg-white p-2 sm:self-start" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-stone">
                      1. Doğrulama uygulamanızla QR&apos;ı taratın veya bu anahtarı elle girin:
                    </p>
                    <code className="mt-1.5 block break-all rounded bg-sand/40 px-3 py-2 font-mono text-xs tracking-wider text-forest">
                      {manualKey}
                    </code>

                    {stashedCodes.length > 0 && (
                      <div className="mt-4 rounded-lg border border-gold/40 bg-gold/5 p-4">
                        <p className="text-xs font-medium text-forest">
                          Yedek kodlar — güvenli bir yere kaydedin. Her kod bir kez kullanılır ve bu liste yalnızca şimdi gösterilir.
                        </p>
                        <div className="mt-3 grid grid-cols-2 gap-2 font-mono text-sm text-forest">
                          {stashedCodes.map((c) => (
                            <span key={c} className="rounded bg-white px-2 py-1 text-center tracking-wider">{c}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    <form action={confirmTwoFactorAction} className="mt-4 space-y-3">
                      <Field label="2. Uygulamadaki 6 haneli kodu girin" htmlFor="code">
                        <input id="code" name="code" inputMode="numeric" autoComplete="one-time-code" required placeholder="123456" className={inputClass} />
                      </Field>
                      <SubmitButton pendingText="Doğrulanıyor...">Doğrula ve etkinleştir</SubmitButton>
                    </form>
                  </div>
                </div>
              ) : (
                <div className="mt-4">
                  <p className="text-sm leading-relaxed text-stone">
                    Doğrulama uygulaması (Google Authenticator, Authy, 1Password vb.) ile hesabınıza ek bir güvenlik katmanı ekleyin.
                    Kurulumda tek seferlik yedek kodlar da verilir.
                  </p>
                  <form action={startTwoFactorSetupAction} className="mt-4">
                    <SubmitButton pendingText="Hazırlanıyor...">İki aşamalı doğrulamayı kur</SubmitButton>
                  </form>
                </div>
              )}
            </AdminCard>
          </div>

          <AdminCard title="Oturum güvenliği" description="Şüpheli bir durumda tüm cihazlardaki oturumları sonlandırın.">
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
      ),
    },
  ];

  return (
    <div className="max-w-5xl">
      <PageHeader title="Ayarlar" description="İletişim bilgileri, marka, SEO ve e-posta gönderim ayarları." />
      <SettingsTabs tabs={tabs} />
    </div>
  );
}
