import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  CreditCard,
  Building2,
  Users,
  FileSpreadsheet,
  Filter,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ExternalLink,
  CheckCircle2,
  Download,
  X,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Briefcase,
  ShieldCheck,
  ArrowUpDown
} from 'lucide-react';
import { apiFetch } from '../utils/api';
import toast from 'react-hot-toast';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Badge,
  BadgeText,
  Button,
  ButtonText,
  ButtonIcon,
  Input,
  InputField,
  InputIcon,
  Card
} from '@/components/ui';

// Settlement channels configured in treasury
const SETTLEMENT_CHANNELS = [
  'All Channels',
  'Kalpana BOI',
  'Kalpana PNB',
  'Babita AU',
  'Hari Mohan BOB',
  'FT HDFC',
  'Pratyush SBI',
  'Cash',
  'Other'
];

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function normalizeMode(mode) {
  if (!mode) return 'Other';
  const m = mode.trim();
  const lower = m.toLowerCase();
  if (lower.includes('kalpana') && lower.includes('boi')) return 'Kalpana BOI';
  if (lower.includes('kalpana') && lower.includes('pnb')) return 'Kalpana PNB';
  if (lower.includes('babita')) return 'Babita AU';
  if (lower.includes('hari') || lower.includes('mohan')) return 'Hari Mohan BOB';
  if (lower.includes('hdfc')) return 'FT HDFC';
  if (lower.includes('pratyush') || lower.includes('sbi')) return 'Pratyush SBI';
  if (lower.includes('cash')) return 'Cash';
  return m;
}

function getInitials(name = '') {
  if (!name) return 'LG';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export default function FullTransactionsPage({ selectedMonth: propMonth, selectedYear: propYear }) {
  const navigate = useNavigate();
  const outletCtx = useOutletContext() || {};
  const selectedMonth = propMonth || outletCtx.selectedMonth || 10;
  const selectedYear = propYear || outletCtx.selectedYear || 2026;

  // Tab: 'BOOKINGS' (Leads) | 'MANUAL' | 'SUPPLIERS'
  const [activeTab, setActiveTab] = useState('BOOKINGS');
  // Time scope: 'MONTH' | 'ALL_TIME' (defaults to active selected month so month selector works as expected)
  const [timeScope, setTimeScope] = useState('MONTH');
  // Selected payment mode channel
  const [selectedChannel, setSelectedChannel] = useState('All Channels');
  // Search query
  const [searchQuery, setSearchQuery] = useState('');
  // Sort field: 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc' | 'name_asc'
  const [sortBy, setSortBy] = useState('date_desc');
  // Expanded row IDs
  const [expandedIds, setExpandedIds] = useState(new Set());
  // Copied item ID
  const [copiedId, setCopiedId] = useState(null);

  // Data states
  const [inflows, setInflows] = useState([]);
  const [manualTx, setManualTx] = useState([]);
  const [outflows, setOutflows] = useState([]);
  const [loading, setLoading] = useState(true);

  // Auto-switch to MONTH scope whenever user changes month/year in header
  useEffect(() => {
    setTimeScope('MONTH');
  }, [selectedMonth, selectedYear]);

  // Request sequence ref & abort controller ref to prevent obsolete requests from overwriting state
  const requestSeqRef = useRef(0);
  const abortControllerRef = useRef(null);

  // Load data
  const loadTransactions = useCallback(async () => {
    // Cancel prior in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const seq = ++requestSeqRef.current;

    setLoading(true);
    try {
      const isMonth = timeScope === 'MONTH';
      const monthQuery = isMonth ? `?month=${selectedMonth}&year=${selectedYear}` : '';
      const manualMonthQuery = isMonth ? `?month=${selectedMonth}&year=${selectedYear}&limit=500` : '?limit=1000';

      const [inflowsRes, manualRes, outflowsRes] = await Promise.all([
        apiFetch(`/transactions/live-inflows${monthQuery}`, { signal: controller.signal }),
        apiFetch(`/transactions${manualMonthQuery}`, { signal: controller.signal }),
        apiFetch(`/transactions/live-outflows${monthQuery}`, { signal: controller.signal })
      ]);

      // Commit results only if this request is still the latest one
      if (seq === requestSeqRef.current) {
        setInflows(inflowsRes.inflows || []);
        setManualTx(manualRes.transactions || []);
        setOutflows(outflowsRes.outflows || []);
      }
    } catch (err) {
      if (err.name === 'AbortError' || controller.signal.aborted) {
        return; // Obsolete request aborted; ignore silently
      }
      if (seq === requestSeqRef.current) {
        console.error('Failed to load full transactions:', err);
        toast.error('Failed to load transaction ledger');
      }
    } finally {
      if (seq === requestSeqRef.current) {
        setLoading(false);
      }
    }
  }, [timeScope, selectedMonth, selectedYear]);

  useEffect(() => {
    loadTransactions();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [loadTransactions]);

  // Toggle row expansion
  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Copy to clipboard helper
  const copyText = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success(`Copied: ${text}`, { id: 'copy-toast', duration: 1500 });
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Helper to check if a date string falls inside the active selected month & year (UTC calendar)
  const matchesSelectedMonth = (dateStr) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;
    return d.getUTCMonth() + 1 === Number(selectedMonth) && d.getUTCFullYear() === Number(selectedYear);
  };

  // Scoped count helpers for tab badges
  const displayedInflowsCount = useMemo(() => {
    if (timeScope !== 'MONTH') return inflows.length;
    return inflows.filter((b) => matchesSelectedMonth(b.paymentDate)).length;
  }, [inflows, timeScope, selectedMonth, selectedYear]);

  const displayedManualCount = useMemo(() => {
    if (timeScope !== 'MONTH') return manualTx.length;
    return manualTx.filter((t) => matchesSelectedMonth(t.date)).length;
  }, [manualTx, timeScope, selectedMonth, selectedYear]);

  const displayedOutflowsCount = useMemo(() => {
    if (timeScope !== 'MONTH') return outflows.length;
    return outflows.filter((s) => matchesSelectedMonth(s.date)).length;
  }, [outflows, timeScope, selectedMonth, selectedYear]);

  // 1. Channel stats with counts and sums for Leads (Customer Inflows)
  const channelStats = useMemo(() => {
    const stats = {};
    SETTLEMENT_CHANNELS.forEach((ch) => {
      stats[ch] = { count: 0, totalAmount: 0 };
    });

    const scopedInflows = timeScope === 'MONTH'
      ? inflows.filter((item) => matchesSelectedMonth(item.paymentDate))
      : inflows;

    scopedInflows.forEach((item) => {
      const norm = normalizeMode(item.paymentMode);
      const amt = Number(item.amountPaid || 0);

      stats['All Channels'].count += 1;
      stats['All Channels'].totalAmount += amt;

      if (stats[norm]) {
        stats[norm].count += 1;
        stats[norm].totalAmount += amt;
      } else {
        stats['Other'].count += 1;
        stats['Other'].totalAmount += amt;
      }
    });

    return stats;
  }, [inflows, timeScope, selectedMonth, selectedYear]);

  // 2. Filtered & Sorted Bookings
  const filteredBookings = useMemo(() => {
    let list = inflows.filter((b) => {
      // Month scope check
      if (timeScope === 'MONTH' && !matchesSelectedMonth(b.paymentDate)) {
        return false;
      }

      // Channel filter
      if (selectedChannel !== 'All Channels') {
        const norm = normalizeMode(b.paymentMode);
        if (selectedChannel === 'Other') {
          const isStandard = SETTLEMENT_CHANNELS.slice(1, -1).includes(norm);
          if (isStandard) return false;
        } else if (norm !== selectedChannel) {
          return false;
        }
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const name = (b.travellerName || '').toLowerCase();
        const phone = (b.travellerPhone || '').toLowerCase();
        const email = (b.travellerEmail || '').toLowerCase();
        const bookingId = (b.bookingId || '').toLowerCase();
        const payId = (b.paymentId || '').toString().toLowerCase();
        const txnId = (b.bookingTransactionId || '').toString().toLowerCase();
        const loc = (b.location || '').toLowerCase();
        const pkg = (b.packageName || '').toLowerCase();
        const agent = (b.addedBy || b.assignedTo || '').toLowerCase();
        const mode = (b.paymentMode || '').toLowerCase();

        return (
          name.includes(q) ||
          phone.includes(q) ||
          email.includes(q) ||
          bookingId.includes(q) ||
          payId.includes(q) ||
          txnId.includes(q) ||
          loc.includes(q) ||
          pkg.includes(q) ||
          agent.includes(q) ||
          mode.includes(q)
        );
      }

      return true;
    });

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'date_desc') return new Date(b.paymentDate) - new Date(a.paymentDate);
      if (sortBy === 'date_asc') return new Date(a.paymentDate) - new Date(b.paymentDate);
      if (sortBy === 'amount_desc') return Number(b.amountPaid || 0) - Number(a.amountPaid || 0);
      if (sortBy === 'amount_asc') return Number(a.amountPaid || 0) - Number(b.amountPaid || 0);
      if (sortBy === 'name_asc') return (a.travellerName || '').localeCompare(b.travellerName || '');
      return 0;
    });

    return list;
  }, [inflows, timeScope, selectedMonth, selectedYear, selectedChannel, searchQuery, sortBy]);

  // 3. Filtered Manual entries
  const filteredManual = useMemo(() => {
    return manualTx.filter((t) => {
      if (timeScope === 'MONTH' && !matchesSelectedMonth(t.date)) {
        return false;
      }
      if (selectedChannel !== 'All Channels') {
        const norm = normalizeMode(t.paymentMode);
        if (norm !== selectedChannel) return false;
      }
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
  }, [manualTx, timeScope, selectedMonth, selectedYear, selectedChannel, searchQuery]);

  // 4. Filtered Suppliers
  const filteredSuppliers = useMemo(() => {
    return outflows.filter((s) => {
      if (timeScope === 'MONTH' && !matchesSelectedMonth(s.date)) {
        return false;
      }
      if (selectedChannel !== 'All Channels') {
        const norm = normalizeMode(s.paymentMode);
        if (norm !== selectedChannel) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const name = (s.supplierName || '').toLowerCase();
        const id = (s.supplierId || '').toLowerCase();
        const bId = (s.bookingId || '').toLowerCase();
        const city = (s.city || '').toLowerCase();
        return name.includes(q) || id.includes(q) || bId.includes(q) || city.includes(q);
      }
      return true;
    });
  }, [outflows, timeScope, selectedMonth, selectedYear, selectedChannel, searchQuery]);

  // Active counts & totals
  const totalVolume = filteredBookings.reduce((sum, b) => sum + Number(b.amountPaid || 0), 0);
  const avgTicket = filteredBookings.length > 0 ? Math.round(totalVolume / filteredBookings.length) : 0;

  // Export to CSV helper
  const exportCSV = () => {
    if (activeTab === 'BOOKINGS') {
      const headers = ['Booking ID', 'Traveller Name', 'Phone', 'Email', 'Location', 'Package', 'Payment Mode', 'Payment ID', 'Amount Paid', 'Disbursed Date', 'Status', 'Agent'];
      const rows = filteredBookings.map((b) => [
        b.bookingId || '',
        `"${b.travellerName || ''}"`,
        b.travellerPhone || '',
        b.travellerEmail || '',
        `"${b.location || ''}"`,
        `"${b.packageName || ''}"`,
        `"${b.paymentMode || ''}"`,
        b.paymentId || '',
        b.amountPaid || 0,
        b.paymentDate ? new Date(b.paymentDate).toISOString().split('T')[0] : '',
        b.status || '',
        b.addedBy || ''
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `leads_ledger_${timeScope.toLowerCase()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Leads ledger exported as CSV');
    }
  };

  return (
    <div className="w-full max-w-[1680px] mx-auto space-y-6 pb-20 px-2 sm:px-4">
      {/* ── TOP EXECUTIVE BANNER ── */}
      <div className="rounded-2xl border border-border/80 bg-card/90 backdrop-blur-xl p-5 md:p-6 shadow-xl relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          {/* Left: Navigation & Title */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground bg-muted/40 hover:bg-muted border border-border/60 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-primary" />
                <span>Dashboard</span>
              </button>
            </div>

            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
                Audit Ledger & Lead Transactions
              </h1>
            </div>
          </div>

          {/* Right: Quick Ledger Metrics & Time Scope Switch */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 lg:self-center">
            {/* KPI pill stats */}
            <div className="grid grid-cols-2 gap-3 bg-muted/30 p-2.5 rounded-xl border border-border/60">
              <div className="px-3 py-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block">
                  Total Volume
                </span>
                <span className="text-base font-bold font-mono text-emerald-400">
                  ₹{totalVolume.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="px-3 py-1 border-l border-border/60">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block">
                  Filtered Leads
                </span>
                <span className="text-base font-bold font-mono text-foreground">
                  {filteredBookings.length}
                </span>
              </div>
            </div>

            {/* Time Scope Toggle */}
            <div className="inline-flex p-1 bg-muted/60 border border-border/70 rounded-xl">
              <button
                type="button"
                onClick={() => setTimeScope('MONTH')}
                className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${timeScope === 'MONTH'
                  ? 'bg-card text-emerald-400 font-bold shadow-sm border border-emerald-500/40'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                Month ({MONTH_NAMES[selectedMonth - 1] || selectedMonth} {selectedYear})
              </button>
              <button
                type="button"
                onClick={() => setTimeScope('ALL_TIME')}
                className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${timeScope === 'ALL_TIME'
                  ? 'bg-card text-foreground font-bold shadow-sm border border-border/80'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                All Time
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── TOP SECTION TABS: CUSTOMER INFLOWS | MANUAL | SUPPLIERS ── */}
      <div className="flex items-center justify-between flex-wrap gap-3 border-b border-border/70 pb-3">
        <div className="inline-flex p-1 bg-muted/50 border border-border/60 rounded-xl gap-1">
          <button
            type="button"
            onClick={() => { setActiveTab('BOOKINGS'); setSelectedChannel('All Channels'); }}
            className={`flex items-center gap-2 py-2 px-3.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeTab === 'BOOKINGS'
              ? 'bg-card text-foreground shadow-sm border border-border/80 text-primary'
              : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            <span>Customer Inflows (Leads)</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400">
              {displayedInflowsCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('MANUAL'); setSelectedChannel('All Channels'); }}
            className={`flex items-center gap-2 py-2 px-3.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeTab === 'MANUAL'
              ? 'bg-card text-foreground shadow-sm border border-border/80 text-sky-400'
              : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-sky-400" />
            <span>Manual Treasury</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-muted text-muted-foreground">
              {displayedManualCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('SUPPLIERS'); setSelectedChannel('All Channels'); }}
            className={`flex items-center gap-2 py-2 px-3.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeTab === 'SUPPLIERS'
              ? 'bg-card text-foreground shadow-sm border border-border/80 text-rose-400'
              : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            <Building2 className="w-3.5 h-3.5 text-rose-400" />
            <span>Supplier Outflows</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-muted text-muted-foreground">
              {displayedOutflowsCount}
            </span>
          </button>
        </div>

        {activeTab === 'BOOKINGS' && (
          <button
            type="button"
            onClick={exportCSV}
            className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold border border-border/70 hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-all cursor-pointer shrink-0"
          >
            <Download className="w-3.5 h-3.5 text-primary" />
            <span>Export CSV</span>
          </button>
        )}
      </div>

      {/* ── FEATURE 3: SLEEK HORIZONTAL PAYMENT MODE FILTER STRIP WITH LEAD COUNTS ── */}
      {activeTab === 'BOOKINGS' && (
        <div className="rounded-xl border border-border/70 bg-card/75 p-3.5 space-y-2.5">
          <div className="flex items-center justify-between flex-wrap gap-2 px-1">
            <div className="flex items-center gap-2 text-xs font-bold text-foreground">
              <CreditCard className="w-3.5 h-3.5 text-primary" />
              <span>Payment Mode Settlement Channel</span>
            </div>

            {selectedChannel !== 'All Channels' && (
              <button
                type="button"
                onClick={() => setSelectedChannel('All Channels')}
                className="text-xs text-primary hover:underline font-semibold flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                <span>Show All Channels</span>
              </button>
            )}
          </div>

          {/* Clean Modern Pill Rails */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none flex-wrap">
            {SETTLEMENT_CHANNELS.map((ch) => {
              const stats = channelStats[ch] || { count: 0, totalAmount: 0 };
              const isSelected = selectedChannel === ch;

              return (
                <button
                  key={ch}
                  type="button"
                  onClick={() => setSelectedChannel(ch)}
                  className={`inline-flex items-center gap-2 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap border ${isSelected
                    ? 'bg-primary/15 text-primary border-primary shadow-sm shadow-primary/20 ring-1 ring-primary/40 font-bold'
                    : 'bg-muted/30 hover:bg-muted/70 text-muted-foreground hover:text-foreground border-border/60'
                    }`}
                >
                  <span>{ch}</span>
                  {/* Count badge */}
                  <span
                    className={`font-mono text-[10px] px-1.5 py-0.2 rounded-full font-bold ${isSelected
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted-foreground/15 text-muted-foreground'
                      }`}
                  >
                    {stats.count}
                  </span>
                  {/* Total collected in mode */}
                  {stats.totalAmount > 0 && ch !== 'All Channels' && (
                    <span className="text-[10px] font-mono text-emerald-400 opacity-80 hidden md:inline">
                      ₹{Math.round(stats.totalAmount / 1000)}k
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Active summary sub-strip */}
          {selectedChannel !== 'All Channels' && (
            <div className="flex items-center justify-between text-xs px-2 pt-1 border-t border-border/40 text-muted-foreground">
              <span>
                Filtered by <strong className="text-foreground">{selectedChannel}</strong>: {channelStats[selectedChannel]?.count || 0} leads paid
              </span>
              <span className="font-mono text-emerald-400 font-bold">
                Total Collected: ₹{(channelStats[selectedChannel]?.totalAmount || 0).toLocaleString('en-IN')}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── SEARCH, SORT, & RESULTS TOOLBAR ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={
              activeTab === 'BOOKINGS'
                ? 'Search traveller, phone, booking ID, txn ID...'
                : activeTab === 'MANUAL'
                  ? 'Search narration, ref, or txn ID...'
                  : 'Search supplier, city, ID...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-muted/40 border border-border/70 rounded-xl h-10 pl-10 pr-9 text-xs text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:border-primary transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Sort Controls & Counter */}
        <div className="flex items-center gap-3 justify-between sm:justify-end">
          {activeTab === 'BOOKINGS' && (
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-muted/40 border border-border/70 rounded-lg text-xs text-foreground py-1.5 px-2.5 focus:outline-none focus:border-primary cursor-pointer"
              >
                <option value="date_desc">Date: Newest First</option>
                <option value="date_asc">Date: Oldest First</option>
                <option value="amount_desc">Amount: High to Low</option>
                <option value="amount_asc">Amount: Low to High</option>
                <option value="name_asc">Traveller: A to Z</option>
              </select>
            </div>
          )}

          <span className="text-xs text-muted-foreground font-mono">
            {activeTab === 'BOOKINGS'
              ? `${filteredBookings.length} entries`
              : activeTab === 'MANUAL'
                ? `${filteredManual.length} entries`
                : `${filteredSuppliers.length} entries`}
          </span>
        </div>
      </div>

      {/* ── MAIN HIGH-DENSITY AUDIT LEDGER TABLE ── */}
      {loading ? (
        <div className="p-16 rounded-2xl border border-border/70 bg-card/60 flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-muted-foreground animate-pulse font-medium">
            Synchronizing live records from database...
          </p>
        </div>
      ) : activeTab === 'BOOKINGS' ? (
        /* ═══════════════════════════════════════════════════════
           TAB 1: HIGH-DENSITY LEADS LEDGER WITH ACCORDION DETAILS
           ═══════════════════════════════════════════════════════ */
        filteredBookings.length === 0 ? (
          <div className="p-16 rounded-2xl border border-border/60 bg-muted/20 text-center space-y-2">
            <Users className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-foreground">No Transactions Match Filter</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              No customer inflows found matching "{searchQuery || selectedChannel}". Clear your filters to see all entries.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-border/80 bg-card/90 overflow-hidden shadow-xl">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-3 px-5 py-3 bg-muted/50 border-b border-border/70 text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-bold">
              <div className="col-span-12 md:col-span-4">Lead / Traveller Contact</div>
              <div className="hidden md:block md:col-span-3">Booking & Itinerary</div>
              <div className="hidden lg:block lg:col-span-2">Settlement Channel</div>
              <div className="col-span-6 md:col-span-2 text-right">Amount Paid</div>
              <div className="col-span-6 md:col-span-1 text-right">Details</div>
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-border/50">
              {filteredBookings.map((b) => {
                const id = b._id || b.paymentId;
                const isExpanded = expandedIds.has(id);
                const channel = normalizeMode(b.paymentMode);

                return (
                  <div
                    key={id}
                    className={`transition-colors ${isExpanded ? 'bg-muted/30' : 'hover:bg-muted/20'
                      }`}
                  >
                    {/* Main Row */}
                    <div
                      onClick={() => toggleExpand(id)}
                      className="grid grid-cols-12 gap-3 px-5 py-3.5 items-center cursor-pointer select-none"
                    >
                      {/* Col 1: Lead Avatar + Name + Contact (4 cols) */}
                      <div className="col-span-12 md:col-span-4 flex items-center gap-3.5 min-w-0">
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-primary/10 border border-emerald-500/30 text-emerald-400 font-bold text-sm flex items-center justify-center shrink-0">
                          {getInitials(b.travellerName)}
                        </div>

                        {/* Name & Quick contact */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-foreground truncate">
                              {b.travellerName || 'Valued Guest'}
                            </span>
                            <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                              {b.bookingId || 'BOOKING'}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1 truncate">
                            {b.travellerPhone && (
                              <span className="font-mono">{b.travellerPhone}</span>
                            )}
                            {b.travellerEmail && (
                              <span className="truncate hidden sm:inline">{b.travellerEmail}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Col 2: Package & Location (3 cols) */}
                      <div className="hidden md:block md:col-span-3 min-w-0">
                        <p className="text-sm text-foreground font-semibold truncate">
                          {b.packageName || 'Custom Yatra Package'}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                          {b.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-muted-foreground/70" />
                              <span className="truncate">{b.location}</span>
                            </span>
                          )}
                          <span className="text-muted-foreground/50">•</span>
                          <span className="font-mono text-xs">{formatDate(b.paymentDate)}</span>
                        </div>
                      </div>

                      {/* Col 3: Settlement Channel Plain Text (2 cols) */}
                      <div className="hidden lg:block lg:col-span-2">
                        <span className="text-sm font-medium text-foreground tracking-tight">
                          {channel}
                        </span>
                      </div>

                      {/* Col 4: Amount Paid (2 cols) */}
                      <div className="col-span-6 md:col-span-2 text-right">
                        <span className="font-mono text-base font-extrabold text-emerald-400 block">
                          +₹{Number(b.amountPaid || 0).toLocaleString('en-IN')}
                        </span>
                        {b.totalBookingAmount && (
                          <span className="text-xs font-mono text-muted-foreground block pt-0.5">
                            Trip: ₹{Number(b.totalBookingAmount).toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>

                      {/* Col 5: Expand Chevron (1 col) */}
                      <div className="col-span-6 md:col-span-1 text-right flex items-center justify-end gap-1">
                        <span className="text-xs text-primary font-semibold md:hidden">
                          {isExpanded ? 'Hide' : 'View'}
                        </span>
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-primary" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* ── EXPANDABLE DETAIL DRAWER (Tidy, Organized into 4 sleek sections) ── */}
                    {isExpanded && (
                      <div className="px-5 py-5 bg-muted/40 border-t border-border/50 text-xs">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          {/* 1. Lead Contact Information */}
                          <div className="bg-card/80 p-4 rounded-xl border border-border/70 space-y-2.5">
                            <span className="text-xs font-mono uppercase tracking-wider text-primary font-bold flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 text-primary" />
                              Lead Contact Info
                            </span>
                            <div className="space-y-2 pt-0.5">
                              <div>
                                <span className="text-xs text-muted-foreground block">Full Name:</span>
                                <span className="font-bold text-sm text-foreground">{b.travellerName || '—'}</span>
                              </div>
                              {b.travellerPhone && (
                                <div>
                                  <span className="text-xs text-muted-foreground block">Phone:</span>
                                  <a
                                    href={`tel:${b.travellerPhone}`}
                                    className="text-primary hover:underline font-mono text-xs md:text-sm font-semibold flex items-center gap-1.5"
                                  >
                                    <Phone className="w-3.5 h-3.5" />
                                    <span>{b.travellerPhone}</span>
                                  </a>
                                </div>
                              )}
                              {b.travellerEmail && (
                                <div>
                                  <span className="text-xs text-muted-foreground block">Email:</span>
                                  <a
                                    href={`mailto:${b.travellerEmail}`}
                                    className="text-primary hover:underline text-xs md:text-sm font-medium truncate block"
                                  >
                                    {b.travellerEmail}
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* 2. Trip & Itinerary Details */}
                          <div className="bg-card/80 p-4 rounded-xl border border-border/70 space-y-2.5">
                            <span className="text-xs font-mono uppercase tracking-wider text-primary font-bold flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-primary" />
                              Trip & Itinerary
                            </span>
                            <div className="space-y-2 pt-0.5">
                              <div>
                                <span className="text-xs text-muted-foreground block">Package:</span>
                                <span className="font-semibold text-sm text-foreground truncate block">
                                  {b.packageName || '—'}
                                </span>
                              </div>
                              <div>
                                <span className="text-xs text-muted-foreground block">Travel Dates:</span>
                                <span className="font-mono text-xs md:text-sm text-foreground">
                                  {formatDate(b.startDate)} → {formatDate(b.endDate)}
                                </span>
                              </div>
                              <div>
                                <span className="text-xs text-muted-foreground block">Travel Party:</span>
                                <span className="text-sm font-medium text-foreground">
                                  {b.adults || 0} Adults {b.children ? `, ${b.children} Children` : ''}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* 3. Transaction & Treasury Details */}
                          <div className="bg-card/80 p-4 rounded-xl border border-border/70 space-y-2.5">
                            <span className="text-xs font-mono uppercase tracking-wider text-primary font-bold flex items-center gap-1.5">
                              <CreditCard className="w-3.5 h-3.5 text-primary" />
                              Treasury Audit Info
                            </span>
                            <div className="space-y-2 pt-0.5">
                              <div>
                                <span className="text-xs text-muted-foreground block">Settlement Channel:</span>
                                <span className="font-bold text-sm text-foreground font-mono">{b.paymentMode || '—'}</span>
                              </div>
                              <div>
                                <span className="text-xs text-muted-foreground block">Payment ID:</span>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-sm text-foreground font-bold">{b.paymentId || '—'}</span>
                                  {b.paymentId && (
                                    <button
                                      type="button"
                                      onClick={() => copyText(b.paymentId, `pay-${b.paymentId}`)}
                                      className="text-muted-foreground hover:text-foreground"
                                      title="Copy Payment ID"
                                    >
                                      {copiedId === `pay-${b.paymentId}` ? (
                                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                                      ) : (
                                        <Copy className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                  )}
                                </div>
                              </div>
                              {b.dueAmount !== undefined && Number(b.dueAmount) > 0 && (
                                <div>
                                  <span className="text-xs text-muted-foreground block">Remaining Due:</span>
                                  <span className="font-mono text-xs md:text-sm text-rose-400 font-bold">
                                    ₹{Number(b.dueAmount).toLocaleString('en-IN')}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* 4. Agent & Verified Receipt Proof */}
                          <div className="bg-card/80 p-4 rounded-xl border border-border/70 space-y-2.5">
                            <span className="text-xs font-mono uppercase tracking-wider text-primary font-bold flex items-center gap-1.5">
                              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                              Receipt Proof & Agent
                            </span>
                            <div className="space-y-2 pt-0.5">
                              <div>
                                <span className="text-xs text-muted-foreground block">Logged by Agent:</span>
                                <span className="font-semibold text-sm text-foreground">{b.addedBy || 'Direct'}</span>
                              </div>

                              {b.details && (
                                <div>
                                  <span className="text-xs text-muted-foreground block">Narration:</span>
                                  <span className="text-xs text-muted-foreground italic truncate block">"{b.details}"</span>
                                </div>
                              )}

                              {b.attachment ? (
                                <a
                                  href={b.attachment}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 py-1.5 px-3.5 rounded-lg text-xs font-bold bg-primary text-primary-foreground shadow-md hover:bg-primary/90 transition-all mt-1"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                  <span>View Receipt Proof</span>
                                </a>
                              ) : (
                                <span className="text-xs text-muted-foreground italic block">
                                  No receipt image uploaded
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )
      ) : activeTab === 'MANUAL' ? (
        /* ═══════════════════════════════════════════════════════
           TAB 2: MANUAL JOURNAL ENTRIES (CLEAN & TIDY TABLE)
           ═══════════════════════════════════════════════════════ */
        filteredManual.length === 0 ? (
          <div className="p-16 rounded-2xl border border-border/60 bg-muted/20 text-center space-y-2">
            <FileSpreadsheet className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-foreground">No Manual Journal Entries</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              No manual treasury adjustments match this period or filter.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-border/80 bg-card/90 overflow-hidden shadow-xl">
            <div className="grid grid-cols-12 gap-3 px-5 py-3 bg-muted/50 border-b border-border/70 text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-bold">
              <div className="col-span-12 md:col-span-5">Narration / Payee</div>
              <div className="hidden md:block md:col-span-2">Category</div>
              <div className="hidden md:block md:col-span-2">Settlement Mode</div>
              <div className="col-span-6 md:col-span-3 text-right">Amount (₹)</div>
            </div>

            <div className="divide-y divide-border/50">
              {filteredManual.map((tx) => {
                const isInflow = tx.type === 'INFLOW';
                return (
                  <div
                    key={tx._id}
                    className="grid grid-cols-12 gap-3 px-5 py-3.5 items-center hover:bg-muted/20 transition-colors"
                  >
                    <div className="col-span-12 md:col-span-5 flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isInflow
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          }`}
                      >
                        {isInflow ? (
                          <ArrowDownLeft className="w-4 h-4 stroke-[2.2]" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4 stroke-[2.2]" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="font-bold text-xs text-foreground truncate block">
                          {tx.description || tx.category}
                        </span>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
                          <span>{formatDate(tx.date)}</span>
                          {tx.referenceNumber && <span>• Ref: {tx.referenceNumber}</span>}
                          <span>• ID: {String(tx._id).slice(-6)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="hidden md:block md:col-span-2">
                      <span className="font-mono text-xs text-muted-foreground">
                        {tx.category}
                      </span>
                    </div>

                    <div className="hidden md:block md:col-span-2">
                      <span className="inline-flex items-center gap-1 font-mono text-xs px-2 py-0.5 rounded bg-muted text-foreground border border-border/60">
                        {tx.paymentMode}
                      </span>
                    </div>

                    <div className="col-span-6 md:col-span-3 text-right">
                      <span
                        className={`font-mono text-sm font-bold ${isInflow ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                      >
                        {isInflow ? '+' : '-'}₹{Number(tx.amount).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )
      ) : (
        /* ═══════════════════════════════════════════════════════
           TAB 3: SUPPLIER OUTFLOWS (CLEAN & TIDY TABLE)
           ═══════════════════════════════════════════════════════ */
        filteredSuppliers.length === 0 ? (
          <div className="p-16 rounded-2xl border border-border/60 bg-muted/20 text-center space-y-2">
            <Building2 className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-foreground">No Supplier Outflows</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              No registered vendor disbursements recorded for this selection.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-border/80 bg-card/90 overflow-hidden shadow-xl">
            <div className="grid grid-cols-12 gap-3 px-5 py-3 bg-muted/50 border-b border-border/70 text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-bold">
              <div className="col-span-12 md:col-span-5">Vendor / Supplier Name</div>
              <div className="hidden md:block md:col-span-2">Service Type</div>
              <div className="hidden md:block md:col-span-2">Booking Reference</div>
              <div className="col-span-6 md:col-span-3 text-right">Disbursed (₹)</div>
            </div>

            <div className="divide-y divide-border/50">
              {filteredSuppliers.map((s) => (
                <div
                  key={s._id || s.supplierId}
                  className="grid grid-cols-12 gap-3 px-5 py-3.5 items-center hover:bg-muted/20 transition-colors"
                >
                  <div className="col-span-12 md:col-span-5 flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
                      <ArrowUpRight className="w-4 h-4 stroke-[2.2]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-xs text-foreground truncate block">
                        {s.supplierName || 'Supplier'}
                      </span>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
                        <span>{formatDate(s.date)}</span>
                        {s.city && <span>• {s.city}</span>}
                        {s.contactPerson && <span>• POC: {s.contactPerson}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="hidden md:block md:col-span-2">
                    <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      {s.category || 'VENDOR'}
                    </span>
                  </div>

                  <div className="hidden md:block md:col-span-2">
                    <span className="font-mono text-xs text-muted-foreground">
                      {s.bookingId || '—'}
                    </span>
                  </div>

                  <div className="col-span-6 md:col-span-3 text-right">
                    <span className="font-mono text-sm font-bold text-rose-400">
                      -₹{Number(s.amount || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      )}
    </div>
  );
}
