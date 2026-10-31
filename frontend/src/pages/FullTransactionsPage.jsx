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
  ArrowUpDown,
  Image as ImageIcon
} from 'lucide-react';
import { apiFetch } from '../utils/api';
import toast from 'react-hot-toast';

// Settlement channels configured in treasury - strictly the 6 Accounts
const SETTLEMENT_CHANNELS = [
  'All Channels',
  'Kalpana BOI',
  'Kalpana PNB',
  'Babita AU',
  'Hari Mohan BOB',
  'FT HDFC',
  'Pratyush SBI'
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

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export default function FullTransactionsPage({ selectedMonth: propMonth, selectedYear: propYear }) {
  const navigate = useNavigate();
  const outletCtx = useOutletContext() || {};
  const selectedMonth = propMonth || outletCtx.selectedMonth || 10;
  const selectedYear = propYear || outletCtx.selectedYear || 2026;

  // Tab: 'INFLOW' (Cash Inflow) | 'OUTFLOW' (Cash Outflow)
  const [activeTab, setActiveTab] = useState('INFLOW');
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
  // Screenshot preview modal
  const [activeScreenshot, setActiveScreenshot] = useState(null); // { url, title }

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
    const manualInflows = manualTx.filter((t) => t.type === 'INFLOW');
    if (timeScope !== 'MONTH') return inflows.length + manualInflows.length;
    return inflows.filter((b) => matchesSelectedMonth(b.paymentDate)).length
      + manualInflows.filter((t) => matchesSelectedMonth(t.date)).length;
  }, [inflows, manualTx, timeScope, selectedMonth, selectedYear]);

  const displayedOutflowsCount = useMemo(() => {
    const manualOutflows = manualTx.filter((t) => t.type === 'OUTFLOW');
    if (timeScope !== 'MONTH') return outflows.length + manualOutflows.length;
    return outflows.filter((s) => matchesSelectedMonth(s.date)).length
      + manualOutflows.filter((t) => matchesSelectedMonth(t.date)).length;
  }, [outflows, manualTx, timeScope, selectedMonth, selectedYear]);

  // 1. Channel stats with counts and sums for Leads (Customer Inflows)
  const channelStats = useMemo(() => {
    const stats = {};
    SETTLEMENT_CHANNELS.forEach((ch) => {
      stats[ch] = { count: 0, totalAmount: 0 };
    });
    // Always ensure 'Other' bucket exists even if not in SETTLEMENT_CHANNELS
    if (!stats['Other']) {
      stats['Other'] = { count: 0, totalAmount: 0 };
    }

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
        const ref = (t.referenceNumber || '').toLowerCase();
        const cat = (t.category || '').toLowerCase();
        const mode = (t.paymentMode || '').toLowerCase();
        return desc.includes(q) || ref.includes(q) || cat.includes(q) || mode.includes(q);
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

  // Export to CSV helper
  const exportCSV = () => {
    if (activeTab === 'INFLOW') {
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
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80 block">
                  Total Volume
                </span>
                <span className="text-lg font-bold text-emerald-400 tabular-nums">
                  ₹{totalVolume.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="px-3 py-1 border-l border-border/60">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80 block">
                  Filtered Leads
                </span>
                <span className="text-lg font-bold text-foreground tabular-nums">
                  {filteredBookings.length}
                </span>
              </div>
            </div>

            {/* Time Scope Toggle */}
            <div className="inline-flex p-1 bg-muted/60 border border-border/70 rounded-xl">
              <button
                type="button"
                onClick={() => setTimeScope('MONTH')}
                className={`py-1.5 px-3 rounded-lg text-xs font-medium transition-all cursor-pointer ${timeScope === 'MONTH'
                  ? 'bg-card text-emerald-400 font-bold shadow-sm border border-emerald-500/40'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                Month ({MONTH_NAMES[selectedMonth - 1] || selectedMonth} {selectedYear})
              </button>
              <button
                type="button"
                onClick={() => setTimeScope('ALL_TIME')}
                className={`py-1.5 px-3 rounded-lg text-xs font-medium transition-all cursor-pointer ${timeScope === 'ALL_TIME'
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

      {/* ── TOP SECTION TABS: CASH INFLOW | CASH OUTFLOW ── */}
      <div className="flex items-center justify-between flex-wrap gap-3 border-b border-border/70 pb-3">
        <div className="inline-flex p-1 bg-muted/50 border border-border/60 rounded-xl gap-1">
          <button
            type="button"
            onClick={() => { setActiveTab('INFLOW'); setSelectedChannel('All Channels'); }}
            className={`flex items-center gap-2 py-2 px-4 rounded-lg text-sm font-semibold transition-all cursor-pointer ${activeTab === 'INFLOW'
              ? 'bg-card text-foreground shadow-sm border border-border/80 text-emerald-400'
              : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
            <span>Cash Inflow</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 tabular-nums">
              {displayedInflowsCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('OUTFLOW'); setSelectedChannel('All Channels'); }}
            className={`flex items-center gap-2 py-2 px-4 rounded-lg text-sm font-semibold transition-all cursor-pointer ${activeTab === 'OUTFLOW'
              ? 'bg-card text-foreground shadow-sm border border-border/80 text-rose-400'
              : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            <ArrowUpRight className="w-4 h-4 text-rose-400" />
            <span>Cash Outflow</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 tabular-nums">
              {displayedOutflowsCount}
            </span>
          </button>
        </div>

        {activeTab === 'INFLOW' && (
          <button
            type="button"
            onClick={exportCSV}
            className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium border border-border/70 hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-all cursor-pointer shrink-0"
          >
            <Download className="w-3.5 h-3.5 text-primary" />
            <span>Export CSV</span>
          </button>
        )}
      </div>

      {/* ── FEATURE 3: SLEEK HORIZONTAL PAYMENT MODE FILTER STRIP WITH LEAD COUNTS ── */}
      {activeTab === 'INFLOW' && (
        <div className="rounded-xl border border-border/70 bg-card/75 p-3.5 space-y-2.5">
          <div className="flex items-center justify-between flex-wrap gap-2 px-1">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <CreditCard className="w-4 h-4 text-primary" />
              <span>Filter by Account</span>
            </div>

            {selectedChannel !== 'All Channels' && (
              <button
                type="button"
                onClick={() => setSelectedChannel('All Channels')}
                className="text-xs text-primary hover:underline font-semibold flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
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
                  className={`inline-flex items-center gap-2 py-1.5 px-3 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap border ${isSelected
                    ? 'bg-primary/15 text-primary border-primary shadow-sm shadow-primary/20 ring-1 ring-primary/40 font-bold'
                    : 'bg-muted/30 hover:bg-muted/70 text-muted-foreground hover:text-foreground border-border/60'
                    }`}
                >
                  <span>{ch}</span>
                  {/* Count badge */}
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-bold tabular-nums ${isSelected
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted-foreground/15 text-muted-foreground'
                      }`}
                  >
                    {stats.count}
                  </span>
                  {/* Total collected in mode */}
                  {stats.totalAmount > 0 && ch !== 'All Channels' && (
                    <span className="text-xs text-emerald-400 opacity-90 hidden md:inline tabular-nums">
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
              <span className="text-emerald-400 font-bold tabular-nums">
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
              activeTab === 'INFLOW'
                ? 'Search traveller, phone, booking ID, txn ID...'
                : 'Search booking ID, payment ID, supplier, category...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-muted/40 border border-border/70 rounded-xl h-10 pl-10 pr-9 text-sm text-foreground placeholder:text-xs placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary transition-all"
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
          {activeTab === 'INFLOW' && (
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-muted/40 border border-border/70 rounded-lg text-xs font-medium text-foreground py-1.5 px-2.5 focus:outline-none focus:border-primary cursor-pointer"
              >
                <option value="date_desc">Date: Newest First</option>
                <option value="date_asc">Date: Oldest First</option>
                <option value="amount_desc">Amount: High to Low</option>
                <option value="amount_asc">Amount: Low to High</option>
                <option value="name_asc">Traveller: A to Z</option>
              </select>
            </div>
          )}

          <span className="text-xs font-medium text-muted-foreground tabular-nums">
            {activeTab === 'INFLOW'
              ? `${filteredBookings.length} entries`
              : `${filteredSuppliers.length + filteredManual.filter(t => t.type === 'OUTFLOW').length} entries`}
          </span>
        </div>
      </div>

      {/* ── MAIN LEDGER TABLE ── */}
      {loading ? (
        <div className="p-16 rounded-2xl border border-border/60 bg-card/80 flex flex-col items-center justify-center space-y-3">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-muted-foreground/70 animate-pulse font-medium">
            Synchronizing live records from database...
          </p>
        </div>
      ) : activeTab === 'INFLOW' ? (
        /* ═══════════════════════════════════════════════════════
           CASH INFLOW TABLE — Booking ID | Payment ID | Date | Amount | Account | SS
           ═══════════════════════════════════════════════════════ */
        <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-xl shadow-xl overflow-hidden">
          {/* Table sub-header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
            <div className="flex items-center gap-2.5">
              <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-bold text-foreground">Customer Inflows</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 tabular-nums">
                {filteredBookings.length} records
              </span>
            </div>
          </div>

          {filteredBookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
              <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center">
                <ArrowDownLeft className="w-7 h-7 text-muted-foreground/40" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">No inflows found</p>
                <p className="text-xs text-muted-foreground">
                  {searchQuery ? `No results for "${searchQuery}"` : 'No customer inflows recorded for this selection'}
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[700px]">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/20">
                    {[
                      { label: 'Booking ID' },
                      { label: 'Payment ID' },
                      { label: 'Account' },
                      { label: 'Date' },
                      { label: 'Screenshot', align: 'center' },
                      { label: 'Amount', align: 'right' },
                    ].map(col => (
                      <th
                        key={col.label}
                        className={`px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-muted-foreground/80 whitespace-nowrap ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''}`}
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((b) => {
                    const id = b._id || b.paymentId;
                    const isExpanded = expandedIds.has(id);
                    const channel = normalizeMode(b.paymentMode);
                    const bmsUrl = b.bookingId ? `https://friskytrails-bms-op.vercel.app/id/${b.bookingId}` : null;

                    return (
                      <tr
                        key={id}
                        onClick={() => toggleExpand(id)}
                        className={`group border-b border-border/40 transition-colors duration-150 text-xs cursor-pointer ${isExpanded ? 'bg-emerald-500/5 border-emerald-500/20' : 'hover:bg-muted/30'}`}
                      >
                        {/* 1. Booking ID */}
                        <td className="px-4 py-3.5 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center gap-1.5">
                            {bmsUrl ? (
                              <a
                                href={bmsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/15 text-primary hover:bg-primary/25 border border-primary/30 text-xs font-semibold transition-all shadow-sm group/bms"
                                title={`Open ${b.bookingId} in BMS`}
                              >
                                <span>{b.bookingId}</span>
                                <ExternalLink className="w-3.5 h-3.5 transition-transform group-hover/bms:translate-x-0.5 group-hover/bms:-translate-y-0.5" />
                              </a>
                            ) : (
                              <span className="text-xs font-semibold text-muted-foreground/50">—</span>
                            )}
                            {b.bookingId && (
                              <button
                                type="button"
                                onClick={() => copyText(b.bookingId, `bk-${id}`)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground/50 hover:text-muted-foreground cursor-pointer p-0.5"
                                title="Copy Booking ID"
                              >
                                {copiedId === `bk-${id}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            )}
                          </div>
                        </td>

                        {/* 2. Payment ID */}
                        <td className="px-4 py-3.5 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-foreground font-medium tabular-nums">
                              {b.paymentId || '—'}
                            </span>
                            {b.paymentId && (
                              <button
                                type="button"
                                onClick={() => copyText(b.paymentId, `pay-${id}`)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground/50 hover:text-muted-foreground cursor-pointer p-0.5"
                                title="Copy Payment ID"
                              >
                                {copiedId === `pay-${id}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            )}
                          </div>
                        </td>

                        {/* 3. Account (Settlement Channel) */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-muted/80 border border-border/80 text-foreground">
                            {channel}
                          </span>
                        </td>

                        {/* 4. Date */}
                        <td className="px-4 py-3.5 whitespace-nowrap text-xs text-muted-foreground">
                          {formatDate(b.paymentDate)}
                        </td>

                        {/* 5. SS */}
                        <td className="px-4 py-3.5 whitespace-nowrap text-center" onClick={e => e.stopPropagation()}>
                          {b.attachment ? (
                            <button
                              type="button"
                              onClick={() => setActiveScreenshot({ url: b.attachment, title: `Booking ${b.bookingId || '—'} — Payment Proof` })}
                              className="inline-flex items-center gap-1 py-1 px-2.5 rounded-md bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30 text-xs font-semibold transition-all shadow-sm cursor-pointer"
                              title="Click to preview screenshot"
                            >
                              <ImageIcon className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <span className="text-xs text-muted-foreground/40">—</span>
                          )}
                        </td>

                        {/* 6. Amount */}
                        <td className="px-4 py-3.5 whitespace-nowrap text-right">
                          <span className="text-sm font-bold text-emerald-400 tabular-nums">
                            +₹{Number(b.amountPaid || 0).toLocaleString('en-IN')}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* ═══════════════════════════════════════════════════════
           TAB 2: CASH OUTFLOW — SUPPLIER + MANUAL EXPENSES
           Columns: Booking ID | Payment ID | Category | Date | Amount | Account | SS
           ═══════════════════════════════════════════════════════ */
        (() => {
          // Merge supplier outflows + manual outflows into one list
          const supplierRows = filteredSuppliers.map(s => ({
            _key: `sup-${s._id || s.supplierId}`,
            bookingId: s.bookingId || '—',
            paymentId: s.paymentId || '—',
            category: s.category || 'OTHERS',
            date: s.date,
            amount: s.amount || 0,
            account: normalizeMode(s.paymentMode),
            attachment: s.attachment || ''
          }));
          const manualOutRows = filteredManual
            .filter(t => t.type === 'OUTFLOW')
            .map(t => ({
              _key: `man-${t._id}`,
              bookingId: '—',
              paymentId: t.referenceNumber || '—',
              category: t.category || 'OTHERS',
              date: t.date,
              amount: t.amount || 0,
              account: normalizeMode(t.paymentMode),
              attachment: t.screenshot || ''
            }));
          const allOutflows = [...supplierRows, ...manualOutRows].sort(
            (a, b) => new Date(b.date) - new Date(a.date)
          );

          return allOutflows.length === 0 ? (
            <div className="p-16 rounded-2xl border border-border/60 bg-muted/20 text-center space-y-2">
              <ArrowUpRight className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-foreground">No Cash Outflows</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                No outflows recorded for this period or filter.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-xl shadow-xl overflow-hidden">
              {/* Table sub-header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
                <div className="flex items-center gap-2.5">
                  <ArrowUpRight className="w-4 h-4 text-rose-400" />
                  <span className="text-sm font-bold text-foreground">Cash Outflows</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 tabular-nums">
                    {allOutflows.length} records
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[700px]">
                  <thead>
                    <tr className="border-b border-border/50 bg-muted/20">
                      {[
                        { label: 'Booking ID' },
                        { label: 'Payment ID' },
                        { label: 'Category' },
                        { label: 'Account' },
                        { label: 'Date' },
                        { label: 'SS', align: 'center' },
                        { label: 'Amount', align: 'right' },
                      ].map(col => (
                        <th
                          key={col.label}
                          className={`px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-muted-foreground/80 whitespace-nowrap ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''}`}
                        >
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {allOutflows.map((row) => (
                      <tr
                        key={row._key}
                        className="group border-b border-border/40 hover:bg-muted/30 transition-colors duration-150 text-xs"
                      >
                        {/* 1. Booking ID */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {row.bookingId !== '—' ? (
                            <a
                              href={`https://friskytrails-bms-op.vercel.app/id/${row.bookingId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/15 text-primary hover:bg-primary/25 border border-primary/30 text-xs font-semibold transition-all"
                              title={`Open ${row.bookingId} in BMS`}
                            >
                              <span>{row.bookingId}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-xs font-semibold text-muted-foreground/50">—</span>
                          )}
                        </td>

                        {/* 2. Payment ID */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className="text-xs text-foreground font-medium tabular-nums">
                            {row.paymentId}
                          </span>
                        </td>

                        {/* 3. Category */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            {row.category}
                          </span>
                        </td>

                        {/* 4. Account */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-muted/80 border border-border/80 text-foreground">
                            {row.account}
                          </span>
                        </td>

                        {/* 5. Date */}
                        <td className="px-4 py-3.5 whitespace-nowrap text-xs text-muted-foreground">
                          {formatDate(row.date)}
                        </td>

                        {/* 6. SS */}
                        <td className="px-4 py-3.5 whitespace-nowrap text-center">
                          {row.attachment ? (
                            <button
                              type="button"
                              onClick={() => setActiveScreenshot({ url: row.attachment, title: `${row.category || 'Outflow'} — Payment Proof` })}
                              className="inline-flex items-center gap-1 py-1 px-2.5 rounded-md bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30 text-xs font-semibold transition-all shadow-sm cursor-pointer"
                              title="Click to preview screenshot"
                            >
                              <ImageIcon className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <span className="text-xs text-muted-foreground/40">—</span>
                          )}
                        </td>

                        {/* 7. Amount */}
                        <td className="px-4 py-3.5 whitespace-nowrap text-right">
                          <span className="text-sm font-bold text-rose-400 tabular-nums">
                            -₹{Number(row.amount).toLocaleString('en-IN')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()
      )}

      {/* ── Screenshot Preview Modal (shared between inflow & outflow) ── */}
      {activeScreenshot && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setActiveScreenshot(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-card border border-border/80 rounded-2xl p-4 shadow-2xl overflow-hidden flex flex-col items-center"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between pb-3 mb-3 border-b border-border/60">
              <span className="text-sm font-semibold text-foreground truncate max-w-md">
                {activeScreenshot.title || 'Payment Screenshot Proof'}
              </span>
              <button
                type="button"
                onClick={() => setActiveScreenshot(null)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <img
              src={activeScreenshot.url}
              alt="Payment Screenshot Proof"
              className="max-h-[72vh] w-auto object-contain rounded-lg shadow-md"
            />
            <div className="w-full flex justify-end gap-2 pt-3 mt-3 border-t border-border/60">
              <a
                href={activeScreenshot.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/20 text-primary text-xs font-bold hover:bg-primary/30 transition-all cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Full Size</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
