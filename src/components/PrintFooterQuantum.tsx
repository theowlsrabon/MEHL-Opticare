import React from 'react';

interface PrintFooterQuantumProps {
  className?: string;
  style?: React.CSSProperties;
  darkGreenColor?: string;
}

export const PrintFooterQuantum: React.FC<PrintFooterQuantumProps> = ({
  className = 'mt-3 pt-1.5 border-t border-slate-200 text-center text-[9px] font-sans font-medium tracking-wide text-black',
  style,
  darkGreenColor = '#047857',
}) => {
  return (
    <div className={className} style={{ color: '#000000', ...style }}>
      A <span style={{ color: darkGreenColor, fontWeight: 700 }}>Quantum</span> Project
    </div>
  );
};

export default PrintFooterQuantum;

