// Baglanti dizesi havuz parametreleri testleri.  npx tsx scripts/check-db-url.ts
//
// Bu testler GERCEK bir baglanti dizesi kullanmaz ve hicbir deger yazdirmaz;
// girdiler uydurma.  applyPoolLimits saf bir fonksiyondur, veritabanina
// dokunmaz.
import { applyPoolLimits } from "../src/lib/dbUrl";

let failures = 0;

function expect(got: string | undefined, want: string | undefined, note: string) {
  if (got === want) {
    console.log(`ok: ${note}`);
  } else {
    console.error(`FAIL: ${note}\n     beklenen: ${want}\n     gelen   : ${got}`);
    failures++;
  }
}

const DOGRUDAN = "postgres://kullanici:parola@db.ornek.io:5432/postgres?sslmode=require";
const HAVUZLU = "prisma+postgres://accelerate.ornek.net/?api_key=sahte";

// --- dogrudan baglantiya sinir eklenir ---
expect(
  applyPoolLimits(DOGRUDAN, {}),
  DOGRUDAN + "&connection_limit=1&pool_timeout=20",
  "dogrudan baglantiya varsayilan sinirlar eklenir, mevcut parametre korunur"
);
expect(
  applyPoolLimits("postgresql://k:p@h:5432/db", {}),
  "postgresql://k:p@h:5432/db?connection_limit=1&pool_timeout=20",
  "postgresql:// semasi da kapsanir, parametresiz dizeye ? ile eklenir"
);

// --- havuzlu dizeye DOKUNULMAZ ---
expect(applyPoolLimits(HAVUZLU, {}), HAVUZLU, "havuzlu (prisma+postgres) dize degistirilmez");

// --- acik ayar her zaman kazanir ---
expect(
  applyPoolLimits(DOGRUDAN + "&connection_limit=7", {}),
  DOGRUDAN + "&connection_limit=7",
  "dizede connection_limit varsa dokunulmaz (pool_timeout de eklenmez)"
);
expect(
  applyPoolLimits(DOGRUDAN, { DATABASE_CONNECTION_LIMIT: "5" }),
  DOGRUDAN + "&connection_limit=5&pool_timeout=20",
  "DATABASE_CONNECTION_LIMIT ortam degiskeni varsayilani ezer"
);
expect(
  applyPoolLimits(DOGRUDAN, { DATABASE_POOL_TIMEOUT: "35" }),
  DOGRUDAN + "&connection_limit=1&pool_timeout=35",
  "DATABASE_POOL_TIMEOUT ortam degiskeni varsayilani ezer"
);

// --- bozuk/eksik girdi cokertmez ---
expect(applyPoolLimits(undefined, {}), undefined, "DATABASE_URL yoksa undefined doner (Prisma kendi hatasini versin)");
expect(applyPoolLimits("", {}), "", "bos dize oldugu gibi doner");
expect(applyPoolLimits("duz-metin-url-degil", {}), "duz-metin-url-degil", "ayristirilamayan dize oldugu gibi doner");
expect(
  applyPoolLimits(DOGRUDAN, { DATABASE_CONNECTION_LIMIT: "sifir degil sayi degil" }),
  DOGRUDAN + "&connection_limit=1&pool_timeout=20",
  "gecersiz ortam degeri yok sayilir, varsayilana dusulur"
);

expect(
  applyPoolLimits(DOGRUDAN, { DATABASE_CONNECTION_LIMIT: "0" }),
  DOGRUDAN + "&connection_limit=1&pool_timeout=20",
  "connection_limit=0 gecersizdir (Prisma kabul etmez), varsayilana dusulur"
);
expect(
  applyPoolLimits(DOGRUDAN + "&pool_timeout=9", {}),
  DOGRUDAN + "&pool_timeout=9&connection_limit=1",
  "dizede pool_timeout varsa korunur, yalnizca connection_limit eklenir"
);

console.log(failures ? `\n${failures} HATA` : "\nhata yok");
process.exit(failures ? 1 : 0);
