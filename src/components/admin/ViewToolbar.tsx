import Link from "next/link";
import AdminIcon from "./icons";

type Params = Record<string, string | undefined>;

function href(basePath: string, params: Params, overrides: Params) {
  const merged: Params = { ...params, ...overrides };
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(merged)) {
    if (v !== undefined && v !== "" && v !== null) qs.set(k, String(v));
  }
  const s = qs.toString();
  return s ? `${basePath}?${s}` : basePath;
}

const seg = (active: boolean) =>
  `inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors ${
    active ? "bg-forest text-ivory" : "text-stone hover:text-forest"
  }`;

/**
 * List/Kanban view switch + Active/Archive filter for admin collection pages.
 * URL-driven (server-rendered Links) so the server renders the right data and
 * the choice is shareable. `right` is a slot for page-specific controls
 * (search, export, "add" button). Toggling view/archive preserves other query
 * params (q, status, …) but resets pagination.
 */
export default function ViewToolbar({
  basePath,
  params,
  kanban = true,
  archive = true,
  right,
}: {
  basePath: string;
  params: Params;
  kanban?: boolean;
  archive?: boolean;
  right?: React.ReactNode;
}) {
  const view = params.view === "kanban" ? "kanban" : "list";
  const isArchived = params.archived === "1";

  return (
    <div className="mb-5 flex flex-wrap items-center gap-3">
      {kanban && (
        <div className="inline-flex rounded-lg border border-sand bg-white p-0.5">
          <Link href={href(basePath, params, { view: undefined })} className={seg(view === "list")} aria-current={view === "list" ? "page" : undefined}>
            <AdminIcon name="list" className="h-4 w-4" />
            Liste
          </Link>
          <Link href={href(basePath, params, { view: "kanban" })} className={seg(view === "kanban")} aria-current={view === "kanban" ? "page" : undefined}>
            <AdminIcon name="columns" className="h-4 w-4" />
            Pano
          </Link>
        </div>
      )}

      {archive && (
        <div className="inline-flex rounded-lg border border-sand bg-white p-0.5">
          <Link href={href(basePath, params, { archived: undefined, page: undefined })} className={seg(!isArchived)} aria-current={!isArchived ? "page" : undefined}>
            Aktif
          </Link>
          <Link href={href(basePath, params, { archived: "1", page: undefined })} className={seg(isArchived)} aria-current={isArchived ? "page" : undefined}>
            <AdminIcon name="archive" className="h-4 w-4" />
            Arşiv
          </Link>
        </div>
      )}

      {right && <div className="ml-auto flex flex-wrap items-center gap-2">{right}</div>}
    </div>
  );
}
