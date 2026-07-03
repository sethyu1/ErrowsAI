import React from 'react';
import { useTranslation } from 'react-i18next';
import { difference } from 'es-toolkit';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@errows/design/lib/utils';
import type { MemberType, DateType } from '@/types';
import { CheckCircleIcon, CheckCircleGradientIcon } from '@errows/icons';

export interface FeatureProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 日期类型 */
  dateType?: DateType;
  memberType?: MemberType;
  hideTitle?: boolean;
  getFeatures: (memberType: MemberType, type: API.Payment.PalnType) => string[];
}

const variants = cva(
  'relative flex flex-col',
  {
    variants: {
      size: {
        default: 'gap-3',
        sm: 'gap-1.5',
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

export function Features(props: FeatureProps & VariantProps<typeof variants>) {
  const {
    dateType = 'yearly',
    memberType = 'star',
    hideTitle = false,
    size,
    className,
    getFeatures,
    ...rest
  } = props;

  const { t } = useTranslation();

  const list = getFeatures(memberType, dateType);
  const starFeatures = getFeatures('star', dateType);
  let diffFeatures: string[] = [];

  if (memberType !== 'star') {
    diffFeatures = difference(list, starFeatures);
  }

  return (
    <div className={cn(variants({ size, className }))} {...rest}>
      {!hideTitle && (
        <div className="text-lg leading-7 font-semibold text-[#F5F5F5]">
          {t('auth.features')}:
        </div>
      )}

      {list.map((text, index) => {
        const isDiff = diffFeatures.includes(text);

        return (
          <div key={index} className="flex gap-3 text-[#DBDBE6]">
            <div className="flex items-center justify-center">
              {memberType === 'galaxy' && (
                <>
                  {isDiff ? (
                    <CheckCircleGradientIcon
                      className="size-5"
                    />
                  ) : (
                    <CheckCircleIcon
                      style={{
                        color: '#DBDBE6'
                      }}
                      className="size-5"
                    />
                  )}
                </>
              )}

              {memberType !== 'galaxy' && (
                <CheckCircleIcon
                  style={{
                    color: isDiff ? '#a8891d' : '#DBDBE6'
                  }}
                  className="size-5"
                />
              )}
            </div>
            <div className="text-base leading-6">
              {text}
            </div>
          </div>
        )
      })}
    </div>
  )
}

