// toSocialHref() davranış testleri.  npx tsx scripts/check-social-url.ts
import { toSocialHref } from "../src/lib/url";

let failures = 0;
function expect(input: string | undefined | null, want: string | null, note: string) {
  const got = toSocialHref(input);
  if (got === want) {
    console.log(`ok: ${note}`);
  } else {
    console.error(`FAIL: ${note}\n     girdi: ${JSON.stringify(input)}\n     beklenen: ${want}\n     gelen   : ${got}`);
    failures++;
  }
}

// Reddedilmesi gerekenler — bu PR'ın asıl sebebi
expect("#", null, "kurulumdan kalan # yer tutucusu reddedilir");
expect("", null, "bos deger reddedilir");
expect("   ", null, "yalnizca bosluk reddedilir");
expect(undefined, null, "undefined reddedilir");
expect(null, null, "null reddedilir");
expect("-", null, "tire yer tutucusu reddedilir");
expect("tbd", null, "noktasiz metin reddedilir");

// Güvenlik: panelden girilebilecek tehlikeli şemalar
expect("javascript:alert(1)", null, "javascript: semasi reddedilir");
expect("data:text/html,<script>alert(1)</script>", null, "data: semasi reddedilir");
expect("https://javascript:alert(1)", null, "noktasiz alan adi reddedilir");

// Kabul edilmesi gerekenler
expect("https://linkedin.com/company/safari", "https://linkedin.com/company/safari", "tam https URL kabul edilir");
expect("http://example.com/x", "http://example.com/x", "http kabul edilir");
expect("  https://x.com/safari  ", "https://x.com/safari", "bastaki/sondaki bosluk kirpilir");
expect("linkedin.com/company/safari", "https://linkedin.com/company/safari", "sema yoksa https varsayilir");
expect("https://wa.me/905551112233", "https://wa.me/905551112233", "WhatsApp baglantisi kabul edilir");

console.log(failures ? `\n${failures} HATA` : "\nhata yok");
process.exit(failures ? 1 : 0);
