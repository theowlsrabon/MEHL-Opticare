import React from 'react';

interface MadinaLogoProps {
  variant?: 'full' | 'icon-only' | 'horizontal' | 'monochrome-white';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const MadinaLogo: React.FC<MadinaLogoProps> = ({
  variant = 'horizontal',
  className = '',
  size = 'md',
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
  };

  const textSizes = {
    sm: { title: 'text-sm', sub: 'text-[9px]' },
    md: { title: 'text-[17px]', sub: 'text-[10px]' },
    lg: { title: 'text-xl', sub: 'text-xs' },
  };

  const isMonochrome = variant === 'monochrome-white';

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Official Madina Eye Hospital Stylized Logo Mark */}
      <div
        className={`${iconSizes[size]} relative rounded-[10px] flex items-center justify-center flex-shrink-0 transition-transform ${
          isMonochrome
            ? 'bg-white text-[#169b90]'
            : 'bg-[#169b90] text-white shadow-sm shadow-[#169b90]/30'
        }`}
        title="Madina Eye Hospital"
      >
        <svg
          viewBox="0 0 100 100"
          className="w-[82%] h-[82%]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Eyeball curve */}
          <path
            d="M15 50C25 32 40 23 58 23C76 23 88 34 94 48C84 66 69 77 50 77C32 77 21 66 15 50Z"
            fill={isMonochrome ? '#169b90' : 'white'}
            fillOpacity="0.25"
          />
          {/* Outer Eye Outline */}
          <path
            d="M14 50C24 30 42 22 56 22C74 22 87 35 93 50C83 67 66 76 48 76C30 76 19 65 14 50Z"
            stroke={isMonochrome ? '#169b90' : 'white'}
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Iris circle */}
          <circle
            cx="52"
            cy="49"
            r="16"
            fill={isMonochrome ? '#169b90' : 'white'}
          />
          {/* Pupil highlight */}
          <circle
            cx="57"
            cy="45"
            r="5"
            fill={isMonochrome ? 'white' : '#169b90'}
          />
          {/* Subtle brand calligraphy curve */}
          <path
            d="M24 74C30 84 45 88 56 86"
            stroke={isMonochrome ? '#169b90' : 'white'}
            strokeWidth="3.5"
            strokeLinecap="round"
            opacity="0.8"
          />
        </svg>

        {/* Small Arabic badge mark under or inside */}
        <span className="sr-only">Madina Eye Hospital Logo</span>
      </div>

      {variant !== 'icon-only' && (
        <div className="flex flex-col text-left leading-none">
          <div className="flex items-baseline gap-1.5">
            <span
              className={`font-extrabold tracking-tight ${textSizes[size].title} ${
                isMonochrome
                  ? 'text-white'
                  : 'text-[#169b90] dark:text-[#2dd4bf]'
              }`}
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              Madina
            </span>
            <span
              className={`font-semibold tracking-tight ${textSizes[size].title} ${
                isMonochrome ? 'text-white/90' : 'text-[#192229] dark:text-white'
              }`}
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              Eye Hospital
            </span>
          </div>

          <div className="flex items-center gap-1.5 mt-0.5">
            <span
              className={`font-normal tracking-wide ${textSizes[size].sub} text-[#808285] dark:text-[#a0a8b2]`}
            >
              মদিনা চক্ষু হাসপাতাল লিঃ
            </span>
            <span className="text-[9px] font-bold text-[#169b90] dark:text-[#38d9a9] bg-[#169b90]/10 dark:bg-[#169b90]/25 px-1 py-0.2 rounded">
              24 Years
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
