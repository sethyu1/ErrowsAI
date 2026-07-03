import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogOverlay,
  DialogHeader,
  DialogContent,
  DialogTitle,
  DialogClose,
} from '@errows/design/components/dialog';
import { CloseIcon } from '@errows/icons';
import { StepEnum } from '../config';
import { Cropper } from './cropper';
import { Gallery } from './gallery';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface UploadAvatarProps extends React.ComponentProps<typeof Dialog> {}

export function UploadAvatarMobile(props: UploadAvatarProps) {
  const { open } = props;
  const { t } = useTranslation();
  const [currentImage, setCurrentImage] = React.useState('');
  const [currentStep, setCurrentStep] = React.useState<string>(StepEnum.Gallery);

  React.useEffect(() => {
    if (open) {
      setCurrentImage('');
      setCurrentStep(StepEnum.Gallery);
    }
  }, [open]);

  const onImageChange = (url: string) => {
    setCurrentImage(url);
  }

  return (
    <Dialog {...props}>
      <DialogOverlay className="z-1999" />
      <DialogContent
        className="w-[calc(100vw-48px)] p-0 z-2000 rounded-2xl [&>button]:hidden"
        style={{
          maxWidth: 'none',
          border: '1px solid rgba(255, 255, 255, 10%)',
          backgroundColor: '#1B1227',
        }}
      >
        <div>
          <DialogHeader className="px-3 pt-4">
            <DialogTitle className="text-left text-xl">
              {currentStep === StepEnum.Gallery ? t('auth.choosePhoto') : t('auth.customizeAvatar')}
            </DialogTitle>
          </DialogHeader>

          <DialogClose asChild>
            <CloseIcon className="absolute top-3 right-3 size-3" />
          </DialogClose>

          {currentStep === StepEnum.Gallery && (
            <Gallery onImageChange={onImageChange} onNext={() => setCurrentStep(StepEnum.Cropper)} />
          )}

          {currentStep === StepEnum.Cropper && (
            <Cropper url={currentImage} onPrev={() => setCurrentStep(StepEnum.Gallery)} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
