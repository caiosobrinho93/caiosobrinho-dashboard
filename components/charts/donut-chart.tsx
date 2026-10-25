import { formatCurrency } from "@/lib/utils";

export type ChartSlice = {
  label: string;
  value: number;
  color: string;
};

type DonutChartProps = {
  data: ChartSlice[];
  centerValue: string;
  centerLabel: string;
};

const RADIUS = 41;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function DonutChart({ data, centerValue, centerLabel }: DonutChartProps) {
  const total = data.reduce((sum, slice) => sum + slice.value, 0);
  const visible = data.filter((slice) => slice.value > 0);
  let offset = 0;

  return (
    <div
      className="donut-wrap"
      role="img"
      aria-label={`${centerLabel}: ${centerValue}. ${visible
        .map((slice) => `${slice.label} ${formatCurrency(slice.value)}`)
        .join(", ")}`}
    >
      <svg className="donut-svg" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r={RADIUS}
          fill="none"
          stroke="#343434"
          strokeWidth="10"
        />
        {total > 0
          ? visible.map((slice) => {
              const fraction = slice.value / total;
              const dash = Math.max(0, fraction * CIRCUMFERENCE - (visible.length > 1 ? 1.4 : 0));
              const element = (
                <circle
                  key={slice.label}
                  cx="50"
                  cy="50"
                  r={RADIUS}
                  fill="none"
                  stroke={slice.color}
                  strokeWidth="10"
                  strokeDasharray={`${dash} ${CIRCUMFERENCE}`}
                  strokeDashoffset={-offset * CIRCUMFERENCE}
                >
                  <title>{`${slice.label}: ${formatCurrency(slice.value)}`}</title>
                </circle>
              );
              offset += fraction;
              return element;
            })
          : null}
      </svg>
      <div className="donut-center">
        <span className="donut-center-value">{centerValue}</span>
        <span className="donut-center-label">{centerLabel}</span>
      </div>
    </div>
  );
}

type DonutLegendProps = {
  data: ChartSlice[];
  maxItems?: number;
};

export function DonutLegend({ data, maxItems = 6 }: DonutLegendProps) {
  const total = data.reduce((sum, slice) => sum + slice.value, 0);
  const sorted = [...data].sort((a, b) => b.value - a.value);
  let shown = sorted;
  if (sorted.length > maxItems) {
    const head = sorted.slice(0, maxItems - 1);
    const rest = sorted.slice(maxItems - 1);
    shown = [
      ...head,
      {
        label: "Outros",
        value: rest.reduce((sum, slice) => sum + slice.value, 0),
        color: "#6f6f6f",
      },
    ];
  }

  if (total <= 0) {
    return <p className="field-hint">Sem gastos neste mês.</p>;
  }

  return (
    <div className="legend">
      {shown.map((slice) => {
        const percentage = Math.round((slice.value / total) * 100);
        return (
          <div className="legend-row" key={slice.label}>
            <span className="legend-dot" style={{ background: slice.color }} />
            <span className="legend-name">{slice.label}</span>
            <span className="legend-value">{formatCurrency(slice.value)}</span>
            <span className="legend-pct">{percentage}%</span>
          </div>
        );
      })}
    </div>
  );
}
