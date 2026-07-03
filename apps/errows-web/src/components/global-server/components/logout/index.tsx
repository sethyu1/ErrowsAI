import { useLogout } from '@/services/auth';
import { useTranslation } from 'react-i18next';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@errows/design/components/alert-dialog';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface LogoutProps extends React.ComponentProps<typeof AlertDialog> {}

export function Logout(props: LogoutProps) {
  const { t } = useTranslation();
  const { logout } = useLogout();

  function onLogout() {
    // 实现注销逻辑
    logout();
  }

  return (
    <AlertDialog {...props}>
      <AlertDialogContent className="w-90 bg-[rgba(27,18,39,1)]">
        <AlertDialogHeader>
          <AlertDialogTitle></AlertDialogTitle>
          <AlertDialogDescription className="text-white text-center">
            {t(`auth.confirmToLogout`)}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex mt-3 items-center w-full sm:justify-center">
          <div className="flex gap-4">
            <AlertDialogCancel
              className="cursor-pointer rounded-full w-30 text-white"
              style={{
                backgroundColor: '#22232A',
                border: '1px solid #2C2C38'
              }}
            >
              {t(`common.cancel`)}
            </AlertDialogCancel>
            <AlertDialogAction
              className="cursor-pointer rounded-full w-30 text-white"
              style={{
                backgroundColor: '#22232A',
                border: '1px solid #2C2C38'
              }}
              onClick={onLogout}
            >
              {t(`common.confirm`)}
            </AlertDialogAction>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
