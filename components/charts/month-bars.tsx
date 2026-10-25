import { formatCurrency } from "@/lib/utils";

export type MonthBar = {
  key: string;
  label: string;
  income: number;
  expense: number;
};

export function MonthBars({ months }: { months: MonthBar[] }) {
  const max = Math.max(
    1,
    ...months.flatMap((month) => [month.income, month.expense]),
  );

  return (
    <div>
      <div
        className="bars-chart"
        role="img"
        aria-label={`Comparativo dos últimos ${months.length} meses: ${months
          .map(
            (month) =>
              `${month.label}, receitas ${formatCurrency(month.income)} e despesas ${formatCurrency(month.expense)}`,
          )
          .join("; ")}`}
      >
        {months.map((month) => {
          const incomeHeight = month.income > 0 ? Math.max(2, (month.income / max) * 100) : 0;
          const expenseHeight = month.expense > 0 ? Math.max(2, (month.expense / max) * 100) : 0;
          return (
            <div className="bar-group" key={month.key}>
              <div
                className="bar-pair"
                title={`${month.label}: +${formatCurrency(month.income)} · −${formatCurrency(month.expense)}`}
              >
                <div className="bar income" style={{ height: `${incomeHeight}%` }} />
                <div className="bar expense" style={{ height: `${expenseHeight}%` }} />
              </div>
              <span className="bar-label">{month.label}</span>
            </div>
          );
        })}
      </div>
      <div className="chart-legend">
        <span className="chart-legend-item">
          <span className="chart-legend-swatch" style={{ background: "var(--teal)" }} />
          Receitas
        </span>
        <span className="chart-legend-item">
          <span className="chart-legend-swatch" style={{ background: "var(--red)", opacity: 0.72 }} />
          Despesas
        </span>
      </div>
    </div>
  );
}
