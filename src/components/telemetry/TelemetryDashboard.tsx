import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from '@tremor/react';

interface SystemMetrics {
  timestamp: number;
  cpu: number;
  memory: number;
  gpu: number;
}

interface TelemetryDashboardProps {
  metrics: SystemMetrics[];
  currentMetrics: {
    cpu: number;
    memory: number;
    gpu: number;
  };
}

export const TelemetryDashboard: React.FC<TelemetryDashboardProps> = ({
  metrics,
  currentMetrics,
}) => {
  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>CPU Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{currentMetrics.cpu}%</div>
          <div className="h-[200px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={metrics}
                index="timestamp"
                categories={['cpu']}
                colors={['blue']}
                valueFormatter={(value) => `${value}%`}
                showLegend={false}
                showAnimation
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={formatTimestamp}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  formatter={(value) => [`${value}%`, 'CPU']}
                  labelFormatter={formatTimestamp}
                />
                <Area
                  type="monotone"
                  dataKey="cpu"
                  stroke="blue"
                  fill="blue"
                  fillOpacity={0.1}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Memory Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{currentMetrics.memory}%</div>
          <div className="h-[200px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={metrics}
                index="timestamp"
                categories={['memory']}
                colors={['green']}
                valueFormatter={(value) => `${value}%`}
                showLegend={false}
                showAnimation
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={formatTimestamp}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  formatter={(value) => [`${value}%`, 'Memory']}
                  labelFormatter={formatTimestamp}
                />
                <Area
                  type="monotone"
                  dataKey="memory"
                  stroke="green"
                  fill="green"
                  fillOpacity={0.1}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>GPU Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{currentMetrics.gpu}%</div>
          <div className="h-[200px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={metrics}
                index="timestamp"
                categories={['gpu']}
                colors={['purple']}
                valueFormatter={(value) => `${value}%`}
                showLegend={false}
                showAnimation
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={formatTimestamp}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  formatter={(value) => [`${value}%`, 'GPU']}
                  labelFormatter={formatTimestamp}
                />
                <Area
                  type="monotone"
                  dataKey="gpu"
                  stroke="purple"
                  fill="purple"
                  fillOpacity={0.1}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 