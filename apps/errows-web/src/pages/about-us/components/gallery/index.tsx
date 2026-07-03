import React from "react";
import { cn } from "@errows/design/lib/utils";
import { useMobile } from "@/hooks/use-mobile-detector";
import { Gallery as GalleryMobile } from "./index.mobile";
import type { GalleryProps } from "./index.mobile";

export const Gallery: React.FC<GalleryProps> = ({ characters }) => {
  return (
    <div
      className="grid grid-cols-6 gap-3
    "
    >
      {characters?.slice(0, 5).map((character, idx) => (
        <div
          key={character.id}
          className={cn(
            "col-span-2 h-[260px]",
            idx === 0 ? "col-span-2" : "col-span-1"
          )}
        >
          <img
            src={character.avatar_url}
            alt={character.nickname}
            className="w-full h-full object-cover rounded-[20px]"
          />
        </div>
      ))}
      {characters?.slice(5, 10).map((character, idx) => (
        <div
          key={character.id}
          className={cn(
            "col-span-2 h-[260px]",
            idx === 4 ? "col-span-2" : "col-span-1"
          )}
        >
          <img
            src={character.avatar_url}
            alt={character.nickname}
            className="w-full h-full object-cover rounded-[20px]"
          />
        </div>
      ))}
    </div>
  );
};

export default (props: GalleryProps) => {
  const isMobile = useMobile();
  return isMobile ? <GalleryMobile {...props} /> : <Gallery {...props} />;
};
