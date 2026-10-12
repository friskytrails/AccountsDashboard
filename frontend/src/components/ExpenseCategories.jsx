import { Hotel, Car, Users, Camera, Briefcase, Megaphone, MoreHorizontal, Layers, Plus, TrendingDown, Building2, Wrench } from 'lucide-react';
import { Card, Box, Heading, Text, Badge, BadgeText, Progress, ProgressFilledTrack, VStack, HStack, Button, ButtonText, ButtonIcon } from '@/components/ui';

const CATEGORY_MAP = {
  SALARIES: { label: 'Salaries & Staff', icon: Briefcase, color: 'text-rose-400', bg: 'bg-rose-400', container: 'bg-rose-400/15 border-rose-400/30' },
  SUPPLIERS: { label: 'Suppliers & Vendors', icon: Building2, color: 'text-sky-400', bg: 'bg-sky-400', container: 'bg-sky-400/15 border-sky-400/30' },
  OPERATIONS: { label: 'Operations & Fleet', icon: Wrench, color: 'text-emerald-400', bg: 'bg-emerald-400', container: 'bg-emerald-400/15 border-emerald-400/30' },
  HOTELS: { label: 'Hotels & Lodging', icon: Hotel, color: 'text-amber-400', bg: 'bg-amber-400', container: 'bg-amber-400/15 border-amber-400/30' },
  TRANSPORT: { label: 'Transport & Fleet', icon: Car, color: 'text-sky-400', bg: 'bg-sky-400', container: 'bg-sky-400/15 border-sky-400/30' },
  GUIDES: { label: 'Tour Guides', icon: Users, color: 'text-emerald-400', bg: 'bg-emerald-400', container: 'bg-emerald-400/15 border-emerald-400/30' },
  SIGHTSEEING: { label: 'Sightseeing & Entry', icon: Camera, color: 'text-violet-400', bg: 'bg-violet-400', container: 'bg-violet-400/15 border-violet-400/30' },
  MARKETING: { label: 'Marketing & Ads', icon: Megaphone, color: 'text-fuchsia-400', bg: 'bg-fuchsia-400', container: 'bg-fuchsia-400/15 border-fuchsia-400/30' },
  OTHERS: { label: 'Miscellaneous', icon: MoreHorizontal, color: 'text-slate-400', bg: 'bg-slate-400', container: 'bg-slate-400/15 border-slate-400/30' },
};

export default function ExpenseCategories({ categoryBreakdown = [], totalOutflow = 0, loading = false, onOpenAdd }) {
  if (loading) {
    return (
      <Card className="p-8 h-96 flex items-center justify-center animate-pulse rounded-xl bg-card/60">
        <Text size="sm" className="text-muted-foreground font-medium">Loading operational breakdown...</Text>
      </Card>
    );
  }

  return (
    <Card className="p-7 lg:p-8 rounded-xl flex flex-col justify-between h-full relative overflow-hidden glow-card bg-gradient-to-b from-card/95 to-card/75 border border-border/80 shadow-2xl">
      {/* Header */}
      <HStack space="md" className="justify-between items-start mb-4">
        <VStack space="2xs">
          <Heading size="xl" bold className="text-foreground tracking-tight text-xl font-bold">
            Expense Allocation
          </Heading>
          <Text size="sm" className="text-muted-foreground text-xs leading-relaxed">
            Breakdown across operating categories
          </Text>
        </VStack>
        <Badge variant={totalOutflow > 0 ? 'error' : 'muted'} size="md" className="py-1 px-3 border border-border/70 rounded-md">
          <BadgeText className="font-mono text-xs font-bold">₹{Number(totalOutflow).toLocaleString('en-IN')}</BadgeText>
        </Badge>
      </HStack>

      {/* Categories Content */}
      <VStack space="md" className="flex-1 overflow-y-auto pr-1 my-2 max-h-[380px]">
        {categoryBreakdown.length === 0 ? (
          <VStack space="md" className="h-64 items-center justify-center text-center p-8 bg-muted/20 border border-border/40 rounded-xl">
            <Box className="w-14 h-14 rounded-md bg-muted/70 border border-border/70 flex items-center justify-center text-muted-foreground shadow-sm">
              <Layers className="w-7 h-7 stroke-[1.5]" />
            </Box>
            <VStack space="xs" className="max-w-xs">
              <Text size="sm" bold className="text-foreground font-semibold">
                Zero Operational Outflows
              </Text>
              <Text size="xs" className="text-muted-foreground leading-relaxed">
                No tour expenditures, fleet, or salaries recorded for this billing cycle. 100% of cash inflow is retained in treasury.
              </Text>
            </VStack>
            {onOpenAdd && (
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenAdd}
                className="mt-2 gap-2 border-border/80 hover:border-primary/50 rounded-md"
              >
                <ButtonIcon as={Plus} className="w-4 h-4" />
                <ButtonText className="text-xs font-semibold">Log Expenditure</ButtonText>
              </Button>
            )}
          </VStack>
        ) : (
          categoryBreakdown.map((item) => {
            const meta = CATEGORY_MAP[item.category] || CATEGORY_MAP.OTHERS;
            const Icon = meta.icon;
            const pct = item.percentage || 0;

            return (
              <VStack key={item.category} space="xs" className="p-3.5 bg-muted/30 hover:bg-muted/50 border border-border/50 rounded-lg transition-all">
                <HStack space="md" className="justify-between text-xs items-center">
                  <HStack space="sm" className="items-center">
                    <Box className={`w-8 h-8 rounded-md flex items-center justify-center border ${meta.container}`}>
                      <Icon className={`w-4 h-4 ${meta.color}`} />
                    </Box>
                    <Text size="sm" bold className="text-foreground font-semibold text-xs">{meta.label}</Text>
                  </HStack>
                  <HStack space="sm" className="items-center">
                    <Text size="sm" bold className="text-foreground font-mono text-xs font-bold">
                      ₹{Number(item.amount).toLocaleString('en-IN')}
                    </Text>
                    <Badge variant="muted" size="sm" className="py-0 px-1.5 font-mono text-[10px]">
                      <BadgeText>{pct.toFixed(1)}%</BadgeText>
                    </Badge>
                  </HStack>
                </HStack>

                {/* Progress track */}
                <Progress value={pct} size="sm" className="bg-muted/80 h-2 rounded-full mt-1.5">
                  <ProgressFilledTrack className={`${meta.bg} rounded-full`} />
                </Progress>
              </VStack>
            );
          })
        )}
      </VStack>
    </Card>
  );
}

