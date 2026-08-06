import Link from "next/link";

export default function NotFound() {
  return (
    <section className="mx-auto flex max-w-6xl flex-col items-center px-5 py-32 text-center">
      <p className="font-display text-7xl text-gold-dark">404</p>
      <p className="mt-4 text-stone">Sayfa bulunamadı · Page not found · Страница не найдена</p>
      <Link
        href="/"
        className="mt-8 rounded-md bg-forest px-7 py-3.5 text-sm font-medium text-ivory transition-colors hover:bg-emerald"
      >
        SAFARI CONSULTING
      </Link>
    </section>
  );
}
