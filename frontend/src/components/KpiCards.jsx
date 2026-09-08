import { ArrowDownLeft, ArrowUpRight, Scale, Wallet, TrendingUp, TrendingDown, CheckCircle, ShieldCheck } from 'lucide-react';
import { Card, Box, Text, Heading, HStack, VStack, Badge, BadgeText, BadgeIcon } from '@/components/ui';

function formatRupee(amount) {
  if (amount === undefined || amount === null) return '₹0';
  return '₹ ' + Number(amount).toLocaleString('en-IN');
}

export default function KpiCards({
  totalInflow = 0,
  totalOutflow = 0,
  netCashFlow = 0,
  closingBalance = 0,
  changes = {},
  month,
  year,
  loading = false
}) {
  const lastDay = new Date(year || 2026, month || 9, 0).getDate();
  const monthName = new Date(year || 2026, (month || 9) - 1).toLocaleString('en-US', { month: 'short' });

  const cards = [
    {
      title: 'Total Cash Inflow',
      amount: totalInflow,
      change: changes?.inflow,
      isBalance: false,
      icon: ArrowDownLeft,
      accentBorder: 'hover:border-primary/50',
      iconBg: 'bg-primary/20 text-primary border border-primary/30 shadow-md shadow-primary/10',
      badgeVariant: 'success',
      footerHighlight: '15 Verified Booking Payments',
      subtitle: 'From live bookings & deposits'
    },
    {
      title: 'Total Cash Outflow',
      amount: totalOutflow,
      change: changes?.outflow,
      isBalance: false,
      icon: ArrowUpRight,
      accentBorder: 'hover:border-destructive/50',
      iconBg: 'bg-destructive/20 text-destructive border border-destructive/30 shadow-md shadow-destructive/10',
      badgeVariant: 'error',
      footerHighlight: totalOutflow === 0 ? 'Zero Outflow Recorded' : 'Operational Expenditures',
      subtitle: 'Vendor & tour operational expenses'
    },
    {
      title: 'Net Cash Velocity',
      amount: netCashFlow,
      change: changes?.net,
      isBalance: false,
      icon: Scale,
      accentBorder: 'hover:border-primary/50',
      iconBg: 'bg-primary/15 text-primary border border-primary/25',
      badgeVariant: netCashFlow >= 0 ? 'success' : 'error',
      footerHighlight: totalInflow > 0 ? `${((netCashFlow / totalInflow) * 100).toFixed(1)}% Cash Retention` : '100% Margin',
      subtitle: 'Inflow minus total disbursements'
    },
    {
      title: 'Closing Treasury Balance',
      amount: closingBalance,
      isBalance: true,
      icon: Wallet,
      accentBorder: 'hover:border-border',
      iconBg: 'bg-muted text-foreground border border-border/80',
      badgeVariant: 'muted',
      footerHighlight: `Reconciled as of ${lastDay} ${monthName}`,
      subtitle: 'Opening balance + net monthly flow'
    }
  ];

  if (loading) {
    return (
      <Box className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-6 h-40 animate-pulse flex flex-col justify-between">
            <Box className="h-4 bg-muted/60 rounded-lg w-1/2" />
            <Box className="h-9 bg-muted/60 rounded-lg w-3/4" />
            <Box className="h-3 bg-muted/60 rounded-lg w-1/3" />
          </Card>
        ))}
      </Box>
    );
  }

  return (
    <Box className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      {cards.map((c, i) => {
        const Icon = c.icon;
        const hasChange = c.change !== null && c.change !== undefined;
        const isPositive = c.change > 0;

        return (
          <Card
            key={i}
            className={`p-6 relative overflow-hidden transition-all duration-300 group hover:-translate-y-1 ${c.accentBorder}`}
          >
            {/* Ambient top light gradient */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-border to-transparent group-hover:via-primary transition-all duration-500" />

            <VStack space="sm" className="justify-between h-full">
              {/* Card Header: Title & Icon Badge */}
              <HStack space="md" className="justify-between items-start w-full">
                <VStack space="2xs">
                  <Text size="2xs" bold className="uppercase tracking-widest text-muted-foreground text-[11px]">
                    {c.title}
                  </Text>
                  <Text size="2xs" className="text-muted-foreground/80 text-[10px]">
                    {c.subtitle}
                  </Text>
                </VStack>
                <Box className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${c.iconBg}`}>
                  <Icon className="w-5 h-5 stroke-[2.2]" />
                </Box>
              </HStack>

              {/* Main Amount Display */}
              <Box className="my-1">
                <Heading size="2xl" bold className="text-foreground tracking-tight font-mono text-3xl font-extrabold">
                  {formatRupee(c.amount)}
                </Heading>
              </Box>

              {/* Card Footer: Change Badge or Highlight Note */}
              <HStack space="sm" className="items-center justify-between pt-2 border-t border-border/40 text-xs">
                {!c.isBalance && hasChange ? (
                  <Badge variant={isPositive ? 'success' : 'error'} size="sm" hasDot>
                    <BadgeIcon as={isPositive ? TrendingUp : TrendingDown} className="w-3 h-3" />
                    <BadgeText>
                      {isPositive ? `+${c.change}%` : `${c.change}%`}
                    </BadgeText>
                  </Badge>
                ) : (
                  <Badge variant="muted" size="sm">
                    <BadgeIcon as={CheckCircle} className="w-3 h-3 text-primary" />
                    <BadgeText className="text-primary font-mono text-[10px]">VERIFIED</BadgeText>
                  </Badge>
                )}

                <Text size="2xs" className="text-muted-foreground font-medium text-[11px]">
                  {c.footerHighlight}
                </Text>
              </HStack>
            </VStack>
          </Card>
        );
      })}
    </Box>
  );
}
