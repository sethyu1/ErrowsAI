import type { MemberType } from '@/types';
import { cn } from '@errows/design/lib/utils';
import { MEMBER_CONFIG } from '@/config';
import { GradientText } from '@/components';

interface MemberTagProps extends React.HTMLAttributes<HTMLDivElement> {
  member?: MemberType;
}

export function MemberTag(props: MemberTagProps) {
  const { className, member, ...rest } = props;

  const memberInfo = MEMBER_CONFIG[member!];

  if (!memberInfo) return null;

  const { title, tag } = memberInfo;
  const Icon = tag.icon;

  return (
    <div
      className={cn(
        'flex items-center justify-center w-fit px-1.5 h-4 text-xs leading-4 rounded-sm overflow-hidden',
        className
      )}
      style={{
        background: tag.background,
      }}
      {...rest}
    >
      <Icon className="size-2.5" style={{ color: tag.color }} />
      {
        tag.color
          ? (
            <span style={{ color: tag.color }} className="scale-85">{title}</span>
          )
          : (
            <GradientText className="scale-85">
              {title}
            </GradientText>
          )
      }
    </div>
  )
}
