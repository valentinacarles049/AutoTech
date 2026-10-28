import React, { useState } from 'react';
import { Search, Plus, Filter, PackageCheck, AlertCircle, ShoppingCart, X, Check } from 'lucide-react';
import { useWorkshop } from '../context/WorkshopContext';

export const InventarioScreen: React.FC = () => {
  const { inventory, createPurchaseRequest, purchaseRequestSuccess } = useWorkshop();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);

  // Purchase Request form
  const [selectedSku, setSelectedSku] = useState(inventory[0]?.sku || '');
  const [purchaseQty, setPurchaseQty] = useState(10);

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Todas' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handlePurchaseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSku) return;
    createPurchaseRequest(selectedSku, Number(purchaseQty));
    setIsPurchaseModalOpen(false);
  };

  return (
    <div className="space-y-6">

      {/* Success Notification */}
      {purchaseRequestSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-lg flex items-center space-x-2 animate-in slide-in-from-top-2">
          <PackageCheck className="w-4 h-4 flex-shrink-0" />
          <span>¡Solicitud de compra generada y stock actualizado correctamente!</span>
        </div>
      )}

      {/* Header Info & Primary Action Button */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-[#282832] border border-slate-200 dark:border-[#3A3A48] shadow-sm">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Catálogo Maestro de Repuestos & Stock de Pañol
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Inventario físico valorizado y alertas de reposición automática
          </p>
        </div>

        {/* ============================================================ */}
        {/* BOTÓN PRIMARIO REQUERIDO: GENERAR SOLICITUD DE COMPRA */}
        {/* ============================================================ */}
        <button
          onClick={() => setIsPurchaseModalOpen(true)}
          className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md shadow-red-600/30 flex items-center space-x-2 transition-all active:scale-95"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Generar Solicitud de Compra</span>
        </button>
      </div>

      {/* TOOLBAR DE FILTROS Y BÚSQUEDA */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 card-surface rounded-2xl shadow-sm">
        <div className="flex items-center space-x-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por código SKU, descripción de repuesto..."
              className="app-input w-full pl-9 pr-3 py-2 text-xs"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="app-input px-3 py-2 text-xs"
          >
            <option value="Todas">Todas las Categorías</option>
            <option value="Filtros & Aceites">Filtros & Aceites</option>
            <option value="Frenos & Discos">Frenos & Discos</option>
            <option value="Distribución & Motor">Distribución & Motor</option>
            <option value="Suspensión & Dirección">Suspensión & Dirección</option>
          </select>
        </div>

        <div className="text-xs text-slate-500">
          Mostrando: <strong className="text-slate-800 dark:text-slate-200">{filteredInventory.length} ítems</strong>
        </div>
      </div>

      {/* ============================================================ */}
      {/* DATA GRID ROBUSTA DE REPUESTOS */}
      {/* ============================================================ */}
      <div className="card-surface rounded-2xl shadow-sm overflow-hidden border border-slate-200 dark:border-[#3A3A48]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-[#1A1A22] text-slate-500 dark:text-slate-400 uppercase font-bold text-[10px] border-b border-slate-200 dark:border-[#3A3A48]">
              <tr>
                <th className="px-4 py-3.5">Código SKU</th>
                <th className="px-4 py-3.5">Descripción de Pieza</th>
                <th className="px-4 py-3.5">Categoría</th>
                <th className="px-4 py-3.5 text-center">Stock Actual</th>
                <th className="px-4 py-3.5 text-center">Stock Mínimo</th>
                <th className="px-4 py-3.5">Ubicación Pañol</th>
                <th className="px-4 py-3.5 text-center">Estado</th>
                <th className="px-4 py-3.5 text-right">Precio Unitario</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-[#3A3A48]">
              {filteredInventory.map((item) => {
                const isCriticalStock = item.currentStock <= item.minStock && item.currentStock > 0;
                const isOutOfStock = item.currentStock === 0;

                return (
                  <tr 
                    key={item.sku}
                    className={`hover:bg-slate-50/80 dark:hover:bg-[#202028] transition-colors ${
                      isOutOfStock ? 'opacity-50 bg-slate-50/30' : ''
                    }`}
                  >
                    {/* SKU */}
                    <td className="px-4 py-3.5 font-mono font-bold text-slate-900 dark:text-white">
                      {item.sku}
                    </td>

                    {/* Descripción */}
                    <td className="px-4 py-3.5 font-semibold text-slate-800 dark:text-slate-200">
                      {item.description}
                    </td>

                    {/* Categoría */}
                    <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400">
                      {item.category}
                    </td>

                    {/* Stock Actual */}
                    <td className="px-4 py-3.5 text-center">
                      <span className={`font-mono font-bold text-xs px-2.5 py-1 rounded-lg ${
                        isOutOfStock 
                          ? 'bg-red-500/10 text-red-600 border border-red-500/20' 
                          : isCriticalStock 
                          ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' 
                          : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                      }`}>
                        {item.currentStock} un.
                      </span>
                    </td>

                    {/* Stock Mínimo */}
                    <td className="px-4 py-3.5 text-center font-mono text-slate-400">
                      {item.minStock} un.
                    </td>

                    {/* Ubicación */}
                    <td className="px-4 py-3.5 font-mono text-slate-600 dark:text-slate-300 text-[11px]">
                      {item.location}
                    </td>

                    {/* Estado Badge */}
                    <td className="px-4 py-3.5 text-center">
                      <span className={
                        item.status === 'Activo' ? 'badge-green' :
                        item.status === 'Pendiente' ? 'badge-yellow' : 'badge-gray'
                      }>
                        {item.status}
                      </span>
                    </td>

                    {/* Precio Unitario */}
                    <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                      $ {item.unitPrice.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================ */}
      {/* MODAL: GENERAR SOLICITUD DE COMPRA */}
      {/* ============================================================ */}
      {isPurchaseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md card-surface rounded-2xl shadow-2xl border border-slate-200 dark:border-[#3A3A48] overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-[#3A3A48] flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Generar Solicitud de Compra
                </h3>
                <p className="text-xs text-slate-500">
                  Reposición de pañol para Taller Central
                </p>
              </div>
              <button onClick={() => setIsPurchaseModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePurchaseSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1.5">
                  Repuesto a Solicitar <span className="text-red-600 font-bold">*</span>
                </label>
                <select
                  value={selectedSku}
                  onChange={(e) => setSelectedSku(e.target.value)}
                  className="app-input w-full px-3 py-2.5 text-xs"
                >
                  {inventory.map(item => (
                    <option key={item.sku} value={item.sku}>
                      [{item.sku}] {item.description} (Stock act: {item.currentStock})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1.5">
                  Cantidad a Solicitar <span className="text-red-600 font-bold">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={purchaseQty}
                  onChange={(e) => setPurchaseQty(Number(e.target.value))}
                  className="app-input w-full px-3.5 py-2.5 font-mono font-bold"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-[#3A3A48] flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsPurchaseModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-200 dark:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md shadow-red-600/30 flex items-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirmar Solicitud</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
