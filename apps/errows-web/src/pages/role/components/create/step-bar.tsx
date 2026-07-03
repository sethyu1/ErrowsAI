import React from 'react';

export interface StepBarProps {
  /** 当前步骤，从 1 开始 */
  step: number;
  /** 总步骤数，默认 5 */
  total?: number;
  /** 是否移动端 */
  isMobile?: boolean;
}

/** 顶部步骤条：高度 4px，间隔 8px，激活 #FFFFFF，未激活 #4A4E58，上下外边距 22px/28px */
export function StepBar({ step, total = 4, isMobile = false }: StepBarProps) {
  const items = Array.from({ length: total }, (_, i) => i + 1);

  return (
    <div className="w-full max-w-4xl mx-auto px-4" style={{ opacity: step === 1 ? 0 : 1, 
      ... isMobile ? {
        marginTop: step === 1 ? '1rem' : '',
        marginBottom: step !== 1 ? '1.5rem' : '',
      } : {
        marginTop: 22, marginBottom: 28,
      }
    }}>
      <div className="grid" style={{ gridTemplateColumns: `repeat(${total}, 1fr)`, gap: 8 , padding: isMobile ? 0 : "0 36px"}}>
        {items.map((i) => (
          <div
            key={i}
            className="rounded-full"
            style={{ height: 4, background: i < step ? '#FFFFFF' : '#4A4E58' }}
          />
        ))}
      </div>
    </div>
  );
}


