import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Calendar, 
  ChevronRight, 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  QrCode, 
  Banknote, 
  ArrowDownRight, 
  Package, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  Edit2, 
  X, 
  Info,
  Clock,
  ShoppingBag,
  Mic
} from 'lucide-react';
import { tokens } from '../tokens';

export default function RecordsView({ t, onRefresh }) {
  const [daysList, setDaysList] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [dailyReport, setDailyReport] = useState(null);
  const [dateFilter, setDateFilter] = useState('all'); // 'all', 'today', 'week', 'month', 'custom'
  const [customDate, setCustomDate] = useState('');
  const [loadingDays, setLoadingDays] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);

  // Manual transaction modal
  const [showModal, setShowModal] = useState(false);
  const [editingTx, setEditingTx] = useState(null);
  const [txFormData, setTxFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().split(' ')[0],
    type: 'cash_collection',
    category: 'sales',
    amount: '',
    description: '',
    payment_method: 'Cash'
  });

  // Fetch list of days
  const fetchDaysList = async () => {
    setLoadingDays(true);
    try {
      let url = `/api/records/days?filter=${dateFilter}`;
      if (dateFilter === 'custom' && customDate) {
        url += `&custom_date=${customDate}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setDaysList(data);
      }
    } catch (err) {
      console.error('Error fetching days list:', err);
    } finally {
      setLoadingDays(false);
    }
  };

  // Fetch detailed day report
  const fetchDailyReport = async (dateStr) => {
    setLoadingReport(true);
    try {
      const res = await fetch(`/api/records/day/${dateStr}`);
      if (res.ok) {
        const data = await res.json();
        setDailyReport(data);
      }
    } catch (err) {
      console.error('Error fetching daily report:', err);
    } finally {
      setLoadingReport(false);
    }
  };

  useEffect(() => {
    fetchDaysList();
  }, [dateFilter, customDate]);

  useEffect(() => {
    if (selectedDate) {
      fetchDailyReport(selectedDate);
    } else {
      setDailyReport(null);
    }
  }, [selectedDate]);

  // Handle transaction delete
  const handleDeleteTx = async (txId) => {
    if (!window.confirm('Are you sure you want to delete this transaction entry?')) return;
    try {
      const res = await fetch(`/api/records/transaction/${txId}`, { method: 'DELETE' });
      if (res.ok) {
        if (selectedDate) fetchDailyReport(selectedDate);
        fetchDaysList();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error('Failed to delete transaction:', err);
    }
  };

  // Handle transaction save (create or update)
  const handleSaveTx = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        date: txFormData.date,
        time: txFormData.time || new Date().toTimeString().split(' ')[0],
        type: txFormData.type,
        category: txFormData.category,
        amount: parseFloat(txFormData.amount) || 0,
        description: txFormData.description,
        payment_method: txFormData.payment_method,
        source: 'Manual',
        confirmed: 1
      };

      let res;
      if (editingTx) {
        res = await fetch(`/api/records/transaction/${editingTx.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch('/api/records/transaction', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        setShowModal(false);
        setEditingTx(null);
        if (selectedDate) fetchDailyReport(selectedDate);
        fetchDaysList();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error('Error saving transaction:', err);
    }
  };

  const openAddModal = (dateStr) => {
    setEditingTx(null);
    setTxFormData({
      date: dateStr || selectedDate || new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0],
      type: 'cash_collection',
      category: 'sales',
      amount: '',
      description: '',
      payment_method: 'Cash'
    });
    setShowModal(true);
  };

  const openEditModal = (tx) => {
    setEditingTx(tx);
    setTxFormData({
      date: tx.date,
      time: tx.time,
      type: tx.type,
      category: tx.category,
      amount: tx.amount,
      description: tx.description,
      payment_method: tx.payment_method || 'Cash'
    });
    setShowModal(true);
  };

  // =========================================================================
  // VIEW 2: DAILY BUSINESS REPORT FOR A SPECIFIC DATE
  // =========================================================================
  if (selectedDate && dailyReport) {
    const s = dailyReport.summary;
    const comp = dailyReport.yesterday_comparison;

    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Navigation Breadcrumb / Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-surface-border shadow-card">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedDate(null)}
              className="p-2 rounded-lg bg-surface-subtle hover:bg-slate-200 text-ink-primary flex items-center gap-1.5 text-xs font-semibold transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-brand" />
              <span>Back to Dates</span>
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-ink-primary">
                  Daily Business Report
                </h2>
                {dailyReport.is_today && (
                  <span className="text-xs font-bold bg-blue-100 text-brand px-2 py-0.5 rounded-full">
                    Today
                  </span>
                )}
                {dailyReport.is_yesterday && (
                  <span className="text-xs font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                    Yesterday
                  </span>
                )}
              </div>
              <p className="text-xs text-ink-tertiary">
                {dailyReport.formatted_date} ({dailyReport.day_name})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => openAddModal(selectedDate)}
              className="px-3 py-2 bg-brand text-white text-xs font-bold rounded-lg shadow-subtle hover:bg-brand-dark transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 text-brand-light" />
              <span>Add Transaction</span>
            </button>
          </div>
        </div>

        {/* PROMINENT TOTAL SALES HERO CARD */}
        <div className="bg-brand text-white rounded-xl p-6 shadow-card border border-blue-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-200 uppercase tracking-wider">
              <ShoppingBag className="w-4 h-4 text-brand-light" />
              <span>Total Sales for {dailyReport.formatted_date}</span>
            </div>
            <div className="mt-2 flex items-baseline gap-3">
              <h1 className="text-3xl font-extrabold text-white tracking-tight tabular-nums">
                ₹{s.total_sales.toLocaleString('en-IN')}
              </h1>
              <span className="text-xs text-blue-200">
                (QR ₹{s.qr_sales.toLocaleString('en-IN')} + Cash ₹{s.cash_sales.toLocaleString('en-IN')})
              </span>
            </div>
            <p className="text-xs text-blue-200 mt-1">
              Recorded through {dailyReport.sales_breakdown.total_sales_count} sales transactions
            </p>
          </div>

          {/* Quick status badge */}
          <div className="bg-blue-950/70 border border-blue-800 p-3.5 rounded-lg text-xs md:text-right">
            <span className="text-blue-200 block">Day Closing Status</span>
            <span className="text-sm font-bold text-brand-light flex items-center md:justify-end gap-1 mt-0.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Reconciled with SQLite
            </span>
          </div>
        </div>

        {/* 6 SUMMARY CARDS GRID */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* 1. QR Sales */}
          <div className="bg-white p-4 rounded-xl border border-surface-border shadow-subtle">
            <div className="flex items-center justify-between text-brand mb-1">
              <span className="text-xs font-semibold text-ink-secondary">QR Sales</span>
              <QrCode className="w-4 h-4 text-brand" />
            </div>
            <p className="text-lg font-bold text-ink-primary tabular-nums">
              ₹{s.qr_sales.toLocaleString('en-IN')}
            </p>
            <span className="text-xs text-ink-tertiary">
              {dailyReport.sales_breakdown.qr_count} transactions
            </span>
          </div>

          {/* 2. Cash Sales */}
          <div className="bg-white p-4 rounded-xl border border-surface-border shadow-subtle">
            <div className="flex items-center justify-between text-emerald-600 mb-1">
              <span className="text-xs font-semibold text-ink-secondary">Cash Sales</span>
              <Banknote className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-lg font-bold text-ink-primary tabular-nums">
              ₹{s.cash_sales.toLocaleString('en-IN')}
            </p>
            <span className="text-xs text-ink-tertiary">
              {dailyReport.sales_breakdown.cash_count} entries
            </span>
          </div>

          {/* 3. Total Sales */}
          <div className="bg-brand-muted p-4 rounded-xl border border-blue-200 shadow-subtle">
            <div className="flex items-center justify-between text-brand mb-1">
              <span className="text-xs font-semibold text-brand">Total Sales</span>
              <ShoppingBag className="w-4 h-4 text-brand" />
            </div>
            <p className="text-lg font-bold text-brand tabular-nums">
              ₹{s.total_sales.toLocaleString('en-IN')}
            </p>
            <span className="text-xs text-ink-tertiary">QR + Cash</span>
          </div>

          {/* 4. Expenses */}
          <div className="bg-white p-4 rounded-xl border border-surface-border shadow-subtle">
            <div className="flex items-center justify-between text-amber-600 mb-1">
              <span className="text-xs font-semibold text-ink-secondary">Expenses</span>
              <ArrowDownRight className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-lg font-bold text-ink-primary tabular-nums">
              ₹{s.expenses.toLocaleString('en-IN')}
            </p>
            <span className="text-xs text-ink-tertiary">
              {dailyReport.expenses_list.length} recorded
            </span>
          </div>

          {/* 5. Stock Purchases */}
          <div className="bg-white p-4 rounded-xl border border-surface-border shadow-subtle">
            <div className="flex items-center justify-between text-purple-600 mb-1">
              <span className="text-xs font-semibold text-ink-secondary">Stock Purchases</span>
              <Package className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-lg font-bold text-ink-primary tabular-nums">
              ₹{s.stock_purchases.toLocaleString('en-IN')}
            </p>
            <span className="text-xs text-ink-tertiary">
              {dailyReport.stock_purchases_list.length} purchases
            </span>
          </div>

          {/* 6. Estimated Profit / Operating Result */}
          <div className="bg-white p-4 rounded-xl border border-surface-border shadow-subtle">
            <div className="flex items-center justify-between text-ink-secondary mb-1">
              <span className="text-xs font-semibold text-ink-secondary truncate" title="Sales after recorded expenses">
                Net Result
              </span>
              <Info className="w-4 h-4 text-ink-tertiary" />
            </div>
            <p className="text-lg font-bold text-ink-primary tabular-nums">
              ₹{s.sales_after_expenses.toLocaleString('en-IN')}
            </p>
            <span className="text-xs text-ink-tertiary block truncate" title="Sales minus expenses">
              After expenses
            </span>
          </div>
        </div>

        {/* PROFIT / LOSS EXPLANATION CALLOUT */}
        <div className="p-3.5 bg-surface-subtle border border-surface-border rounded-xl flex items-start gap-3">
          <Info className="w-4 h-4 text-brand flex-shrink-0 mt-0.5" />
          <div className="text-xs text-ink-secondary leading-normal">
            <strong className="text-ink-primary">Financial Accounting Note: </strong>
            Sales after recorded expenses is <strong>₹{s.sales_after_expenses.toLocaleString('en-IN')}</strong>. 
            This is not verified profit because full Cost of Goods Sold (COGS) is not yet factored. Stock purchases are recorded as inventory assets rather than automatic expense deductions.
          </div>
        </div>

        {/* COMPARED WITH YESTERDAY SECTION */}
        <div className="bg-white rounded-xl p-5 border border-surface-border shadow-card">
          <div className="flex items-center justify-between mb-3 border-b border-surface-border pb-3">
            <div>
              <h3 className="text-sm font-bold text-ink-primary flex items-center gap-2">
                <span>Compared with Yesterday</span>
                {comp.has_yesterday && (
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                    comp.trend === 'up'
                      ? 'bg-status-positiveBg text-status-positive border border-status-positiveBorder'
                      : comp.trend === 'down'
                      ? 'bg-status-criticalBg text-status-critical border border-status-criticalBorder'
                      : 'bg-surface-subtle text-ink-secondary'
                  }`}>
                    {comp.trend === 'up' && <TrendingUp className="w-3.5 h-3.5" />}
                    {comp.trend === 'down' && <TrendingDown className="w-3.5 h-3.5" />}
                    {comp.trend === 'same' && <Minus className="w-3.5 h-3.5" />}
                    <span>{comp.message}</span>
                  </span>
                )}
              </h3>
              <p className="text-xs text-ink-tertiary mt-0.5">
                {comp.has_yesterday 
                  ? `Comparing ${dailyReport.formatted_date} with preceding calendar day (${comp.yesterday_date})`
                  : 'Comparing with immediately preceding calendar day'}
              </p>
            </div>
          </div>

          {comp.has_yesterday ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Total Sales Comparison */}
              <div className="p-4 bg-surface-canvas rounded-lg border border-surface-border">
                <span className="text-xs text-ink-tertiary block">Total Sales Comparison</span>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-lg font-bold text-ink-primary tabular-nums">
                    ₹{comp.today_total_sales.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs text-ink-tertiary">
                    vs ₹{comp.yesterday_total_sales.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="mt-2 text-xs font-semibold">
                  <span className={comp.diff_amount >= 0 ? 'text-status-positive' : 'text-status-critical'}>
                    {comp.diff_amount >= 0 ? '+' : ''}₹{comp.diff_amount.toLocaleString('en-IN')} ({comp.pct_change > 0 ? '+' : ''}{comp.pct_change}%)
                  </span>
                </div>
              </div>

              {/* QR Sales Comparison */}
              <div className="p-4 bg-surface-canvas rounded-lg border border-surface-border">
                <span className="text-xs text-ink-tertiary block">QR Sales Comparison</span>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-lg font-bold text-brand tabular-nums">
                    ₹{comp.qr_diff.today.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs text-ink-tertiary">
                    vs ₹{comp.qr_diff.yesterday.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="mt-2 text-xs font-semibold">
                  <span className={comp.qr_diff.diff >= 0 ? 'text-status-positive' : 'text-status-critical'}>
                    {comp.qr_diff.diff >= 0 ? '+' : ''}₹{comp.qr_diff.diff.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Cash Sales Comparison */}
              <div className="p-4 bg-surface-canvas rounded-lg border border-surface-border">
                <span className="text-xs text-ink-tertiary block">Cash Sales Comparison</span>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-lg font-bold text-emerald-800 tabular-nums">
                    ₹{comp.cash_diff.today.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs text-ink-tertiary">
                    vs ₹{comp.cash_diff.yesterday.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="mt-2 text-xs font-semibold">
                  <span className={comp.cash_diff.diff >= 0 ? 'text-status-positive' : 'text-status-critical'}>
                    {comp.cash_diff.diff >= 0 ? '+' : ''}₹{comp.cash_diff.diff.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 bg-surface-canvas rounded-lg border border-dashed border-surface-border">
              <Info className="w-5 h-5 text-ink-tertiary mx-auto mb-1.5" />
              <p className="text-xs font-semibold text-ink-secondary">
                No records available for comparison.
              </p>
              <p className="text-xs text-ink-tertiary mt-0.5">
                The preceding calendar day does not contain recorded sales transactions.
              </p>
            </div>
          )}
        </div>

        {/* DETAILED DAILY BREAKDOWN: SALES, EXPENSES & STOCK */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Sales Breakdown */}
          <div className="bg-white rounded-xl p-5 border border-surface-border shadow-card">
            <h3 className="text-xs font-bold text-ink-primary flex items-center gap-2 mb-3">
              <ShoppingBag className="w-4 h-4 text-brand" />
              <span>Sales Breakdown</span>
            </h3>

            <div className="space-y-2.5">
              <div className="p-3 bg-surface-canvas rounded-lg border border-surface-border flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-brand">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-ink-primary">Paytm Soundbox QR</h4>
                    <p className="text-xs text-ink-tertiary">{dailyReport.sales_breakdown.qr_count} transactions</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-brand tabular-nums">
                  ₹{dailyReport.sales_breakdown.qr_total.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="p-3 bg-surface-canvas rounded-lg border border-surface-border flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-800">
                    <Banknote className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-ink-primary">Cash Register</h4>
                    <p className="text-xs text-ink-tertiary">{dailyReport.sales_breakdown.cash_count} entries</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-emerald-800 tabular-nums">
                  ₹{dailyReport.sales_breakdown.cash_total.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Expenses Breakdown */}
          <div className="bg-white rounded-xl p-5 border border-surface-border shadow-card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-ink-primary flex items-center gap-2">
                <ArrowDownRight className="w-4 h-4 text-amber-600" />
                <span>Recorded Expenses</span>
              </h3>
              <span className="text-xs font-bold text-amber-800 tabular-nums">
                Total: ₹{s.expenses.toLocaleString('en-IN')}
              </span>
            </div>

            {dailyReport.expenses_list.length === 0 ? (
              <div className="text-center py-6 text-xs text-ink-tertiary bg-surface-canvas rounded-lg border border-dashed border-surface-border">
                No expenses recorded for this date.
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {dailyReport.expenses_list.map((exp) => (
                  <div
                    key={exp.id}
                    className="p-2.5 bg-surface-canvas rounded-lg border border-surface-border flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-semibold text-ink-primary block">{exp.description}</span>
                      <span className="text-ink-tertiary text-xs flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-ink-tertiary" /> {exp.time} • {exp.category}
                      </span>
                    </div>
                    <span className="font-bold text-amber-800 tabular-nums">
                      -₹{exp.amount.toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Stock Purchases Section */}
        {dailyReport.stock_purchases_list.length > 0 && (
          <div className="bg-white rounded-xl p-5 border border-surface-border shadow-card">
            <h3 className="text-xs font-bold text-ink-primary flex items-center gap-2 mb-3">
              <Package className="w-4 h-4 text-purple-600" />
              <span>Stock Purchases</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {dailyReport.stock_purchases_list.map((stk) => (
                <div
                  key={stk.id}
                  className="p-3 bg-surface-canvas rounded-lg border border-surface-border flex items-center justify-between text-xs"
                >
                  <div>
                    <h4 className="font-bold text-ink-primary">{stk.product_name}</h4>
                    <p className="text-ink-tertiary">
                      Quantity: {stk.quantity} • Time: {stk.time}
                    </p>
                  </div>
                  <span className="font-bold text-purple-800 tabular-nums">
                    ₹{stk.amount.toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ALL TRANSACTIONS TABLE FOR THIS DATE */}
        <div className="bg-white rounded-xl border border-surface-border shadow-card overflow-hidden">
          <div className="p-4 bg-surface-subtle border-b border-surface-border flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-ink-primary flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand" />
                <span>All Transactions ({dailyReport.transactions.length})</span>
              </h3>
              <p className="text-xs text-ink-tertiary">
                Chronological list of all events stored in SQLite for {dailyReport.formatted_date}
              </p>
            </div>
            <button
              onClick={() => openAddModal(selectedDate)}
              className="px-2.5 py-1 bg-white border border-surface-border text-ink-primary hover:text-brand text-xs font-semibold rounded-md shadow-subtle flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add Entry
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-ink-secondary border-b border-surface-border font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Time</th>
                  <th className="py-2.5 px-4">Type</th>
                  <th className="py-2.5 px-4">Description</th>
                  <th className="py-2.5 px-4">Method</th>
                  <th className="py-2.5 px-4">Source</th>
                  <th className="py-2.5 px-4 text-right">Amount</th>
                  <th className="py-2.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {dailyReport.transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-surface-canvas transition-colors">
                    <td className="py-3 px-4 font-medium text-ink-tertiary whitespace-nowrap">
                      {tx.time}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        tx.type === 'qr_collection'
                          ? 'bg-blue-100 text-brand'
                          : tx.type === 'cash_collection'
                          ? 'bg-emerald-100 text-emerald-800'
                          : tx.type === 'expense'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {tx.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-ink-primary max-w-xs truncate">
                      {tx.description}
                    </td>
                    <td className="py-3 px-4 text-ink-secondary">
                      {tx.payment_method}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] font-medium bg-slate-100 text-ink-secondary px-1.5 py-0.5 rounded">
                        {tx.source}
                      </span>
                    </td>
                    <td className={`py-3 px-4 text-right font-bold tabular-nums ${
                      tx.is_credit ? 'text-status-positive' : 'text-status-critical'
                    }`}>
                      {tx.is_credit ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEditModal(tx)}
                          className="text-ink-tertiary hover:text-brand transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteTx(tx.id)}
                          className="text-ink-tertiary hover:text-status-critical transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* VOICE SAATHI SYNC BANNER */}
        <div className="bg-gradient-to-r from-[#ebf8fe] to-blue-50 border border-sky-200 p-4 rounded-xl flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#002970] text-white flex items-center justify-center shadow-sm">
              <Mic className="w-5 h-5 text-[#00baf2]" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#002970]">
                Synced with Paytm Saathi Voice AI
              </h4>
              <p className="text-xs text-slate-600">
                All voice entries for this date are reconciled in SQLite and reflected immediately in Records, Dashboard, and Inventory.
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#002970] text-white">
            <span className="w-2 h-2 rounded-full bg-[#00baf2] animate-pulse" />
            <span>Voice Reconciled</span>
          </span>
        </div>

        {/* Modal for Add / Edit */}
        {showModal && renderTxModal()}
      </div>
    );
  }

  // =========================================================================
  // VIEW 1: RECORDS LANDING PAGE — DATE-WISE CHRONOLOGICAL VIEW
  // =========================================================================
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-surface-border shadow-card">
        <div>
          <h1 className="text-xl font-bold text-ink-primary tracking-tight">
            Business Records
          </h1>
          <p className="text-xs text-ink-tertiary mt-0.5">
            Your business, day by day.
          </p>
        </div>

        {/* Date Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-surface-subtle p-1 rounded-lg border border-surface-border">
          {[
            { id: 'all', label: 'All Dates' },
            { id: 'today', label: 'Today' },
            { id: 'week', label: 'This Week' },
            { id: 'month', label: 'This Month' },
            { id: 'custom', label: 'Custom Date' }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setDateFilter(f.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                dateFilter === f.id
                  ? 'bg-brand text-white shadow-subtle'
                  : 'text-ink-secondary hover:text-ink-primary'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Date Input when selected */}
      {dateFilter === 'custom' && (
        <div className="bg-white p-4 rounded-xl border border-surface-border shadow-subtle flex items-center gap-3">
          <Calendar className="w-4 h-4 text-brand" />
          <span className="text-xs font-medium text-ink-secondary">Select Custom Date:</span>
          <input
            type="date"
            value={customDate}
            onChange={(e) => setCustomDate(e.target.value)}
            className="px-3 py-1.5 text-xs border border-surface-border rounded-lg bg-surface-subtle text-ink-primary focus-visible:ring-2 focus-visible:ring-brand"
          />
        </div>
      )}

      {/* CHRONOLOGICAL DATE CARDS LIST */}
      <div className="space-y-3.5">
        {loadingDays ? (
          <div className="text-center py-12 bg-white rounded-xl border border-surface-border">
            <FileText className="w-6 h-6 text-brand mx-auto mb-2" />
            <p className="text-xs text-ink-tertiary">Loading business records…</p>
          </div>
        ) : daysList.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-surface-border">
            <FileText className="w-8 h-8 text-ink-tertiary mx-auto mb-2" />
            <h3 className="text-xs font-bold text-ink-primary">No records for this date range</h3>
            <p className="text-xs text-ink-tertiary mt-0.5">
              Voice-confirmed transactions and sales will appear here day by day.
            </p>
          </div>
        ) : (
          daysList.map((day) => {
            const comp = day.comparison;
            return (
              <div
                key={day.date}
                onClick={() => setSelectedDate(day.date)}
                className="bg-white p-5 rounded-xl border border-surface-border shadow-subtle hover:shadow-card hover:border-brand/40 cursor-pointer transition-all flex flex-col justify-between group"
              >
                {/* Card Top Row: Date Label + Comparison Indicator */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-surface-border pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-brand-muted border border-blue-200 flex items-center justify-center text-brand flex-shrink-0">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-ink-primary group-hover:text-brand transition-colors flex items-center gap-2">
                        <span>{day.label}</span>
                      </h3>
                      <p className="text-xs text-ink-tertiary">
                        {day.tx_count} recorded transactions
                      </p>
                    </div>
                  </div>

                  {/* Day-over-day Comparison Badge */}
                  <div>
                    {comp.has_prev ? (
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        comp.trend === 'up'
                          ? 'bg-status-positiveBg text-status-positive border border-status-positiveBorder'
                          : comp.trend === 'down'
                          ? 'bg-status-criticalBg text-status-critical border border-status-criticalBorder'
                          : 'bg-surface-subtle text-ink-secondary'
                      }`}>
                        {comp.trend === 'up' && <TrendingUp className="w-3.5 h-3.5" />}
                        {comp.trend === 'down' && <TrendingDown className="w-3.5 h-3.5" />}
                        {comp.trend === 'same' && <Minus className="w-3.5 h-3.5" />}
                        <span>{comp.text}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs text-ink-tertiary bg-surface-subtle">
                        {comp.text}
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Middle: 4 Key Financial Figures */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-3">
                  <div className="p-2.5 bg-surface-canvas rounded-lg">
                    <span className="text-xs text-ink-tertiary block">QR Sales</span>
                    <span className="text-sm font-bold text-brand tabular-nums">
                      ₹{day.qr_sales.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="p-2.5 bg-surface-canvas rounded-lg">
                    <span className="text-xs text-ink-tertiary block">Cash Sales</span>
                    <span className="text-sm font-bold text-emerald-800 tabular-nums">
                      ₹{day.cash_sales.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="p-2.5 bg-brand-muted/50 rounded-lg border border-blue-100">
                    <span className="text-xs text-brand block font-semibold">Total Sales</span>
                    <span className="text-sm font-extrabold text-brand tabular-nums">
                      ₹{day.total_sales.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="p-2.5 bg-surface-canvas rounded-lg">
                    <span className="text-xs text-ink-tertiary block">Expenses</span>
                    <span className="text-sm font-bold text-amber-800 tabular-nums">
                      ₹{day.expenses.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Card Bottom Row: Estimated Result & Click Action */}
                <div className="pt-2.5 border-t border-surface-border flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-ink-secondary font-medium">
                    <Info className="w-3.5 h-3.5 text-ink-tertiary" />
                    <span>{day.operating_result_label}</span>
                  </div>
                  <div className="flex items-center gap-1 text-brand font-bold group-hover:translate-x-0.5 transition-transform">
                    <span>View report</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal for Add / Edit Transaction */}
      {showModal && renderTxModal()}
    </div>
  );

  // Render Transaction Add/Edit Modal
  function renderTxModal() {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-md w-full shadow-modal border border-surface-border overflow-hidden">
          <div className="p-4 bg-surface-subtle border-b border-surface-border flex items-center justify-between">
            <h3 className="text-xs font-bold text-ink-primary">
              {editingTx ? 'Edit Transaction' : 'Add Transaction'}
            </h3>
            <button
              onClick={() => setShowModal(false)}
              className="text-ink-tertiary hover:text-ink-primary"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSaveTx} className="p-4 space-y-3.5 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-ink-secondary mb-1">Date</label>
                <input
                  type="date"
                  value={txFormData.date}
                  onChange={(e) => setTxFormData({ ...txFormData, date: e.target.value })}
                  className="w-full px-3 py-2 border border-surface-border rounded-lg bg-surface-subtle text-ink-primary focus-visible:ring-2 focus-visible:ring-brand"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold text-ink-secondary mb-1">Time</label>
                <input
                  type="time"
                  value={txFormData.time}
                  onChange={(e) => setTxFormData({ ...txFormData, time: e.target.value })}
                  className="w-full px-3 py-2 border border-surface-border rounded-lg bg-surface-subtle text-ink-primary focus-visible:ring-2 focus-visible:ring-brand"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-ink-secondary mb-1">Type</label>
                <select
                  value={txFormData.type}
                  onChange={(e) => setTxFormData({ ...txFormData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-surface-border rounded-lg bg-surface-subtle text-ink-primary focus-visible:ring-2 focus-visible:ring-brand"
                >
                  <option value="cash_collection">Cash Collection</option>
                  <option value="qr_collection">QR Collection</option>
                  <option value="expense">Expense</option>
                  <option value="stock_purchase">Stock Purchase</option>
                  <option value="product_sale">Product Sale</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-ink-secondary mb-1">Payment Method</label>
                <select
                  value={txFormData.payment_method}
                  onChange={(e) => setTxFormData({ ...txFormData, payment_method: e.target.value })}
                  className="w-full px-3 py-2 border border-surface-border rounded-lg bg-surface-subtle text-ink-primary focus-visible:ring-2 focus-visible:ring-brand"
                >
                  <option value="Cash">Cash</option>
                  <option value="QR">Paytm QR</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-ink-secondary mb-1">Amount (₹)</label>
              <input
                type="number"
                step="any"
                value={txFormData.amount}
                onChange={(e) => setTxFormData({ ...txFormData, amount: e.target.value })}
                placeholder="e.g. 500"
                className="w-full px-3 py-2 border border-surface-border rounded-lg bg-surface-subtle text-ink-primary focus-visible:ring-2 focus-visible:ring-brand font-bold"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-ink-secondary mb-1">Description</label>
              <input
                type="text"
                value={txFormData.description}
                onChange={(e) => setTxFormData({ ...txFormData, description: e.target.value })}
                placeholder="e.g. Electricity bill or Customer cash purchase"
                className="w-full px-3 py-2 border border-surface-border rounded-lg bg-surface-subtle text-ink-primary focus-visible:ring-2 focus-visible:ring-brand"
                required
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-3.5 py-2 rounded-lg bg-surface-subtle hover:bg-slate-200 text-ink-secondary font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-brand hover:bg-brand-dark text-white font-bold shadow-subtle"
              >
                {editingTx ? 'Update Transaction' : 'Save Transaction'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }
}
