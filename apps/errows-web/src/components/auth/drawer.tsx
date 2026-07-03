import {
  Sheet,
  SheetContent,
  SheetClose,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from '@errows/design/components/sheet';
import { useTranslation } from 'react-i18next';
import { CloseIcon } from '@errows/icons';
import bg from '@/assets/images/background/login-mobile.webp';
import { LoginForm } from './login-form';
import { Feature } from './components';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface AuthDrawerProps extends React.ComponentProps<typeof Sheet> {}

export function AuthDrawer(props: AuthDrawerProps) {
  const { t } = useTranslation();

  const features = [
    {
      icon: 'local:speak-filled',
      color: '#ec4899',
      text: t('auth.createAiFriends')
    },
    {
      icon: 'local:image-filled',
      color: '#22c55e',
      text: t('auth.generateAiImages')
    },
    {
      icon: 'local:film-filled',
      color: '#ef4444',
      text: t('auth.generateAiVideos')
    },
    {
      icon: 'local:chat-voice-filled',
      color: '#3b82f6',
      text: t('auth.chatWithoutBoundaries')
    }
  ];

  return (
    <Sheet {...props}>
      <SheetContent
        side="right"
        className="w-screen z-1000 [&>button]:hidden"
        style={{
          background: `
            radial-gradient(82.17% 82.17% at 103.46% 0%, rgba(9, 9, 13, 0.09) 0%, #101018 100%),
            url(${bg}) top -130px right -190px/536px no-repeat
          `,
        }}
      >
        <SheetHeader className="hidden">
          <SheetTitle />
          <SheetDescription />
        </SheetHeader>

        <SheetClose asChild>
          <CloseIcon className="absolute z-2000 top-6 left-5 size-4" />
        </SheetClose>


        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto">
          <div className="w-full px-4 mt-7 sm:px-6 pb-6">
            <LoginForm />

            <div className="mt-8 sm:mt-10 grid grid-cols-2 gap-2 sm:gap-3">
              {features.map((item, index) => (
                <Feature
                  key={index}
                  icon={item.icon}
                  color={item.color}
                  text={item.text}
                />
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
