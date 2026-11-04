import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  RefreshCw,
  Percent,
  Calendar,
  Package,
  BadgeIndianRupee,
  Building2,
  Wallet,
  AlertCircle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Scale
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

function formatINRFull(n) {
  if (n === null || n === undefined) return '₹0';
  const num = Math.round(Number(n));
  const abs = Math.abs(num);
  const formatted = abs.toLocaleString('en-IN');
  return num < 0 ? `-₹${formatted}` : `₹${formatted}`;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// ─── Animated Number Component ────────────────────────────────────────────────

function AnimatedNumber({ value, prefix = '₹', duration = 800 }) {
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
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration]);

  const abs = Math.abs(display);
  let formatted;
  if (abs >= 1_00_00_000) formatted = `${prefix}${(abs / 1_00_00_000).toFixed(2)}Cr`;
  else if (abs >= 1_00_000) formatted = `${prefix}${(abs / 1_00_00_000 >= 1 ? (abs / 1_00_00_000).toFixed(2) + 'Cr' : (abs / 1_00_000).toFixed(2) + 'L')}`;
  else formatted = `${prefix}${abs.toLocaleString('en-IN')}`;

  return <span>{display < 0 ? `-${formatted}` : formatted}</span>;
}

// ─── Modern Metric Card ───────────────────────────────────────────────────────

function KpiCard({ label, value, icon: Icon, colorClass, bgGlow, badge, subtext, rawAmount }) {
  return (
    <Box
      className="relative rounded-2xl border border-border/70 bg-card/85 backdrop-blur-xl p-5 md:p-6 flex flex-col justify-between shadow-xl glow-card transition-all duration-300 hover:scale-[1.015] hover:border-border overflow-hidden"
    >
      {/* Ambient background glow */}
      <div className={`absolute -top-8 -right-8 w-32 h-32 rounded-full blur-3xl opacity-20 pointer-events-none ${bgGlow}`} />

      <div className="space-y-3 relative z-10">
        <HStack className="items-center justify-between">
          <Text className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground/80">
            {label}
          </Text>
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${bgGlow} bg-opacity-20 border border-white/10 shrink-0`}>
            <Icon className={`w-4.5 h-4.5 ${colorClass}`} />
          </div>
        </HStack>

        <div
          title={formatINRFull(rawAmount !== undefined ? rawAmount : value)}
          className={`text-2xl md:text-3xl font-black tracking-tight ${colorClass} tabular-nums cursor-default`}
        >
          <AnimatedNumber value={value} />
        </div>
      </div>

      <div className="pt-3 border-t border-border/40 mt-3 flex items-center justify-between gap-2 relative z-10">
        {badge && (
          <div className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.className}`}>
            {badge.icon && <badge.icon className="w-3 h-3" />}
            <span>{badge.text}</span>
          </div>
        )}
        {subtext && (
          <Text className="text-[11px] text-muted-foreground/70 truncate">{subtext}</Text>
        )}
      </div>
    </Box>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProfitMarginPage({ selectedMonth: propMonth, selectedYear: propYear }) {
  const navigate = useNavigate();
  const outletCtx = useOutletContext() || {};
  const selectedMonth = propMonth || outletCtx.selectedMonth || 10;
  const selectedYear = propYear || outletCtx.selectedYear || 2026;

  // Status Filter: 'Confirmed' (Default) | 'ALL' | 'Cancelled'
  const [statusFilter, setStatusFilter] = useState('Confirmed');
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [summaryError, setSummaryError] = useState(false);
  const latestRequestRef = useRef(0);
  const [bookingFromDate, setBookingFromDate] = useState('');
  const [bookingToDate, setBookingToDate] = useState('');
  const [serviceFromDate, setServiceFromDate] = useState('');
  const [serviceToDate, setServiceToDate] = useState('');
  const [appliedDates, setAppliedDates] = useState({ bookingFromDate: '', bookingToDate: '', serviceFromDate: '', serviceToDate: '' });

  const monthName = MONTH_NAMES[Number(selectedMonth) - 1] || `Month ${selectedMonth}`;
  const hasAppliedBookingRange = Boolean(appliedDates.bookingFromDate || appliedDates.bookingToDate);
  const periodLabel = hasAppliedBookingRange ? 'the booking date range' : `${monthName} ${selectedYear}`;

  // ── Fetch summary according to Booking Date (createdAt) in selected month ──
  const fetchMarginSummary = useCallback(async () => {
    const requestId = ++latestRequestRef.current;
    setLoading(true);
    setSummary(null);
    setSummaryError(false);
    try {
      const params = new URLSearchParams();
      // The explicit booking date range overrides month selection on the server.
      if (appliedDates.bookingFromDate || appliedDates.bookingToDate) {
        if (appliedDates.bookingFromDate) params.set('fromDate', appliedDates.bookingFromDate);
        if (appliedDates.bookingToDate) params.set('toDate', appliedDates.bookingToDate);
      } else {
        params.set('month', String(selectedMonth));
        params.set('year', String(selectedYear));
      }
      if (appliedDates.serviceFromDate) params.set('serviceStartDate', appliedDates.serviceFromDate);
      if (appliedDates.serviceToDate) params.set('serviceEndDate', appliedDates.serviceToDate);
      if (statusFilter && statusFilter !== 'ALL') {
        params.set('status', statusFilter);
      }
      // Only request summary data with limit=1 to save bandwidth since table entries are removed
      params.set('limit', '1');

      const data = await apiFetch(`/transactions/profit-margins?${params.toString()}`);
      if (requestId !== latestRequestRef.current) return;
      setSummary(data.summary || null);
    } catch (err) {
      if (requestId !== latestRequestRef.current) return;
      setSummary(null);
      setSummaryError(true);
      console.error('Failed to load margin data:', err);
      toast.error('Failed to load profit and loss margins');
    } finally {
      if (requestId === latestRequestRef.current) setLoading(false);
    }
  }, [selectedMonth, selectedYear, statusFilter, appliedDates]);

  useEffect(() => {
    fetchMarginSummary();
  }, [fetchMarginSummary]);

  // Derived metrics
  const totalPackageCost = summary?.totalPackageCost || 0;
  const totalProfitMargin = summary?.totalProfitMargin || 0;
  const totalSupplierCost = summary?.totalSupplierCost ?? Math.max(0, totalPackageCost - totalProfitMargin);
  const totalPaidAmount = summary?.totalPaidAmount || 0;
  const totalDueAmount = summary?.totalDueAmount || 0;
  const totalGstAmount = summary?.totalGstAmount || 0;
  const totalCount = summary?.totalCount || 0;
  const overallMarginPercent = summary?.overallMarginPercent ?? (totalPackageCost > 0 ? +((totalProfitMargin / totalPackageCost) * 100).toFixed(1) : 0);
  const isProfit = totalProfitMargin >= 0;

  const avgMarginPerBooking = totalCount > 0 ? Math.round(totalProfitMargin / totalCount) : 0;
  const supplierCostRatio = totalPackageCost > 0 ? Math.round((totalSupplierCost / totalPackageCost) * 100) : 0;
  const collectionRatio = totalPackageCost > 0 ? Math.round((totalPaidAmount / totalPackageCost) * 100) : 0;
  const dueRatio = totalPackageCost > 0 ? Math.round((totalDueAmount / totalPackageCost) * 100) : 0;

  const profitableCount = summary?.profitableCount || 0;
  const lossCount = summary?.lossCount || 0;
  const breakEvenCount = summary?.breakEvenCount || Math.max(0, totalCount - profitableCount - lossCount);

  const applyDateFilters = () => {
    if (bookingFromDate && bookingToDate && bookingFromDate > bookingToDate) {
      toast.error('Booking start date must be on or before the end date');
      return;
    }
    if (serviceFromDate && serviceToDate && serviceFromDate > serviceToDate) {
      toast.error('Service start date must be on or before the end date');
      return;
    }
    setAppliedDates({ bookingFromDate, bookingToDate, serviceFromDate, serviceToDate });
  };

  return (
    <Box className="w-full max-w-[1680px] mx-auto space-y-7 pb-20">
      {/* ── TOP EXECUTIVE BANNER ── */}
      <div className="rounded-2xl border border-border/80 bg-card/90 backdrop-blur-xl p-6 shadow-xl relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          {/* Left: Navigation, Title & Scope */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground bg-muted/40 hover:bg-muted border border-border/60 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-primary" />
                <span>Dashboard</span>
              </button>

              <div className="inline-flex items-center gap-1.5 py-1 px-3 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                <Calendar className="w-3.5 h-3.5" />
                <span>{bookingFromDate || bookingToDate ? 'Booking Date Range' : `Booking Date Filter: ${monthName} ${selectedYear}`}</span>
              </div>
            </div>

            <div>
              <Heading size="lg" bold className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20">
                  <TrendingUp className="w-4.5 h-4.5 text-white" />
                </span>
                Profit &amp; Loss Margin Summary
              </Heading>
              <Text className="text-xs text-muted-foreground/80 mt-1">
                Aggregated profit, package revenue, and supplier obligations for the selected booking and service dates
              </Text>
            </div>
          </div>

          {/* Right: Status Filter & Refresh */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Status Segmented Control */}
            <div className="inline-flex p-1 bg-muted/50 border border-border/70 rounded-xl gap-1">
              {[
                { label: 'Confirmed', value: 'Confirmed' },
                { label: 'All Statuses', value: 'ALL' },
                { label: 'Cancelled', value: 'Cancelled' }
              ].map((st) => (
                <button
                  key={st.value}
                  type="button"
                  onClick={() => setStatusFilter(st.value)}
                  className={`py-1.5 px-3.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    statusFilter === st.value
                      ? 'bg-card text-foreground font-bold shadow-sm border border-border/80'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={fetchMarginSummary}
              disabled={loading}
              className="p-2.5 rounded-xl border border-border/70 bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer shadow-sm disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-primary' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <Box className="rounded-2xl border border-border/70 bg-card/80 p-5 shadow-lg">
        <div className="flex flex-col gap-4">
          <div>
            <Heading size="sm" bold className="text-base">Filter by dates</Heading>
            <Text className="text-xs text-muted-foreground mt-1">Choose booking dates, service dates, or use the month selector.</Text>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[['Booking from', bookingFromDate, setBookingFromDate], ['Booking to', bookingToDate, setBookingToDate], ['Service from', serviceFromDate, setServiceFromDate], ['Service to', serviceToDate, setServiceToDate]].map(([label, value, setter]) => (
              <label key={label} className="space-y-1.5 text-xs font-semibold text-muted-foreground">
                <span>{label}</span>
                <input type="date" value={value} onChange={(event) => setter(event.target.value)} className="w-full rounded-lg border border-border/70 bg-background px-3 py-2.5 text-sm text-foreground" />
              </label>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={applyDateFilters} disabled={loading} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90 disabled:opacity-50">Apply filters</button>
            {(bookingFromDate || bookingToDate || serviceFromDate || serviceToDate || appliedDates.bookingFromDate || appliedDates.bookingToDate || appliedDates.serviceFromDate || appliedDates.serviceToDate) && (
              <button type="button" onClick={() => { setBookingFromDate(''); setBookingToDate(''); setServiceFromDate(''); setServiceToDate(''); setAppliedDates({ bookingFromDate: '', bookingToDate: '', serviceFromDate: '', serviceToDate: '' }); }} className="text-xs font-semibold text-primary hover:underline">Clear date filters</button>
            )}
          </div>
        </div>
      </Box>

      {/* ── KPI CARDS GRID ── */}
      {loading && !summary ? (
        <div className="p-20 rounded-2xl border border-border/60 bg-card/80 flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="w-7 h-7 text-primary animate-spin" />
          <Text className="text-sm font-medium text-muted-foreground">Calculating booking margins for {monthName} {selectedYear}...</Text>
        </div>
      ) : summaryError ? (
        <div role="alert" className="p-10 rounded-2xl border border-rose-500/30 bg-rose-500/5 text-center">
          <Text className="text-sm font-semibold text-rose-400">Profit and loss summary is unavailable. Try refreshing or adjusting the filters.</Text>
        </div>
      ) : summary ? (
        <>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 lg:gap-6">
          {/* 1. Total Package Cost */}
          <KpiCard
            label="Total Package Cost"
            value={totalPackageCost}
            icon={Package}
            colorClass="text-orange-400"
            bgGlow="bg-orange-500"
            badge={{
              text: `${totalCount} Bookings`,
              icon: Package,
              className: 'bg-orange-500/10 border-orange-500/25 text-orange-400'
            }}
            subtext={`Gross package value for ${periodLabel}`}
          />

          {/* 2. Total Margin */}
          <KpiCard
            label="Total Margin"
            value={totalProfitMargin}
            icon={isProfit ? TrendingUp : TrendingDown}
            colorClass={isProfit ? 'text-emerald-400' : 'text-rose-400'}
            bgGlow={isProfit ? 'bg-emerald-500' : 'bg-rose-500'}
            badge={{
              text: `${isProfit ? '+' : ''}${overallMarginPercent}% Margin`,
              icon: Percent,
              className: isProfit
                ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/25 text-rose-400'
            }}
            subtext="Net profit earnings after vendor costs"
          />

          {/* 3. GST */}
          <KpiCard
            label="GST"
            value={totalGstAmount}
            icon={BadgeIndianRupee}
            colorClass="text-sky-400"
            bgGlow="bg-sky-500"
            badge={{
              text: 'Tax Component',
              icon: BadgeIndianRupee,
              className: 'bg-sky-500/10 border-sky-500/25 text-sky-400'
            }}
            subtext={`GST liability for ${periodLabel}`}
          />

          <KpiCard
            label="Supplier Cost"
            value={totalSupplierCost}
            icon={Building2}
            colorClass="text-violet-400"
            bgGlow="bg-violet-500"
            badge={{
              text: `${supplierCostRatio}% of package value`,
              icon: Building2,
              className: 'bg-violet-500/10 border-violet-500/25 text-violet-400'
            }}
            subtext="Estimated supplier obligations"
          />

          <Box className="rounded-2xl border border-border/70 bg-card/85 backdrop-blur-xl p-5 md:p-6 shadow-xl">
            <Text className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground/80">Booking Outcomes</Text>
            <div className="mt-5 grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-center">
                <CheckCircle2 className="w-4 h-4 mx-auto text-emerald-400" />
                <div className="mt-2 text-xl font-black tabular-nums text-emerald-400">{profitableCount}</div>
                <Text className="mt-1 text-[10px] text-muted-foreground">Profitable</Text>
              </div>
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-center">
                <XCircle className="w-4 h-4 mx-auto text-rose-400" />
                <div className="mt-2 text-xl font-black tabular-nums text-rose-400">{lossCount}</div>
                <Text className="mt-1 text-[10px] text-muted-foreground">Loss</Text>
              </div>
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-center">
                <Scale className="w-4 h-4 mx-auto text-amber-400" />
                <div className="mt-2 text-xl font-black tabular-nums text-amber-400">{breakEvenCount}</div>
                <Text className="mt-1 text-[10px] text-muted-foreground">Break-even</Text>
              </div>
            </div>
          </Box>
        </div>
        </>
      ) : null}
    </Box>
  );
}
