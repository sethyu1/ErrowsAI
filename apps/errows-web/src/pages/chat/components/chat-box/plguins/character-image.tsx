import React from "react";
import { CharacterMessageItem } from "../history-item";
import { PraiseIcon, StepOnIcon } from "@errows/icons";
import dayjs from "dayjs";
import { Feedback } from "../components/feedback";
import { Loader2, ImageOff } from "lucide-react";
import { Loading } from "@/components/loading";
import { download } from "@/pages/multimedia/util";
import { useMediaViewer } from "@/components/media-viewer/use-media-viewer";
import { type PluginProps } from "./base";
import { isMessageReply } from "../utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTranslation } from "react-i18next";

export const CharacterImage: React.FC<PluginProps> = (props) => {
  const { message, sid } = props;
  const { status, sended_at } = message;
  const { open } = useMediaViewer();
  const isMobile = useIsMobile();
  const { t } = useTranslation();
  const image_url = isMessageReply(message)
    ? message?.reply_picture_url
    : message?.image_url;
  
  const hasValidImage = image_url && 
    image_url !== "null" && 
    image_url !== "undefined" && 
    !image_url.endsWith("/null") &&
    (image_url.startsWith("http://") || image_url.startsWith("https://"));
  const isLoading = status === "loading";
  const isFailed = status === "failed";
  
  if (!hasValidImage && !isLoading && !isFailed) {
    return null;
  }
  
  const handleDownload = () => {
    image_url && download(image_url);
  };
  const handleOpen = () => {
    if (hasValidImage) {
      open({
        list: [
          {
            url: image_url,
            type: "image",
          },
        ],
        index: 0,
      });
    }
  };
  return (
    <CharacterMessageItem className="flex flex-col relative">
      <div className="flex p-2" onClick={hasValidImage ? handleOpen : undefined} style={{ cursor: hasValidImage ? 'pointer' : 'default' }}>
        {hasValidImage ? (
          <img
            src={image_url}
            alt="character image"
            className="w-[184px] h-[220px] object-cover"
          />
        ) : (
          <div className="w-[184px] h-[220px] bg-[#1A1B23] rounded" />
        )}
      </div>
      {hasValidImage && (
        <div className="flex items-center justify-between h-8 pl-4 pr-2">
          <div className="flex items-center gap-3">
            {message && (
              <Feedback sid={sid} message={message} onDownload={handleDownload} />
            )}
          </div>
          <span className="font-[Static] font-normal not-italic text-[10px] text-right text-[#A4ACB9]">
            {dayjs(sended_at).format("HH:mm")}
          </span>
        </div>
      )}
      {isLoading && (
        <div className="absolute flex flex-col items-center justify-center gap-2 top-0 left-0 rounded-tl-[16px] rounded-tr-[16px] rounded-br-[16px] w-full h-full bg-[#2c2c38b3] backdrop-blur-md">
          <Loading
            variant="gray"
            style={{
              fontSize: isMobile ? 46 : 32,
            }}
          />
          <span className="font-[Static] font-normal not-italic text-[14px] text-right text-[#A4ACB9]">
            {t('common.generating')}
          </span>
        </div>
      )}
      {isFailed && (
        <div className="absolute top-0 left-0 rounded-tl-[16px] rounded-tr-[16px] rounded-br-[16px] w-full h-full bg-[#2c2c38b3] backdrop-blur-md flex flex-col items-center justify-center gap-2">
          <ImageOff className="w-6 h-6 text-[#A4ACB9]" />
        </div>
      )}
    </CharacterMessageItem>
  );
};
