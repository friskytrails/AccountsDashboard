import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  FileSpreadsheet,
  ExternalLink,
  Image as ImageIcon
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
  const navigate = useNavigate();
  // Main view tab: 'INFLOW' | 'OUTFLOW'
  const [activeTab, setActiveTab] = useState('INFLOW');
  const [filterType, setFilterType] = useState('ALL'); // For manual entries: 'ALL' | 'INFLOW' | 'OUTFLOW'
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Filtered Manual Transactions (search by description, category, reference number, or transaction ID)
  const filteredManual = transactions.filter((t) => {
    if (filterType === 'INFLOW' && t.type !== 'INFLOW') return false;
    if (filterType === 'OUTFLOW' && t.type !== 'OUTFLOW') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const desc = (t.description || '').toLowerCase();
      const cat = (t.category || '').toLowerCase();
      const ref = (t.referenceNumber || '').toLowerCase();
      const id = (t._id || '').toString().toLowerCase();
      return desc.includes(q) || cat.includes(q) || ref.includes(q) || id.includes(q);
    }
    return true;
  });

  // 2. Filtered Live Booking Inflows (search by name, booking ID, location, package, mode, payment ID, or txn ID)
  const filteredBookings = liveInflows.filter((b) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const name = (b.travellerName || '').toLowerCase();
    const bId = (b.bookingId || '').toLowerCase();
    const loc = (b.location || '').toLowerCase();
    const pkg = (b.packageName || '').toLowerCase();
    const mode = (b.paymentMode || '').toLowerCase();
    const payId = (b.paymentId || '').toString().toLowerCase();
    const txnId = (b.bookingTransactionId || '').toString().toLowerCase();
    const id = (b._id || '').toString().toLowerCase();
    return name.includes(q) || bId.includes(q) || loc.includes(q) || pkg.includes(q) || mode.includes(q) || payId.includes(q) || txnId.includes(q) || id.includes(q);
  });

  // 3. Filtered Live Supplier Outflows (search by supplier name, contact, category, city, supplier ID, service ID, or booking ID)
  const filteredSuppliers = liveOutflows.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const name = (s.supplierName || '').toLowerCase();
    const contact = (s.contactPerson || '').toLowerCase();
    const cat = (s.category || '').toLowerCase();
    const city = (s.city || '').toLowerCase();
    const id = (s.supplierId || '').toLowerCase();
    const sId = (s._id || '').toString().toLowerCase();
    const sBooking = (s.bookingId || '').toLowerCase();
    const sService = (s.serviceId || '').toLowerCase();
    return name.includes(q) || contact.includes(q) || cat.includes(q) || city.includes(q) || id.includes(q) || sId.includes(q) || sBooking.includes(q) || sService.includes(q);
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
                <BadgeText className="text-xs font-semibold tabular-nums">
                  {activeTab === 'INFLOW'
                    ? `${filteredBookings.length} Customer Inflows`
                    : `${filteredSuppliers.length} Supplier Outflows`}
                </BadgeText>
              </Badge>
            </HStack>
            <Text size="sm" className="text-muted-foreground text-xs leading-relaxed">
              Transparent live ledger combining customer inflows, supplier payouts, and manual adjustments
            </Text>
          </VStack>

          <HStack space="sm" className="items-center flex-wrap">
            <Button
              variant="outline"
              size="md"
              onClick={() => navigate('/full-transactions')}
              className="gap-2 border-border/80 hover:border-primary/50 hover:bg-primary/10 rounded-lg px-3.5 shrink-0 transition-all cursor-pointer"
            >
              <ButtonIcon as={FileSpreadsheet} className="w-4 h-4 text-primary" />
              <ButtonText className="text-xs font-bold text-foreground">Check Full Transactions</ButtonText>
            </Button>

            <Button
              variant="default"
              size="md"
              onClick={onOpenAdd}
              className="gap-2 shadow-lg shadow-primary/25 rounded-lg px-4 shrink-0 transition-all cursor-pointer"
            >
              <ButtonIcon as={Plus} className="stroke-[2.5] w-4 h-4" />
              <ButtonText className="text-xs font-bold">Record Transaction</ButtonText>
            </Button>
          </HStack>
        </HStack>

        {/* Source Navigation Tabs */}
        <HStack space="xs" className="p-1 bg-muted/60 border border-border/70 rounded-lg flex-wrap gap-1 mt-1">
          <button
            type="button"
            onClick={() => { setActiveTab('INFLOW'); setSearchQuery(''); }}
            className={`flex items-center gap-2 py-1.5 px-3 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'INFLOW'
                ? 'bg-card text-foreground font-bold shadow-sm border border-border/80'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
            <span>Cash Inflow ({liveInflows.length})</span>
            {totalBookingSum > 0 && (
              <span className="text-[10px] tabular-nums text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                +₹{totalBookingSum.toLocaleString('en-IN')}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('OUTFLOW'); setSearchQuery(''); }}
            className={`flex items-center gap-2 py-1.5 px-3 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'OUTFLOW'
                ? 'bg-card text-foreground font-bold shadow-sm border border-border/80'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />
            <span>Cash Outflow ({liveOutflows.length})</span>
            {totalSupplierSum > 0 && (
              <span className="text-[10px] tabular-nums text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded">
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
                  activeTab === 'INFLOW'
                    ? 'Search traveller, booking ID, txn ID...'
                    : 'Search booking ID, payment ID, category...'
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
        ) : activeTab === 'INFLOW' ? (
          /* TAB 1: LIVE CUSTOMER INFLOWS */
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
            filteredBookings.map((b) => {
              const bmsUrl = b.bookingId ? `https://friskytrails-bms-op.vercel.app/id/${b.bookingId}` : null;
              const txnId = b.bookingTransactionId || b.paymentId || '—';

              return (
                <HStack
                  key={b._id || b.paymentId}
                  space="md"
                  className="justify-between items-center p-3 bg-muted/30 hover:bg-muted/60 border border-border/50 rounded-lg transition-all group hover:border-border/80"
                >
                  <HStack space="md" className="min-w-0 items-center flex-1">
                    <Box className="w-9 h-9 rounded-md flex items-center justify-center shrink-0 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm">
                      <ArrowDownLeft className="w-4 h-4 stroke-[2.2]" />
                    </Box>

                    <VStack space="2xs" className="min-w-0 flex-1">
                      <HStack space="sm" className="items-center flex-wrap">
                        {bmsUrl ? (
                          <a
                            href={bmsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary/15 text-primary hover:bg-primary/25 border border-primary/30 text-xs font-semibold transition-all group/bms"
                            title={`Open ${b.bookingId} in BMS`}
                          >
                            <span>{b.bookingId}</span>
                            <ExternalLink className="w-3 h-3 transition-transform group-hover/bms:translate-x-0.5 group-hover/bms:-translate-y-0.5" />
                          </a>
                        ) : (
                          <Badge variant="success" size="sm" className="py-0 px-2 text-[10px] font-semibold">
                            <BadgeText>NO_ID</BadgeText>
                          </Badge>
                        )}

                        <Badge variant="outline" size="sm" className="py-0 px-1.5 text-[10px] text-foreground font-semibold">
                          <BadgeText>{b.paymentMode || 'Kalpana BOI'}</BadgeText>
                        </Badge>
                      </HStack>

                      <HStack space="md" className="items-center text-xs text-muted-foreground flex-wrap gap-2 pt-0.5">
                        <Text size="2xs" className="text-muted-foreground tabular-nums">{formatDate(b.paymentDate)}</Text>
                        <Text size="2xs" className="text-muted-foreground/60">•</Text>
                        <Text size="2xs" className="text-muted-foreground tabular-nums text-[10px]">Pay ID: {b.paymentId || '—'}</Text>
                        <Text size="2xs" className="text-muted-foreground/60">•</Text>
                        <Text size="2xs" className="text-muted-foreground tabular-nums text-[10px]">Txn ID: {txnId}</Text>

                        {b.attachment ? (
                          <>
                            <Text size="2xs" className="text-muted-foreground/60">•</Text>
                            <a
                              href={b.attachment}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-emerald-400 font-bold hover:underline inline-flex items-center gap-1"
                            >
                              <ImageIcon className="w-3 h-3" />
                              <span>View SS</span>
                            </a>
                          </>
                        ) : (
                          <>
                            <Text size="2xs" className="text-muted-foreground/60">•</Text>
                            <span className="text-[10px] text-muted-foreground/50 italic">No SS</span>
                          </>
                        )}
                      </HStack>
                    </VStack>
                  </HStack>

                  <HStack space="md" className="items-center pl-3">
                    <Text size="md" bold className="tabular-nums text-sm sm:text-base font-bold text-emerald-400">
                      +₹{Number(b.amountPaid).toLocaleString('en-IN')}
                    </Text>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 hidden sm:inline" title="Verified in Booking System" />
                  </HStack>
                </HStack>
              );
            })
          )
        ) : (
          /* TAB 2: LIVE SUPPLIER OUTFLOWS — strictly 7 fields */
          filteredSuppliers.length === 0 ? (
            <VStack space="md" className="h-64 items-center justify-center text-center p-8 bg-muted/20 border border-border/40 rounded-2xl">
              <Box className="w-12 h-12 rounded-xl bg-muted/70 flex items-center justify-center text-muted-foreground border border-border/70 shadow-sm">
                <ArrowUpRight className="w-6 h-6 stroke-[1.5]" />
              </Box>
              <VStack space="2xs" className="max-w-sm">
                <Text size="sm" bold className="text-foreground font-semibold">
                  No Supplier Payouts Found
                </Text>
                <Text size="xs" className="text-muted-foreground leading-relaxed">
                  {searchQuery
                    ? `No outflows match "${searchQuery}".`
                    : 'No supplier payouts registered for this period.'}
                </Text>
              </VStack>
            </VStack>
          ) : (
            filteredSuppliers.map((s) => {
              const bmsUrl = s.bookingId ? `https://friskytrails-bms-op.vercel.app/id/${s.bookingId}` : null;
              return (
                <HStack
                  key={s._id || s.supplierId}
                  space="md"
                  className="justify-between items-center p-3.5 bg-muted/30 hover:bg-muted/60 border border-border/50 rounded-lg transition-all hover:border-border/80"
                >
                  <HStack space="md" className="min-w-0 items-start flex-1">
                    <Box className="w-9 h-9 rounded-md flex items-center justify-center shrink-0 bg-rose-500/15 text-rose-400 border border-rose-500/30 shadow-sm mt-0.5">
                      <ArrowUpRight className="w-4 h-4 stroke-[2.2]" />
                    </Box>

                    <VStack space="2xs" className="min-w-0 flex-1">
                      {/* Row 1: Booking ID + Category */}
                      <HStack space="sm" className="items-center flex-wrap">
                        {bmsUrl ? (
                          <a
                            href={bmsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary/15 text-primary hover:bg-primary/25 border border-primary/30 text-xs font-semibold transition-all"
                            title={`Open ${s.bookingId} in BMS`}
                          >
                            <span>{s.bookingId}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">—</span>
                        )}
                        <Badge variant="error" size="sm" className="py-0 px-2 text-[10px] font-semibold">
                          <BadgeText>{s.category || 'OTHERS'}</BadgeText>
                        </Badge>
                      </HStack>

                      {/* Row 2: Payment ID, Date, Account, SS */}
                      <HStack space="md" className="items-center text-xs text-muted-foreground flex-wrap gap-2 pt-0.5">
                        <Text size="2xs" className="text-muted-foreground tabular-nums text-[10px]">Pay ID: {s.paymentId || '—'}</Text>
                        <Text size="2xs" className="text-muted-foreground/60">•</Text>
                        <Text size="2xs" className="text-muted-foreground tabular-nums">{formatDate(s.date)}</Text>
                        <Text size="2xs" className="text-muted-foreground/60">•</Text>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-foreground border border-border/60 font-medium">
                          {s.paymentMode || 'Account'}
                        </span>
                        {s.attachment ? (
                          <>
                            <Text size="2xs" className="text-muted-foreground/60">•</Text>
                            <a
                              href={s.attachment}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-emerald-400 font-bold hover:underline inline-flex items-center gap-1"
                            >
                              <ImageIcon className="w-3 h-3" />
                              <span>SS</span>
                            </a>
                          </>
                        ) : (
                          <>
                            <Text size="2xs" className="text-muted-foreground/60">•</Text>
                            <span className="text-[10px] text-muted-foreground/50 italic">No SS</span>
                          </>
                        )}
                      </HStack>
                    </VStack>
                  </HStack>

                  <HStack space="md" className="items-center pl-3 shrink-0">
                    <Text size="md" bold className="tabular-nums text-sm font-bold text-rose-400">
                      -₹{Number(s.amount).toLocaleString('en-IN')}
                    </Text>
                  </HStack>
                </HStack>
              );
            })
          )
        )}
      </VStack>

      {/* Footer Info */}
      <HStack space="sm" className="mt-3 pt-3 border-t border-border/50 items-center justify-between text-xs text-muted-foreground">
        <HStack space="xs" className="items-center">
          <ShieldCheck className="w-3.5 h-3.5 text-primary" />
          <Text size="xs" className="text-muted-foreground text-[11px]">
            {activeTab === 'INFLOW'
              ? 'Synchronized live from ft_booking_system.bookings'
              : 'Synchronized live from ft_booking_system.suppliers'}
          </Text>
        </HStack>
        <Text size="xs" className="text-muted-foreground tabular-nums text-[11px]">
          {activeTab === 'INFLOW'
            ? `Showing ${filteredBookings.length} of ${liveInflows.length}`
            : `Showing ${filteredSuppliers.length} of ${liveOutflows.length}`}
        </Text>
      </HStack>
    </Card>
  );
}
