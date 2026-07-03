import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogHeader,
  DialogContent,
  DialogTitle,
} from '@errows/design/components/dialog';
import { useShallow } from 'zustand/react/shallow';
import { useGlobalStore } from '@/stores/global';
import { LocaleConfig } from '@/config';
import { ModelSelectIcon } from '@errows/icons'
import { cn } from '@errows/design/lib/utils';
import { cva } from 'class-variance-authority';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface LanguageDialogProps extends React.ComponentProps<typeof Dialog> {}

const localeVariants = cva(
  'h-14 rounded-xl flex items-center justify-between px-6 cursor-pointer bg-[rgba(44,44,56,0.40)]',
  {
    variants: {
      active: {
        true: 'bg-[rgba(44,44,56,1)]',
      },
    },
  }
)

export function SelectLocale(props: LanguageDialogProps) {
  const { t } = useTranslation();
  const { locale, setLocale, setOpenLocale } = useGlobalStore(useShallow(state => ({
    locale: state.locale,
    setLocale: state.setLocale,
    setOpenLocale: state.setOpenLocale,
  })));

  return (
    <Dialog {...props}>
      <DialogContent
        className="w-120 rounded-2xl overflow-hidden bg-[rgba(30,26,39,1)]"
        style={{
          border: '1px solid rgba(255, 255, 255, 10%)'
        }}
      >
        <DialogHeader>
          <DialogTitle>
            {t('auth.selectLanguage')}
          </DialogTitle>
        </DialogHeader>

        {/* Language list */}
        <div className="space-y-4">
          {LocaleConfig.map((item) => {
            const { label, value, icon } = item;
            const isSelected = locale === value;

            return (
              <div
                key={value}
                onClick={() => {
                  setLocale(value);
                  setOpenLocale(false);
                }}
                className={cn(localeVariants({ active: value === locale }))}
              >
                <div className="flex items-center gap-3">
                  {React.cloneElement(icon, { className: 'size-6' })}
                  <span
                    className="text-white font-semibold text-[14px]"
                    style={{ fontFamily: 'Urbanist, sans-serif' }}
                  >
                    {label}
                  </span>
                </div>
                {isSelected && (
                  <ModelSelectIcon className="w-5 h-5" />
                )}
              </div>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}
