import { Card, Box, Heading, Text, HStack, VStack, Badge, BadgeText, BadgeIcon } from '@/components/ui';
import { ArrowDownLeft, ArrowUpRight, PieChart } from 'lucide-react';

export default function DonutChart({ totalInflow = 0, totalOutflow = 0, loading = false }) {
  const sum = totalInflow + totalOutflow;
  const inflowPct = sum > 0 ? (totalInflow / sum) * 100 : 100;
  const outflowPct = sum > 0 ? (totalOutflow / sum) * 100 : 0;

  // SVG circular geometry
  const radius = 68;
  const strokeWidth = 22;
  const circumference = 2 * Math.PI * radius; // ~427.26

  const inflowDash = (inflowPct / 100) * circumference;
  const outflowDash = (outflowPct / 100) * circumference;

  // Format short currency for center
  const formatShort = (val) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)}Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(1)}k`;
    return `₹${val}`;
  };

  if (loading) {
    return (
      <Card className="p-6 h-80 flex items-center justify-center animate-pulse">
        <Text size="sm" className="text-muted-foreground">
          Calculating proportional cash ratios...
        </Text>
      </Card>
    );
  }

  return (
    <Card className="p-6 flex flex-col justify-between h-full relative overflow-hidden">
      {/* Header */}
      <HStack space="md" className="justify-between items-start">
        <VStack space="2xs">
          <Heading size="md" bold className="text-foreground tracking-tight">
            Inflow vs Outflow Share
          </Heading>
          <Text size="xs" className="text-muted-foreground">
            Relative distribution of gross cash movements
          </Text>
        </VStack>
        <Box className="w-8 h-8 rounded-lg bg-muted/60 flex items-center justify-center border border-border/50 text-muted-foreground">
          <PieChart className="w-4 h-4" />
        </Box>
      </HStack>

      {/* Donut SVG */}
      <Box className="relative flex items-center justify-center my-3">
        <svg width="195" height="195" viewBox="0 0 200 200" className="transform -rotate-90 filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
          <defs>
            <filter id="inflowGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="rgb(16, 185, 129)" floodOpacity="0.4" />
            </filter>
            <filter id="outflowGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="rgb(244, 63, 94)" floodOpacity="0.4" />
            </filter>
          </defs>

          {/* Background track */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-muted/50"
          />

          {/* Inflow Arc (Primary) */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="transparent"
            stroke="rgb(16, 185, 129)"
            strokeWidth={strokeWidth}
            strokeDasharray={`${inflowDash} ${circumference}`}
            strokeDashoffset="0"
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
            filter={inflowPct > 10 ? 'url(#inflowGlow)' : undefined}
          />

          {/* Outflow Arc (Destructive) */}
          {totalOutflow > 0 && (
            <circle
              cx="100"
              cy="100"
              r={radius}
              fill="transparent"
              stroke="rgb(244, 63, 94)"
              strokeWidth={strokeWidth}
              strokeDasharray={`${outflowDash} ${circumference}`}
              strokeDashoffset={-inflowDash}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
              filter={outflowPct > 10 ? 'url(#outflowGlow)' : undefined}
            />
          )}
        </svg>

        {/* Center Text Dial */}
        <VStack space="2xs" className="absolute inset-0 items-center justify-center text-center">
          <Text size="2xs" bold className="uppercase tracking-widest text-muted-foreground text-[9px]">
            Inflow Dominance
          </Text>
          <Heading size="2xl" bold className="text-foreground tracking-tight font-mono text-2xl font-extrabold">
            {inflowPct.toFixed(0)}%
          </Heading>
          <Badge variant="success" size="sm" className="py-0 px-1.5 font-mono text-[10px]">
            <BadgeText>{formatShort(totalInflow)}</BadgeText>
          </Badge>
        </VStack>
      </Box>

      {/* Legend Below */}
      <VStack space="xs" className="pt-3 border-t border-border/60">
        <HStack space="md" className="items-center justify-between p-2 bg-muted/20 border border-border/40 rounded-xl">
          <HStack space="xs" className="items-center">
            <Box className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center">
              <ArrowDownLeft className="w-3.5 h-3.5 text-primary" />
            </Box>
            <VStack space="2xs">
              <Text size="xs" bold className="text-foreground">Inflow</Text>
              <Text size="2xs" className="text-muted-foreground font-medium">Bookings & manual</Text>
            </VStack>
          </HStack>
          <VStack space="2xs" className="items-end">
            <Text size="xs" bold className="text-primary font-mono">
              ₹{Number(totalInflow).toLocaleString('en-IN')}
            </Text>
            <Badge variant="success" size="sm" className="py-0 px-1 text-[9px]">
              <BadgeText>{inflowPct.toFixed(1)}%</BadgeText>
            </Badge>
          </VStack>
        </HStack>

        <HStack space="md" className="items-center justify-between p-2 bg-muted/20 border border-border/40 rounded-xl">
          <HStack space="xs" className="items-center">
            <Box className="w-6 h-6 rounded-lg bg-destructive/20 flex items-center justify-center">
              <ArrowUpRight className="w-3.5 h-3.5 text-destructive" />
            </Box>
            <VStack space="2xs">
              <Text size="xs" bold className="text-foreground">Outflow</Text>
              <Text size="2xs" className="text-muted-foreground font-medium">Operating expenses</Text>
            </VStack>
          </HStack>
          <VStack space="2xs" className="items-end">
            <Text size="xs" bold className="text-destructive font-mono">
              ₹{Number(totalOutflow).toLocaleString('en-IN')}
            </Text>
            <Badge variant="muted" size="sm" className="py-0 px-1 text-[9px]">
              <BadgeText>{outflowPct.toFixed(1)}%</BadgeText>
            </Badge>
          </VStack>
        </HStack>
      </VStack>
    </Card>
  );
}
