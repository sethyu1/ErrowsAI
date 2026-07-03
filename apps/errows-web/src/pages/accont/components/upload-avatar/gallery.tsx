import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@errows/design/components/select';
import { Button } from '@errows/design/components/button';
import { ScrollArea } from '@errows/design/components/scroll-area';
import { useCharacterImages, useImages } from '@/services/character';
import { Loading } from '@/components/loading';
import { ImageCard } from './image-card';

interface GalleryProps {
  onImageChange?: (url: string) => void;
  onNext?: () => void;
}

export function Gallery(props: GalleryProps) {
  const { onImageChange, onNext } = props;
  const { t } = useTranslation();
  const { data = [] } = useCharacterImages({ page: 0, size: 100 });
  const [cid, setCid] = React.useState('');
  const [currentImage, setCurrentImage] = React.useState('');
  const { data: imagesData, loading: imagesLoading } = useImages(cid);
  const images = imagesData?.data || [];

  React.useEffect(
    () => {
      const index = data[0];

      if (index) {
        setCid(index.cid);
      }
    }, [data]
  );

  const onValueChange = (value: string) => {
    setCid(value);
  }

  const onImageClick = (url: string) => {
    setCurrentImage(url);
    onImageChange?.(url);
  }

  return (
    <div className="w-full">
      {data.length > 0 && (
        <Select
          value={cid}
          onValueChange={onValueChange}
        >
          <SelectTrigger className="w-50">
            <SelectValue placeholder={t('auth.selectCharacter')} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {data.map((item) => {
                return (
                  <SelectItem key={item.cid} value={item.cid}>
                    {item?.character?.nickname}
                  </SelectItem>
                )
              })}
            </SelectGroup>
          </SelectContent>
        </Select>
      )}

      <div className="relative">
        {imagesLoading && (
          <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
            <Loading className="text-4xl" />
          </div>
        )}
        <ScrollArea className="max-h-145 min-h-78 py-6">
          <div className="flex flex-wrap gap-3">
            {images.map(item => {
              return (
                <ImageCard
                  key={item.id}
                  url={item.url}
                  active={item.url === currentImage}
                  onClick={() => onImageClick(item.url)}
                />
              )
            })}
          </div>
        </ScrollArea>
        {images.length > 0 && (
          <div
            className="absolute h-23 bottom-0 left-0 w-full flex justify-center items-center"
            style={{
              background: 'linear-gradient(180deg, rgba(27, 18, 39, 0) 0%, #1B1227 86.54%)',
            }}
          >
            <Button
              onClick={currentImage ? onNext : undefined}
              className="w-60 cursor-pointer"
              appearance="gradientFill"
              shape="round"
            >
              {t('common.next')}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
