"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type CategoryItem = {
  name: string;
  amount: number;
  percentage: number;
};

type TrendItem = {
  month: string;
  income: number;
  expense: number;
};

type ReportChartsProps = {
  income: number;
  expense: number;
  categoryData: CategoryItem[];
  trendData: TrendItem[];
};

function formatMoney(
  amount: number
) {
  return `RM ${new Intl.NumberFormat(
    "en-MY",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  ).format(amount)}`;
}

export default function ReportCharts({
  income,
  expense,
  categoryData,
  trendData,
}: ReportChartsProps) {
  const incomeExpenseData = [
    {
      name: "Income",
      amount: income,
    },
    {
      name: "Expenses",
      amount: expense,
    },
  ];

  return (
    <div className="space-y-8">

      {/* ================================= */}
      {/* INCOME VS EXPENSE */}
      {/* ================================= */}

      <section>

        <div>
          <h2 className="text-lg font-bold text-gray-900">
            Income vs Expenses
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Comparison for the selected month.
          </p>
        </div>


        <div className="mt-3 rounded-3xl border border-gray-100 bg-white p-5">

          <div className="h-64 w-full">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <BarChart
                data={
                  incomeExpenseData
                }
                margin={{
                  top: 10,
                  right: 10,
                  left: 0,
                  bottom: 0,
                }}
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                />

                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                />

                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={55}
                  tickFormatter={(
                    value
                  ) =>
                    Number(value) >=
                    1000
                      ? `${(
                          Number(value) /
                          1000
                        ).toFixed(1)}k`
                      : String(value)
                  }
                />

                <Tooltip
                  formatter={(
                    value
                  ) => [
                    formatMoney(
                      Number(value)
                    ),
                    "Amount",
                  ]}
                />

                <Bar
                  dataKey="amount"
                  radius={[
                    8,
                    8,
                    0,
                    0,
                  ]}
                />

              </BarChart>
            </ResponsiveContainer>

          </div>

        </div>

      </section>


      {/* ================================= */}
      {/* CATEGORY BREAKDOWN */}
      {/* ================================= */}

      <section>

        <div>

          <h2 className="text-lg font-bold text-gray-900">
            Spending by Category
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Where your expenses went.
          </p>

        </div>


        {categoryData.length ===
        0 ? (

          <div className="mt-3 rounded-3xl border border-gray-100 bg-white p-8 text-center">

            <div className="text-4xl">
              📊
            </div>

            <p className="mt-3 font-semibold text-gray-900">
              No expenses this month
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Category spending will appear here.
            </p>

          </div>

        ) : (

          <div className="mt-3 rounded-3xl border border-gray-100 bg-white p-5">

            {/* PIE */}
            <div className="h-64 w-full">

              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <PieChart>

                  <Pie
                    data={
                      categoryData
                    }
                    dataKey="amount"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={2}
                  >

                    {categoryData.map(
                      (
                        category,
                        index
                      ) => (

                        <Cell
                          key={`${category.name}-${index}`}
                        />

                      )
                    )}

                  </Pie>

                  <Tooltip
                    formatter={(
                      value
                    ) => [
                      formatMoney(
                        Number(value)
                      ),
                      "Spent",
                    ]}
                  />

                </PieChart>
              </ResponsiveContainer>

            </div>


            {/* CATEGORY LIST */}
            <div className="mt-4 divide-y divide-gray-100">

              {categoryData.map(
                (category) => (

                  <div
                    key={
                      category.name
                    }
                    className="flex items-center justify-between gap-4 py-4"
                  >

                    <div>

                      <p className="font-semibold text-gray-900">
                        {
                          category.name
                        }
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        {
                          category.percentage.toFixed(
                            1
                          )
                        }
                        %
                      </p>

                    </div>


                    <p className="font-bold text-gray-900">
                      {formatMoney(
                        category.amount
                      )}
                    </p>

                  </div>

                )
              )}

            </div>

          </div>

        )}

      </section>


      {/* ================================= */}
      {/* SIX MONTH TREND */}
      {/* ================================= */}

      <section>

        <div>

          <h2 className="text-lg font-bold text-gray-900">
            6-Month Trend
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Income and expenses over time.
          </p>

        </div>


        <div className="mt-3 rounded-3xl border border-gray-100 bg-white p-5">

          <div className="h-72 w-full">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <LineChart
                data={
                  trendData
                }
                margin={{
                  top: 10,
                  right: 10,
                  left: 0,
                  bottom: 0,
                }}
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                />

                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                />

                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={55}
                  tickFormatter={(
                    value
                  ) =>
                    Number(value) >=
                    1000
                      ? `${(
                          Number(value) /
                          1000
                        ).toFixed(1)}k`
                      : String(value)
                  }
                />

                <Tooltip
                  formatter={(
                    value,
                    name
                  ) => [
                    formatMoney(
                      Number(value)
                    ),
                    name === "income"
                      ? "Income"
                      : "Expenses",
                  ]}
                />

                <Line
                  type="monotone"
                  dataKey="income"
                  stroke="currentColor"
                  strokeWidth={2}
                  dot={{
                    r: 3,
                  }}
                />

                <Line
                  type="monotone"
                  dataKey="expense"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeDasharray="6 4"
                  dot={{
                    r: 3,
                  }}
                />

              </LineChart>
            </ResponsiveContainer>

          </div>


          <div className="mt-4 flex flex-wrap gap-5 text-sm">

            <div className="flex items-center gap-2">
              <span className="h-0.5 w-6 bg-gray-900" />

              <span className="text-gray-600">
                Income
              </span>
            </div>


            <div className="flex items-center gap-2">
              <span className="w-6 border-t-2 border-dashed border-gray-900" />

              <span className="text-gray-600">
                Expenses
              </span>
            </div>

          </div>

        </div>

      </section>

    </div>
  );
}