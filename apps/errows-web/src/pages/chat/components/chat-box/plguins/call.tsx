import React from "react";
import { UserMessageItem } from "../history-item";
import { CallIcon } from "@errows/icons";
import dayjs from "dayjs";
import { type PluginProps } from "./base";
// 将毫秒转换为 HH:mm:ss 格式
const formatDuration = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0"
  )}:${String(seconds).padStart(2, "0")}`;
};
// Hangup info box: Call duration + time only. No play button (that is for chat TTS, not call recording).
export const Call: React.FC<PluginProps> = (props) => {
  const { message } = props;
  const { sended_at, info } = message;

  return (
    <UserMessageItem className="flex flex-col px-4 pt-4 pb-3 ">
      <div className="flex items-center justify-between w-full gap-3">
        <div className="flex items-center gap-3">
          <CallIcon className="w-4 h-4 text-[#A4ACB9]" />
          <span className="font-[Static] font-normal not-italic text-[10px] text-right text-[#A4ACB9]">
            Call duration
          </span>
          <span className="font-[Static] font-normal not-italic text-[10px] text-right text-[#A4ACB9]">
            {info?.duration ? formatDuration(info.duration) : "00:00:00"}
          </span>
        </div>
        <span className="font-[Static] font-normal not-italic text-[10px] text-right text-[#A4ACB9]">
          {dayjs(sended_at).format("HH:mm")}
        </span>
      </div>
    </UserMessageItem>
  );
};
