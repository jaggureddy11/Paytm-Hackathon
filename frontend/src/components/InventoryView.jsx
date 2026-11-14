import React, { useState } from 'react';
import { 
  Package, 
  Plus, 
  AlertTriangle, 
  CheckCircle2, 
  X,
  Search
} from 'lucide-react';

export default function InventoryView({ products, t, onRefresh }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'General',
    opening_stock: 0,
    purchased_stock: 0,
    sold_stock: 0,
    price: 0,
    min_threshold: 5,
    unit: 'packet'
  });

  const [adjustData, setAdjustData] = useState({
    adjustment_type: 'purchase',
    quantity: 1,
    amount: 0,
    notes: ''
  });

  const filteredProducts = (products || []).filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct)
      });
      if (res.ok) {
        setShowAddModal(false);
        setNewProduct({
          name: '',
          category: 'General',
          opening_stock: 0,
          purchased_stock: 0,
          sold_stock: 0,
          price: 0,
          min_threshold: 5,
          unit: 'packet'
        });
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error('Failed to create product:', err);
    }
  };

  const handleAdjustStock = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;
    try {
      const res = await fetch('/api/inventory/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: selectedProduct.id,
          adjustment_type: adjustData.adjustment_type,
          quantity: parseInt(adjustData.quantity, 10),
          amount: parseFloat(adjustData.amount) || 0,
          notes: adjustData.notes
        })
      });
      if (res.ok) {
        setShowAdjustModal(false);
        setSelectedProduct(null);
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error('Failed to adjust stock:', err);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-ink-primary tracking-tight">
            {t.inventory.title}
          </h1>
          <p className="text-xs text-ink-tertiary mt-0.5">
            {t.inventory.formulaNote}
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-3.5 py-2 bg-brand hover:bg-brand-dark text-white rounded-lg text-xs font-semibold shadow-subtle transition-colors"
        >
          <Plus className="w-3.5 h-3.5 text-brand-light" />
          <span>{t.inventory.addProduct}</span>
        </button>
      </div>

      {/* Search Bar & Summary Stats */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-surface-border shadow-card">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-ink-tertiary" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search items by name or category…"
            className="w-full pl-9 pr-3.5 py-1.5 bg-surface-subtle border border-surface-border rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-brand focus:border-brand transition-colors"
          />
        </div>

        <div className="flex items-center gap-4 text-xs font-medium text-ink-secondary">
          <span>Total: <strong className="text-ink-primary">{products?.length || 0}</strong> products</span>
          <span>Low stock: <strong className="text-status-critical">{(products || []).filter(p => p.remaining_stock <= p.min_threshold).length}</strong> items</span>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-surface-border shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-subtle text-ink-secondary font-semibold border-b border-surface-border">
              <tr>
                <th className="px-6 py-3">Product</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-center">Opening</th>
                <th className="px-4 py-3 text-center text-blue-700">Purchased</th>
                <th className="px-4 py-3 text-center text-status-positive">Sold</th>
                <th className="px-4 py-3 text-center font-bold text-ink-primary">Remaining</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Threshold</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border font-medium">
              {filteredProducts.map((p) => {
                const isLow = p.remaining_stock <= p.min_threshold;
                return (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3.5 font-bold text-ink-primary">
                      {p.name}
                    </td>
                    <td className="px-4 py-3.5 text-ink-tertiary">
                      <span className="px-2 py-0.5 rounded-md bg-surface-subtle text-ink-secondary text-xs">
                        {p.category}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center text-ink-secondary tabular-nums">
                      {p.opening_stock} {p.unit}
                    </td>
                    <td className="px-4 py-3.5 text-center text-blue-700 font-semibold tabular-nums">
                      +{p.purchased_stock}
                    </td>
                    <td className="px-4 py-3.5 text-center text-status-positive font-semibold tabular-nums">
                      -{p.sold_stock}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold tabular-nums ${
                        isLow ? 'bg-status-warningBg text-status-warning' : 'bg-surface-subtle text-ink-primary'
                      }`}>
                        {p.remaining_stock} {p.unit}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-ink-primary tabular-nums">
                      ₹{p.price}
                    </td>
                    <td className="px-4 py-3.5 text-ink-tertiary tabular-nums">
                      {p.min_threshold} {p.unit}
                    </td>
                    <td className="px-4 py-3.5">
                      {isLow ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-status-warning bg-status-warningBg px-2 py-0.5 rounded-md border border-status-warningBorder">
                          <AlertTriangle className="w-3.5 h-3.5" /> Low stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-status-positive bg-status-positiveBg px-2 py-0.5 rounded-md border border-status-positiveBorder">
                          <CheckCircle2 className="w-3.5 h-3.5" /> In stock
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <button
                        onClick={() => {
                          setSelectedProduct(p);
                          setShowAdjustModal(true);
                        }}
                        className="px-2.5 py-1 bg-surface-subtle hover:bg-slate-200 text-brand font-semibold rounded-md transition-colors border border-surface-border text-xs"
                      >
                        Adjust stock
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal (clean backdrop without blur slop #46) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-modal border border-surface-border">
            <div className="flex items-center justify-between pb-3 border-b border-surface-border">
              <h3 className="text-sm font-bold text-ink-primary">Add new product</h3>
              <button onClick={() => setShowAddModal(false)} className="text-ink-tertiary hover:text-ink-primary">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-medium text-ink-secondary mb-1">Product name</label>
                <input
                  type="text"
                  required
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  placeholder="e.g. Milk Packets 500ml"
                  className="w-full px-3 py-2 bg-surface-subtle border border-surface-border rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-brand"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-ink-secondary mb-1">Category</label>
                  <input
                    type="text"
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    placeholder="Dairy, Grocery"
                    className="w-full px-3 py-2 bg-surface-subtle border border-surface-border rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-brand"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink-secondary mb-1">Unit</label>
                  <input
                    type="text"
                    value={newProduct.unit}
                    onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                    placeholder="packet, kg, box"
                    className="w-full px-3 py-2 bg-surface-subtle border border-surface-border rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-brand"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-ink-secondary mb-1">Opening stock</label>
                  <input
                    type="number"
                    value={newProduct.opening_stock}
                    onChange={(e) => setNewProduct({ ...newProduct, opening_stock: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 bg-surface-subtle border border-surface-border rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-brand"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink-secondary mb-1">Price (₹)</label>
                  <input
                    type="number"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-surface-subtle border border-surface-border rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-brand"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink-secondary mb-1">Min threshold</label>
                  <input
                    type="number"
                    value={newProduct.min_threshold}
                    onChange={(e) => setNewProduct({ ...newProduct, min_threshold: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 bg-surface-subtle border border-surface-border rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-brand"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-brand text-white rounded-lg text-xs font-semibold hover:bg-brand-dark transition-colors"
                >
                  Save product
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="py-2 px-4 bg-surface-subtle text-ink-secondary rounded-lg text-xs font-medium hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {showAdjustModal && selectedProduct && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-modal border border-surface-border">
            <div className="flex items-center justify-between pb-3 border-b border-surface-border">
              <div>
                <h3 className="text-sm font-bold text-ink-primary">Adjust stock</h3>
                <p className="text-xs text-ink-tertiary">{selectedProduct.name} (Current: {selectedProduct.remaining_stock} {selectedProduct.unit})</p>
              </div>
              <button onClick={() => setShowAdjustModal(false)} className="text-ink-tertiary hover:text-ink-primary">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAdjustStock} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-medium text-ink-secondary mb-1">Adjustment action</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'purchase', label: 'Stock in (Purchase)' },
                    { id: 'sale', label: 'Stock out (Sale)' },
                    { id: 'manual_set', label: 'Manual reset' }
                  ].map(act => (
                    <button
                      key={act.id}
                      type="button"
                      onClick={() => setAdjustData({ ...adjustData, adjustment_type: act.id })}
                      className={`py-1.5 px-2 text-xs font-medium rounded-lg border text-center transition-colors ${
                        adjustData.adjustment_type === act.id
                          ? 'bg-brand text-white border-brand'
                          : 'bg-surface-subtle text-ink-secondary border-surface-border hover:bg-slate-200'
                      }`}
                    >
                      {act.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-ink-secondary mb-1">Quantity ({selectedProduct.unit})</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={adjustData.quantity}
                    onChange={(e) => setAdjustData({ ...adjustData, quantity: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-subtle border border-surface-border rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-brand"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink-secondary mb-1">Total amount (₹, optional)</label>
                  <input
                    type="number"
                    value={adjustData.amount}
                    onChange={(e) => setAdjustData({ ...adjustData, amount: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-subtle border border-surface-border rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-brand"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-brand text-white rounded-lg text-xs font-semibold hover:bg-brand-dark transition-colors"
                >
                  Apply adjustment
                </button>
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="py-2 px-4 bg-surface-subtle text-ink-secondary rounded-lg text-xs font-medium hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
