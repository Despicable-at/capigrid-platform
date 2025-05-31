import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AnalyticsChartProps {
  data: Array<{ date: string; amount: string; count: number }>;
  title?: string;
  timeRange?: string;
  onTimeRangeChange?: (value: string) => void;
}

export default function AnalyticsChart({ 
  data, 
  title = "Funding Progress", 
  timeRange = "30d",
  onTimeRangeChange 
}: AnalyticsChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<any>(null);

  useEffect(() => {
    const loadChart = async () => {
      // Dynamically import Chart.js to avoid SSR issues
      const { Chart, registerables } = await import('chart.js');
      Chart.register(...registerables);

      const canvas = canvasRef.current;
      if (!canvas) return;

      // Destroy existing chart
      if (chartRef.current) {
        chartRef.current.destroy();
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Prepare data
      const labels = data.map(item => {
        const date = new Date(item.date);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      });

      const amounts = data.map(item => parseFloat(item.amount));
      const maxAmount = Math.max(...amounts, 1);

      // Create gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, 400);
      gradient.addColorStop(0, 'rgba(37, 99, 235, 0.3)');
      gradient.addColorStop(1, 'rgba(37, 99, 235, 0.05)');

      chartRef.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Daily Contributions',
              data: amounts,
              borderColor: 'rgb(37, 99, 235)',
              backgroundColor: gradient,
              borderWidth: 3,
              fill: true,
              tension: 0.4,
              pointBackgroundColor: 'rgb(37, 99, 235)',
              pointBorderColor: 'white',
              pointBorderWidth: 2,
              pointRadius: 5,
              pointHoverRadius: 7,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            intersect: false,
            mode: 'index',
          },
          plugins: {
            legend: {
              display: false,
            },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              titleColor: 'white',
              bodyColor: 'white',
              borderColor: 'rgb(37, 99, 235)',
              borderWidth: 1,
              cornerRadius: 8,
              displayColors: false,
              callbacks: {
                title: (context) => {
                  const dataIndex = context[0].dataIndex;
                  const date = new Date(data[dataIndex].date);
                  return date.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  });
                },
                label: (context) => {
                  const dataIndex = context.dataIndex;
                  const amount = data[dataIndex].amount;
                  const count = data[dataIndex].count;
                  return [
                    `Amount: $${parseFloat(amount).toLocaleString()}`,
                    `Contributions: ${count}`,
                  ];
                },
              },
            },
          },
          scales: {
            x: {
              grid: {
                display: false,
              },
              border: {
                display: false,
              },
              ticks: {
                color: 'rgb(107, 114, 128)',
                font: {
                  size: 12,
                },
              },
            },
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(107, 114, 128, 0.1)',
              },
              border: {
                display: false,
              },
              ticks: {
                color: 'rgb(107, 114, 128)',
                font: {
                  size: 12,
                },
                callback: function(value) {
                  return '$' + Number(value).toLocaleString();
                },
              },
            },
          },
          elements: {
            point: {
              hoverBorderWidth: 3,
            },
          },
        },
      });
    };

    loadChart();

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [data]);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          {onTimeRangeChange && (
            <Select value={timeRange} onValueChange={onTimeRangeChange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full chart-container rounded-lg p-4">
          <canvas ref={canvasRef} className="w-full h-full" />
        </div>
        
        {data.length === 0 && (
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-muted flex items-center justify-center">
                📊
              </div>
              <p className="text-sm">No data available for the selected period</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
