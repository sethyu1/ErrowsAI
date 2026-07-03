import React from 'react';

interface StepProps {
  children: React.ReactNode;
}

export function Step(props: StepProps) {
  const { children } = props;

  return (
    <div className="w-[64px] h-[64px] rounded-[16px] bg-[#22232A] flex items-center justify-center shrink-0">
      <span
        className="font-bold text-[24px] leading-[35px] bg-clip-text text-transparent"
        style={{
          fontFamily: 'Urbanist, sans-serif',
          background: 'linear-gradient(96.61deg, #DD429D 0%, #B14BF4 50%, #485CFB 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}
      >
        {children}
      </span>
    </div>
  );
}
