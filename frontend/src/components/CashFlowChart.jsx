import { useState } from 'react';
import { Card, Box, Heading, Text, HStack, VStack, Badge, BadgeText, BadgeIcon } from '@/components/ui';
import { TrendingUp, Activity } from 'lucide-react';

export default function CashFlowChart({ dailyTrend = [], loading = false }) {
  const [hoveredDay, setHoveredDay] = useState(null);

  if (loading || !dailyTrend || dailyTrend.length === 0) {
    return (
      <Card className="p-6 h-80 flex items-center justify-center">
        <Text size="sm" className="text-muted-foreground animate-pulse">
          Loading cash flow trends...
        </Text>
      </Card>
    );
  }

  const daysCount = dailyTrend.length;
  // Calculate peak day and total inflow days
  const activeDays = dailyTrend.filter(d => d.inflow > 0 || d.outflow > 0);
  const peakDayObj = [...dailyTrend].sort((a, b) => (b.inflow || 0) - (a.inflow || 0))[0] || { day: 1, inflow: 0 };

  const maxInflow = Math.max(...dailyTrend.map((d) => d.inflow || 0), 0);
  const maxOutflow = Math.max(...dailyTrend.map((d) => d.outflow || 0), 0);
  const maxVal = Math.max(maxInflow, maxOutflow, 10000);

  // SVG dimensions
  const svgWidth = 820;
  const svgHeight = 240;
  const paddingLeft = 55;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 35;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  const stepX = chartWidth / daysCount;
  const barWidth = Math.max(2.5, Math.min(8, stepX / 2 - 1.5));

  // Y scale formatter
  const formatYLabel = (val) => {
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `₹${Math.round(val / 1000)}k`;
    return `₹${Math.round(val)}`;
  };

  // Grid lines
  const gridLines = [0, 0.33, 0.66, 1].map((ratio) => {
    const val = maxVal * ratio;
    const y = paddingTop + chartHeight - ratio * chartHeight;
    return { val, y };
  });

  // Calculate curve points
  const points = dailyTrend.map((d, i) => {
    const x = paddingLeft + i * stepX + stepX / 2;
    const ratio = Math.max(0, Math.min(1, (d.net || 0) / maxVal));
    const y = paddingTop + chartHeight - ratio * chartHeight;
    return { x, y, day: d.day, net: d.net };
  });

  const polylinePoints = points.map(p => `${p.x},${p.y}`).join(' ');

  // Area under curve points (close path to bottom)
  const firstPoint = points[0] || { x: paddingLeft, y: paddingTop + chartHeight };
  const lastPoint = points[points.length - 1] || { x: svgWidth - paddingRight, y: paddingTop + chartHeight };
  const areaPoints = `${firstPoint.x},${paddingTop + chartHeight} ${polylinePoints} ${lastPoint.x},${paddingTop + chartHeight}`;

  return (
    <Card className="p-6 relative overflow-hidden flex flex-col justify-between h-full">
      {/* Header */}
      <HStack space="md" className="justify-between items-center mb-4 flex-wrap gap-2">
        <VStack space="2xs">
          <HStack space="sm" className="items-center">
            <Heading size="md" bold className="text-foreground tracking-tight">
              Daily Cash Flow Velocity
            </Heading>
            <Badge variant="info" size="sm" className="gap-1 font-mono text-[10px]">
              <BadgeIcon as={Activity} className="w-3 h-3 text-primary" />
              <BadgeText>{activeDays.length} Active Days</BadgeText>
            </Badge>
          </HStack>
          <Text size="xs" className="text-muted-foreground">
            Day-by-day booking payments vs. operational disbursements
          </Text>
        </VStack>

        {/* Legend and Peak stat */}
        <HStack space="md" className="items-center text-xs font-medium">
          <HStack space="xs" className="items-center bg-muted/40 px-2.5 py-1 rounded-lg border border-border/50">
            <Text size="2xs" className="text-muted-foreground">Peak Inflow:</Text>
            <Text size="2xs" bold className="text-primary font-mono">
              ₹{Number(peakDayObj.inflow || 0).toLocaleString('en-IN')} (Day {peakDayObj.day})
            </Text>
          </HStack>

          <HStack space="sm" className="items-center">
            <HStack space="xs" className="items-center">
              <Box className="w-2 h-2 rounded-full bg-primary" />
              <Text size="2xs" className="text-foreground/80 font-medium">Inflow</Text>
            </HStack>
            <HStack space="xs" className="items-center">
              <Box className="w-2 h-2 rounded-full bg-destructive" />
              <Text size="2xs" className="text-foreground/80 font-medium">Outflow</Text>
            </HStack>
            <HStack space="xs" className="items-center">
              <Box className="w-3.5 h-0.5 bg-primary rounded" />
              <Text size="2xs" className="text-foreground/80 font-medium">Net Velocity</Text>
            </HStack>
          </HStack>
        </HStack>
      </HStack>

      {/* SVG Chart */}
      <Box className="w-full overflow-x-auto relative">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-60 select-none"
          onMouseLeave={() => setHoveredDay(null)}
        >
          <defs>
            {/* Net Flow Area Gradient */}
            <linearGradient id="netAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(16, 185, 129)" stopOpacity="0.25" />
              <stop offset="100%" stopColor="rgb(16, 185, 129)" stopOpacity="0.0" />
            </linearGradient>
            {/* Inflow Bar Gradient */}
            <linearGradient id="inflowBarGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(52, 211, 153)" />
              <stop offset="100%" stopColor="rgb(16, 185, 129)" />
            </linearGradient>
            {/* Outflow Bar Gradient */}
            <linearGradient id="outflowBarGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(251, 113, 133)" />
              <stop offset="100%" stopColor="rgb(244, 63, 94)" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {gridLines.map((line, idx) => (
            <g key={idx}>
              <line
                x1={paddingLeft}
                y1={line.y}
                x2={svgWidth - paddingRight}
                y2={line.y}
                stroke="currentColor"
                className="text-border/60"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              <text
                x={paddingLeft - 10}
                y={line.y + 4}
                textAnchor="end"
                className="text-[10px] fill-muted-foreground font-mono font-medium"
              >
                {formatYLabel(line.val)}
              </text>
            </g>
          ))}

          {/* Area Under Net Curve */}
          <polygon
            points={areaPoints}
            fill="url(#netAreaGradient)"
          />

          {/* Grouped Bars */}
          {dailyTrend.map((d, i) => {
            const centerX = paddingLeft + i * stepX + stepX / 2;
            const inflowHeight = (d.inflow / maxVal) * chartHeight;
            const outflowHeight = (d.outflow / maxVal) * chartHeight;

            const inflowX = centerX - barWidth - 0.5;
            const outflowX = centerX + 0.5;

            const inflowY = paddingTop + chartHeight - inflowHeight;
            const outflowY = paddingTop + chartHeight - outflowHeight;

            return (
              <g
                key={d.day}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredDay(d)}
              >
                {/* Transparent hover column */}
                <rect
                  x={paddingLeft + i * stepX}
                  y={paddingTop}
                  width={stepX}
                  height={chartHeight}
                  fill={hoveredDay?.day === d.day ? 'currentColor' : 'transparent'}
                  className="text-primary/10 transition-colors"
                  rx="4"
                />

                {/* Inflow bar */}
                {d.inflow > 0 && (
                  <rect
                    x={inflowX}
                    y={inflowY}
                    width={barWidth}
                    height={Math.max(inflowHeight, 2)}
                    fill="url(#inflowBarGradient)"
                    rx="1.5"
                  />
                )}

                {/* Outflow bar */}
                {d.outflow > 0 && (
                  <rect
                    x={outflowX}
                    y={outflowY}
                    width={barWidth}
                    height={Math.max(outflowHeight, 2)}
                    fill="url(#outflowBarGradient)"
                    rx="1.5"
                  />
                )}
              </g>
            );
          })}

          {/* Net Flow Curve Line */}
          <polyline
            fill="none"
            stroke="rgb(16, 185, 129)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={polylinePoints}
            className="filter drop-shadow-[0_2px_8px_rgba(16,185,129,0.35)]"
          />

          {/* Active Data Dots on Net Curve */}
          {points.map((p) => {
            if (p.net <= 0 && (!hoveredDay || hoveredDay.day !== p.day)) return null;
            const isHovered = hoveredDay?.day === p.day;
            return (
              <circle
                key={p.day}
                cx={p.x}
                cy={p.y}
                r={isHovered ? '5' : '3'}
                fill="rgb(16, 185, 129)"
                stroke="rgb(13, 18, 30)"
                strokeWidth="2"
                className="transition-all"
              />
            );
          })}

          {/* X Axis labels */}
          {dailyTrend.map((d, i) => {
            if (d.day === 1 || d.day % 5 === 0 || d.day === daysCount) {
              const x = paddingLeft + i * stepX + stepX / 2;
              return (
                <text
                  key={d.day}
                  x={x}
                  y={svgHeight - 10}
                  textAnchor="middle"
                  className="text-[10px] fill-muted-foreground font-mono font-medium"
                >
                  {String(d.day).padStart(2, '0')}
                </text>
              );
            }
            return null;
          })}
        </svg>
      </Box>

      {/* Floating Hover Details Card */}
      {hoveredDay ? (
        <Card className="mt-3 p-3 bg-card/90 border-border/80 flex items-center justify-between text-xs animate-in fade-in shadow-xl">
          <HStack space="sm" className="items-center">
            <Badge variant="info" size="sm">
              <BadgeText className="font-mono">Day {hoveredDay.day}</BadgeText>
            </Badge>
            <Text size="xs" className="text-muted-foreground">
              Daily Movement:
            </Text>
          </HStack>

          <HStack space="lg" className="items-center">
            <HStack space="xs" className="items-center">
              <Text size="2xs" className="text-muted-foreground">In:</Text>
              <Text size="xs" bold className="text-primary font-mono">
                ₹{Number(hoveredDay.inflow || 0).toLocaleString('en-IN')}
              </Text>
            </HStack>
            <HStack space="xs" className="items-center">
              <Text size="2xs" className="text-muted-foreground">Out:</Text>
              <Text size="xs" bold className="text-destructive font-mono">
                ₹{Number(hoveredDay.outflow || 0).toLocaleString('en-IN')}
              </Text>
            </HStack>
            <HStack space="xs" className="items-center">
              <Text size="2xs" className="text-muted-foreground">Net:</Text>
              <Text size="xs" bold className="text-foreground font-mono">
                ₹{Number(hoveredDay.net || 0).toLocaleString('en-IN')}
              </Text>
            </HStack>
          </HStack>
        </Card>
      ) : (
        <Box className="mt-3 py-1.5 px-3 bg-muted/20 border border-border/40 rounded-xl flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Tip: Hover over any date column to view exact daily liquidity movements.</span>
          <span className="font-mono font-medium text-primary">Live MongoDB Aggregation</span>
        </Box>
      )}
    </Card>
  );
}
