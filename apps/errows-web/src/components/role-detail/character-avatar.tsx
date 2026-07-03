import React, { useRef } from "react";
import { cn } from "@errows/design/lib/utils";
import { MediaViewer, type MediaItem } from "@/components";
import {
  NRoleAttentionIcon,
  HeartIcon,
  MediaImageIcon,
  NRoleCommentIcon,
} from "@errows/icons";
import type { MediaViewerRef } from "../media-viewer";
import { formatCompactNumber } from "@/utils/util";


type SocialStat = API.Character.CHARACTER['social']

export interface CharacterAvatarProps {
  characterId: string;
  followCount: number;
  /** 角色头像 URL */
  imageUrl?: string;
  social?: SocialStat
  /** 是否为移动端布局 */
  isMobile?: boolean;
  owner?: string;
  slot?:React.ReactNode;
}

/**
 * 角色头像和底部操作按钮区域
 * PC端: 图片宽 327px，高 479px，下方为操作按钮
 * 移动端: 全宽图片，下方为操作按钮
 */
export const CharacterAvatar: React.FC<CharacterAvatarProps> = ({
  characterId,
  followCount,
  imageUrl,
  social = {} as SocialStat,
  isMobile = false,
  slot,
}) => {
  const { likes_count = 0, posted_count = 0, dialogues_count = 0 } = social;
  const mediaViewerRef = useRef<MediaViewerRef>(null);

  const stats = [
    { Icon: NRoleAttentionIcon, value: followCount, key: "follow" },
    { Icon: HeartIcon, value: likes_count, key: "like" },
    // { Icon: NRolePostIcon, value: posted_count, key: "post" },
    { Icon: MediaImageIcon, value: posted_count, key: "post" },
    { Icon: NRoleCommentIcon, value: dialogues_count, key: "comment" },
  ];

  const mediaItems: MediaItem[] = imageUrl
    ? [
      {
        type: "image",
        url: imageUrl,
      },
    ]
    : [];

  return (
    <div
      className={cn("relative flex-shrink-0 w-full", isMobile ? "w-full" : "")}
    >
      {/* 头像图片 */}
      <div
        className={cn(
          "relative rounded-6 overflow-hidden bg-gray-900 flex-shrink-0 bg-center bg-no-repeat bg-cover",
          isMobile ? "w-full aspect-[327/420]" : "w-[327px] h-[420px]"
        )}
        onClick={() => {
          mediaViewerRef.current?.show();
        }}
      >
        {/** 深色渐变背景 */}
        <div className='absolute w-full h-full left-0 top-0 right-0 bottom-0 rounded-lg z-1'
          style={{
            background: 'linear-gradient(360deg, rgba(0, 0, 0, 0.6) 3.44%, rgba(0, 0, 0, 0) 27.48%)',
          }}
        />
        <img src={imageUrl} alt="character-avatar" className="w-full h-full object-cover rounded-[16px]" />
        {/* 底部操作按钮区 - Absolute 布局 */}
        <div className="absolute h-15 z-2 w-full bottom-0 left-0 right-0 flex items-center justify-between px-4 gap-4">
          {stats.map(({ Icon, value, key }) => (
            <div
              key={key + `${value}` + characterId}
              className="flex items-center gap-[8px] flex-1 justify-center"
            >
              <Icon className="w-[20px] h-[20px] text-white flex-shrink-0" />
              <span
                className="ml-1.5 font-urbanist font-bold text-sm  text-center flex-shrink-0"
                style={{ color: "#E7E9EB" }}
              >
                {key === "follow" || key === "like" ? formatCompactNumber(value) : value}
              </span>
            </div>
          ))}
        </div>
      </div>
      {slot}

      <MediaViewer
        ref={mediaViewerRef}
        list={mediaItems}
      />
    </div>
  );
};

export default CharacterAvatar;
