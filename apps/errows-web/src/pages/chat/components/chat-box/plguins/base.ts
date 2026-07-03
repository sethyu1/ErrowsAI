import type { SendingMessage } from "@/pages/chat/hooks";

export type ReplyMessage = Required<SendingMessage>["reply"];

export interface PluginProps {
  sid: string;
  message: API.SESSION.SESSION_MESSAGE | ReplyMessage;
}
