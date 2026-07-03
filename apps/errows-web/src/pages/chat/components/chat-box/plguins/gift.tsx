import type { SendingMessage } from "@/pages/chat/hooks";
import React from "react";
import { UserMessageItem } from "../history-item";
import dayjs from "dayjs";
import { type PluginProps } from "./base";

export const Gift: React.FC<PluginProps> = (props) => {
  const { message, sid } = props;
  const { image_url, sended_at } = message;
  return (
    <UserMessageItem className="flex flex-col px-4 pt-4 pb-3 ">
      <div className="flex items-center justify-center w-full mb-5">
        <img src={image_url ?? ""} alt="gift" className="size-15" />
      </div>
      <span className="font-[Static] font-normal not-italic text-[10px] text-right text-[#A4ACB9]">
        {dayjs(sended_at).format("HH:mm")}
      </span>
    </UserMessageItem>
  );
};
