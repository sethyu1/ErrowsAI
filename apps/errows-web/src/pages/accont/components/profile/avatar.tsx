import { TakePhotoIcon } from '@errows/icons';
import { useAuthStore } from '@/stores/auth';
import { useShallow } from 'zustand/react/shallow';
import {
  Avatar as AvatarComponent,
  AvatarImage,
  AvatarFallback,
} from '@errows/design/components/avatar';
import { cn } from '@errows/design/lib/utils';

interface AvatarProps extends React.ComponentProps<'div'> {
  src?: string;
  edit?: boolean;
}

export function Avatar(props: AvatarProps) {
  const { src, edit = false, ...rest } = props;

  const { user } = useAuthStore(
    useShallow((state) => ({
      user: state.user,
    }))
  );

  return (
    <div className={cn('relative size-21', edit && 'cursor-pointer')} {...rest}>
      <AvatarComponent className="size-21">
        <AvatarImage src={src} />
        <AvatarFallback>{user?.name?.[0] || 'E'}</AvatarFallback>
      </AvatarComponent>
      {edit && (
        <div
          className={cn(
            'absolute h-6 w-6 bottom-0 right-0 bg-white rounded-full',
            'flex items-center justify-center',
          )}
        >
          <TakePhotoIcon className="w-3 h-3 text-[rgba(214,68,172,1)]" />
        </div>
      )}
    </div>
  )
}
