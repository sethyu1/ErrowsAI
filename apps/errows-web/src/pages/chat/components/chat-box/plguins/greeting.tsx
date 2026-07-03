import React from "react";
import { CharacterMessageItem } from "../history-item";
import { PraiseIcon, StepOnIcon } from "@errows/icons";
import type { PluginProps } from "./base";
import dayjs from "dayjs";
import { Feedback } from "../components/feedback";


export const Greeting: React.FC<PluginProps> = (props) => {
  const { message, sid } = props;
  const { content, sended_at } = message;
  return (
    <CharacterMessageItem className="flex flex-col px-4 pt-4">
      <span className="font-urbanist font-normal italic text-[13px] leading-[18px] text-justify text-[#D7DADA] block">
        Under the dim amber lights of the Fresh Mint bar, Martha stood behind
        the counter in her sharply tailored black suit, her short golden hair
        catching a warm glint. As she looked up to see you entering, her red
        contact lenses shimmered with a calm, noble presence. The scent of mint
        liqueur and oak barrels hung in the air, while a soft jazz tune played
        quietly in the background.
      </span>
      <span className="font-urbanist font-bold text-[16px] leading-[24px] text-justify text-white mt-2">
        {content}
      </span>
      <div className="flex items-center justify-between h-8">
        {message && (
          <Feedback
            sid={sid}
            message={message}
          />
        )}
        <span className="font-[Static] font-normal not-italic text-[10px] text-right text-[#A4ACB9]">
          {dayjs(sended_at).format("HH:mm")}
        </span>
      </div>
    </CharacterMessageItem>
  );
};
