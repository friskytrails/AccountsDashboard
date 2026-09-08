import { Hotel, Car, Users, Camera, Briefcase, Megaphone, MoreHorizontal, Layers, Plus } from 'lucide-react';
import { Card, Box, Heading, Text, Badge, BadgeText, Progress, ProgressFilledTrack, VStack, HStack, Button, ButtonText, ButtonIcon } from '@/components/ui';

const CATEGORY_MAP = {
  HOTELS: { label: 'Hotels & Lodging', icon: Hotel, color: 'text-primary', bg: 'bg-primary' },
  TRANSPORT: { label: 'Transport & Fleet', icon: Car, color: 'text-foreground', bg: 'bg-foreground' },
  GUIDES: { label: 'Tour Guides', icon: Users, color: 'text-accent-foreground', bg: 'bg-accent' },
  SIGHTSEEING: { label: 'Sightseeing & Entry', icon: Camera, color: 'text-primary', bg: 'bg-primary' },
  SALARIES: { label: 'Team Salaries', icon: Briefcase, color: 'text-destructive', bg: 'bg-destructive' },
  MARKETING: { label: 'Marketing & Ads', icon: Megaphone, color: 'text-destructive', bg: 'bg-destructive' },
  OTHERS: { label: 'Miscellaneous', icon: MoreHorizontal, color: 'text-muted-foreground', bg: 'bg-muted-foreground' },
};

export default function ExpenseCategories({ categoryBreakdown = [], totalOutflow = 0, loading = false, onOpenAdd }) {
  if (loading) {
    return (
      <Card className="p-6 h-80 flex items-center justify-center animate-pulse">
        <Text size="sm" className="text-muted-foreground">Loading operational breakdown...</Text>
      </Card>
    );
  }

  return (
    <Card className="p-6 flex flex-col justify-between h-full relative overflow-hidden">
      {/* Header */}
      <HStack space="md" className="justify-between items-start mb-4">
        <VStack space="2xs">
          <Heading size="md" bold className="text-foreground tracking-tight">
            Expense Allocation
          </Heading>
          <Text size="xs" className="text-muted-foreground">
            Breakdown across operating categories
          </Text>
        </VStack>
        <Badge variant={totalOutflow > 0 ? 'error' : 'muted'} size="md">
          <BadgeText className="font-mono">₹{Number(totalOutflow).toLocaleString('en-IN')}</BadgeText>
        </Badge>
      </HStack>

      {/* Categories Content */}
      <VStack space="md" className="flex-1 overflow-y-auto pr-1">
        {categoryBreakdown.length === 0 ? (
          <VStack space="md" className="h-52 items-center justify-center text-center p-4 bg-muted/20 border border-border/40 rounded-2xl">
            <Box className="w-12 h-12 rounded-2xl bg-muted/60 border border-border flex items-center justify-center text-muted-foreground">
              <Layers className="w-6 h-6 stroke-[1.5]" />
            </Box>
            <VStack space="2xs">
              <Text size="xs" bold className="text-foreground">
                Zero Outflows Logged
              </Text>
              <Text size="2xs" className="text-muted-foreground max-w-[240px]">
                No operational expenditures recorded for this billing cycle. 100% of inflow is retained.
              </Text>
            </VStack>
            {onOpenAdd && (
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenAdd}
                className="mt-1 gap-1.5"
              >
                <ButtonIcon as={Plus} />
                <ButtonText>Log Expense</ButtonText>
              </Button>
            )}
          </VStack>
        ) : (
          categoryBreakdown.map((item) => {
            const meta = CATEGORY_MAP[item.category] || CATEGORY_MAP.OTHERS;
            const Icon = meta.icon;
            const pct = item.percentage || 0;

            return (
              <VStack key={item.category} space="xs" className="p-2.5 bg-muted/30 border border-border/40 rounded-xl">
                <HStack space="md" className="justify-between text-xs items-center">
                  <HStack space="sm" className="items-center">
                    <Box className="w-6 h-6 rounded-md bg-muted flex items-center justify-center">
                      <Icon className={`w-3.5 h-3.5 ${meta.color}`} />
                    </Box>
                    <Text size="xs" bold className="text-foreground">{meta.label}</Text>
                  </HStack>
                  <HStack space="sm" className="items-center">
                    <Text size="xs" bold className="text-foreground font-mono">
                      ₹{Number(item.amount).toLocaleString('en-IN')}
                    </Text>
                    <Badge variant="muted" size="sm" className="py-0 px-1 font-mono text-[10px]">
                      <BadgeText>{pct.toFixed(1)}%</BadgeText>
                    </Badge>
                  </HStack>
                </HStack>

                {/* Progress track */}
                <Progress value={pct} size="sm" className="bg-muted/80 h-1.5">
                  <ProgressFilledTrack className={meta.bg} />
                </Progress>
              </VStack>
            );
          })
        )}
      </VStack>
    </Card>
  );
}
