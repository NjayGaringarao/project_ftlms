import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CampusEtlAtlFacultyMetric } from "@/lib/proposal/read-models";

const toFixed = (value: number) => value.toFixed(2);

type CampusLoadEtlAtlChartProps = {
  rows: CampusEtlAtlFacultyMetric[];
};

const CampusLoadEtlAtlChart = ({ rows }: CampusLoadEtlAtlChartProps) => {
  return (
    <div className="rounded-md border p-4">
      <p className="mb-2 text-sm font-medium">ETL vs ATL Per Faculty</p>
      <div className="h-80 overflow-x-auto">
        <BarChart
          width={Math.max(256, rows.length * 88)}
          height={320}
          data={rows}
          margin={{ top: 8, right: 0, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="faculty_name"
            angle={-28}
            textAnchor="end"
            interval="preserveStartEnd"
            height={56}
            tick={{ fontSize: 10 }}
          />
          <YAxis />
          <Tooltip
            formatter={(value) => toFixed(Number(value ?? 0))}
            labelFormatter={(value) => `Faculty: ${value}`}
          />
          <Legend />
          <Bar
            dataKey="etl"
            name="ETL"
            fill="var(--color-blue-400)"
            radius={[4, 4, 0, 0]}
            barSize={12}
          />
          <Bar
            dataKey="atl"
            name="ATL"
            fill="var(--color-green-400)"
            radius={[4, 4, 0, 0]}
            barSize={12}
          />
        </BarChart>
      </div>
    </div>
  );
};

export default CampusLoadEtlAtlChart;
