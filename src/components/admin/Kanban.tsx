export type KanbanColumn = {
  key: string;
  label: string;
  count: number;
  dot?: string; // Tailwind bg-* class for the status dot
  cards: React.ReactNode;
};

/** Horizontal board of status columns. Cards use inline controls (not dropdown
 *  menus) so nothing is clipped by the board's horizontal scroll. */
export default function KanbanBoard({ columns }: { columns: KanbanColumn[] }) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-3">
      {columns.map((col) => (
        <div key={col.key} className="flex max-h-[70vh] w-[19.5rem] shrink-0 flex-col rounded-xl border border-sand bg-ivory/50">
          <div className="flex items-center justify-between border-b border-sand px-3.5 py-2.5">
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${col.dot ?? "bg-stone"}`} aria-hidden="true" />
              <span className="text-sm font-semibold text-forest">{col.label}</span>
            </div>
            <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-stone">{col.count}</span>
          </div>
          <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto p-2.5">
            {col.count === 0 ? (
              <p className="px-1 py-8 text-center text-xs text-stone/50">Bu kolonda kayıt yok</p>
            ) : (
              col.cards
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Styled card container for kanban items. */
export function KanbanCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-sand bg-white p-3 shadow-sm shadow-forest/5">{children}</div>
  );
}
