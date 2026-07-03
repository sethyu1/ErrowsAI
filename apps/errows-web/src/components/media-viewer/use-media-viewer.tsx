import React from "react";
import { useModal } from "@/hooks/use-modal";
import { MediaViewer, type MediaItem } from "./index";

type OpenParams = {
  list: MediaItem[];
  index?: number;
};

interface MediaViewerContextValue {
  open: (params: OpenParams) => void;
  close: () => void;
}

const MediaViewerContext = React.createContext<MediaViewerContextValue>(
  {} as MediaViewerContextValue
);

export const MediaViewerProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const { data, open, close } = useModal<OpenParams>();
  const mediaViewerRef = React.useRef<{
    show: (index?: number) => void;
    close: () => void;
  } | null>(null);

  const openViewer = (params: OpenParams) => {
    open(params);
    mediaViewerRef.current?.show(params.index);
  };

  return (
    <MediaViewerContext.Provider value={{ open: openViewer, close }}>
      {children}
      <MediaViewer ref={mediaViewerRef} list={data?.list || []} />
    </MediaViewerContext.Provider>
  );
};

export const useMediaViewer = () => {
  return React.useContext(MediaViewerContext);
};
