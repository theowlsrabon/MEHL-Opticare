import React, { useState } from 'react';
import { InventoryItem, UserProfile } from '../types';
import { printElementById } from '../utils/printUtils';
import { OpticalBarcodeLabel } from './OpticalBarcodeLabel';

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
            <OpticalBarcodeLabel item={activeItem} />

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
