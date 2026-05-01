import type { CampusEtlAtlFacultyMetric } from "@/features/ftl-evaluation/lib/load-proposal/read-models";

const toFixed = (value: number) => value.toFixed(2);

const loadBandLabel: Record<CampusEtlAtlFacultyMetric["load_band"], string> = {
  NORMAL: "Normal",
  UNDERLOAD: "Underload",
  OVERLOAD: "Overload",
};

const loadBandStyle: Record<CampusEtlAtlFacultyMetric["load_band"], string> = {
  NORMAL: "bg-emerald-100 text-emerald-800 border-emerald-200",
  UNDERLOAD: "bg-amber-100 text-amber-800 border-amber-200",
  OVERLOAD: "bg-rose-100 text-rose-800 border-rose-200",
};

type CampusLoadFacultyTableProps = {
  rows: CampusEtlAtlFacultyMetric[];
  emptyStateMessage: string;
};

const CampusLoadFacultyTable = ({
  rows,
  emptyStateMessage,
}: CampusLoadFacultyTableProps) => {
  return (
    <div className="rounded-md border p-3">
      <p className="mb-2 text-sm font-medium">Individual Faculty Load</p>
      <div className="overflow-x-auto">
        <table className="w-full overflow-hidden rounded-md text-sm">
          <thead className="border-b bg-foreground/10">
            <tr className="text-left text-xs">
              <th className="px-2 py-2">Faculty</th>
              <th className="px-2 py-2">ETL</th>
              <th className="px-2 py-2">ATL</th>
              <th className="px-2 py-2">TWL</th>
              <th className="px-2 py-2">Load Band</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.faculty_id} className="border-b">
                <td className="px-2 py-2">{row.faculty_name}</td>
                <td className="px-2 py-2">{toFixed(row.etl)}</td>
                <td className="px-2 py-2">{toFixed(row.atl)}</td>
                <td className="px-2 py-2">{toFixed(row.twl)}</td>
                <td className="px-2 py-2">
                  <span
                    className={`rounded border px-1.5 py-0.5 text-xs ${loadBandStyle[row.load_band]}`}
                  >
                    {loadBandLabel[row.load_band]}
                  </span>
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-2 py-4 text-center text-foreground/70">
                  {emptyStateMessage}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CampusLoadFacultyTable;
