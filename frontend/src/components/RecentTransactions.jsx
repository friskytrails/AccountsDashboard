import { useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  Trash2,
  Receipt,
  Search,
  ShieldCheck,
  CreditCard,
  Building2,
  Users,
  MapPin,
  Phone,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';
import {
  Card,
  Box,
  Heading,
  Text,
  Button,
  ButtonText,
  ButtonIcon,
  VStack,
  HStack,
  Badge,
  BadgeText,
  Input,
  InputField,
  InputIcon
} from '@/components/ui';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function RecentTransactions({
  transactions = [],
  liveInflows = [],
  liveOutflows = [],
  onOpenAdd,
  onDelete,
  loading = false
}) {
  // Main view tab: 'MANUAL' | 'BOOKINGS' | 'SUPPLIERS'
  const [activeTab, setActiveTab] = useState('MANUAL');
  const [filterType, setFilterType] = useState('ALL'); // For manual entries: 'ALL' | 'INFLOW' | 'OUTFLOW'
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Filtered Manual Transactions
  const filteredManual = transactions.filter((t) => {
    if (filterType === 'INFLOW' && t.type !== 'INFLOW') return false;
    if (filterType === 'OUTFLOW' && t.type !== 'OUTFLOW') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const desc = (t.description || '').toLowerCase();
      const cat = (t.category || '').toLowerCase();
      const ref = (t.referenceNumber || '').toLowerCase();
      return desc.includes(q) || cat.includes(q) || ref.includes(q);
    }
    return true;
  });

  // 2. Filtered Live Booking Inflows
  const filteredBookings = liveInflows.filter((b) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const name = (b.travellerName || '').toLowerCase();
    const bId = (b.bookingId || '').toLowerCase();
    const loc = (b.location || '').toLowerCase();
    const pkg = (b.packageName || '').toLowerCase();
    const mode = (b.paymentMode || '').toLowerCase();
    return name.includes(q) || bId.includes(q) || loc.includes(q) || pkg.includes(q) || mode.includes(q);
  });

  // 3. Filtered Live Supplier Outflows
  const filteredSuppliers = liveOutflows.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const name = (s.supplierName || '').toLowerCase();
    const contact = (s.contactPerson || '').toLowerCase();
    const cat = (s.category || '').toLowerCase();
    const city = (s.city || '').toLowerCase();
    const id = (s.supplierId || '').toLowerCase();
    return name.includes(q) || contact.includes(q) || cat.includes(q) || city.includes(q) || id.includes(q);
  });

  const totalBookingSum = liveInflows.reduce((acc, curr) => acc + Number(curr.amountPaid || 0), 0);
  const totalSupplierSum = liveOutflows.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  return (
    <Card className="p-7 lg:p-8 rounded-xl relative overflow-hidden flex flex-col justify-between h-full glow-card bg-gradient-to-b from-card/95 to-card/75 border border-border/80 shadow-2xl">
      {/* Header & Main Tabs */}
      <VStack space="md" className="mb-4">
        <HStack space="md" className="justify-between items-start flex-wrap gap-4">
          <VStack space="2xs">
            <HStack space="sm" className="items-center">
              <Heading size="xl" bold className="text-foreground tracking-tight text-xl font-bold">
                Audit & Transaction Ledger
              </Heading>
              <Badge variant="muted" size="md" className="border border-border/70 rounded-md">
                <BadgeText className="font-mono text-xs">
                  {activeTab === 'MANUAL'
                    ? `${filteredManual.length} Journal Entries`
                    : activeTab === 'BOOKINGS'
                    ? `${filteredBookings.length} Customer Inflows`
                    : `${filteredSuppliers.length} Supplier Outflows`}
                </BadgeText>
              </Badge>
            </HStack>
            <Text size="sm" className="text-muted-foreground text-xs leading-relaxed">
              Transparent live ledger combining customer inflows, supplier payouts, and manual adjustments
            </Text>
          </VStack>

          <Button
            variant="default"
            size="md"
            onClick={onOpenAdd}
            className="gap-2 shadow-lg shadow-primary/25 rounded-md px-4 shrink-0"
          >
            <ButtonIcon as={Plus} className="stroke-[2.5] w-4 h-4" />
            <ButtonText className="text-xs font-bold">Record Transaction</ButtonText>
          </Button>
        </HStack>

        {/* Source Navigation Tabs */}
        <HStack space="xs" className="p-1 bg-muted/60 border border-border/70 rounded-lg flex-wrap gap-1 mt-1">
          <button
            type="button"
            onClick={() => { setActiveTab('MANUAL'); setSearchQuery(''); }}
            className={`flex items-center gap-2 py-1.5 px-3 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'MANUAL'
                ? 'bg-card text-foreground font-bold shadow-sm border border-border/80'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Manual Entries ({transactions.length})</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('BOOKINGS'); setSearchQuery(''); }}
            className={`flex items-center gap-2 py-1.5 px-3 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'BOOKINGS'
                ? 'bg-card text-foreground font-bold shadow-sm border border-border/80'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            <span>Customer Inflows ({liveInflows.length})</span>
            {totalBookingSum > 0 && (
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                +₹{totalBookingSum.toLocaleString('en-IN')}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('SUPPLIERS'); setSearchQuery(''); }}
            className={`flex items-center gap-2 py-1.5 px-3 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'SUPPLIERS'
                ? 'bg-card text-foreground font-bold shadow-sm border border-border/80'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-rose-400" />
            <span>Supplier Outflows ({liveOutflows.length})</span>
            {totalSupplierSum > 0 && (
              <span className="text-[10px] font-mono text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded">
                -₹{totalSupplierSum.toLocaleString('en-IN')}
              </span>
            )}
          </button>
        </HStack>

        {/* Filter & Search Bar */}
        <HStack space="md" className="items-center justify-between flex-wrap gap-3 pt-1">
          {/* Sub-filters for Manual tab */}
          {activeTab === 'MANUAL' ? (
            <HStack space="xs" className="p-1 bg-muted/40 border border-border/50 rounded-md">
              {[
                { id: 'ALL', label: 'All Manual' },
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
                    className={`h-7 px-2.5 text-[11px] font-semibold rounded-md transition-all ${
                      isActive ? 'bg-card text-foreground font-bold shadow-sm border border-border/80' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <ButtonText>{tab.label}</ButtonText>
                  </Button>
                );
              })}
            </HStack>
          ) : (
            <Text size="xs" className="text-muted-foreground font-medium">
              {activeTab === 'BOOKINGS'
                ? 'Live verified customer payment disbursements from booking engine'
                : 'Live registered vendor payouts from supplier treasury directory'}
            </Text>
          )}

          {/* Quick Search Input */}
          <Box className="w-64 relative">
            <Input size="sm" className="bg-muted/40 border-border/60 rounded-md h-8">
              <InputIcon as={Search} className="w-3.5 h-3.5 text-muted-foreground ml-3" />
              <InputField
                placeholder={
                  activeTab === 'MANUAL'
                    ? 'Search narration...'
                    : activeTab === 'BOOKINGS'
                    ? 'Search traveller, booking ID...'
                    : 'Search supplier, city, ID...'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-xs text-foreground placeholder:text-muted-foreground/70 pl-2"
              />
            </Input>
          </Box>
        </HStack>
      </VStack>

      {/* Tab Content Display */}
      <VStack space="sm" className="flex-1 overflow-y-auto max-h-[460px] pr-1.5 my-2">
        {loading ? (
          <Box className="h-64 flex items-center justify-center">
            <Text size="sm" className="text-muted-foreground animate-pulse font-medium">
              Synchronizing corporate journal entries...
            </Text>
          </Box>
        ) : activeTab === 'MANUAL' ? (
          /* TAB 1: MANUAL JOURNAL ENTRIES */
          filteredManual.length === 0 ? (
            <VStack space="md" className="h-64 items-center justify-center text-center p-8 bg-muted/20 border border-border/40 rounded-2xl">
              <Box className="w-12 h-12 rounded-xl bg-muted/70 flex items-center justify-center text-muted-foreground border border-border/70 shadow-sm">
                <Receipt className="w-6 h-6 stroke-[1.5]" />
              </Box>
              <VStack space="2xs" className="max-w-sm">
                <Text size="sm" bold className="text-foreground font-semibold">
                  No Manual Entries Found
                </Text>
                <Text size="xs" className="text-muted-foreground leading-relaxed">
                  {searchQuery
                    ? `No manual transactions match "${searchQuery}".`
                    : 'No manual cash inflows or expense disbursements logged for this billing period.'}
                </Text>
              </VStack>
              {!searchQuery && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onOpenAdd}
                  className="mt-1 gap-2 border-border/80 hover:border-primary/50"
                >
                  <ButtonIcon as={Plus} className="w-4 h-4" />
                  <ButtonText className="text-xs font-semibold">Record First Entry</ButtonText>
                </Button>
              )}
            </VStack>
          ) : (
            filteredManual.map((tx) => {
              const isInflow = tx.type === 'INFLOW';
              return (
                <HStack
                  key={tx._id}
                  space="md"
                  className="justify-between items-center p-3.5 bg-muted/30 hover:bg-muted/60 border border-border/50 rounded-lg transition-all group hover:border-border/80"
                >
                  <HStack space="md" className="min-w-0 items-center flex-1">
                    <Box
                      className={`w-10 h-10 rounded-md flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                        isInflow
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-md shadow-emerald-500/10'
                          : 'bg-rose-500/15 text-rose-400 border border-rose-500/30 shadow-md shadow-rose-500/10'
                      }`}
                    >
                      {isInflow ? <ArrowDownLeft className="w-5 h-5 stroke-[2.2]" /> : <ArrowUpRight className="w-5 h-5 stroke-[2.2]" />}
                    </Box>

                    <VStack space="2xs" className="min-w-0 flex-1">
                      <HStack space="sm" className="items-center">
                        <Text size="sm" bold isTruncated className="text-foreground font-semibold text-xs truncate">
                          {tx.description || tx.category}
                        </Text>
                        <Badge
                          variant={isInflow ? 'success' : 'muted'}
                          size="sm"
                          className="py-0 px-2 font-mono text-[10px]"
                        >
                          <BadgeText>{tx.category}</BadgeText>
                        </Badge>
                      </HStack>

                      <HStack space="md" className="items-center text-xs text-muted-foreground flex-wrap gap-2">
                        <Text size="2xs" className="text-muted-foreground font-mono">{formatDate(tx.date)}</Text>
                        <Text size="2xs" className="text-muted-foreground/60">•</Text>
                        <HStack space="xs" className="items-center">
                          <CreditCard className="w-3 h-3 text-muted-foreground" />
                          <Text size="2xs" className="font-mono text-muted-foreground uppercase text-[10px]">{tx.paymentMode}</Text>
                        </HStack>
                        {tx.referenceNumber && (
                          <>
                            <Text size="2xs" className="text-muted-foreground/60">•</Text>
                            <Text size="2xs" className="text-muted-foreground font-mono text-[10px]">
                              Ref: {tx.referenceNumber}
                            </Text>
                          </>
                        )}
                      </HStack>
                    </VStack>
                  </HStack>

                  <HStack space="md" className="items-center pl-4">
                    <Text
                      size="md"
                      bold
                      className={`font-mono text-base font-bold ${isInflow ? 'text-emerald-400' : 'text-rose-400'}`}
                    >
                      {isInflow ? '+' : '-'}₹{Number(tx.amount).toLocaleString('en-IN')}
                    </Text>

                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onDelete(tx._id)}
                      title="Delete record"
                      className="h-7 w-7 text-muted-foreground/60 hover:text-destructive hover:bg-destructive/15 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </HStack>
                </HStack>
              );
            })
          )
        ) : activeTab === 'BOOKINGS' ? (
          /* TAB 2: LIVE CUSTOMER INFLOWS */
          filteredBookings.length === 0 ? (
            <VStack space="md" className="h-64 items-center justify-center text-center p-8 bg-muted/20 border border-border/40 rounded-2xl">
              <Box className="w-12 h-12 rounded-xl bg-muted/70 flex items-center justify-center text-muted-foreground border border-border/70 shadow-sm">
                <Users className="w-6 h-6 stroke-[1.5]" />
              </Box>
              <VStack space="2xs" className="max-w-sm">
                <Text size="sm" bold className="text-foreground font-semibold">
                  No Customer Inflows Found
                </Text>
                <Text size="xs" className="text-muted-foreground leading-relaxed">
                  {searchQuery
                    ? `No booking payments match "${searchQuery}".`
                    : 'No customer payments recorded for this period in ft_booking_system.'}
                </Text>
              </VStack>
            </VStack>
          ) : (
            filteredBookings.map((b) => (
              <HStack
                key={b._id || b.paymentId}
                space="md"
                className="justify-between items-center p-3.5 bg-muted/30 hover:bg-muted/60 border border-border/50 rounded-lg transition-all group hover:border-border/80"
              >
                <HStack space="md" className="min-w-0 items-center flex-1">
                  <Box className="w-10 h-10 rounded-md flex items-center justify-center shrink-0 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-md shadow-emerald-500/10">
                    <ArrowDownLeft className="w-5 h-5 stroke-[2.2]" />
                  </Box>

                  <VStack space="2xs" className="min-w-0 flex-1">
                    <HStack space="sm" className="items-center">
                      <Text size="sm" bold isTruncated className="text-foreground font-semibold text-xs">
                        {b.travellerName || 'Valued Guest'}
                      </Text>
                      <Badge variant="success" size="sm" className="py-0 px-2 font-mono text-[10px]">
                        <BadgeText>{b.bookingId || 'BOOKING'}</BadgeText>
                      </Badge>
                      {b.location && (
                        <Text size="2xs" className="text-muted-foreground truncate hidden sm:inline">
                          • {b.location}
                        </Text>
                      )}
                    </HStack>

                    <HStack space="md" className="items-center text-xs text-muted-foreground flex-wrap gap-2">
                      <Text size="2xs" className="text-muted-foreground font-mono">{formatDate(b.paymentDate)}</Text>
                      <Text size="2xs" className="text-muted-foreground/60">•</Text>
                      <HStack space="xs" className="items-center">
                        <CreditCard className="w-3 h-3 text-muted-foreground" />
                        <Text size="2xs" className="font-mono text-muted-foreground uppercase text-[10px]">{b.paymentMode || 'PAYMENT'}</Text>
                      </HStack>
                      {b.addedBy && (
                        <>
                          <Text size="2xs" className="text-muted-foreground/60">•</Text>
                          <Text size="2xs" className="text-muted-foreground text-[10px]">Agent: {b.addedBy}</Text>
                        </>
                      )}
                    </HStack>
                  </VStack>
                </HStack>

                <HStack space="md" className="items-center pl-4">
                  <Text size="md" bold className="font-mono text-base font-bold text-emerald-400">
                    +₹{Number(b.amountPaid).toLocaleString('en-IN')}
                  </Text>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" title="Verified in Booking System" />
                </HStack>
              </HStack>
            ))
          )
        ) : (
          /* TAB 3: LIVE SUPPLIER OUTFLOWS */
          filteredSuppliers.length === 0 ? (
            <VStack space="md" className="h-64 items-center justify-center text-center p-8 bg-muted/20 border border-border/40 rounded-2xl">
              <Box className="w-12 h-12 rounded-xl bg-muted/70 flex items-center justify-center text-muted-foreground border border-border/70 shadow-sm">
                <Building2 className="w-6 h-6 stroke-[1.5]" />
              </Box>
              <VStack space="2xs" className="max-w-sm">
                <Text size="sm" bold className="text-foreground font-semibold">
                  No Supplier Payouts Found
                </Text>
                <Text size="xs" className="text-muted-foreground leading-relaxed">
                  {searchQuery
                    ? `No suppliers match "${searchQuery}".`
                    : 'No supplier payouts registered in ft_booking_system for this period.'}
                </Text>
              </VStack>
            </VStack>
          ) : (
            filteredSuppliers.map((s) => (
              <HStack
                key={s._id || s.supplierId}
                space="md"
                className="justify-between items-center p-3.5 bg-muted/30 hover:bg-muted/60 border border-border/50 rounded-lg transition-all group hover:border-border/80"
              >
                <HStack space="md" className="min-w-0 items-center flex-1">
                  <Box className="w-10 h-10 rounded-md flex items-center justify-center shrink-0 bg-rose-500/15 text-rose-400 border border-rose-500/30 shadow-md shadow-rose-500/10">
                    <ArrowUpRight className="w-5 h-5 stroke-[2.2]" />
                  </Box>

                  <VStack space="2xs" className="min-w-0 flex-1">
                    <HStack space="sm" className="items-center">
                      <Text size="sm" bold isTruncated className="text-foreground font-semibold text-xs">
                        {s.supplierName}
                      </Text>
                      <Badge variant="error" size="sm" className="py-0 px-2 font-mono text-[10px]">
                        <BadgeText>{s.category}</BadgeText>
                      </Badge>
                      {s.city && (
                        <HStack space="2xs" className="items-center text-muted-foreground hidden sm:flex">
                          <MapPin className="w-3 h-3 text-muted-foreground" />
                          <Text size="2xs" className="text-muted-foreground text-[10px]">
                            {s.city}{s.state ? `, ${s.state}` : ''}
                          </Text>
                        </HStack>
                      )}
                    </HStack>

                    <HStack space="md" className="items-center text-xs text-muted-foreground flex-wrap gap-2">
                      <Text size="2xs" className="text-muted-foreground font-mono">{formatDate(s.date)}</Text>
                      {s.contactPerson && s.contactPerson !== s.supplierName && (
                        <>
                          <Text size="2xs" className="text-muted-foreground/60">•</Text>
                          <Text size="2xs" className="text-muted-foreground text-[10px]">POC: {s.contactPerson}</Text>
                        </>
                      )}
                      {s.supplierId && (
                        <>
                          <Text size="2xs" className="text-muted-foreground/60">•</Text>
                          <Text size="2xs" className="text-muted-foreground font-mono text-[10px]">ID: {s.supplierId}</Text>
                        </>
                      )}
                    </HStack>
                  </VStack>
                </HStack>

                <HStack space="md" className="items-center pl-4">
                  <Text size="md" bold className="font-mono text-base font-bold text-rose-400">
                    -₹{Number(s.amount).toLocaleString('en-IN')}
                  </Text>
                  <Badge variant="muted" size="sm" className="py-0.5 px-1.5 text-[10px]">
                    <BadgeText>{s.status || 'Active'}</BadgeText>
                  </Badge>
                </HStack>
              </HStack>
            ))
          )
        )}
      </VStack>

      {/* Footer Info */}
      <HStack space="sm" className="mt-3 pt-3 border-t border-border/50 items-center justify-between text-xs text-muted-foreground">
        <HStack space="xs" className="items-center">
          <ShieldCheck className="w-3.5 h-3.5 text-primary" />
          <Text size="xs" className="text-muted-foreground text-[11px]">
            {activeTab === 'MANUAL'
              ? 'Local journal entry records'
              : activeTab === 'BOOKINGS'
              ? 'Synchronized live from ft_booking_system.bookings'
              : 'Synchronized live from ft_booking_system.suppliers'}
          </Text>
        </HStack>
        <Text size="xs" className="text-muted-foreground font-mono text-[11px]">
          {activeTab === 'MANUAL'
            ? `Showing ${filteredManual.length} of ${transactions.length}`
            : activeTab === 'BOOKINGS'
            ? `Showing ${filteredBookings.length} of ${liveInflows.length}`
            : `Showing ${filteredSuppliers.length} of ${liveOutflows.length}`}
        </Text>
      </HStack>
    </Card>
  );
}
