import React, { useState } from 'react';
import { InventoryItem, UserProfile } from '../types';
import { generateEyewearSKU, encodeAdminCostCipher } from '../utils/barcodeUtils';

interface AddGlassesStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddStock: (newItem: InventoryItem, printImmediately: boolean) => void;
  currentUser: UserProfile;
}

export const AddGlassesStockModal: React.FC<AddGlassesStockModalProps> = ({
  isOpen,
  onClose,
  onAddStock,
  currentUser,
}) => {
  const isAdmin = currentUser.role === 'admin' || currentUser.permissions.canViewPurchaseCost;

  const [brand, setBrand] = useState('Ray-Ban');
  const [model, setModel] = useState('');
  const [category, setCategory] = useState<'Optical Frame' | 'Premium Frame'>('Optical Frame');
  const [frameSize, setFrameSize] = useState('54-18-140');
  const [color, setColor] = useState('Matte Black');
  const [material, setMaterial] = useState('Acetate & Titanium');
  const [stockQty, setStockQty] = useState<number>(5);
  const [storageBin, setStorageBin] = useState('Frame Rack 2, Drawer B-01');
  const [purchasePriceBDT, setPurchasePriceBDT] = useState<number>(1200);
  const [askingPriceBDT, setAskingPriceBDT] = useState<number>(2800);
  const [printImmediately, setPrintImmediately] = useState<boolean>(true);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brand.trim() || !model.trim()) {
      alert('Please provide both Frame Brand and Model Name/Number.');
      return;
    }

    const sku = generateEyewearSKU(brand, model);
    const costUSD = purchasePriceBDT / 120;
    const sellUSD = askingPriceBDT / 120;
    const adminCipher = encodeAdminCostCipher(purchasePriceBDT);

    const newItem: InventoryItem = {
      id: `inv-frm-${Date.now()}`,
      sku,
      name: `${brand} ${model}`,
      specs: `${material} • ${color} ${frameSize}`,
      category,
      opticalSpecs: `Bridge: ${frameSize.split('-')[1] || '18'}mm • Temple: ${frameSize.split('-')[2] || '140'}mm`,
      opticalDetails: `Size ${frameSize} • ${material}`,
      stockQty: Number(stockQty) || 1,
      minThreshold: 2,
      costPrice: Number(costUSD.toFixed(1)),
      sellPrice: Number(sellUSD.toFixed(1)),
      suggestedAskingPrice: Number(sellUSD.toFixed(1)),
      storageBin,
      brand,
      model,
      color,
      frameSize,
      frameMaterial: material,
      adminCostCode: adminCipher,
      status: (Number(stockQty) || 1) <= 2 ? 'low' : 'healthy',
    };

    onAddStock(newItem, printImmediately);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-5 backdrop-blur-xs overflow-y-auto">
      <div className="bg-surface-container-lowest dark:bg-[#1a1d26] border border-outline-variant/80 dark:border-[#262c3b] rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-surface-container-low dark:bg-[#1e222e] border-b border-outline-variant/60 dark:border-[#262c3b] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#169b90]/15 text-[#169b90] flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">eyeglasses</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-on-surface">
                New Glasses Stock Entry &amp; Barcode Intake
              </h2>
              <p className="text-[11px] text-outline">
                Register incoming frames, configure negotiated price parameters &amp; print butterfly labels
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-outline hover:text-on-surface hover:bg-[#f1f4f9] dark:hover:bg-[#282e3d] transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex flex-col gap-4">
          
          {/* Brand & Model */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-outline block mb-1">
                Glasses Brand *
              </label>
              <input
                type="text"
                required
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. Ray-Ban, Silhouette, Gucci, Titan"
                className="w-full h-9 px-3 text-xs bg-white dark:bg-[#202430] border border-outline-variant/80 dark:border-[#2c3344] rounded-xl text-on-surface focus:border-[#169b90] font-medium outline-hidden"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-outline block mb-1">
                Model Name / Number *
              </label>
              <input
                type="text"
                required
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="e.g. RB3025 Aviator, TMA-5515"
                className="w-full h-9 px-3 text-xs bg-white dark:bg-[#202430] border border-outline-variant/80 dark:border-[#2c3344] rounded-xl text-on-surface focus:border-[#169b90] font-medium outline-hidden"
              />
            </div>
          </div>

          {/* Frame Category & Specs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-bold text-outline block mb-1">
                Frame Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full h-9 px-2 text-xs bg-white dark:bg-[#202430] border border-outline-variant/80 dark:border-[#2c3344] rounded-xl text-on-surface outline-hidden"
              >
                <option value="Optical Frame">Optical Frame (Standard)</option>
                <option value="Premium Frame">Premium Titanium / Designer</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-outline block mb-1">
                Frame Size (Eye-Bridge-Temple)
              </label>
              <input
                type="text"
                value={frameSize}
                onChange={(e) => setFrameSize(e.target.value)}
                placeholder="e.g. 54-18-140"
                className="w-full h-9 px-3 text-xs bg-white dark:bg-[#202430] border border-outline-variant/80 dark:border-[#2c3344] rounded-xl text-on-surface font-mono outline-hidden"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-outline block mb-1">
                Color &amp; Finish
              </label>
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="e.g. Matte Gold, Tortoise"
                className="w-full h-9 px-3 text-xs bg-white dark:bg-[#202430] border border-outline-variant/80 dark:border-[#2c3344] rounded-xl text-on-surface outline-hidden"
              />
            </div>
          </div>

          {/* Material & Bin Location & Initial Qty */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-bold text-outline block mb-1">
                Material Description
              </label>
              <input
                type="text"
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                placeholder="e.g. Beta Titanium, TR90"
                className="w-full h-9 px-3 text-xs bg-white dark:bg-[#202430] border border-outline-variant/80 dark:border-[#2c3344] rounded-xl text-on-surface outline-hidden"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-outline block mb-1">
                Initial Stock Quantity (Pairs)
              </label>
              <input
                type="number"
                min="1"
                required
                value={stockQty}
                onChange={(e) => setStockQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-full h-9 px-3 text-xs bg-white dark:bg-[#202430] border border-outline-variant/80 dark:border-[#2c3344] rounded-xl text-on-surface font-bold outline-hidden"
              />
            </div>
          </div>

          {/* ========================================================================= */}
          {/* PRICING ARCHITECTURE: NEGOTIATED RETAIL VS CONFIDENTIAL ADMIN WHOLESALE */}
          {/* ========================================================================= */}
          <div className="p-4 rounded-2xl border border-outline-variant/80 dark:border-[#262c3b] bg-[#f8fafc] dark:bg-[#14171f] flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-outline-variant/60 pb-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#169b90] text-[18px]">gavel</span>
                <span className="text-xs font-bold text-on-surface">
                  Negotiated Price Framework (দরদাম সাপেক্ষ নীতিমালা)
                </span>
              </div>
              <span className="text-[10px] font-bold text-outline bg-white dark:bg-[#202430] px-2 py-0.5 rounded-full border border-outline-variant/60">
                Non-Fixed Retail
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Asking / Guide Price (Visible on floor, negotiable) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-on-surface">
                    Initial Asking / Guide Price (৳ BDT)
                  </label>
                  <span className="text-[10px] text-emerald-600 font-bold">Negotiable</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-outline">৳</span>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={askingPriceBDT}
                    onChange={(e) => setAskingPriceBDT(Number(e.target.value))}
                    className="w-full h-9 pl-7 pr-3 text-xs font-bold bg-white dark:bg-[#202430] border border-outline-variant/80 dark:border-[#2c3344] rounded-xl text-on-surface outline-hidden focus:border-[#169b90]"
                  />
                </div>
                <p className="text-[10px] text-outline mt-1">
                  Serves as the starting guide price for salesperson bargaining. Can be negotiated freely at POS.
                </p>
              </div>

              {/* Purchase Price (Strictly Restricted to Admin) */}
              <div className="p-3 bg-white dark:bg-[#1c202b] rounded-xl border border-outline-variant/60">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-on-surface flex items-center gap-1">
                    <span className="material-symbols-outlined text-amber-500 text-[14px]">lock</span>
                    <span>Purchase Cost Price (৳ BDT)</span>
                  </label>
                  <span className="text-[9px] font-extrabold px-1.5 py-0.2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded">
                    ADMIN ONLY
                  </span>
                </div>

                {isAdmin ? (
                  <>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs font-bold text-outline">৳</span>
                      <input
                        type="number"
                        min="0"
                        step="50"
                        value={purchasePriceBDT}
                        onChange={(e) => setPurchasePriceBDT(Number(e.target.value))}
                        className="w-full h-9 pl-7 pr-3 text-xs font-bold bg-[#f8fafc] dark:bg-[#151821] border border-outline-variant/80 dark:border-[#2c3344] rounded-xl text-on-surface outline-hidden focus:border-[#169b90]"
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-outline mt-1 font-mono">
                      <span>Cipher: <strong>{encodeAdminCostCipher(purchasePriceBDT)}</strong></span>
                      <span className="text-emerald-600 font-bold">
                        Expected Markup: +{(((askingPriceBDT - purchasePriceBDT) / Math.max(1, purchasePriceBDT)) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="p-2 bg-slate-100 dark:bg-[#232836] rounded-lg text-[11px] text-outline flex items-center gap-2">
                    <span className="material-symbols-outlined text-outline text-[16px]">visibility_off</span>
                    <span>Wholesale purchase price is restricted to Hospital Director &amp; Admin.</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Barcode Tag Printing Immediate Checkbox */}
          <div className="p-3 bg-[#169b90]/10 border border-[#169b90]/30 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#169b90] text-[20px]">print</span>
              <div>
                <span className="text-xs font-bold text-on-surface block">
                  Print Sky Routs Butterfly Barcode Tags Immediately
                </span>
                <span className="text-[10px] text-outline">
                  Opens thermal dumbbell label print preview ({stockQty} tags) on submission
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={printImmediately}
              onChange={(e) => setPrintImmediately(e.target.checked)}
              className="w-4 h-4 rounded text-[#169b90] focus:ring-[#169b90] cursor-pointer"
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-outline-variant/60">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white dark:bg-[#232836] border border-outline-variant/80 dark:border-[#2c3344] hover:bg-[#f1f4f9] text-on-surface rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-[#169b90] to-[#295559] hover:from-[#128279] hover:to-[#1e4043] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">save</span>
              <span>Register Glasses &amp; Generate Barcode</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
