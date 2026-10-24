import React from 'react';
import {
  Shield,
  Gem,
  Telescope,
  AppWindow,
  Square,
  Box,
  Sparkles,
  Palette,
} from 'lucide-react';

export interface LensConfiguration {
  material: string;
  materialEn: string;
  coating: string;
  coatingEn: string;
  color: string;
  colorEn: string;
  design: string;
  designEn: string;
  calculatedPrice: number;
  fullName: string;
}

interface OphthalmicLensSelectorProps {
  selectedMaterial: string;
  onSelectMaterial: (m: string) => void;
  selectedCoating: string;
  onSelectCoating: (c: string) => void;
  selectedColor: string;
  onSelectColor: (c: string) => void;
  selectedDesign: string;
  onSelectDesign: (d: string) => void;
  onConfigurationChange?: (config: LensConfiguration) => void;
  showPrescriptionGrid?: boolean;
}

export const MATERIALS = [
  {
    id: 'cr39',
    bn: 'CR-39 প্লাস্টিক',
    en: 'CR-39',
    basePrice: 600,
    icon: (
      <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-950/60 border border-purple-300 dark:border-purple-800 flex items-center justify-center shrink-0">
        <Square className="w-4 h-4 text-purple-600 dark:text-purple-400" />
      </div>
    ),
  },
  {
    id: 'poly',
    bn: 'পলিকার্বোনেট',
    en: 'Polycarbonate',
    basePrice: 1800,
    icon: (
      <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950/60 border border-blue-300 dark:border-blue-800 flex items-center justify-center shrink-0">
        <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400 fill-blue-500/20" />
      </div>
    ),
  },
  {
    id: 'trivex',
    bn: 'ট্রাইভেক্স',
    en: 'Trivex',
    basePrice: 2400,
    icon: (
      <div className="w-7 h-7 rounded-lg bg-cyan-100 dark:bg-cyan-950/60 border border-cyan-300 dark:border-cyan-800 flex items-center justify-center shrink-0">
        <Gem className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
      </div>
    ),
  },
  {
    id: 'hi_index',
    bn: 'হাই-ইনডেক্স',
    en: 'High-Index 1.67',
    basePrice: 3200,
    icon: (
      <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 border border-indigo-300 dark:border-indigo-800 flex items-center justify-center shrink-0">
        <Telescope className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
      </div>
    ),
  },
  {
    id: 'crown_glass',
    bn: 'ক্রাউন গ্লাস',
    en: 'Crown Glass',
    basePrice: 900,
    icon: (
      <div className="w-7 h-7 rounded-lg bg-sky-100 dark:bg-sky-950/60 border border-sky-300 dark:border-sky-800 flex items-center justify-center shrink-0">
        <AppWindow className="w-4 h-4 text-sky-600 dark:text-sky-400" />
      </div>
    ),
  },
];

export const COATINGS = [
  {
    id: 'white',
    bn: 'হোয়াইট',
    en: 'White (Plain)',
    addPrice: 0,
    icon: (
      <div className="w-6 h-6 rounded-md bg-purple-100 border border-purple-300 flex items-center justify-center shrink-0 shadow-xs">
        <div className="w-3.5 h-3.5 bg-white rounded-xs"></div>
      </div>
    ),
  },
  {
    id: 'blue_cut_green',
    bn: 'ব্লু কাট গ্রীন',
    en: 'Blue Cut Green',
    addPrice: 800,
    icon: (
      <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-emerald-600 to-emerald-300 shadow-sm shrink-0 border border-emerald-400"></div>
    ),
  },
  {
    id: 'blue_cut_golden',
    bn: 'ব্লু কাট গোল্ডেন',
    en: 'Blue Cut Golden',
    addPrice: 900,
    icon: (
      <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-600 to-yellow-300 shadow-sm shrink-0 border border-amber-400"></div>
    ),
  },
  {
    id: 'blue_cut_violet',
    bn: 'ব্লু কাট ভায়োলেট',
    en: 'Blue Cut Violet',
    addPrice: 1100,
    icon: (
      <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-700 to-indigo-400 shadow-sm shrink-0 border border-purple-400"></div>
    ),
  },
  {
    id: 'frosted',
    bn: 'ফ্রস্টেড',
    en: 'Frosted',
    addPrice: 500,
    icon: (
      <div className="w-6 h-6 rounded-md bg-sky-200 border border-sky-400 flex items-center justify-center shrink-0 shadow-xs">
        <Box className="w-3.5 h-3.5 text-sky-700" />
      </div>
    ),
  },
  {
    id: 'mc',
    bn: 'এমসি',
    en: 'MC (Multi-Coat)',
    addPrice: 700,
    icon: (
      <div className="w-6 h-6 rounded-md bg-amber-100 border border-amber-300 flex items-center justify-center shrink-0 shadow-xs">
        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
      </div>
    ),
  },
];

export const COLORS = [
  {
    id: 'clear',
    bn: 'সাদা (Clear)',
    en: 'Clear',
    addPrice: 0,
    icon: (
      <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-600 to-sky-300 shadow-sm shrink-0 border border-sky-400"></div>
    ),
  },
  {
    id: 'photochromic',
    bn: 'ফটোক্রোমিক',
    en: 'Photochromic',
    addPrice: 1400,
    icon: (
      <div
        className="w-6 h-6 rounded-full border border-slate-600 shadow-sm shrink-0 overflow-hidden"
        style={{
          background: 'linear-gradient(90deg, #d97706 50%, #1e293b 50%)',
        }}
      ></div>
    ),
  },
  {
    id: 'tinted',
    bn: 'কালারিং',
    en: 'Tinted/Color',
    addPrice: 800,
    icon: (
      <div className="w-6 h-6 rounded-full bg-rose-100 border border-rose-300 flex items-center justify-center shrink-0 shadow-xs">
        <Palette className="w-3.5 h-3.5 text-rose-600" />
      </div>
    ),
  },
];

export const DESIGNS = [
  {
    id: 'single_vision',
    bn: 'সিঙ্গেল ভিশন',
    en: 'Single Vision',
    addPrice: 0,
  },
  {
    id: 'moon_bifocal',
    bn: 'মুন বাইফোকাল',
    en: 'Moon Bifocal',
    addPrice: 600,
  },
  {
    id: 'd_bifocal',
    bn: 'ডি-বাইফোকাল',
    en: 'D-Bifocal',
    addPrice: 800,
  },
  {
    id: 'progressive',
    bn: 'প্রগ্রেসিভ',
    en: 'Progressive',
    addPrice: 2200,
  },
];

export const OphthalmicLensSelector: React.FC<OphthalmicLensSelectorProps> = ({
  selectedMaterial,
  onSelectMaterial,
  selectedCoating,
  onSelectCoating,
  selectedColor,
  onSelectColor,
  selectedDesign,
  onSelectDesign,
  onConfigurationChange,
}) => {
  const curMat = MATERIALS.find((m) => m.id === selectedMaterial) || MATERIALS[0];
  const curCoat = COATINGS.find((c) => c.id === selectedCoating) || COATINGS[0];
  const curColor = COLORS.find((c) => c.id === selectedColor) || COLORS[0];
  const curDesign = DESIGNS.find((d) => d.id === selectedDesign) || DESIGNS[0];

  const totalCalculated =
    curMat.basePrice + curCoat.addPrice + curColor.addPrice + curDesign.addPrice;
  const fullName = `${curMat.bn} (${curMat.en}) — ${curCoat.bn} — ${curColor.bn} — ${curDesign.bn}`;

  // Notify parent if config changed
  React.useEffect(() => {
    if (onConfigurationChange) {
      onConfigurationChange({
        material: curMat.bn,
        materialEn: curMat.en,
        coating: curCoat.bn,
        coatingEn: curCoat.en,
        color: curColor.bn,
        colorEn: curColor.en,
        design: curDesign.bn,
        designEn: curDesign.en,
        calculatedPrice: totalCalculated,
        fullName,
      });
    }
  }, [
    selectedMaterial,
    selectedCoating,
    selectedColor,
    selectedDesign,
    totalCalculated,
    fullName,
  ]);

  return (
    <div className="flex flex-col gap-3.5 select-none font-sans">
      {/* 1. উপাদান (MATERIAL) */}
      <div className="bg-white dark:bg-[#161c27] rounded-2xl border border-sky-100 dark:border-slate-800 p-3.5 shadow-2xs">
        <div className="flex items-center gap-1.5 text-sky-700 dark:text-sky-400 font-bold text-xs uppercase tracking-wide mb-2.5">
          <span className="text-sm">🧪</span>
          <span>① উপাদান (MATERIAL)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {MATERIALS.map((m) => {
            const isSelected = selectedMaterial === m.id;
            return (
              <button
                type="button"
                key={m.id}
                onClick={() => onSelectMaterial(m.id)}
                className={`flex items-center gap-2.5 p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-2 border-blue-500 bg-blue-50/40 dark:bg-blue-950/30 shadow-xs'
                    : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1a202c] hover:border-sky-300 dark:hover:border-slate-600'
                }`}
              >
                {m.icon}
                <div className="flex-1 min-w-0">
                  <div
                    className={`text-xs font-bold truncate ${
                      isSelected
                        ? 'text-blue-700 dark:text-blue-400'
                        : 'text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {m.bn}
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium truncate">
                    {m.en}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. কোটিং (COATING) */}
      <div className="bg-white dark:bg-[#161c27] rounded-2xl border border-sky-100 dark:border-slate-800 p-3.5 shadow-2xs">
        <div className="flex items-center gap-1.5 text-sky-700 dark:text-sky-400 font-bold text-xs uppercase tracking-wide mb-2.5">
          <span className="text-sm">🧠</span>
          <span>② কোটিং (COATING)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {COATINGS.map((c) => {
            const isSelected = selectedCoating === c.id;
            return (
              <button
                type="button"
                key={c.id}
                onClick={() => onSelectCoating(c.id)}
                className={`flex items-center gap-2.5 p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-2 border-blue-500 bg-blue-50/40 dark:bg-blue-950/30 shadow-xs'
                    : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1a202c] hover:border-sky-300 dark:hover:border-slate-600'
                }`}
              >
                {c.icon}
                <div className="flex-1 min-w-0">
                  <div
                    className={`text-xs font-bold truncate ${
                      isSelected
                        ? 'text-blue-700 dark:text-blue-400'
                        : 'text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {c.bn}
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium truncate">
                    {c.en}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. রঙ / টিন্ট (COLOR) */}
      <div className="bg-white dark:bg-[#161c27] rounded-2xl border border-sky-100 dark:border-slate-800 p-3.5 shadow-2xs">
        <div className="flex items-center gap-1.5 text-sky-700 dark:text-sky-400 font-bold text-xs uppercase tracking-wide mb-2.5">
          <span className="text-sm">🌈</span>
          <span>③ রঙ / টিন্ট (COLOR)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {COLORS.map((col) => {
            const isSelected = selectedColor === col.id;
            return (
              <button
                type="button"
                key={col.id}
                onClick={() => onSelectColor(col.id)}
                className={`flex flex-col items-center justify-center text-center p-3 rounded-xl transition-all cursor-pointer ${
                  isSelected
                    ? 'border-2 border-blue-500 bg-blue-50/40 dark:bg-blue-950/30 shadow-xs'
                    : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1a202c] hover:border-sky-300 dark:hover:border-slate-600'
                }`}
              >
                <div className="mb-1.5">{col.icon}</div>
                <div
                  className={`text-xs font-bold truncate w-full ${
                    isSelected
                      ? 'text-blue-700 dark:text-blue-400'
                      : 'text-slate-700 dark:text-slate-200'
                  }`}
                >
                  {col.bn}
                </div>
                <div className="text-[10px] text-slate-400 font-medium truncate w-full">
                  {col.en}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. লেন্স ডিজাইন */}
      <div className="bg-white dark:bg-[#161c27] rounded-2xl border border-sky-100 dark:border-slate-800 p-3.5 shadow-2xs">
        <div className="flex items-center gap-1.5 text-sky-700 dark:text-sky-400 font-bold text-xs uppercase tracking-wide mb-2.5">
          <span className="text-sm">🔍</span>
          <span>④ লেন্স ডিজাইন</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {DESIGNS.map((d) => {
            const isSelected = selectedDesign === d.id;
            return (
              <button
                type="button"
                key={d.id}
                onClick={() => onSelectDesign(d.id)}
                className={`flex flex-col items-center justify-center p-3 rounded-xl text-center transition-all cursor-pointer ${
                  isSelected
                    ? 'border-2 border-blue-500 bg-blue-50/40 dark:bg-blue-950/30 shadow-xs'
                    : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1a202c] hover:border-sky-300 dark:hover:border-slate-600'
                }`}
              >
                <div
                  className={`text-xs font-bold ${
                    isSelected
                      ? 'text-blue-700 dark:text-blue-400'
                      : 'text-slate-700 dark:text-slate-200'
                  }`}
                >
                  {d.bn}
                </div>
                <div className="text-[10px] text-slate-400 font-medium">
                  {d.en}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Summary Bar (Dark Container) */}
      <div className="bg-[#0b1120] text-white rounded-xl p-3 border border-slate-800 shadow-md flex flex-col items-center justify-center">
        <div className="text-[11px] text-sky-400 font-medium mb-1 tracking-wide">
          নির্বাচিত লেন্স
        </div>
        <div className="text-xs sm:text-sm font-bold flex flex-wrap items-center justify-center gap-2 text-slate-100">
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-xs bg-purple-400"></span>
            <span>{curMat.bn}</span>
          </span>
          <span className="text-slate-500">•</span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-xs bg-slate-200"></span>
            <span>{curCoat.bn}</span>
          </span>
          <span className="text-slate-500">•</span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-500"></span>
            <span>{curColor.bn}</span>
          </span>
          <span className="text-slate-500">•</span>
          <span className="text-sky-400 font-black">{curDesign.bn}</span>
        </div>
      </div>
    </div>
  );
};
