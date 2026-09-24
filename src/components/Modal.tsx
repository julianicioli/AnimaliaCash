import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  id?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  size?: 'md' | 'lg' | 'xl';
  onClose: () => void;
  headerActions?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

const sizeClass = {
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export const Modal: React.FC<ModalProps> = ({
  id,
  title,
  subtitle,
  size = 'lg',
  onClose,
  headerActions,
  footer,
  children,
}) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/40 print:static print:bg-white print:p-0"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id={id}
        role="dialog"
        aria-modal="true"
        className={`bg-white rounded-2xl w-full ${sizeClass[size]} shadow-xl max-h-[92vh] flex flex-col print:max-h-none print:shadow-none`}
      >
        <div className="px-6 pt-5 pb-4 flex items-start justify-between gap-4 border-b border-slate-100">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-slate-900 leading-snug">{title}</h2>
            {subtitle && <div className="text-sm text-slate-500 mt-0.5">{subtitle}</div>}
          </div>
          <div className="flex items-center gap-1 shrink-0" data-print-hide>
            {headerActions}
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar"
              className="p-2 -mr-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">{children}</div>

        {footer && (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 rounded-b-2xl" data-print-hide>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export const inputClass =
  'w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500';

export const labelClass = 'block text-sm font-medium text-slate-700 mb-1.5';

export const primaryButtonClass =
  'inline-flex items-center justify-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer disabled:bg-slate-300 disabled:cursor-not-allowed';

export const secondaryButtonClass =
  'inline-flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-lg border border-slate-300 transition-colors cursor-pointer';
