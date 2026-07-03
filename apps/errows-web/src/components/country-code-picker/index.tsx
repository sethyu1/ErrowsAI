import React from 'react';
import { useClickAway } from 'ahooks';
import { cn } from '@errows/design/lib/utils';
import { type CountryCode, countryCodes, getDefaultCountry } from '@/config/country-codes';

interface CountryCodePickerProps {
  value: CountryCode;
  onChange: (country: CountryCode) => void;
  className?: string;
}

export function CountryCodePicker({ value, onChange, className }: CountryCodePickerProps) {
  const [open, setOpen] = React.useState(false);
  const pickerRef = React.useRef<HTMLDivElement>(null);

  useClickAway(() => {
    setOpen(false);
  }, pickerRef);

  return (
    <div ref={pickerRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 h-9 px-3 rounded-l-full border border-r-0 border-input bg-[rgba(9,10,10,1)] text-white text-sm hover:bg-gray-800 transition-colors shadow-xs min-w-0"
      >
        <span>{value.dialCode}</span>
        <svg
          className={cn('w-4 h-4 transition-transform', open && 'rotate-180')}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 z-50 mt-1 w-64 max-h-60 overflow-y-auto rounded-lg border border-gray-600 bg-[rgba(9,10,10,1)] shadow-lg">
          {countryCodes.map((country) => (
            <button
              key={country.code}
              type="button"
              onClick={() => {
                onChange(country);
                setOpen(false);
              }}
              className={cn(
                'w-full flex items-center justify-between px-3 py-2 text-sm text-left hover:bg-gray-800 transition-colors',
                value.code === country.code && 'bg-gray-700 text-white'
              )}
            >
              <span className="text-gray-300">{country.name}</span>
              <span className="text-gray-400">{country.dialCode}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function useCountryCode() {
  const [selectedCountry, setSelectedCountry] = React.useState<CountryCode>(getDefaultCountry());
  return { selectedCountry, setSelectedCountry };
}

export { type CountryCode, countryCodes, getDefaultCountry, formatMobileNumber } from '@/config/country-codes';
