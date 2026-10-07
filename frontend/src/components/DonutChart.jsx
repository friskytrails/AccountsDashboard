import { useState, useRef } from 'react';
import { Card, Box, Heading, Text, HStack, VStack, Badge, BadgeText, Button, ButtonText, ButtonIcon } from '@/components/ui';
import {
  PieChart,
  Briefcase,
  Building2,
  Wrench,
  Hotel,
  Car,
  Users,
  Camera,
  Megaphone,
  MoreHorizontal,
  Plus
} from 'lucide-react';

const CATEGORY_MAP = {
  SALARIES: {
    label: 'Salaries & Staff',
    icon: Briefcase,
    hex: '#F43F5E', // Rose
    color: 'text-rose-400',
    bg: 'bg-rose-400',
    container: 'bg-rose-500/15 border-rose-500/30 text-rose-400'
  },
  SUPPLIERS: {
    label: 'Suppliers & Vendors',
    icon: Building2,
    hex: '#0EA5E9', // Sky
    color: 'text-sky-400',
    bg: 'bg-sky-400',
    container: 'bg-sky-500/15 border-sky-500/30 text-sky-400'
  },
  OPERATIONS: {
    label: 'Operations & Fleet',
    icon: Wrench,
    hex: '#10B981', // Emerald
    color: 'text-emerald-400',
    bg: 'bg-emerald-400',
    container: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
  },
  HOTELS: {
    label: 'Hotels & Lodging',
    icon: Hotel,
    hex: '#F59E0B', // Amber
    color: 'text-amber-400',
    bg: 'bg-amber-400',
    container: 'bg-amber-500/15 border-amber-500/30 text-amber-400'
  },
  TRANSPORT: {
    label: 'Transport & Fleet',
    icon: Car,
    hex: '#06B6D4', // Cyan
    color: 'text-cyan-400',
    bg: 'bg-cyan-400',
    container: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400'
  },
  GUIDES: {
    label: 'Tour Guides',
    icon: Users,
    hex: '#14B8A6', // Teal
    color: 'text-teal-400',
    bg: 'bg-teal-400',
    container: 'bg-teal-500/15 border-teal-500/30 text-teal-400'
  },
  SIGHTSEEING: {
    label: 'Sightseeing & Entry',
    icon: Camera,
    hex: '#8B5CF6', // Violet
    color: 'text-violet-400',
    bg: 'bg-violet-400',
    container: 'bg-violet-500/15 border-violet-500/30 text-violet-400'
  },
  MARKETING: {
    label: 'Marketing & Ads',
    icon: Megaphone,
    hex: '#D946EF', // Fuchsia
    color: 'text-fuchsia-400',
    bg: 'bg-fuchsia-400',
    container: 'bg-fuchsia-500/15 border-fuchsia-500/30 text-fuchsia-400'
  },
  OTHERS: {
    label: 'Miscellaneous',
    icon: MoreHorizontal,
    hex: '#94A3B8', // Slate
    color: 'text-slate-400',
    bg: 'bg-slate-400',
    container: 'bg-slate-500/15 border-slate-500/30 text-slate-400'
  },
};

function formatRupee(amount) {
  if (amount === undefined || amount === null) return '₹0';
  return '₹' + Number(amount).toLocaleString('en-IN');
}

export default function DonutChart({
  categoryBreakdown = [],
  totalOutflow = 0,
  loading = false,
  onOpenAdd
}) {
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [tooltip, setTooltip] = useState({
    visible: false,
    x: 0,
    y: 0,
    category: null,
    amount: 0,
    percentage: 0,
    meta: null
  });
  const containerRef = useRef(null);

  if (loading) {
    return (
      <Card className="p-8 h-96 flex items-center justify-center animate-pulse rounded-3xl bg-card/60">
        <Text size="sm" className="text-muted-foreground font-medium">
          Loading category-wise cash distribution...
        </Text>
      </Card>
    );
  }

  // SVG circular geometry
  const radius = 80;
  const strokeWidth = 26;
  const circumference = 2 * Math.PI * radius; // ~502.65

  // Slices calculation
  let cumulativeOffset = 0;
  const slices = categoryBreakdown.map((item) => {
    const meta = CATEGORY_MAP[item.category] || CATEGORY_MAP.OTHERS;
    const pct = totalOutflow > 0 ? (item.amount / totalOutflow) * 100 : 0;
    const dashLength = (pct / 100) * circumference;
    const gap = categoryBreakdown.length > 1 ? 4 : 0;
    const strokeDash = Math.max(0, dashLength - gap);
    const offset = cumulativeOffset;
    cumulativeOffset += dashLength;

    return {
      category: item.category,
      amount: item.amount,
      percentage: pct,
      meta,
      strokeDash,
      strokeDasharray: `${strokeDash} ${circumference - strokeDash}`,
      strokeDashoffset: -offset
    };
  });

  const handleMouseMove = (e, slice) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setTooltip({
      visible: true,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      category: slice.category,
      amount: slice.amount,
      percentage: slice.percentage,
      meta: slice.meta
    });
    setHoveredCategory(slice.category);
  };

  const handleMouseLeave = () => {
    setTooltip(prev => ({ ...prev, visible: false }));
    setHoveredCategory(null);
  };

  return (
    <Card className="p-7 lg:p-8 rounded-xl flex flex-col justify-between h-full relative overflow-hidden glow-card bg-gradient-to-b from-card/95 to-card/75 border border-border/80 shadow-2xl">
      {/* Header */}
      <HStack space="md" className="justify-between items-start mb-2">
        <VStack space="2xs">
          <Heading size="xl" bold className="text-foreground tracking-tight text-xl font-bold">
            Category Distribution
          </Heading>
          <Text size="sm" className="text-muted-foreground text-xs leading-relaxed">
            Distribution of money across salary, suppliers, operations & expenses
          </Text>
        </VStack>
        <Badge variant={totalOutflow > 0 ? 'error' : 'muted'} size="md" className="py-1 px-3 border border-border/70 rounded-md">
          <BadgeText className="font-mono text-xs font-bold">{formatRupee(totalOutflow)}</BadgeText>
        </Badge>
      </HStack>

      {/* Donut SVG Gauge Area with Floating Tooltip */}
      <Box
        ref={containerRef}
        className="relative flex items-center justify-center my-6 py-4 select-none"
      >
        <svg
          width="230"
          height="230"
          viewBox="0 0 230 230"
          className="transform -rotate-90 filter drop-shadow-[0_8px_24px_rgba(0,0,0,0.45)]"
        >
          {/* Subtle background track */}
          <circle
            cx="115"
            cy="115"
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-muted/30"
          />

          {/* Slices with hover transitions */}
          {totalOutflow > 0 && slices.map((slice) => {
            const isHovered = hoveredCategory === slice.category;
            return (
              <circle
                key={slice.category}
                cx="115"
                cy="115"
                r={radius}
                fill="transparent"
                stroke={slice.meta.hex}
                strokeWidth={isHovered ? strokeWidth + 5 : strokeWidth}
                strokeDasharray={slice.strokeDasharray}
                strokeDashoffset={slice.strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-200 cursor-pointer"
                onMouseMove={(e) => handleMouseMove(e, slice)}
                onMouseLeave={handleMouseLeave}
              />
            );
          })}

          {/* Empty state ring */}
          {totalOutflow === 0 && (
            <circle
              cx="115"
              cy="115"
              r={radius}
              fill="transparent"
              stroke="currentColor"
              strokeWidth={strokeWidth}
              strokeDasharray="6 8"
              className="text-muted/50"
            />
          )}
        </svg>

        {/* Floating Tooltip positioned near cursor */}
        {tooltip.visible && tooltip.meta && (
          <div
            className="absolute pointer-events-none z-30 transition-all duration-75 ease-out"
            style={{
              left: `${tooltip.x}px`,
              top: `${tooltip.y - 14}px`,
              transform: 'translate(-50%, -100%)'
            }}
          >
            <div className="bg-popover/95 backdrop-blur-xl border border-border/90 shadow-2xl rounded-2xl p-3 min-w-[150px] flex flex-col gap-1.5 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                  style={{ backgroundColor: tooltip.meta.hex }}
                />
                <span className="font-bold text-foreground text-xs truncate">
                  {tooltip.meta.label}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4 pt-1.5 border-t border-border/50 font-mono text-xs">
                <span className="text-foreground font-extrabold text-sm">
                  {formatRupee(tooltip.amount)}
                </span>
                <span
                  className="font-bold px-1.5 py-0.5 rounded-md text-[11px]"
                  style={{
                    backgroundColor: `${tooltip.meta.hex}20`,
                    color: tooltip.meta.hex
                  }}
                >
                  {tooltip.percentage.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        )}
      </Box>

      {/* Legend & Breakdown Rows */}
      <VStack space="sm" className="pt-4 border-t border-border/60">
        <HStack space="sm" className="items-center justify-between mb-1 px-1">
          <Text size="2xs" bold className="uppercase tracking-widest text-muted-foreground text-[11px] font-mono">
            Category Legend
          </Text>
          <Badge variant="muted" size="sm" className="py-0 px-2 text-[10.5px] font-mono">
            <BadgeText>
              {categoryBreakdown.length > 0
                ? `${categoryBreakdown.length} ${categoryBreakdown.length === 1 ? 'Category' : 'Categories'}`
                : '0 Outflows'}
            </BadgeText>
          </Badge>
        </HStack>

        {categoryBreakdown.length === 0 ? (
          <VStack space="xs" className="p-4 bg-muted/20 border border-border/40 rounded-2xl text-center items-center">
            <Text size="xs" bold className="text-foreground font-semibold">
              Zero Operational Outflows
            </Text>
            <Text size="2xs" className="text-muted-foreground leading-relaxed">
              No salary, supplier, or operating expenses recorded for this billing cycle.
            </Text>
            {onOpenAdd && (
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenAdd}
                className="mt-2 h-7 px-3 border-border/80 hover:border-primary/50 rounded-md"
              >
                <ButtonIcon as={Plus} className="w-3.5 h-3.5" />
                <ButtonText className="text-xs font-semibold">Log Expenditure</ButtonText>
              </Button>
            )}
          </VStack>
        ) : (
          categoryBreakdown.map((item) => {
            const meta = CATEGORY_MAP[item.category] || CATEGORY_MAP.OTHERS;
            const Icon = meta.icon;
            const pct = item.percentage || (totalOutflow > 0 ? (item.amount / totalOutflow) * 100 : 0);
            const isHovered = hoveredCategory === item.category;

            return (
              <HStack
                key={item.category}
                space="md"
                onMouseEnter={() => setHoveredCategory(item.category)}
                onMouseLeave={() => setHoveredCategory(null)}
                className={`items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${
                  isHovered
                    ? 'bg-muted/70 border-border shadow-lg -translate-y-0.5'
                    : 'bg-muted/30 hover:bg-muted/50 border-border/50'
                }`}
              >
                <HStack space="sm" className="items-center min-w-0">
                  <Box
                    className="w-8 h-8 rounded-md flex items-center justify-center shrink-0 border"
                    style={{
                      backgroundColor: `${meta.hex}18`,
                      borderColor: `${meta.hex}40`
                    }}
                  >
                    <Icon className="w-4 h-4" style={{ color: meta.hex }} />
                  </Box>
                  <VStack space="2xs" className="min-w-0">
                    <HStack space="xs" className="items-center">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: meta.hex }}
                      />
                      <Text size="sm" bold className="text-foreground font-semibold text-xs truncate">
                        {meta.label}
                      </Text>
                    </HStack>
                    <Text size="2xs" className="text-muted-foreground text-[10.5px]">
                      Share of monthly disbursements
                    </Text>
                  </VStack>
                </HStack>

                <VStack space="2xs" className="items-end shrink-0">
                  <Text size="sm" bold className="text-foreground font-mono text-xs font-bold">
                    {formatRupee(item.amount)}
                  </Text>
                  <span
                    className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md"
                    style={{
                      backgroundColor: `${meta.hex}18`,
                      color: meta.hex
                    }}
                  >
                    {pct.toFixed(1)}%
                  </span>
                </VStack>
              </HStack>
            );
          })
        )}
      </VStack>
    </Card>
  );
}
