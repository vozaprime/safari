export default function MiniBarChart({
  data,
  height = 120,
}: {
  data: { label: string; value: number }[];
  height?: number;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const barW = 100 / data.length;

  return (
    <div>
      <div className="flex items-end gap-[2px]" style={{ height }}>
        {data.map((d, i) => (
          <div key={i} className="group relative flex-1" title={`${d.label}: ${d.value}`}>
            <div
              className="w-full rounded-t bg-forest/80 transition-colors group-hover:bg-gold"
              style={{ height: `${(d.value / max) * height}px`, minHeight: d.value > 0 ? 3 : 0 }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-stone/60">
        <span>{data[0]?.label}</span>
        <span>{data[Math.floor(data.length / 2)]?.label}</span>
        <span>{data[data.length - 1]?.label}</span>
      </div>
      <style>{`.flex-1 { min-width: ${barW}%; }`}</style>
    </div>
  );
}
