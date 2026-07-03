import {
  Avatar as AvatarComponent,
  AvatarFallback,
  AvatarImage
} from '@errows/design/components/avatar';
import { cn } from '@errows/design/lib/utils';
import { MEMBER_CONFIG } from '@/config';
import type { MemberType } from '@/types';
import { Star } from './star';

interface AvatarProps extends React.ComponentProps<'div'> {
  member?: MemberType;
  animate?: boolean;
  src?: string;
  fallback?: string;
}

export function Avatar(props: AvatarProps) {
  const { fallback, animate = true, src, member, ...rest } = props;
  const memberInfo = MEMBER_CONFIG[member!];

  return (
    <div
      className={cn(
        'relative cursor-pointer rounded-full w-10 h-10',
      )}
      {...rest}
    >
      <div
        className={cn(
          'absolute top-0 z-10 left-0 w-full h-full',
        )}
        style={{
          backgroundImage: `url(${memberInfo?.avatar?.bg})`,
          backgroundSize: '100%',
          backgroundRepeat: 'no-repeat',
        }}
      />

      <div className="pt-1 pl-1 scale-105">
        <AvatarComponent>
          <AvatarImage className="overflow-hidden rounded-full" src={src} alt="avatar" />
          <AvatarFallback>{fallback}</AvatarFallback>
        </AvatarComponent>
      </div>

      {member === 'galaxy' && animate && (
        <>
          <Star size="lg" className="-top-1 right-0" />
          <Star className="left-1 bottom-0" duration={2} />
          <Star className="left-4" duration={1} />
          <Star className="left-2 top-2" />
          <Star className="left-2 top-0" />
        </>
      )}

      {memberInfo?.avatar?.badge && (
        <div className="absolute z-20 -top-1 right-0">
          <img src={memberInfo.avatar.badge} className="w-4 h-4" alt="member" />
        </div>
      )}

      {memberInfo?.avatar?.decorate && (
        <div
          className="absolute z-20 left-1/2 h-4 bottom-0"
          style={{ transform: 'translate(-50%, 40%)' }}
        >
          <img src={memberInfo.avatar.decorate} className="h-full" alt="member" />
        </div>
      )}
    </div>
  );
}
