import React from 'react';

interface AnimaliaLogoProps {
  logoUrl?: string;
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  className?: string;
}

export const AnimaliaLogo: React.FC<AnimaliaLogoProps> = ({
  logoUrl = '/logo.jpg',
  size = 'md',
  showSubtitle = true,
  className = '',
}) => {
  const isSm = size === 'sm';
  const isLg = size === 'lg';

  const emblemSizeClasses = isSm ? 'w-10 h-10' : isLg ? 'w-16 h-16' : 'w-12 h-12';
  const titleClasses = isSm ? 'text-lg' : isLg ? 'text-2xl' : 'text-xl';
  const subtitleClasses = isSm ? 'text-[10px]' : isLg ? 'text-xs' : 'text-[11px]';

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Emblem / Logo Image */}
      <div 
        className={`relative ${emblemSizeClasses} rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-center overflow-hidden shrink-0 transition-transform hover:scale-105`}
      >
        <img
          src={logoUrl || '/logo.jpg'}
          alt="Animalia Cash"
          className="w-full h-full object-contain p-0.5"
          referrerPolicy="no-referrer"
          onError={(e) => {
            // Fallback to stylized vector icon if image fails
            const target = e.currentTarget;
            target.style.display = 'none';
          }}
        />
      </div>

      {/* Styled Brand Typography */}
      <div className="flex flex-col leading-none">
        <div className={`font-black tracking-tight flex items-baseline gap-1.5 ${titleClasses}`}>
          {/* Stylized 'Animalia' with green leaf element */}
          <span className="text-[#0B2545] flex items-center">
            <span className="relative inline-block">
              A
              {/* Leaf accent mark on letter A */}
              <span className="absolute -top-1 -right-0.5 w-2 h-2 text-emerald-600 pointer-events-none">
                <svg viewBox="0 0 10 10" fill="currentColor" className="w-2.5 h-2.5">
                  <path d="M1,8 C1,8 2,2 8,2 C8,2 8,8 1,8 Z" />
                </svg>
              </span>
            </span>
            <span>nimalia</span>
          </span>

          {/* 'Cash' in vivid emerald green */}
          <span className="text-[#00A868] font-black">
            Cash
          </span>
        </div>

        {/* Subtitle with accent lines: — Soluções Financeiras — */}
        {showSubtitle && (
          <div className="flex items-center gap-1.5 mt-1">
            <span className="h-px w-3 bg-emerald-600/40"></span>
            <span className={`font-semibold text-slate-500 tracking-wider uppercase ${subtitleClasses}`}>
              Soluções Financeiras
            </span>
            <span className="h-px w-3 bg-emerald-600/40"></span>
          </div>
        )}
      </div>
    </div>
  );
};
