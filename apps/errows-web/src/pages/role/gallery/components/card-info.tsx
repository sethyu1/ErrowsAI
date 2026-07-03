export interface RoleCardInfoProps {
  name?: string;
  description?: string;
}

export function RoleCardInfo({ name }: RoleCardInfoProps) {
  return (
    <div className="absolute bottom-[50px] left-0 right-0 px-5">
      <div>
        <div className="text-white font-urbanist font-medium text-[15.31px] leading-[21.05px] mb-1">
          {name}
        </div>
      </div>
    </div>
  );
}

