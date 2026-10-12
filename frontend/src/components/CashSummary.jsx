import { ShieldCheck, ArrowDownLeft, ArrowUpRight, Wallet, TrendingUp } from 'lucide-react';
import { Card, Box, Heading, Text, Badge, BadgeText, VStack, HStack } from '@/components/ui';

function formatRupee(num) {
  return '₹ ' + Number(num || 0).toLocaleString('en-IN');
}

export default function CashSummary({
  openingBalance = 0,
  totalInflow = 0,
  totalOutflow = 0,
  closingBalance = 0,
  month = 9,
  year = 2026,
  loading = false
}) {
  const lastDay = new Date(year, month, 0).getDate();
  const monthName = new Date(year, month - 1).toLocaleString('en-US', { month: 'short' });
  const netCashFlow = totalInflow - totalOutflow;

  if (loading) {
    return (
      <Card className="p-8 h-64 flex items-center justify-center animate-pulse rounded-3xl bg-card/60">
        <Text size="sm" className="text-muted-foreground font-medium">Calculating treasury positions...</Text>
      </Card>
    );
  }

  const stages = [
    {
      step: '01',
      label: `Opening Balance (01 ${monthName})`,
      amount: openingBalance,
      subtitle: 'Carried forward from August',
      icon: Wallet,
      color: 'text-foreground',
      bg: 'bg-muted/70 border-border/70',
      iconBg: 'bg-muted text-muted-foreground',
      prefix: ''
    },
    {
      step: '02',
      label: '(+) Booking Inflows',
      amount: totalInflow,
      subtitle: '15 verified payments live',
      icon: ArrowDownLeft,
      color: 'text-emerald-400',
      bg: 'bg-emerald-950/20 border-emerald-500/30',
      iconBg: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
      prefix: '+'
    },
    {
      step: '03',
      label: '(-) Operational Outflows',
      amount: totalOutflow,
      subtitle: totalOutflow === 0 ? 'Zero expenditures recorded' : 'Tour & fleet disbursals',
      icon: ArrowUpRight,
      color: 'text-rose-400',
      bg: 'bg-rose-950/15 border-rose-500/30',
      iconBg: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
      prefix: '-'
    },
    {
      step: '04',
      label: '(=) Net Cash Movement',
      amount: netCashFlow,
      subtitle: 'Net liquidity generation',
      icon: TrendingUp,
      color: 'text-teal-400',
      bg: 'bg-teal-950/20 border-teal-500/30',
      iconBg: 'bg-teal-500/15 text-teal-400 border border-teal-500/30',
      prefix: netCashFlow >= 0 ? '+' : ''
    },
    {
      step: '05',
      label: `Closing Position (${lastDay} ${monthName})`,
      amount: closingBalance,
      subtitle: 'Verified treasury balance',
      icon: ShieldCheck,
      color: 'text-primary',
      bg: 'bg-gradient-to-br from-emerald-950/40 via-card to-card border-emerald-500/40 shadow-xl shadow-emerald-950/20',
      iconBg: 'bg-primary/20 text-primary border border-primary/40 shadow-md shadow-primary/20',
      prefix: ''
    }
  ];

  return (
    <Card className="p-8 lg:p-10 rounded-3xl relative overflow-hidden flex flex-col justify-between glow-card bg-gradient-to-b from-card/95 to-card/70 border border-border/80 shadow-2xl">
      {/* Top Header */}
      <VStack space="xs" className="mb-8">
        <HStack space="md" className="justify-between items-center flex-wrap gap-3">
          <HStack space="sm" className="items-center">
            <Heading size="xl" bold className="text-foreground tracking-tight text-xl xl:text-2xl font-bold">
              Treasury Cash Flow & Reconciliation Pipeline
            </Heading>
            <Badge variant="muted" size="md" className="py-1 px-3 border border-border/70">
              <BadgeText className="font-mono text-xs font-semibold">{monthName} {year} Fiscal Cycle</BadgeText>
            </Badge>
          </HStack>
        </HStack>
        <Text size="sm" className="text-muted-foreground text-xs leading-relaxed">
          Sequential financial movement tracking: Opening balance synchronized with verified booking payments, operational expenditures, and reconciled closing treasury reserves.
        </Text>
      </VStack>

      {/* Horizontal Pipeline Grid */}
      <Box className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-stretch relative my-2">
        {stages.map((stage, idx) => {
          const Icon = stage.icon;
          const isLast = idx === stages.length - 1;

          return (
            <Box
              key={idx}
              className={`p-5 rounded-2xl border transition-all duration-300 relative flex flex-col justify-between ${stage.bg} ${
                isLast ? 'ring-1 ring-primary/30' : ''
              }`}
            >
              <VStack space="sm">
                {/* Stage Header */}
                <HStack space="sm" className="justify-between items-center">
                  <Text size="2xs" bold className="font-mono text-muted-foreground text-[11px] uppercase tracking-wider">
                    Step {stage.step}
                  </Text>
                  <Box className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${stage.iconBg}`}>
                    <Icon className="w-4 h-4 stroke-[2.2]" />
                  </Box>
                </HStack>

                {/* Stage Label */}
                <Text size="xs" bold className="text-foreground/90 font-semibold text-xs leading-tight">
                  {stage.label}
                </Text>

                {/* Currency Figure */}
                <Box className="my-1">
                  <Text size="lg" bold className={`font-mono font-extrabold text-xl xl:text-2xl ${stage.color}`}>
                    {stage.prefix}{formatRupee(stage.amount)}
                  </Text>
                </Box>
              </VStack>

              {/* Subtitle / Note */}
              <Text size="2xs" className="text-muted-foreground text-[11px] pt-2 border-t border-border/40 mt-3">
                {stage.subtitle}
              </Text>
            </Box>
          );
        })}
      </Box>
    </Card>
  );
}
