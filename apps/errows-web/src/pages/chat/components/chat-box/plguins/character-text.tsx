import React from "react";
import { CharacterMessageItem } from "../history-item";
import dayjs from "dayjs";
import { Feedback } from "../components/feedback";
import { formatMessage } from "../utils";
import { type PluginProps } from "./base";

export const CharacterText: React.FC<PluginProps> = (props) => {
  const { message, sid } = props;
  const { sended_at, content, status } = message;
  const isStreaming = status === "loading";

  const formatContent = React.useMemo(() => {
    return formatMessage(content);
  }, [content]);

  return (
    <CharacterMessageItem className="flex flex-col px-4 pt-4">
      <span
        className="font-urbanist font-bold not-italic text-[16px] leading-[24px] text-[#F5F5F5] block"
        style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
      >
        {formatContent?.map((item, index) => {
          if (item.type === "text") {
            return (
              <span
                key={index}
                className="font-urbanist font-normal italic text-[13px] leading-[18px] text-justify text-[#D7DADA]"
              >
                {`${item.data}`}
              </span>
            );
          }
          if (item.type === "speech") {
            return (
              <span
                key={index}
                className="font-urbanist font-bold italic text-[16px] leading-[24px] text-[#FFFFFF]"
              >
                {`"${item.data}"`}
              </span>
            );
          }
          if (item.type === "action") {
            return (
              <span
                key={index}
                className="font-urbanist font-normal italic text-[13px] leading-[18px] text-justify text-[#D7DADA]"
              >
                {item.data}
              </span>
            );
          }
          return (
            <span
              key={index}
              className="font-urbanist font-normal italic text-[13px] leading-[18px] text-justify text-[#D7DADA]"
            >
              {item.data}
            </span>
          );
        })}
        {isStreaming && (
          <span className="inline-block w-2 h-4 bg-[#F5F5F5] ml-1 animate-pulse" />
        )}
      </span>
      <div className="flex items-center justify-between h-8">
        <div className="flex items-center gap-3">
          {message && !isStreaming && (
            <Feedback sid={sid} message={message} tts={true} />
          )}
        </div>
        <span className="font-[Static] font-normal not-italic text-[10px] text-right text-[#A4ACB9]">
          {dayjs(sended_at).format("HH:mm")}
        </span>
      </div>
    </CharacterMessageItem>
  );
};
