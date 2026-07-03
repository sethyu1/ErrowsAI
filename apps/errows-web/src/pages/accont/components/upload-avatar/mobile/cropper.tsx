import type { Area, CropperProps as CropperPropsType } from 'react-easy-crop';
import React from 'react'
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';
import ReactCropper from 'react-easy-crop';
import { Button } from '@errows/design/components/button';
import { Spinner } from '@errows/design/components/spinner';
import { useAuthStore } from '@/stores/auth';
import { getCroppedImg, base64ToFile } from '../utils';
import { updateAvatarApi } from '@/apis';

const CropperCom = ReactCropper as unknown as React.FC<Partial<CropperPropsType>>;

interface CropperProps {
  url: string;
  onPrev?: () => void;
}

export function Cropper(props: CropperProps) {
  const { url, onPrev } = props;
  const { t } = useTranslation();
  const [loading, setLoading] = React.useState(false);
  const [crop, setCrop] = React.useState({ x: 0, y: 0 });
  const [rotation, setRotation] = React.useState(0)
  const [zoom, setZoom] = React.useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = React.useState<Area | null>(null);
  const { updateAvatar } = useAuthStore(useShallow((state) => ({
    updateAvatar: state.updateAvatar,
  })));

  const getCroppedImage = React.useCallback(
    async () => {
      if (!croppedAreaPixels) {
        return
      }

      setLoading(true);

      try {
        const base64 = await getCroppedImg(url, croppedAreaPixels, rotation);
        const croppedImage = base64ToFile(base64);

        const { avatar_url } = await updateAvatarApi(croppedImage);

        updateAvatar(avatar_url);
      } catch (e) {
        console.error(e)
      }

      setLoading(false);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [url, croppedAreaPixels, rotation]
  );

  const onCropComplete = (_: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  return (
    <div className="py-6 px-7">
      <div className="relative w-full h-60">
        <CropperCom
          image={url}
          crop={crop}
          rotation={rotation}
          zoom={zoom}
          aspect={1}
          onCropChange={setCrop}
          onRotationChange={setRotation}
          onCropComplete={onCropComplete}
          onZoomChange={setZoom}
        />
      </div>
      <div className="flex justify-center mt-12">
        <div className="flex gap-3">
          <Button
            className="w-25 cursor-pointer"
            variant="outline"
            shape="round"
            onClick={onPrev}
          >
            {t('common.cancel')}
          </Button>
          <Button
            className="w-25 cursor-pointer"
            appearance="gradientFill"
            shape="round"
            disabled={loading}
            onClick={getCroppedImage}
          >
            {loading && <Spinner />}
            {t('common.save')}
          </Button>
        </div>
      </div>
    </div>
  )
}
