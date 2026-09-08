import { CheckCircle2, AlertTriangle, ShieldCheck, ArrowDownLeft, ArrowUpRight, Wallet, Calculator } from 'lucide-react';
import { Card, Box, Heading, Text, Badge, BadgeText, BadgeIcon, VStack, HStack, Divider } from '@/components/ui';

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
  const isHealthy = netCashFlow >= 0;

  if (loading) {
    return (
      <Card className="p-6 h-full min-h-[360px] flex items-center justify-center animate-pulse">
        <Text size="sm" className="text-muted-foreground">Calculating corporate cash summary...</Text>
      </Card>
    );
  }

  return (
    <Card className="p-6 flex flex-col justify-between h-full relative overflow-hidden">
      {/* Background ambient corner glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />

      <VStack space="md">
        {/* Statement Header */}
        <HStack space="md" className="justify-between items-start">
          <VStack space="2xs">
            <HStack space="sm" className="items-center">
              <Heading size="md" bold className="text-foreground tracking-tight">
                Cash Reconciliation
              </Heading>
              <Badge variant="muted" size="sm" className="py-0 text-[10px]">
                <BadgeText className="font-mono">{monthName} {year}</BadgeText>
              </Badge>
            </HStack>
            <Text size="xs" className="text-muted-foreground">
              Official monthly balance and verified liquidity audit
            </Text>
          </VStack>
          <Box className="w-8 h-8 rounded-lg bg-muted/60 flex items-center justify-center border border-border/50 text-muted-foreground">
            <Calculator className="w-4 h-4" />
          </Box>
        </HStack>

        {/* Statement Accounting Rows */}
        <VStack space="xs" className="mt-3 text-xs bg-muted/20 p-3.5 rounded-xl border border-border/40">
          {/* Opening Balance */}
          <HStack space="md" className="justify-between items-center py-1.5">
            <HStack space="xs" className="items-center">
              <Box className="w-5 h-5 rounded-md bg-muted flex items-center justify-center">
                <Wallet className="w-3 h-3 text-muted-foreground" />
              </Box>
              <Text size="xs" className="text-foreground/80 font-medium">Opening Balance (01 {monthName})</Text>
            </HStack>
            <Text size="xs" bold className="text-foreground font-mono">{formatRupee(openingBalance)}</Text>
          </HStack>

          {/* Booking Inflows */}
          <HStack space="md" className="justify-between items-center py-1.5">
            <HStack space="xs" className="items-center">
              <Box className="w-5 h-5 rounded-md bg-primary/20 flex items-center justify-center">
                <ArrowDownLeft className="w-3 h-3 text-primary" />
              </Box>
              <VStack space="2xs">
                <Text size="xs" className="text-primary font-medium">(+) Booking Payments</Text>
              </VStack>
            </HStack>
            <HStack space="xs" className="items-center">
              <Badge variant="success" size="sm" className="py-0 px-1 text-[9px] font-mono">
                <BadgeText>15 Tx</BadgeText>
              </Badge>
              <Text size="xs" bold className="text-primary font-mono">{formatRupee(totalInflow)}</Text>
            </HStack>
          </HStack>

          {/* Operational Outflows */}
          <HStack space="md" className="justify-between items-center py-1.5">
            <HStack space="xs" className="items-center">
              <Box className="w-5 h-5 rounded-md bg-destructive/20 flex items-center justify-center">
                <ArrowUpRight className="w-3 h-3 text-destructive" />
              </Box>
              <Text size="xs" className="text-destructive font-medium">(-) Operational Outflows</Text>
            </HStack>
            <HStack space="xs" className="items-center">
              <Badge variant="muted" size="sm" className="py-0 px-1 text-[9px] font-mono">
                <BadgeText>0 Tx</BadgeText>
              </Badge>
              <Text size="xs" bold className="text-destructive font-mono">{formatRupee(totalOutflow)}</Text>
            </HStack>
          </HStack>

          {/* Net Flow sub-row */}
          <HStack space="md" className="justify-between items-center py-1.5 pt-2 border-t border-border/40">
            <Text size="xs" className="text-muted-foreground font-semibold">(=) Net Operational Movement</Text>
            <Text size="xs" bold className="text-primary font-mono">{formatRupee(netCashFlow)}</Text>
          </HStack>
        </VStack>

        {/* Closing Balance Highlight Box */}
        <Box className="p-3.5 bg-primary/10 border border-primary/25 rounded-xl">
          <HStack space="md" className="justify-between items-center">
            <VStack space="2xs">
              <HStack space="xs" className="items-center">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                <Text size="xs" bold className="text-foreground">
                  Closing Cash Position
                </Text>
              </HStack>
              <Text size="2xs" className="text-muted-foreground">
                As on {lastDay} {monthName} {year}
              </Text>
            </VStack>
            <Heading
              size="lg"
              bold
              className="text-primary font-mono text-xl tracking-tight"
            >
              {formatRupee(closingBalance)}
            </Heading>
          </HStack>
        </Box>
      </VStack>

      {/* Health Badge Footer */}
      <Box className="mt-4 pt-3 border-t border-border/60">
        <Badge variant={isHealthy ? 'success' : 'error'} size="lg" hasDot className="w-full justify-center py-2.5">
          <BadgeIcon as={isHealthy ? CheckCircle2 : AlertTriangle} className="w-4 h-4" />
          <BadgeText className="text-xs font-semibold">
            {isHealthy
              ? 'Healthy Cash Runway • 100% Liquidity Retained'
              : 'Deficit Alert • Disbursements exceed monthly inflow'}
          </BadgeText>
        </Badge>
      </Box>
    </Card>
  );
}
