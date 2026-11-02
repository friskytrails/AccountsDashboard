import { useState } from 'react';
import {
  Building2,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Scale,
  CheckCircle2,
  ExternalLink,
  Filter,
  Check
} from 'lucide-react';
import { Card, Box, Heading, Text, Badge, BadgeText, VStack, HStack, Button, ButtonText } from '@/components/ui';

function formatRupee(amount) {
  if (amount === undefined || amount === null) return '₹0';
  return '₹' + Number(amount).toLocaleString('en-IN');
}

export default function AccountWiseSummary({
  accountWiseBreakdown = [],
  selectedAccount = 'ALL',
  onSelectAccount,
  loading = false
}) {
  if (loading) {
    return (
      <Card className="p-6 rounded-2xl bg-card/80 border border-border/70 shadow-xl">
        <div className="h-6 w-64 bg-muted/60 animate-pulse rounded-md mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-44 rounded-xl bg-muted/30 border border-border/40 animate-pulse" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 rounded-2xl bg-card/90 border border-border/80 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/15 text-primary border border-primary/30 flex items-center justify-center shadow-sm">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <Heading size="md" bold className="text-foreground tracking-tight">
                Account Balances & Cash Flow
              </Heading>
              <Text size="xs" className="text-muted-foreground">
                Overview of the 6 bank accounts: Inflow, Outflow, Net Cash Flow, and Closing Balance
              </Text>
            </div>
          </div>
        </div>

        {selectedAccount !== 'ALL' && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSelectAccount('ALL')}
            className="text-xs h-8 border-primary/40 text-primary hover:bg-primary/10 self-start sm:self-center"
          >
            <ButtonText>Show All Accounts</ButtonText>
          </Button>
        )}
      </div>

      {/* 6 Account Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accountWiseBreakdown.map((item) => {
          const isSelected = selectedAccount === item.account;
          const isPositiveNet = item.net >= 0;

          return (
            <div
              key={item.account}
              onClick={() => onSelectAccount(isSelected ? 'ALL' : item.account)}
              className={`p-4 rounded-xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
                isSelected
                  ? 'bg-primary/10 border-primary ring-2 ring-primary/40 shadow-lg shadow-primary/15'
                  : 'bg-muted/20 hover:bg-muted/40 border-border/70 hover:border-border'
              }`}
            >
              {/* Account Header */}
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md bg-muted/70 text-foreground border border-border/60 flex items-center justify-center font-bold text-xs">
                    {item.account.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <span className="font-bold text-sm text-foreground block">
                      {item.account}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      Bank Account
                    </span>
                  </div>
                </div>

                {isSelected ? (
                  <Badge variant="success" size="sm" className="gap-1">
                    <Check className="w-3 h-3" />
                    <BadgeText>Active Filter</BadgeText>
                  </Badge>
                ) : (
                  <span className="text-[11px] text-primary hover:underline font-semibold tabular-nums">
                    Filter by Account →
                  </span>
                )}
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-3 py-3 text-xs">
                {/* Inflow */}
                <div className="bg-card/70 p-2.5 rounded-lg border border-border/60">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block flex items-center gap-1">
                    <ArrowDownLeft className="w-3 h-3 text-emerald-400" />
                    Inflow
                  </span>
                  <span className="text-sm font-extrabold text-emerald-400 block pt-1 tabular-nums">
                    +{formatRupee(item.inflow)}
                  </span>
                </div>

                {/* Outflow */}
                <div className="bg-card/70 p-2.5 rounded-lg border border-border/60">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block flex items-center gap-1">
                    <ArrowUpRight className="w-3 h-3 text-rose-400" />
                    Outflow
                  </span>
                  <span className="text-sm font-extrabold text-rose-400 block pt-1 tabular-nums">
                    -{formatRupee(item.outflow)}
                  </span>
                </div>

                {/* Net */}
                <div className="bg-card/70 p-2.5 rounded-lg border border-border/60">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block flex items-center gap-1">
                    <Scale className="w-3 h-3 text-teal-400" />
                    Net Cash Flow
                  </span>
                  <span
                    className={`text-sm font-extrabold block pt-1 tabular-nums ${
                      isPositiveNet ? 'text-teal-400' : 'text-rose-400'
                    }`}
                  >
                    {isPositiveNet ? '+' : ''}{formatRupee(item.net)}
                  </span>
                </div>

                {/* Closing Balance */}
                <div className="bg-card/70 p-2.5 rounded-lg border border-border/60">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block flex items-center gap-1">
                    <Wallet className="w-3 h-3 text-indigo-400" />
                    Closing Balance
                  </span>
                  <span className="text-sm font-extrabold text-indigo-300 block pt-1 tabular-nums">
                    {formatRupee(item.closing)}
                  </span>
                </div>
              </div>

              {/* Footer hint */}
              <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground tabular-nums">
                <span>Opening: {formatRupee(item.opening)}</span>
                <span className="text-primary font-semibold">
                  {isSelected ? 'Currently Filtering' : 'Click to select'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
