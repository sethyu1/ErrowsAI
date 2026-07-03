import React from 'react'

interface TitleProps {
  children: React.ReactNode;
}

export function Title(props: TitleProps) {
  const { children } = props;

  return (
    <div className="text-center font-normal text-[14px] leading-[16px] tracking-[0.1px] text-[#A4ACB9] [font-family:'Roboto']">
      {children}
    </div>
  )
}
