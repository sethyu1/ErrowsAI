import React from "react";
import { cn } from "@errows/design/lib/utils";

export interface GalleryProps {
  characters: API.Character.CHARACTER[];
}

export const Gallery: React.FC<GalleryProps> = ({ characters }) => {
  return (
    <div className="grid grid-cols-3 gap-3">
      {characters?.slice(0, 2).map((character, idx) => (
        <div
          key={character.id}
          className={cn(
            "col-span-2 h-[152px]",
            idx === 0 ? "col-span-2" : "col-span-1"
          )}
        >
          <img
            src={character.avatar_url}
            alt={character.nickname}
            className="w-full h-full object-cover rounded-[12px]"
          />
        </div>
      ))}
      {characters?.slice(2, 5).map((character, idx) => (
        <div key={character.id} className={cn(" h-[152px] col-span-1")}>
          <img
            src={character.avatar_url}
            alt={character.nickname}
            className="w-full h-full object-cover rounded-[12px]"
          />
        </div>
      ))}
      {characters?.slice(5, 7).map((character, idx) => (
        <div
          key={character.id}
          className={cn(
            "col-span-2 h-[152px]",
            idx === 0 ? "col-span-1" : "col-span-2"
          )}
        >
          <img
            src={character.avatar_url}
            alt={character.nickname}
            className="w-full h-full object-cover rounded-[12px]"
          />
        </div>
      ))}
      {characters?.slice(7, 10).map((character, idx) => (
        <div key={character.id} className={cn(" h-[152px] col-span-1")}>
          <img
            src={character.avatar_url}
            alt={character.nickname}
            className="w-full h-full object-cover rounded-[12px]"
          />
        </div>
      ))}
    </div>
  );
};
