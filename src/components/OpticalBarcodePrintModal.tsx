import React, { useState } from 'react';
import Barcode from 'react-barcode';
import { InventoryItem, UserProfile } from '../types';
import { printElementById } from '../utils/printUtils';

interface OpticalBarcodePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItem?: InventoryItem | null;
  item?: InventoryItem | null;
  allItems?: InventoryItem[];
  currentUser: UserProfile;
}

export const OpticalBarcodePrintModal: React.FC<OpticalBarcodePrintModalProps> = ({
  isOpen,
  onClose,
  selectedItem,
  item,
}) => {
  const currentItem = selectedItem || item || null;
  const [activeItem, setActiveItem] = useState<InventoryItem | null>(currentItem);

  React.useEffect(() => {
    const itemTarget = selectedItem || item;
    if (itemTarget) setActiveItem(itemTarget);
  }, [selectedItem, item]);

  if (!isOpen || !activeItem) return null;

  const brandName = activeItem.brand || 'Premium Eyewear';
  const modelName = activeItem.model || activeItem.name.replace(brandName, '').trim() || activeItem.sku;
  const handlePrint = () => {
    printElementById('optical-barcode-printable', {
      title: `Optical_Barcode_${activeItem.sku}`,
      pageMargin: '0mm',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-xs print:bg-white print:p-0">
      <div className="bg-white dark:bg-[#1a1d26] rounded-2xl shadow-2xl overflow-hidden print:shadow-none print:rounded-none">
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-b border-outline-variant/60 print:hidden">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-gradient-to-r from-[#169b90] to-[#295559] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">print</span>
            Print Barcode (Thermal)
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-outline hover:bg-slate-100 dark:hover:bg-[#282e3d] cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="flex items-center gap-5 p-5 print:p-0">
          <div id="optical-barcode-printable" className="printable-area flex items-center justify-center print:p-0">
            <div className="w-[185px] h-[115px] bg-white p-2.5 rounded-xl border border-slate-300 shadow-xs flex flex-col justify-between font-sans text-slate-900 print:border-black print:shadow-none">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                <span className="text-[8px] font-black tracking-wider text-[#169b90] uppercase">
                  MADINA EYE HOSPITAL
                </span>
                <span className="text-[8px] font-bold bg-slate-100 text-slate-700 px-1 py-0.2 rounded font-mono">
                  OPTICAL
                </span>
              </div>

              <div className="my-0.5">
                <div className="text-[12px] font-black tracking-tight truncate" title={brandName}>
                  {brandName}
                </div>
                <div className="text-[10px] font-bold text-slate-700 truncate" title={modelName}>
                  {modelName}
                </div>
              </div>

              <div className="flex flex-col items-center justify-center pt-0.5 border-t border-slate-200">
                <div className="flex items-center justify-center gap-[1.5px] h-6 w-full px-1">
                  <Barcode
                    value={activeItem.sku}
                    format="CODE128"
                    width={1}
                    height={24}
                    displayValue={false}
                    margin={0}
                    background="transparent"
                    lineColor="#000000"
                  />
                </div>
                <span className="text-[8px] font-mono font-bold tracking-widest text-slate-800 text-center mt-0.5 truncate max-w-full">
                  {activeItem.sku}
                </span>
              </div>
            </div>

            <div className="w-64 rounded-xl border border-outline-variant/60 bg-surface-container-low dark:bg-[#202430] p-4 print:hidden">
              <p className="text-sm font-bold text-on-surface mb-3">Barcode Summary</p>
              <dl className="space-y-2 text-xs">
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-outline">Brand</dt>
                  <dd className="font-bold text-on-surface text-right">{brandName}</dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-outline">Product</dt>
                  <dd className="font-bold text-on-surface text-right">{modelName}</dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-outline">Category</dt>
                  <dd className="font-bold text-on-surface text-right">{activeItem.category}</dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-outline">Barcode Value</dt>
                  <dd className="font-mono font-bold text-on-surface text-right break-all">{activeItem.sku}</dd>
                </div>
                <div className="pt-2 mt-2 border-t border-outline-variant/60 text-[11px] leading-4 text-outline">
                  This barcode identifies the item in POS. Scanning it loads brand, product, category, SKU, and price details.
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
