import React from 'react';

interface NormalTitleProps {
  children: React.ReactNode;
}

export function NormalTitle({ children }: NormalTitleProps) {
  return (
    <div className="text-2xl text-white font-[700] font-urbanist w-full text-center mt-2 mb-5">{children}</div>
  );
}