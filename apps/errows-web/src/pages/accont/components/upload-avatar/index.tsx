import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogHeader,
  DialogContent,
  DialogTitle,
} from '@errows/design/components/dialog';
import { Cropper } from './cropper';
import { Gallery } from './gallery';
import { StepEnum } from './config';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface UploadAvatarProps extends React.ComponentProps<typeof Dialog> {}

export function UploadAvatar(props: UploadAvatarProps) {
  const [currentImage, setCurrentImage] = React.useState('');
  const [currentStep, setCurrentStep] = React.useState<string>(StepEnum.Gallery);
  const { t } = useTranslation();

  React.useEffect(() => {
    if (props.open) {
      setCurrentImage('');
      setCurrentStep(StepEnum.Gallery);
    }
  }, [props.open])

  const onImageChange = (url: string) => {
    setCurrentImage(url);
  }

  return (
    <Dialog {...props}>
      <DialogContent
        className="w-200 pb-0 rounded-2xl overflow-hidden bg-[rgba(30,26,39,1)]"
        style={{
          maxWidth: 'none',
          border: '1px solid rgba(255, 255, 255, 10%)',
          backgroundColor: 'rgba(27,18,39,1)',
        }}
      >
        <DialogHeader>
          <DialogTitle>
            {t('auth.choosePhoto')}
          </DialogTitle>
        </DialogHeader>

        <>
          {currentStep === StepEnum.Gallery && (
            <Gallery onImageChange={onImageChange} onNext={() => setCurrentStep(StepEnum.Cropper)} />
          )}

          {currentStep === StepEnum.Cropper && currentImage && (
            <Cropper url={currentImage} onPrev={() => setCurrentStep(StepEnum.Gallery)} />
          )}
        </>
      </DialogContent>
    </Dialog>
  )
}
