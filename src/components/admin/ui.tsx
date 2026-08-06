import Link from "next/link";
import AdminIcon from "./icons";

export function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl text-forest md:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm text-stone">{description}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}

export function AdminCard({
  title,
  description,
  children,
  className = "",
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-sand bg-white p-6 shadow-sm shadow-forest/5 ${className}`}>
      {title && <h2 className="text-sm font-semibold text-forest">{title}</h2>}
      {description && <p className="mt-1 text-xs text-stone">{description}</p>}
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon,
  href,
  accent = false,
}: {
  label: string;
  value: React.ReactNode;
  icon?: string;
  href?: string;
  accent?: boolean;
}) {
  const inner = (
    <div
      className={`flex items-center justify-between rounded-xl border bg-white p-5 transition-all ${
        accent ? "border-gold/50" : "border-sand"
      } ${href ? "hover:-translate-y-0.5 hover:border-gold/60 hover:shadow-md hover:shadow-forest/10" : ""}`}
    >
      <div>
        <p className="font-display text-3xl text-forest">{value}</p>
        <p className="mt-1 text-xs uppercase tracking-wider text-stone">{label}</p>
      </div>
      {icon && (
        <span className={`rounded-lg p-2.5 ${accent ? "bg-gold/15 text-gold-dark" : "bg-ivory text-forest"}`}>
          <AdminIcon name={icon} className="h-5 w-5" />
        </span>
      )}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-sand bg-white px-5 py-12 text-center text-sm text-stone">
      {text}
    </div>
  );
}

const statusStyles: Record<string, string> = {
  new: "bg-gold/20 text-gold-dark",
  read: "bg-sand text-stone",
  replied: "bg-emerald/15 text-emerald",
};

export function StatusBadge({ status, label }: { status: string; label: string }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-medium ${
        statusStyles[status] ?? "bg-sand text-stone"
      }`}
    >
      {label}
    </span>
  );
}

export function RoleBadge({ role }: { role: string }) {
  const admin = role === "admin";
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-medium ${
        admin ? "bg-forest/10 text-forest" : "bg-sand text-stone"
      }`}
    >
      {admin ? "Yönetici" : "Editör"}
    </span>
  );
}

export const inputClass =
  "w-full rounded-md border border-sand bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-colors focus:border-gold focus:ring-2 focus:ring-gold/20";
export const labelClass = "mb-1.5 block text-xs font-medium uppercase tracking-wider text-stone";

export function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className={labelClass}>
        {label}
        {hint && <span className="ml-2 normal-case tracking-normal text-stone/70">{hint}</span>}
      </label>
      {children}
    </div>
  );
}
