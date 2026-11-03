import React from 'react';
import Barcode from 'react-barcode';
import { InventoryItem } from '../types';

interface OpticalBarcodeLabelProps {
  item: InventoryItem;
}

export const OpticalBarcodeLabel: React.FC<OpticalBarcodeLabelProps> = ({ item }) => {
  const brandName = item.brand || 'Premium Eyewear';
  const modelName = item.model || item.name.replace(brandName, '').trim() || item.sku;

  return (
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
            value={item.sku}
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
          {item.sku}
        </span>
        <div className="text-[7px] text-center font-sans font-medium tracking-tight text-black mt-0.5 leading-none" style={{ color: '#000000' }}>
          A <span style={{ color: '#047857', fontWeight: 700 }}>Quantum</span> Project
        </div>
      </div>
    </div>
  );
};
