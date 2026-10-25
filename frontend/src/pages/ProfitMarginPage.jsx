import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  Search,
  RotateCcw,
  Eye,
  RefreshCw,
  FileText,
  AlertCircle,
  Percent,
  Copy,
  Check,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Calendar,
  User,
  Package,
  BadgeIndianRupee,
  Filter,
  Download
} from 'lucide-react';
import { apiFetch } from '../utils/api';
import toast from 'react-hot-toast';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading
} from '@/components/ui';

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatINR(n) {
  if (n === null || n === undefined) return '₹0';
  const abs = Math.abs(Math.round(Number(n)));
  if (abs >= 1_00_00_000) return `₹${(abs / 1_00_00_000).toFixed(2)}Cr`;
  if (abs >= 1_00_000) return `₹${(abs / 1_00_000).toFixed(2)}L`;
  return `₹${abs.toLocaleString('en-IN')}`;
}

function formatINRFull(n) {
  if (n === null || n === undefined) return '₹0';
  const num = Math.round(Number(n));
  const abs = Math.abs(num);
  const formatted = abs.toLocaleString('en-IN');
  return num < 0 ? `-₹${formatted}` : `₹${formatted}`;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateInput(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function getInitials(name = '') {
  if (!name || !name.trim()) return 'FT';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2 && parts[0] && parts[1]) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.trim().slice(0, 2).toUpperCase();
}

const AVATAR_COLORS = [
  'from-emerald-500 to-teal-600',
  'from-sky-500 to-blue-600',
  'from-violet-500 to-purple-600',
  'from-orange-500 to-amber-600',
  'from-rose-500 to-pink-600',
  'from-cyan-500 to-sky-600',
];
function avatarColor(name = '') {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

// ─── Animated Number ───────────────────────────────────────────────────────────

function AnimatedNumber({ value, prefix = '₹', duration = 900 }) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef(null);
  const startRef = useRef(null);
  const startValRef = useRef(display);

  useEffect(() => {
    startValRef.current = display;
    startRef.current = null;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const target = Math.round(Number(value) || 0);
    const from = startValRef.current;

    function step(ts) {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (target - from) * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    }
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  const abs = Math.abs(display);
  let formatted;
  if (abs >= 1_00_00_000) formatted = `${prefix}${(abs / 1_00_00_000).toFixed(2)}Cr`;
  else if (abs >= 1_00_000) formatted = `${prefix}${(abs / 1_00_000).toFixed(2)}L`;
  else formatted = `${prefix}${abs.toLocaleString('en-IN')}`;

  return <span>{display < 0 ? `-${formatted}` : formatted}</span>;
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, icon: Icon, colorClass, bgGlow, badge, subtext }) {
  return (
    <Box
      className={`relative rounded-2xl border border-border/60 bg-card/80 backdrop-blur-xl px-6 py-5 flex flex-col gap-3 shadow-xl overflow-hidden glow-card transition-all duration-300 hover:scale-[1.015]`}
    >
      {/* Ambient glow blob */}
      <div className={`absolute -top-6 -right-6 w-28 h-28 rounded-full blur-3xl opacity-20 ${bgGlow}`} />

      <HStack className="items-center justify-between">
        <Text className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground/80">
          {label}
        </Text>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${bgGlow} bg-opacity-20 border border-white/10`}>
          <Icon className={`w-4.5 h-4.5 ${colorClass}`} />
        </div>
      </HStack>

      <div
        title={formatINRFull(value)}
        className={`text-3xl font-black tracking-tight ${colorClass} tabular-nums cursor-default`}
      >
        <AnimatedNumber value={value} />
      </div>

      {badge && (
        <div className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border w-fit ${badge.className}`}>
          {badge.icon && <badge.icon className="w-3 h-3" />}
          {badge.text}
        </div>
      )}

      {subtext && (
        <Text className="text-[11px] text-muted-foreground/70 -mt-1">{subtext}</Text>
      )}
    </Box>
  );
}

// ─── Sortable Column Header ────────────────────────────────────────────────────

function SortHeader({ label, field, sortBy, onSort }) {
  const isActive = sortBy.field === field;
  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      className="flex items-center gap-1 group hover:text-foreground transition-colors cursor-pointer"
    >
      <span>{label}</span>
      <span className="text-muted-foreground/50 group-hover:text-muted-foreground transition-colors">
        {isActive ? (
          sortBy.dir === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />
        ) : (
          <ChevronsUpDown className="w-3 h-3" />
        )}
      </span>
    </button>
  );
}

// ─── Booking Row ──────────────────────────────────────────────────────────────

function BookingRow({ booking, copiedId, onCopy }) {
  const margin = Number(booking.profitMargin || 0);
  const pct = Number(booking.marginPercentage || 0);
  const isProfit = margin > 0;
  const isLoss = margin < 0;
  const due = Number(booking.dueAmount || 0);

  const marginColorClass = isProfit
    ? 'text-emerald-400'
    : isLoss
    ? 'text-rose-400'
    : 'text-slate-400';

  const marginBgClass = isProfit
    ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
    : isLoss
    ? 'bg-rose-500/10 border-rose-500/25 text-rose-400'
    : 'bg-slate-500/10 border-slate-500/20 text-slate-400';

  const tripStatusColors = {
    'Trip Completed': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
    'Fulfillment Done': 'bg-sky-500/10 text-sky-400 border-sky-500/25',
    'Under Process': 'bg-amber-500/10 text-amber-400 border-amber-500/25',
    'Pending': 'bg-orange-500/10 text-orange-400 border-orange-500/25',
    'Postponed': 'bg-violet-500/10 text-violet-400 border-violet-500/25',
    'Cash Refund Done': 'bg-rose-500/10 text-rose-400 border-rose-500/25',
    'No Refund': 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  };

  return (
    <tr className="group border-b border-border/40 hover:bg-muted/30 transition-colors duration-150">
      {/* Booking ID */}
      <td className="px-4 py-3.5 whitespace-nowrap">
        <HStack space="xs" className="items-center">
          <span className="text-[13px] font-black text-orange-400 tracking-wide font-mono">
            {booking.bookingId}
          </span>
          <button
            type="button"
            onClick={() => onCopy(booking.bookingId)}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground/50 hover:text-muted-foreground cursor-pointer"
          >
            {copiedId === booking.bookingId
              ? <Check className="w-3.5 h-3.5 text-emerald-400" />
              : <Copy className="w-3.5 h-3.5" />
            }
          </button>
        </HStack>
      </td>

      {/* Booking Date */}
      <td className="px-4 py-3.5 whitespace-nowrap">
        <HStack space="xs" className="items-center text-muted-foreground">
          <Calendar className="w-3.5 h-3.5 shrink-0" />
          <span className="text-[12px]">{formatDate(booking.createdAt)}</span>
        </HStack>
      </td>

      {/* Client */}
      <td className="px-4 py-3.5">
        <HStack space="sm" className="items-center">
          <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${avatarColor(booking.travellerName)} flex items-center justify-center text-white text-[9px] font-black shrink-0`}>
            {getInitials(booking.travellerName)}
          </div>
          <span className="text-[13px] font-semibold text-foreground whitespace-nowrap">
            {booking.travellerName || '—'}
          </span>
        </HStack>
      </td>

      {/* Package */}
      <td className="px-4 py-3.5 max-w-[180px]">
        <span className="text-[12px] text-muted-foreground/90 line-clamp-2 leading-snug">
          {booking.packageName || '—'}
        </span>
      </td>

      {/* Total */}
      <td className="px-4 py-3.5 whitespace-nowrap text-right">
        <span className="text-[13px] font-bold text-sky-300 tabular-nums">
          {formatINRFull(booking.totalAmount)}
        </span>
      </td>

      {/* Paid */}
      <td className="px-4 py-3.5 whitespace-nowrap text-right">
        <span className="text-[13px] font-bold text-emerald-400 tabular-nums">
          {formatINRFull(booking.paidAmount)}
        </span>
      </td>

      {/* Due */}
      <td className="px-4 py-3.5 whitespace-nowrap text-right">
        <span className={`text-[13px] font-bold tabular-nums ${due > 0 ? 'text-rose-400' : 'text-slate-500'}`}>
          {formatINRFull(booking.dueAmount)}
        </span>
      </td>

      {/* Profit / Loss Margin — the star column */}
      <td className="px-4 py-3.5 whitespace-nowrap">
        <VStack space="2xs">
          <span className={`text-[13px] font-black tabular-nums ${marginColorClass}`}>
            {isProfit ? '+' : ''}{formatINRFull(margin)}
          </span>
          <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold border w-fit ${marginBgClass}`}>
            {isProfit ? <TrendingUp className="w-2.5 h-2.5" /> : isLoss ? <TrendingDown className="w-2.5 h-2.5" /> : null}
            {isProfit ? '+' : ''}{pct.toFixed(1)}% Margin
          </span>
        </VStack>
      </td>

      {/* Trip Dates */}
      <td className="px-4 py-3.5 whitespace-nowrap">
        <VStack space="2xs">
          <span className="text-[11px] text-sky-400 font-semibold">{formatDate(booking.startDate)}</span>
          <span className="text-[11px] text-sky-300/60">{formatDate(booking.endDate)}</span>
        </VStack>
      </td>

      {/* Booking Status */}
      <td className="px-4 py-3.5 whitespace-nowrap">
        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${
          booking.status === 'Confirmed'
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
            : 'bg-rose-500/10 text-rose-400 border-rose-500/25'
        }`}>
          {booking.status || '—'}
        </span>
      </td>

      {/* Trip Status */}
      <td className="px-4 py-3.5 whitespace-nowrap">
        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${
          tripStatusColors[booking.tripStatus] || 'bg-slate-500/10 text-slate-400 border-slate-500/20'
        }`}>
          {booking.tripStatus || '—'}
        </span>
      </td>
    </tr>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const DEFAULT_FILTERS = {
  bookingId: '',
  status: 'Confirmed',
  createdBy: 'ALL',
  fromDate: '',
  toDate: '',
  serviceStartDate: '',
  serviceEndDate: '',
  phone: ''
};

export default function ProfitMarginPage() {
  const navigate = useNavigate();

  // Filters state
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [pendingFilters, setPendingFilters] = useState(DEFAULT_FILTERS);

  // Data state
  const [summary, setSummary] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, totalPages: 1, total: 0 });
  const [creators, setCreators] = useState([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [creatorsLoading, setCreatorsLoading] = useState(true);
  const [hasFetched, setHasFetched] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [sortBy, setSortBy] = useState({ field: 'createdAt', dir: 'desc' });

  // ── Load creators dropdown ──
  useEffect(() => {
    setCreatorsLoading(true);
    apiFetch('/transactions/booking-creators')
      .then(data => setCreators(data.creators || []))
      .catch(() => {})
      .finally(() => setCreatorsLoading(false));
  }, []);

  // ── Fetch data ──
  const fetchData = useCallback(async (overrideFilters = null, viewAll = false) => {
    setLoading(true);
    const f = overrideFilters || filters;
    const params = new URLSearchParams();
    if (f.bookingId.trim()) params.set('bookingId', f.bookingId.trim());
    if (f.status && f.status !== 'ALL') params.set('status', f.status);
    if (f.createdBy && f.createdBy !== 'ALL') params.set('createdBy', f.createdBy);
    if (f.fromDate) params.set('fromDate', f.fromDate);
    if (f.toDate) params.set('toDate', f.toDate);
    if (f.serviceStartDate) params.set('serviceStartDate', f.serviceStartDate);
    if (f.serviceEndDate) params.set('serviceEndDate', f.serviceEndDate);
    if (f.phone.trim()) params.set('phone', f.phone.trim());
    if (viewAll) params.set('viewAll', 'true');
    params.set('limit', '200');

    try {
      const data = await apiFetch(`/transactions/profit-margins?${params.toString()}`);
      setSummary(data.summary || null);
      setBookings(data.bookings || []);
      setPagination(data.pagination || { page: 1, limit: 200, totalPages: 1, total: 0 });
      setHasFetched(true);
    } catch (err) {
      toast.error('Failed to load booking margins');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // ── Handle sort ──
  const handleSort = useCallback((field) => {
    setSortBy(prev => ({
      field,
      dir: prev.field === field && prev.dir === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  // ── Sort bookings client-side ──
  const sortedBookings = [...bookings].sort((a, b) => {
    const dir = sortBy.dir === 'asc' ? 1 : -1;
    if (sortBy.field === 'bookingId') return dir * (a.bookingId || '').localeCompare(b.bookingId || '');
    if (sortBy.field === 'createdAt') return dir * (new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
    if (sortBy.field === 'travellerName') return dir * (a.travellerName || '').localeCompare(b.travellerName || '');
    if (sortBy.field === 'totalAmount') return dir * ((a.totalAmount || 0) - (b.totalAmount || 0));
    if (sortBy.field === 'paidAmount') return dir * ((a.paidAmount || 0) - (b.paidAmount || 0));
    if (sortBy.field === 'dueAmount') return dir * ((a.dueAmount || 0) - (b.dueAmount || 0));
    if (sortBy.field === 'profitMargin') return dir * ((a.profitMargin || 0) - (b.profitMargin || 0));
    if (sortBy.field === 'marginPercentage') return dir * ((a.marginPercentage || 0) - (b.marginPercentage || 0));
    if (sortBy.field === 'startDate') return dir * (new Date(a.startDate || 0) - new Date(b.startDate || 0));
    return 0;
  });

  // ── Copy to clipboard ──
  const handleCopy = useCallback((text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    toast.success(`Copied: ${text}`, { id: 'copy', duration: 1500 });
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  // ── Filter input change ──
  const handleChange = (key, val) => {
    setPendingFilters(prev => ({ ...prev, [key]: val }));
  };

  const handleGetData = () => {
    setFilters(pendingFilters);
    fetchData(pendingFilters, false);
  };

  const handleViewAll = () => {
    const f = {
      ...pendingFilters,
      fromDate: '',
      toDate: '',
      serviceStartDate: '',
      serviceEndDate: ''
    };
    setPendingFilters(f);
    setFilters(f);
    fetchData(f, true);
  };

  const handleReset = () => {
    setPendingFilters(DEFAULT_FILTERS);
    setFilters(DEFAULT_FILTERS);
    setSummary(null);
    setBookings([]);
    setHasFetched(false);
  };

  // ── CSV Export ──
  const exportCSV = () => {
    if (!sortedBookings.length) return;
    const headers = ['Booking ID', 'Booking Date', 'Client Name', 'Package', 'Total (₹)', 'Paid (₹)', 'Due (₹)', 'Profit Margin (₹)', 'Margin %', 'Trip Start', 'Trip End', 'Booking Status', 'Trip Status', 'Created By'];
    const rows = sortedBookings.map(b => [
      b.bookingId,
      formatDate(b.createdAt),
      b.travellerName || '',
      b.packageName || '',
      b.totalAmount,
      b.paidAmount,
      b.dueAmount,
      b.profitMargin,
      Number(b.marginPercentage || 0).toFixed(2) + '%',
      formatDate(b.startDate),
      formatDate(b.endDate),
      b.status || '',
      b.tripStatus || '',
      b.creatorName || ''
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `profit-margin-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported!');
  };

  // ─── KPI Card Configs ────────────────────────────────────────────────────────

  const overallPct = summary?.overallMarginPercent ?? 0;
  const isOverallProfit = overallPct >= 0;

  const kpiCards = summary ? [
    {
      label: 'Total Package Cost',
      value: summary.totalPackageCost,
      icon: FileText,
      colorClass: 'text-orange-400',
      bgGlow: 'bg-orange-500',
      subtext: `Across ${summary.totalCount} booking${summary.totalCount !== 1 ? 's' : ''}`
    },
    {
      label: 'Total Paid Amount',
      value: summary.totalPaidAmount,
      icon: RefreshCw,
      colorClass: 'text-emerald-400',
      bgGlow: 'bg-emerald-500',
      subtext: 'Client payments collected'
    },
    {
      label: 'Total Due Amount',
      value: summary.totalDueAmount,
      icon: AlertCircle,
      colorClass: 'text-rose-400',
      bgGlow: 'bg-rose-500',
      subtext: 'Outstanding receivables'
    },
    {
      label: 'Total Profit Margin',
      value: summary.totalProfitMargin,
      icon: isOverallProfit ? TrendingUp : TrendingDown,
      colorClass: isOverallProfit ? 'text-emerald-300' : 'text-rose-400',
      bgGlow: isOverallProfit ? 'bg-emerald-500' : 'bg-rose-500',
      badge: {
        text: `${isOverallProfit ? '+' : ''}${overallPct.toFixed(1)}% Overall Margin`,
        icon: Percent,
        className: isOverallProfit
          ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
          : 'bg-rose-500/10 border-rose-500/25 text-rose-400'
      },
      subtext: 'Net profit after supplier B2B cost'
    }
  ] : [];

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <Box className="space-y-7">
      {/* ── Page Header ── */}
      <HStack className="items-center justify-between">
        <HStack space="md" className="items-center">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-9 h-9 rounded-xl border border-border/60 bg-card/80 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-border transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <VStack space="2xs">
            <Heading size="lg" bold className="text-foreground tracking-tight text-xl flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0">
                <TrendingUp className="w-4 h-4 text-white" />
              </span>
              Profit &amp; Loss Margin Ledger
            </Heading>
            <Text className="text-xs text-muted-foreground/80">
              Booking-level profit, margin %, and financial performance overview
            </Text>
          </VStack>
        </HStack>

        {hasFetched && sortedBookings.length > 0 && (
          <button
            type="button"
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border/60 bg-card/80 text-muted-foreground hover:text-foreground hover:border-border text-xs font-semibold transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        )}
      </HStack>

      {/* ── Filter Card ── */}
      <Box className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-xl p-6 shadow-xl glow-card">
        {/* Header */}
        <HStack space="sm" className="items-center mb-5">
          <div className="w-7 h-7 rounded-lg bg-orange-500/15 border border-orange-500/25 flex items-center justify-center">
            <Filter className="w-3.5 h-3.5 text-orange-400" />
          </div>
          <Text className="text-sm font-bold text-foreground/90">Find Bookings</Text>
          <Text className="text-xs text-muted-foreground/60">(Fill any filter to search)</Text>
        </HStack>

        {/* Row 1: Booking ID | Status | Created By */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <VStack space="xs">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">Booking ID / Txn ID</label>
            <input
              id="filter-booking-id"
              type="text"
              value={pendingFilters.bookingId}
              onChange={e => handleChange('bookingId', e.target.value)}
              placeholder="FTXXXXXX or Txn / Ref ID"
              className="w-full h-10 px-3.5 rounded-xl bg-muted/50 border border-border/60 text-foreground text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all font-mono"
            />
          </VStack>

          <VStack space="xs">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">Booking Status</label>
            <select
              id="filter-status"
              value={pendingFilters.status}
              onChange={e => handleChange('status', e.target.value)}
              className="w-full h-10 px-3.5 rounded-xl bg-muted/50 border border-border/60 text-foreground text-sm focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all cursor-pointer appearance-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </VStack>

          <VStack space="xs">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">Booking Created By</label>
            <select
              id="filter-creator"
              value={pendingFilters.createdBy}
              onChange={e => handleChange('createdBy', e.target.value)}
              disabled={creatorsLoading}
              className="w-full h-10 px-3.5 rounded-xl bg-muted/50 border border-border/60 text-foreground text-sm focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all cursor-pointer appearance-none disabled:opacity-50"
            >
              <option value="ALL">All Creators</option>
              {creators.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </VStack>
        </div>

        {/* Row 2: From Date | To Date | Phone */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <VStack space="xs">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">Booking Date (From)</label>
            <input
              id="filter-from-date"
              type="date"
              value={pendingFilters.fromDate}
              onChange={e => handleChange('fromDate', e.target.value)}
              className="w-full h-10 px-3.5 rounded-xl bg-muted/50 border border-border/60 text-foreground text-sm focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all [color-scheme:dark]"
            />
          </VStack>

          <VStack space="xs">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">Booking Date (To)</label>
            <input
              id="filter-to-date"
              type="date"
              value={pendingFilters.toDate}
              onChange={e => handleChange('toDate', e.target.value)}
              className="w-full h-10 px-3.5 rounded-xl bg-muted/50 border border-border/60 text-foreground text-sm focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all [color-scheme:dark]"
            />
          </VStack>

          <VStack space="xs">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">Phone Number</label>
            <input
              id="filter-phone"
              type="text"
              value={pendingFilters.phone}
              onChange={e => handleChange('phone', e.target.value)}
              placeholder="xxx-xxx-xxxx"
              className="w-full h-10 px-3.5 rounded-xl bg-muted/50 border border-border/60 text-foreground text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all"
            />
          </VStack>
        </div>

        {/* Row 3: Service Start | Service End */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
          <VStack space="xs">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">Service Start Date</label>
            <input
              id="filter-service-start"
              type="date"
              value={pendingFilters.serviceStartDate}
              onChange={e => handleChange('serviceStartDate', e.target.value)}
              className="w-full h-10 px-3.5 rounded-xl bg-muted/50 border border-border/60 text-foreground text-sm focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all [color-scheme:dark]"
            />
          </VStack>

          <VStack space="xs">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">Service End Date</label>
            <input
              id="filter-service-end"
              type="date"
              value={pendingFilters.serviceEndDate}
              onChange={e => handleChange('serviceEndDate', e.target.value)}
              className="w-full h-10 px-3.5 rounded-xl bg-muted/50 border border-border/60 text-foreground text-sm focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all [color-scheme:dark]"
            />
          </VStack>

          <div /> {/* spacer */}
        </div>

        {/* Actions row */}
        <HStack className="items-center justify-between">
          <button
            type="button"
            onClick={handleReset}
            className="text-xs text-orange-400 hover:text-orange-300 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Filters
          </button>

          <HStack space="sm" className="items-center">
            <button
              id="btn-view-all"
              type="button"
              onClick={handleViewAll}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border/70 bg-muted/50 text-foreground text-xs font-bold hover:bg-muted hover:border-border transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Eye className="w-3.5 h-3.5" />
              View All
            </button>

            <button
              id="btn-get-data"
              type="button"
              onClick={handleGetData}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-black shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed active:scale-95"
            >
              {loading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Search className="w-3.5 h-3.5" />
              )}
              {loading ? 'Loading...' : 'Get Data'}
            </button>
          </HStack>
        </HStack>
      </Box>

      {/* ── KPI Summary Cards ── */}
      {hasFetched && summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {kpiCards.map((card) => (
            <KpiCard key={card.label} {...card} />
          ))}
        </div>
      )}

      {/* ── Bookings Table ── */}
      {hasFetched && (
        <Box className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-xl shadow-xl glow-card overflow-hidden">
          {/* Table Header */}
          <HStack className="items-center justify-between px-5 py-4 border-b border-border/50">
            <HStack space="sm" className="items-center">
              <Package className="w-4 h-4 text-muted-foreground" />
              <Text className="text-sm font-bold text-foreground">
                Booking Margins
              </Text>
              {summary && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-primary/10 text-primary border border-primary/20">
                  {pagination.total} records
                </span>
              )}
            </HStack>
            <Text className="text-[11px] text-muted-foreground/60">
              Click column headers to sort
            </Text>
          </HStack>

          {/* Loading state */}
          {loading && (
            <div className="flex items-center justify-center py-20 gap-3">
              <RefreshCw className="w-5 h-5 text-primary animate-spin" />
              <Text className="text-sm text-muted-foreground">Fetching booking data...</Text>
            </div>
          )}

          {/* Empty state */}
          {!loading && sortedBookings.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
              <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center">
                <BadgeIndianRupee className="w-7 h-7 text-muted-foreground/50" />
              </div>
              <VStack space="2xs" className="items-center">
                <Text className="text-sm font-bold text-foreground/60">No bookings found</Text>
                <Text className="text-xs text-muted-foreground/50">Try adjusting your filters or click "View All"</Text>
              </VStack>
            </div>
          )}

          {/* Table */}
          {!loading && sortedBookings.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[1100px]">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/20">
                    {[
                      { label: 'Booking ID', field: 'bookingId' },
                      { label: 'Booking Date', field: 'createdAt' },
                      { label: 'Client Name', field: 'travellerName' },
                      { label: 'Package Name', field: null },
                      { label: 'Total', field: 'totalAmount', align: 'right' },
                      { label: 'Paid', field: 'paidAmount', align: 'right' },
                      { label: 'Due', field: 'dueAmount', align: 'right' },
                      { label: 'Profit / Loss Margin', field: 'profitMargin' },
                      { label: 'Trip Dates', field: 'startDate' },
                      { label: 'Booking Status', field: null },
                      { label: 'Trip Status', field: null },
                    ].map(col => (
                      <th
                        key={col.label}
                        className={`px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ${col.align === 'right' ? 'text-right' : ''}`}
                      >
                        {col.field ? (
                          <SortHeader label={col.label} field={col.field} sortBy={sortBy} onSort={handleSort} />
                        ) : (
                          col.label
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedBookings.map((b, idx) => (
                    <BookingRow
                      key={`${b.bookingId}-${idx}`}
                      booking={b}
                      copiedId={copiedId}
                      onCopy={handleCopy}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination hint */}
          {!loading && pagination.total > pagination.limit && (
            <div className="px-5 py-3 border-t border-border/40 flex items-center justify-between">
              <Text className="text-xs text-muted-foreground/60">
                Showing {sortedBookings.length} of {pagination.total} bookings
              </Text>
              <Text className="text-xs text-muted-foreground/50">
                Increase limit or apply filters to narrow results
              </Text>
            </div>
          )}
        </Box>
      )}

      {/* ── Initial empty state ── */}
      {!hasFetched && !loading && (
        <Box className="rounded-2xl border border-dashed border-border/40 bg-card/40 p-16 flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/20 flex items-center justify-center">
            <TrendingUp className="w-8 h-8 text-emerald-400/70" />
          </div>
          <VStack space="xs" className="items-center">
            <Heading size="md" bold className="text-foreground/70">
              Profit &amp; Loss Ledger
            </Heading>
            <Text className="text-sm text-muted-foreground/60 max-w-sm">
              Apply filters above and click <strong className="text-orange-400">"Get Data"</strong> to load booking margins, or click <strong className="text-foreground/80">"View All"</strong> to see all bookings.
            </Text>
          </VStack>
        </Box>
      )}
    </Box>
  );
}
