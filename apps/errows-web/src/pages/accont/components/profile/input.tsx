import { EditIcon } from '@errows/icons';
import React from 'react';

interface InputProps extends React.HTMLAttributes<HTMLDivElement> {
  label: React.ReactNode;
  onEdit?: () => void;
}

export function Input(props: InputProps) {
  const { label, children, onEdit, ...rest } = props;

  return (
    <>
      <div className="text-sm leading-7 text-[#A4ACB9]">
        {label}
      </div>
      <div
        className="flex justify-between items-center px-4 h-11.5 leading-11.5 rounded-full"
        style={{
          border: '1px solid rgba(255,255,255,0.3)'
        }}
        {...rest}
      >
        <span>{children}</span>
        <EditIcon onClick={onEdit} className="size-5 text-white" />
      </div>
    </>
  )
}
