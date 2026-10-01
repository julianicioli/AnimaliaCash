import React, { useEffect, useState } from 'react';

interface NumericInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type' | 'inputMode'> {
  value: number;
  onChange: (value: number) => void;
}

function parseDraft(value: string): number | null {
  const normalized = value.trim().replace(',', '.');
  if (!normalized || normalized === '-' || normalized.endsWith('.')) return null;
  if (!/^-?(?:\d+\.?\d*|\.\d+)$/.test(normalized)) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export const NumericInput: React.FC<NumericInputProps> = ({ value, onChange, min, max, onBlur, onFocus, ...props }) => {
  const [draft, setDraft] = useState(String(value));
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) setDraft(String(value));
  }, [value, isFocused]);

  return (
    <input
      {...props}
      type="text"
      inputMode="decimal"
      value={draft}
      onFocus={(event) => {
        setIsFocused(true);
        onFocus?.(event);
      }}
      onChange={(event) => {
        const nextDraft = event.target.value;
        setDraft(nextDraft);
        const parsed = parseDraft(nextDraft);
        if (parsed !== null) onChange(parsed);
      }}
      onBlur={(event) => {
        setIsFocused(false);
        const parsed = parseDraft(draft);
        let nextValue = parsed ?? (draft.trim() === '' ? 0 : value);
        if (min !== undefined) nextValue = Math.max(Number(min), nextValue);
        if (max !== undefined) nextValue = Math.min(Number(max), nextValue);
        onChange(nextValue);
        setDraft(String(nextValue));
        onBlur?.(event);
      }}
    />
  );
};