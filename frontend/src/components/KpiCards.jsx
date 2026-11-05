import { ArrowDownLeft, ArrowUpRight, Scale, Wallet, TrendingUp, TrendingDown, CheckCircle, ShieldCheck, Zap, History, ArrowRight } from 'lucide-react';
import { Card, Box, Text, Heading, HStack, VStack, Badge, BadgeText, BadgeIcon } from '@/components/ui';

function formatRupee(amount) {
  if (amount === undefined || amount === null) return '₹0';
  return '₹' + Number(amount).toLocaleString('en-IN');
}

export default function KpiCards({
  totalInflow = 0,
  totalOutflow = 0,
  netCashFlow = 0,
  closingBalance = 0,
  openingBalance = 0,
  changes = {},
  month,
  year,
  loading = false
}) {
  const lastDay = new Date(year || 2026, month || 9, 0).getDate();
  const monthName = new Date(year || 2026, (month || 9) - 1).toLocaleString('en-US', { month: 'short' });

  // Previous month name for carry-forward label
  const prevMonthNum = (month || 9) === 1 ? 12 : (month || 9) - 1;
  const prevYear = (month || 9) === 1 ? (year || 2026) - 1 : (year || 2026);
  const prevMonthName = new Date(prevYear, prevMonthNum - 1).toLocaleString('en-US', { month: 'short' });

  // Calculate cash retention ratio
  const retentionRatio = totalInflow > 0 ? Math.max(0, Math.min(100, Math.round((netCashFlow / totalInflow) * 100))) : 100;

  const cards = [
    {
      title: 'Previous Month Balance',
      amount: openingBalance,
      isBalance: true,
      icon: History,
      cardGradient: 'from-amber-950/20 via-card to-card border-amber-500/20 hover:border-amber-500/40 shadow-amber-950/20',
      iconContainer: 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-lg shadow-amber-500/10',
      accentGlow: 'bg-amber-500',
      badgeVariant: 'muted',
      tagText: `Carryforward (${prevMonthName} ${prevYear})`,
      metricPill: 'Carry Forward'
    },
    {
      title: 'Total Cash Inflow',
      amount: totalInflow,
      change: changes?.inflow,
      isBalance: false,
      icon: ArrowDownLeft,
      cardGradient: 'from-emerald-950/25 via-card to-card border-emerald-500/20 hover:border-emerald-500/40 shadow-emerald-950/20',
      iconContainer: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-500/10',
      accentGlow: 'bg-emerald-500',
      badgeVariant: 'success',
      tagText: 'Verified Inflow',
      metricPill: `${formatRupee(totalInflow)} MTD`
    },
    {
      title: 'Total Cash Outflow',
      amount: totalOutflow,
      change: changes?.outflow,
      isBalance: false,
      icon: ArrowUpRight,
      cardGradient: 'from-rose-950/20 via-card to-card border-rose-500/20 hover:border-rose-500/40 shadow-rose-950/20',
      iconContainer: 'bg-rose-500/15 text-rose-400 border border-rose-500/30 shadow-lg shadow-rose-500/10',
      accentGlow: 'bg-rose-500',
      badgeVariant: 'error',
      tagText: totalOutflow === 0 ? 'Zero Outflow Logged' : 'Supplier Disbursements',
      metricPill: totalOutflow === 0 ? '0% Burn Rate' : `${formatRupee(totalOutflow)} paid`
    },
    {
      title: 'Net Cash Velocity',
      amount: netCashFlow,
      change: changes?.net,
      isBalance: false,
      icon: Scale,
      cardGradient: 'from-teal-950/25 via-card to-card border-teal-500/20 hover:border-teal-500/40 shadow-teal-950/20',
      iconContainer: 'bg-teal-500/15 text-teal-400 border border-teal-500/30 shadow-lg shadow-teal-500/10',
      accentGlow: 'bg-teal-500',
      badgeVariant: netCashFlow >= 0 ? 'success' : 'error',
      tagText: `${retentionRatio}% Retention`,
      metricPill: netCashFlow >= 0 ? 'Surplus Liquidity' : 'Liquidity Deficit'
    },
    {
      title: 'Closing Treasury Balance',
      amount: closingBalance,
      isBalance: true,
      icon: Wallet,
      cardGradient: 'from-indigo-950/25 via-card to-card border-indigo-500/20 hover:border-indigo-500/40 shadow-indigo-950/20',
      iconContainer: 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 shadow-lg shadow-indigo-500/10',
      accentGlow: 'bg-indigo-500',
      badgeVariant: 'muted',
      tagText: `Audited as of ${lastDay} ${monthName}`,
      metricPill: 'Reconciled'
    }
  ];

  if (loading) {
    return (
      <Box className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 xl:gap-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} className="p-6 h-48 animate-pulse flex flex-col justify-between rounded-sm bg-card/60">
            <Box className="h-4 bg-muted/60 rounded-none w-1/2" />
            <Box className="h-10 bg-muted/60 rounded-none w-3/4" />
            <Box className="h-4 bg-muted/60 rounded-none w-1/3" />
          </Card>
        ))}
      </Box>
    );
  }

  return (
    <Box className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 xl:gap-6">
      {cards.map((c, i) => {
          const Icon = c.icon;
          const hasChange = c.change !== null && c.change !== undefined;
          const isPositive = c.change > 0;

          return (
            <Card
              key={i}
              className={`p-6 rounded-sm relative overflow-hidden transition-all duration-300 group hover:shadow-2xl hover:border-border/90 glow-card bg-gradient-to-br ${c.cardGradient} flex flex-col justify-between min-h-[190px]`}
            >
              {/* Top ambient accent glow */}
              <div className={`absolute -top-12 -right-12 w-32 h-32 ${c.accentGlow}/10 rounded-full blur-2xl pointer-events-none group-hover:scale-150 transition-transform duration-700`} />

              <VStack space="md" className="h-full justify-between">
                {/* Header: Title & Spacious Icon Badge */}
                <HStack space="md" className="justify-between items-center w-full">
                  <Text size="xs" bold className="uppercase tracking-wider text-muted-foreground font-semibold text-xs leading-tight">
                    {c.title}
                  </Text>
                  <Box className={`w-10 h-10 rounded-sm flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-105 ${c.iconContainer}`}>
                    <Icon className="w-5 h-5 stroke-[2.2]" />
                  </Box>
                </HStack>

                {/* Main Currency Amount */}
                <Box className="my-2 overflow-hidden">
                  <Heading
                    size="2xl"
                    bold
                    className="text-foreground tracking-tight font-sans text-xl sm:text-2xl xl:text-[26px] font-extrabold whitespace-nowrap truncate"
                  >
                    {formatRupee(c.amount)}
                  </Heading>
                </Box>

                {/* Card Footer: Badges & Contextual Stats */}
                <HStack space="sm" className="items-center justify-between pt-3 border-t border-border/50 text-xs">
                  {!c.isBalance && hasChange ? (
                    <Badge variant={isPositive ? 'success' : 'error'} size="md" hasDot className="py-1 px-2.5 rounded-md">
                      <BadgeIcon as={isPositive ? TrendingUp : TrendingDown} className="w-3.5 h-3.5" />
                      <BadgeText className="text-xs font-bold">
                        {isPositive ? `+${c.change}%` : `${c.change}%`}
                      </BadgeText>
                    </Badge>
                  ) : (
                    <Badge variant="muted" size="md" className="py-1 px-2.5 bg-muted/60 border border-border/70 rounded-md">
                      <BadgeIcon as={CheckCircle} className="w-3.5 h-3.5 text-primary" />
                      <BadgeText className="text-primary font-mono text-xs font-semibold">VERIFIED</BadgeText>
                    </Badge>
                  )}

                  <Text size="xs" className="text-muted-foreground/90 font-medium text-xs">
                    {c.tagText}
                  </Text>
                </HStack>
              </VStack>
            </Card>
          );
        })}
      </Box>
  );
}

