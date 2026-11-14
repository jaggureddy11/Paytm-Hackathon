import React from 'react';
import { 
  QrCode, 
  Banknote, 
  TrendingUp, 
  ArrowDownRight, 
  Wallet, 
  Package, 
  AlertTriangle, 
  Mic, 
  CheckCircle2, 
  Info,
  Calendar
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { tokens } from '../tokens';

export default function DashboardView({ 
  dashboardData, 
  t, 
  onTriggerClosing, 
  setActiveTab 
}) {
  const fin = dashboardData?.financials || {
    qr_collections: 1000.0,
    cash_collections: 0.0,
    total_collections: 1000.0,
    expenses: 0.0,
    stock_purchases: 0.0,
    estimated_balance: 1000.0,
    has_closed_today: false
  };

  const inv = dashboardData?.inventory || {
    total_products: 5,
    low_stock_count: 1,
    low_stock_items: []
  };

  const chartData = dashboardData?.weekly_chart || [];
  const insights = dashboardData?.insights || [];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner: Solid Navy, clear action, no decorative gradient slop (#30) */}
      <div className="rounded-xl bg-brand text-white p-6 shadow-card border border-blue-900">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1 max-w-xl">
            <div className="inline-flex items-center bg-blue-900/60 border border-blue-800 px-2.5 py-0.5 rounded-md text-xs font-medium text-blue-200">
              <span>{t.tagline}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              {t.dashboard.title}
            </h1>
            <p className="text-xs text-blue-200">
              {t.dashboard.subtitle}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={onTriggerClosing}
              className="px-4 py-2.5 rounded-lg bg-brand-light hover:bg-cyan-300 text-brand font-bold text-xs shadow-subtle flex items-center justify-center gap-2 transition-colors"
            >
              <Mic className="w-4 h-4 text-brand" />
              <span>{t.dashboard.triggerClosing}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Financial Overview Cards (#11: Data first, hero number on top, quiet label below) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Today's QR Collections */}
        <div className="bg-white rounded-xl p-5 border border-surface-border shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-ink-tertiary">
              {t.dashboard.qrCollections}
            </span>
            <span className="text-xs font-semibold bg-brand-muted text-brand px-2 py-0.5 rounded-md">
              Demo data
            </span>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-brand tabular-nums">
              ₹{fin.qr_collections.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs text-ink-tertiary">
            <QrCode className="w-3.5 h-3.5 text-brand-light" />
            <span>Paytm Soundbox QR</span>
          </div>
        </div>

        {/* Today's Cash Collections */}
        <div className="bg-white rounded-xl p-5 border border-surface-border shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-ink-tertiary">
              {t.dashboard.cashCollections}
            </span>
            <Banknote className="w-4 h-4 text-status-positive" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-ink-primary tabular-nums">
              ₹{fin.cash_collections.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs text-ink-tertiary">
            {fin.cash_collections > 0 ? (
              <span className="text-status-positive font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Reconciled
              </span>
            ) : (
              <span className="text-status-warning font-medium">Pending closing flow</span>
            )}
          </div>
        </div>

        {/* Total Collections */}
        <div className="bg-white rounded-xl p-5 border border-surface-border shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-ink-tertiary">
              {t.dashboard.totalCollections}
            </span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-status-positive tabular-nums">
              ₹{fin.total_collections.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="mt-2 text-xs text-ink-tertiary">
            QR (₹{fin.qr_collections}) + Cash (₹{fin.cash_collections})
          </div>
        </div>

        {/* Recorded Expenses */}
        <div className="bg-white rounded-xl p-5 border border-surface-border shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-ink-tertiary">
              {t.dashboard.expenses}
            </span>
            <ArrowDownRight className="w-4 h-4 text-status-critical" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-status-critical tabular-nums">
              ₹{fin.expenses.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="mt-2 text-xs text-ink-tertiary">
            Electricity & utilities
          </div>
        </div>

        {/* Estimated Balance (Neutral card with clear label, no gradient) */}
        <div className="bg-white rounded-xl p-5 border border-blue-200 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-brand">
              {t.dashboard.estimatedBalance}
            </span>
            <Wallet className="w-4 h-4 text-brand" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-brand tabular-nums">
              ₹{fin.estimated_balance.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="mt-2 text-xs text-ink-tertiary leading-tight">
            Collections minus outflows (not verified profit)
          </div>
        </div>
      </div>

      {/* Main Grid: Weekly Chart & AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Performance Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-surface-border shadow-card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-ink-primary">
                {t.dashboard.weeklyTrend}
              </h3>
              <p className="text-xs text-ink-tertiary">
                Daily comparison of QR collections, cash, and business expenses
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-ink-tertiary bg-surface-subtle px-2.5 py-1 rounded-md border border-surface-border">
              <Calendar className="w-3.5 h-3.5" />
              <span>Last 7 days</span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={tokens.colors.chartGrid} />
                <XAxis dataKey="day" stroke={tokens.colors.chartAxis} fontSize={11} tickLine={false} />
                <YAxis stroke={tokens.colors.chartAxis} fontSize={11} tickLine={false} tickFormatter={(val) => `₹${val}`} />
                <Tooltip 
                  formatter={(val, name) => [`₹${val}`, name === 'qr' ? 'QR collection' : name === 'cash' ? 'Cash collection' : 'Expense']}
                  contentStyle={tokens.chartTooltipStyle}
                />
                <Legend iconType="circle" />
                <Bar dataKey="qr" name="QR collections" fill={tokens.colors.brand} radius={[4, 4, 0, 0]} />
                <Bar dataKey="cash" name="Cash collections" fill={tokens.colors.brandLight} radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Expenses" fill={tokens.colors.chartExpense} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Business Insights & Inventory Alerts */}
        <div className="space-y-6">
          {/* AI Insights Card */}
          <div className="bg-white rounded-xl p-6 border border-surface-border shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-md bg-brand-muted text-brand flex items-center justify-center">
                <Info className="w-3.5 h-3.5 text-brand" />
              </div>
              <h3 className="text-sm font-bold text-ink-primary">
                {t.dashboard.aiInsights}
              </h3>
            </div>

            <div className="space-y-3">
              {insights.map((item, idx) => (
                <div 
                  key={idx}
                  className="p-3 rounded-lg bg-surface-subtle border border-surface-border"
                >
                  <div className="flex items-center gap-2">
                    {item.type === 'positive' && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
                    {item.type === 'warning' && <span className="w-2 h-2 rounded-full bg-amber-500" />}
                    {item.type === 'neutral' && <span className="w-2 h-2 rounded-full bg-blue-500" />}
                    {item.type === 'info' && <span className="w-2 h-2 rounded-full bg-slate-500" />}
                    <h4 className="text-xs font-semibold text-ink-primary">{item.title}</h4>
                  </div>
                  <p className="text-xs text-ink-secondary mt-1 leading-normal">
                    {item.message}
                  </p>
                  <p className="text-xs text-brand font-medium mt-1 flex items-center gap-1">
                    <Info className="w-3 h-3 text-brand-light" /> {item.action}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Inventory Summary Widget */}
          <div className="bg-white rounded-xl p-5 border border-surface-border shadow-card">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-brand" />
                <h4 className="text-xs font-bold text-ink-primary">Inventory status</h4>
              </div>
              <button 
                onClick={() => setActiveTab('inventory')}
                className="text-xs font-medium text-brand hover:underline"
              >
                View catalog &gt;
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="p-3 bg-surface-subtle rounded-lg border border-surface-border">
                <span className="text-xs text-ink-tertiary font-medium">Total items</span>
                <p className="text-lg font-bold text-ink-primary mt-0.5">{inv.total_products}</p>
              </div>
              <div className="p-3 bg-status-warningBg rounded-lg border border-status-warningBorder">
                <span className="text-xs text-status-warning font-medium">Low stock</span>
                <p className="text-lg font-bold text-status-warning mt-0.5">{inv.low_stock_count}</p>
              </div>
            </div>

            {inv.low_stock_items && inv.low_stock_items.length > 0 && (
              <div className="p-2.5 bg-status-warningBg rounded-lg border border-status-warningBorder text-xs text-status-warning flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">{inv.low_stock_items[0].name}</span> has {inv.low_stock_items[0].remaining_stock} {inv.low_stock_items[0].unit} left (threshold: {inv.low_stock_items[0].min_threshold}).
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
