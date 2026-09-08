import { useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Plus, Trash2, Receipt, Filter } from 'lucide-react';
import { Card, Box, Heading, Text, Button, ButtonText, ButtonIcon, VStack, HStack, Badge, BadgeText } from '@/components/ui';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function RecentTransactions({
  transactions = [],
  onOpenAdd,
  onDelete,
  loading = false
}) {
  const [filterType, setFilterType] = useState('ALL');

  const filtered = transactions.filter((t) => {
    if (filterType === 'INFLOW') return t.type === 'INFLOW';
    if (filterType === 'OUTFLOW') return t.type === 'OUTFLOW';
    return true;
  });

  return (
    <Card className="p-6 flex flex-col justify-between h-full relative overflow-hidden">
      {/* Header */}
      <VStack space="sm" className="mb-3">
        <HStack space="md" className="justify-between items-center">
          <VStack space="2xs">
            <Heading size="md" bold className="text-foreground tracking-tight">
              Audit & Transactions
            </Heading>
            <Text size="xs" className="text-muted-foreground">
              Manual entries and vendor settlements
            </Text>
          </VStack>

          <Button
            variant="default"
            size="sm"
            onClick={onOpenAdd}
            className="gap-1.5 shadow-md shadow-primary/20"
          >
            <ButtonIcon as={Plus} className="stroke-[2.5]" />
            <ButtonText>Record</ButtonText>
          </Button>
        </HStack>

        {/* Filter Tabs */}
        <HStack space="xs" className="p-1 bg-muted/40 border border-border/40 rounded-xl">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'INFLOW', label: 'Inflows (+)' },
            { id: 'OUTFLOW', label: 'Outflows (-)' },
          ].map((tab) => {
            const isActive = filterType === tab.id;
            return (
              <Button
                key={tab.id}
                size="sm"
                variant={isActive ? 'secondary' : 'ghost'}
                onClick={() => setFilterType(tab.id)}
                className={`flex-1 py-1 h-7 text-xs rounded-lg transition-all ${
                  isActive ? 'bg-card text-foreground font-bold shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <ButtonText>{tab.label}</ButtonText>
              </Button>
            );
          })}
        </HStack>
      </VStack>

      {/* Transaction List */}
      <VStack space="xs" className="flex-1 overflow-y-auto max-h-56 pr-1">
        {loading ? (
          <Box className="h-44 flex items-center justify-center">
            <Text size="xs" className="text-muted-foreground animate-pulse">Loading transaction records...</Text>
          </Box>
        ) : filtered.length === 0 ? (
          <VStack space="sm" className="h-44 items-center justify-center text-center p-4 bg-muted/20 border border-border/40 rounded-xl">
            <Box className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
              <Receipt className="w-5 h-5 stroke-[1.5]" />
            </Box>
            <VStack space="2xs">
              <Text size="xs" bold className="text-foreground">No Records Found</Text>
              <Text size="2xs" className="text-muted-foreground">
                {filterType === 'ALL'
                  ? 'No manual cash records logged yet for this month.'
                  : `No ${filterType.toLowerCase()} records match this filter.`}
              </Text>
            </VStack>
          </VStack>
        ) : (
          filtered.map((tx) => {
            const isInflow = tx.type === 'INFLOW';

            return (
              <HStack
                key={tx._id}
                space="md"
                className="justify-between items-center p-2.5 bg-muted/30 hover:bg-muted/60 border border-border/40 rounded-xl transition-all group"
              >
                {/* Left: Icon & Description */}
                <HStack space="sm" className="min-w-0 items-center">
                  <Box
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isInflow
                        ? 'bg-primary/20 text-primary border border-primary/30'
                        : 'bg-destructive/20 text-destructive border border-destructive/30'
                    }`}
                  >
                    {isInflow ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                  </Box>
                  <VStack space="2xs" className="min-w-0">
                    <Text size="xs" bold isTruncated className="text-foreground">
                      {tx.description || tx.category}
                    </Text>
                    <HStack space="xs" className="items-center">
                      <Text size="2xs" className="text-muted-foreground font-mono">{formatDate(tx.date)}</Text>
                      <Text size="2xs" className="text-muted-foreground">•</Text>
                      <Badge variant="muted" size="sm" className="py-0 px-1 font-mono uppercase">
                        <BadgeText className="text-[9px]">{tx.paymentMode}</BadgeText>
                      </Badge>
                      {tx.referenceNumber && (
                        <Text size="2xs" className="text-muted-foreground font-mono text-[9px] truncate max-w-[80px]">
                          Ref: {tx.referenceNumber}
                        </Text>
                      )}
                    </HStack>
                  </VStack>
                </HStack>

                {/* Right: Amount & Delete Button */}
                <HStack space="sm" className="items-center">
                  <Text
                    size="xs"
                    bold
                    className={`font-mono ${isInflow ? 'text-primary' : 'text-destructive'}`}
                  >
                    {isInflow ? '+' : '-'}₹{Number(tx.amount).toLocaleString('en-IN')}
                  </Text>

                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => onDelete(tx._id)}
                    title="Delete record"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/15 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ButtonIcon as={Trash2} className="w-3.5 h-3.5" />
                  </Button>
                </HStack>
              </HStack>
            );
          })
        )}
      </VStack>
    </Card>
  );
}
