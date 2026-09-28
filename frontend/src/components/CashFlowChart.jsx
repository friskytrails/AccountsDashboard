import { useState } from 'react';
import { Card, Box, Heading, Text, HStack, VStack, Badge, BadgeText, BadgeIcon, Button, ButtonText } from '@/components/ui';
import { TrendingUp, Activity, ArrowDownLeft, ArrowUpRight, Filter, Sparkles } from 'lucide-react';

export default function CashFlowChart({ dailyTrend = [], loading = false }) {
  const [hoveredDay, setHoveredDay] = useState(null);
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'INFLOW' | 'OUTFLOW'

  if (loading || !dailyTrend || dailyTrend.length === 0) {
    return (
      <Card className="p-10 h-96 flex items-center justify-center rounded-3xl bg-card/70 border border-border/70">
        <VStack space="sm" className="items-center">
          <Activity className="w-8 h-8 text-primary animate-pulse" />
          <Text size="sm" className="text-muted-foreground font-medium">
            Aggregating daily cash flow trends from MongoDB...
          </Text>
        </VStack>
      </Card>
    );
  }

  const daysCount = dailyTrend.length;
  const activeDays = dailyTrend.filter(d => d.inflow > 0 || d.outflow > 0);
  const peakDayObj = [...dailyTrend].sort((a, b) => (b.inflow || 0) - (a.inflow || 0))[0] || { day: 1, inflow: 0 };
  const totalMonthInflow = dailyTrend.reduce((acc, curr) => acc + (curr.inflow || 0), 0);

  const maxInflow = Math.max(...dailyTrend.map((d) => d.inflow || 0), 0);
  const maxOutflow = Math.max(...dailyTrend.map((d) => d.outflow || 0), 0);
  const maxVal = Math.max(maxInflow, maxOutflow, 10000);

  // SVG dimensions - Grand and Expansive
  const svgWidth = 1120;
  const svgHeight = 360;
  const paddingLeft = 65;
  const paddingRight = 25;
  const paddingTop = 30;
  const paddingBottom = 45;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  const stepX = chartWidth / daysCount;
  const barWidth = Math.max(4, Math.min(12, stepX / 2 - 2));

  // Y scale formatter
  const formatYLabel = (val) => {
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `₹${Math.round(val / 1000)}k`;
    return `₹${Math.round(val)}`;
  };

  // Grid lines
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
    const val = maxVal * ratio;
    const y = paddingTop + chartHeight - ratio * chartHeight;
    return { val, y };
  });

  // Calculate curve points for Net Velocity
  const points = dailyTrend.map((d, i) => {
    const x = paddingLeft + i * stepX + stepX / 2;
    const ratio = Math.max(0, Math.min(1, (d.net || 0) / maxVal));
    const y = paddingTop + chartHeight - ratio * chartHeight;
    return { x, y, day: d.day, net: d.net, inflow: d.inflow, outflow: d.outflow };
  });

  const polylinePoints = points.map(p => `${p.x},${p.y}`).join(' ');

  // Area under curve points
  const firstPoint = points[0] || { x: paddingLeft, y: paddingTop + chartHeight };
  const lastPoint = points[points.length - 1] || { x: svgWidth - paddingRight, y: paddingTop + chartHeight };
  const areaPoints = `${firstPoint.x},${paddingTop + chartHeight} ${polylinePoints} ${lastPoint.x},${paddingTop + chartHeight}`;

  // Find hovered point coordinates
  const hoveredPoint = hoveredDay ? points.find(p => p.day === hoveredDay.day) : null;

  return (
    <Card className="p-8 lg:p-10 rounded-xl relative overflow-hidden flex flex-col justify-between glow-card bg-gradient-to-b from-card/90 to-card/60 border border-border/80 shadow-2xl">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/[0.04] rounded-full blur-3xl pointer-events-none" />

      {/* Top Header & Analytics Strip */}
      <VStack space="lg" className="mb-6">
        <HStack space="md" className="justify-between items-start flex-wrap gap-4">
          <VStack space="xs">
            <HStack space="md" className="items-center">
              <Heading size="xl" bold className="text-foreground tracking-tight text-xl xl:text-2xl font-bold">
                Daily Cash Flow Velocity
              </Heading>
              <Badge variant="info" size="md" className="gap-1.5 py-1 px-3 rounded-md">
                <BadgeIcon as={Activity} className="w-3.5 h-3.5 text-primary" />
                <BadgeText className="text-xs font-mono font-bold">{activeDays.length} Active Payment Days</BadgeText>
              </Badge>
            </HStack>
          </VStack>

          {/* Quick Metrics & Filter Controls */}
          <HStack space="md" className="items-center flex-wrap gap-3">
            {/* Filter Toggle Buttons */}
            <HStack space="xs" className="p-1 bg-muted/60 border border-border/60 rounded-md">
              {[
                { id: 'ALL', label: 'All Flows' },
                { id: 'INFLOW', label: 'Inflows Only' },
                { id: 'OUTFLOW', label: 'Outflows Only' },
              ].map((tab) => {
                const isActive = activeFilter === tab.id;
                return (
                  <Button
                    key={tab.id}
                    size="sm"
                    variant={isActive ? 'secondary' : 'ghost'}
                    onClick={() => setActiveFilter(tab.id)}
                    className={`h-8 px-3 text-xs font-semibold rounded-md transition-all ${
                      isActive ? 'bg-card text-foreground font-bold shadow-sm border border-border/80' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <ButtonText>{tab.label}</ButtonText>
                  </Button>
                );
              })}
            </HStack>

            {/* Peak Day Chip */}
            <HStack space="xs" className="items-center bg-muted/40 px-3.5 py-1.5 rounded-md border border-border/60">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <Text size="xs" className="text-muted-foreground">Peak Inflow:</Text>
              <Text size="xs" bold className="text-primary font-mono font-bold">
                ₹{Number(peakDayObj.inflow || 0).toLocaleString('en-IN')} (Day {peakDayObj.day})
              </Text>
            </HStack>
          </HStack>
        </HStack>

        {/* Legend Indicators */}
        <HStack space="lg" className="items-center text-xs font-medium pt-2 border-t border-border/40">
          <HStack space="xs" className="items-center">
            <Box className="w-3 h-3 rounded-md bg-emerald-500 shadow-sm shadow-emerald-500/30" />
            <Text size="xs" className="text-foreground/90 font-medium">Verified Inflow Payments</Text>
          </HStack>
          <HStack space="xs" className="items-center">
            <Box className="w-3 h-3 rounded-md bg-rose-500 shadow-sm shadow-rose-500/30" />
            <Text size="xs" className="text-foreground/90 font-medium">Operational Outflows</Text>
          </HStack>
          <HStack space="xs" className="items-center">
            <Box className="w-5 h-1 bg-emerald-400 rounded-full" />
            <Text size="xs" className="text-foreground/90 font-medium">Net Velocity Trendline</Text>
          </HStack>
        </HStack>
      </VStack>

      {/* SVG Chart Canvas */}
      <Box className="w-full overflow-x-auto relative select-none">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-80 xl:h-96 select-none"
          onMouseLeave={() => setHoveredDay(null)}
        >
          <defs>
            {/* Net Flow Area Gradient */}
            <linearGradient id="netAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(16, 185, 129)" stopOpacity="0.30" />
              <stop offset="60%" stopColor="rgb(16, 185, 129)" stopOpacity="0.08" />
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
                className="text-border/40"
                strokeDasharray="4 6"
                strokeWidth="1"
              />
              <text
                x={paddingLeft - 12}
                y={line.y + 4}
                textAnchor="end"
                className="text-[11px] fill-muted-foreground/80 font-mono font-medium"
              >
                {formatYLabel(line.val)}
              </text>
            </g>
          ))}

          {/* Area Under Net Curve */}
          {activeFilter !== 'OUTFLOW' && (
            <polygon
              points={areaPoints}
              fill="url(#netAreaGradient)"
            />
          )}

          {/* Vertical Crosshair Line when hovered */}
          {hoveredPoint && (
            <line
              x1={hoveredPoint.x}
              y1={paddingTop}
              x2={hoveredPoint.x}
              y2={paddingTop + chartHeight}
              stroke="rgb(16, 185, 129)"
              strokeWidth="1.5"
              strokeDasharray="3 3"
              className="opacity-70"
            />
          )}

          {/* Grouped Daily Bars */}
          {dailyTrend.map((d, i) => {
            const centerX = paddingLeft + i * stepX + stepX / 2;
            const inflowHeight = (d.inflow / maxVal) * chartHeight;
            const outflowHeight = (d.outflow / maxVal) * chartHeight;

            const inflowX = centerX - barWidth - 1;
            const outflowX = centerX + 1;

            const inflowY = paddingTop + chartHeight - inflowHeight;
            const outflowY = paddingTop + chartHeight - outflowHeight;

            const showInflow = activeFilter === 'ALL' || activeFilter === 'INFLOW';
            const showOutflow = activeFilter === 'ALL' || activeFilter === 'OUTFLOW';

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
                  rx="6"
                />

                {/* Inflow bar */}
                {showInflow && d.inflow > 0 && (
                  <rect
                    x={inflowX}
                    y={inflowY}
                    width={barWidth}
                    height={Math.max(inflowHeight, 3)}
                    fill="url(#inflowBarGradient)"
                    rx="2"
                    className="transition-all duration-200"
                  />
                )}

                {/* Outflow bar */}
                {showOutflow && d.outflow > 0 && (
                  <rect
                    x={outflowX}
                    y={outflowY}
                    width={barWidth}
                    height={Math.max(outflowHeight, 3)}
                    fill="url(#outflowBarGradient)"
                    rx="2"
                    className="transition-all duration-200"
                  />
                )}
              </g>
            );
          })}

          {/* Net Flow Curve Line */}
          {activeFilter !== 'OUTFLOW' && (
            <polyline
              fill="none"
              stroke="rgb(16, 185, 129)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={polylinePoints}
              className="filter drop-shadow-[0_4px_12px_rgba(16,185,129,0.4)]"
            />
          )}

          {/* Active Data Dots on Net Curve */}
          {points.map((p) => {
            if (p.net <= 0 && (!hoveredDay || hoveredDay.day !== p.day)) return null;
            const isHovered = hoveredDay?.day === p.day;
            return (
              <g key={p.day}>
                {isHovered && (
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="9"
                    fill="rgba(16, 185, 129, 0.25)"
                    className="animate-ping"
                  />
                )}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? '6' : '3.5'}
                  fill="rgb(16, 185, 129)"
                  stroke="rgb(13, 18, 30)"
                  strokeWidth="2.5"
                  className="transition-all"
                />
              </g>
            );
          })}

          {/* X Axis Labels */}
          {dailyTrend.map((d, i) => {
            if (d.day === 1 || d.day % 5 === 0 || d.day === daysCount) {
              const x = paddingLeft + i * stepX + stepX / 2;
              return (
                <text
                  key={d.day}
                  x={x}
                  y={svgHeight - 12}
                  textAnchor="middle"
                  className="text-[11px] fill-muted-foreground/80 font-mono font-medium"
                >
                  Day {String(d.day).padStart(2, '0')}
                </text>
              );
            }
            return null;
          })}
        </svg>
      </Box>

      {/* Spacious Interactive Hover Information Card */}
      {hoveredDay ? (
        <Card className="mt-5 p-4 bg-card/95 border border-primary/30 rounded-2xl flex items-center justify-between text-xs animate-in fade-in shadow-2xl">
          <HStack space="md" className="items-center">
            <Badge variant="info" size="md" className="py-1 px-3">
              <BadgeText className="font-mono font-bold text-xs">Day {hoveredDay.day}</BadgeText>
            </Badge>
            <Text size="sm" bold className="text-foreground font-semibold">
              Daily Settlement Detail
            </Text>
          </HStack>

          <HStack space="xl" className="items-center">
            <HStack space="sm" className="items-center">
              <Text size="xs" className="text-muted-foreground">Booking Inflows:</Text>
              <Text size="sm" bold className="text-primary font-mono text-sm">
                ₹{Number(hoveredDay.inflow || 0).toLocaleString('en-IN')}
              </Text>
            </HStack>
            <HStack space="sm" className="items-center">
              <Text size="xs" className="text-muted-foreground">Operational Outflows:</Text>
              <Text size="sm" bold className="text-destructive font-mono text-sm">
                ₹{Number(hoveredDay.outflow || 0).toLocaleString('en-IN')}
              </Text>
            </HStack>
            <HStack space="sm" className="items-center pl-3 border-l border-border/50">
              <Text size="xs" className="text-muted-foreground">Net Velocity:</Text>
              <Text size="sm" bold className="text-foreground font-mono text-sm">
                ₹{Number(hoveredDay.net || 0).toLocaleString('en-IN')}
              </Text>
            </HStack>
          </HStack>
        </Card>
      ) : (
        <Box className="mt-4 p-3.5 bg-muted/30 border border-border/50 rounded-2xl text-xs text-muted-foreground">
          <Text size="xs" className="text-muted-foreground">
            Hover over any day column or velocity peak to inspect granular daily booking payments and disbursements.
          </Text>
        </Box>
      )}
    </Card>
  );
}

