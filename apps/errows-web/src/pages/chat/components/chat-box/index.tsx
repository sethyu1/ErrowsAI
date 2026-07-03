import { useRef, useEffect, Fragment, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Sender, type SenderRef } from "../sender";
import { ChatHeader } from "./plguins/header";
import { Greeting } from "./plguins/greeting";
import { avatarUrl } from "@/utils/mock";
import { HistoryItem, UserMessageItem, CharacterMessageItem } from "./history-item";
import { Loading } from "@/components/loading";
import { UserText } from "./plguins/user-text";
import { Gift } from "./plguins/gift";
import { CharacterText } from "./plguins/character-text";
import type { SendingMessage } from "../../hooks";
import { useChatServices } from "../../services";
import { CharacterImage } from "./plguins/character-image";
import { toast, alertDialog } from "@errows/design";
import type { ReplyMessage } from "./plguins/base";
import { Call } from "./plguins/call";
import { isMessageReply } from "./utils";

export interface ChatBoxProps {
  className?: string;
  style?: React.CSSProperties;
  loading?: boolean;
}

const selectPluginByMessaage = (
  sid: string,
  message: API.SESSION.SESSION_MESSAGE | ReplyMessage,
  context: {
    onEditMessage?: (messageId: string, content: string) => void;
    onDeleteMessage?: (messageId: string) => void;
    sendingMessages?: SendingMessage[];
    lastUserMessage?: API.SESSION.SESSION_MESSAGE;
    lastUserSendingMessage?: SendingMessage;
  }
) => {
  const {
    sendingMessages,
    lastUserMessage,
    lastUserSendingMessage,
    onEditMessage,
    onDeleteMessage,
  } = context;
  if (message?.type === "image") {
    const image_url = isMessageReply(message)
      ? (message as any)?.reply_picture_url
      : (message as any)?.image_url;
    const status = (message as any)?.status;
    const hasValidImage = image_url && 
      image_url !== "null" && 
      image_url !== "undefined" && 
      !image_url.endsWith("/null") &&
      (image_url.startsWith("http://") || image_url.startsWith("https://"));
    const isLoading = status === "loading" || (!hasValidImage && message?.type === "image");
    if (!hasValidImage && !isLoading && status !== "loading") {
      return null;
    }
    return <CharacterImage sid={sid} message={{...message, status: isLoading ? "loading" : (status || "success")}} />;
  } else if (message?.type === "gift") {
    return <Gift sid={sid} message={message} />;
  } else if (message?.type === "voice_call") {
    return <Call sid={sid} message={message as any} />;
  } else if (String((message as any).requestId ?? "").startsWith("voice-")) {
    const content = String((message as any).content ?? "").trim();
    const voiceCaptionClass = "font-urbanist font-bold italic text-[16px] leading-[24px] text-[#FFFFFF] block";
    const spanStyle = { whiteSpace: "pre-wrap" as const, wordBreak: "break-word" as const };
    if (message.role === "user") {
      return (
        <UserMessageItem className="flex flex-col px-4 pt-4">
          <span className={voiceCaptionClass} style={spanStyle}>{content}</span>
        </UserMessageItem>
      );
    }
    return (
      <CharacterMessageItem className="flex flex-col px-4 pt-4">
        <span className={voiceCaptionClass} style={spanStyle}>{content}</span>
      </CharacterMessageItem>
    );
  } else {
    if (message.role === "user" && !isMessageReply(message)) {
      const id = (message as any).reply?.send_message_id ?? message?.id!;
      const isLastFromSession = sendingMessages?.length === 0 && message?.id === lastUserMessage?.id;
      const isLastSendingWithReply = lastUserSendingMessage?.requestId === (message as any).requestId && (message as any).reply;
      const action = isLastFromSession || !!isLastSendingWithReply;
      return (
        <UserText
          sid={sid}
          message={message}
          messageId={id}
          action={action}
          onEdit={onEditMessage}
          onDelete={onDeleteMessage}
        />
      );
    } else {
      return <CharacterText sid={sid} message={message} />;
    }
  }
};

export const renderMessages = (
  session: API.SESSION.SESSION_CHAT_HISTORY,
  sendingMessages: SendingMessage[] = [],
  onEditMessage?: (messageId: string, content: string) => void,
  onDeleteMessage?: (messageId: string) => void,
  expandedVoiceCallIds?: Set<string>,
  onToggleVoiceCallExpand?: (messageId: string) => void
) => {
  //查找最后一条user消息
  const lastUserMessage = session?.messages
    ?.slice()
    .reverse()
    .find((message) => message.role === "user");
  const lastUserSendingMessage = sendingMessages
    ?.slice()
    ?.reverse()
    ?.find((message) => message.type === "text");
  return (
    <>
      {session?.messages?.length === 1 && (
        <HistoryItem direction="justify-center" className="mb-6">
          <ChatHeader
            avatar={session?.character?.avatar_url}
            name={session?.character?.nickname}
            age={25}
            description={
              "All communication with the character willremain private. No one will see it."
            }
          />
        </HistoryItem>
      )}
      {/* 这里需要特殊处理一下，如果是图片消息而且还存在文本的情况下两条都要显示 */}
      {session?.messages.map((message, idx) => (
        <Fragment key={message.id}>
          {message.type === "image" && message.content && (
            <HistoryItem
              direction={
                message.role === "user" ? "justify-end" : "justify-start"
              }
            >
              {selectPluginByMessaage(
                session.id,
                {
                  ...message,
                  type: "text",
                  content: message.content,
                },
                {
                  sendingMessages,
                  lastUserMessage,
                  lastUserSendingMessage,
                  onEditMessage,
                  onDeleteMessage,
                }
              )}
            </HistoryItem>
          )}
          {message.type === "voice_call" ? (
            // Call duration box first; then transcript summary + expandable segments below
            (() => {
              const plugin = selectPluginByMessaage(session.id, message, {
                sendingMessages,
                lastUserMessage,
                lastUserSendingMessage,
                onEditMessage,
                onDeleteMessage,
              });
              if (plugin === null) return null;
              return (
                <HistoryItem direction="justify-end">
                  {plugin}
                </HistoryItem>
              );
            })()
          ) : null}
          {message.type === "voice_call" &&
            (() => {
              const voiceSegs = (message as API.SESSION.SESSION_MESSAGE & { voice_segments?: { transcript_user: string; transcript_character: string[] | null }[] }).voice_segments;
              const hasContent = (s: string) => (s ?? "").trim().length > 0;
              const segmentCount = voiceSegs?.filter((seg) => hasContent(seg.transcript_user ?? "") || hasContent(Array.isArray(seg.transcript_character) ? seg.transcript_character.join(" ") : (seg.transcript_character ?? ""))).length ?? 0;
              const isExpanded = onToggleVoiceCallExpand == null
                ? true
                : (expandedVoiceCallIds?.has(message.id) ?? false);
              const showTranscriptSummary = segmentCount > 0 && onToggleVoiceCallExpand != null;
              return (
                <>
                  {showTranscriptSummary && (
                    <HistoryItem direction="justify-end">
                      <UserMessageItem
                        className="flex flex-row items-center justify-between gap-2 px-4 pt-3 pb-3"
                        style={{ minWidth: "auto" }}
                      >
                        <div
                          className="flex flex-row items-center justify-between gap-2 w-full cursor-pointer"
                          onClick={() => onToggleVoiceCallExpand(message.id)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              onToggleVoiceCallExpand(message.id);
                            }
                          }}
                        >
                          <span className="font-[Static] font-normal not-italic text-[10px] text-[#A4ACB9]">
                            Voice transcript ({segmentCount} {segmentCount === 1 ? "segment" : "segments"})
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-[#A4ACB9] shrink-0" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-[#A4ACB9] shrink-0" />
                          )}
                        </div>
                      </UserMessageItem>
                    </HistoryItem>
                  )}
                  {isExpanded && voiceSegs && voiceSegs.length > 0 &&
                    voiceSegs.map(
                      (seg: { transcript_user: string; transcript_character: string[] | null }, i: number) => {
                        const userCaption = seg.transcript_user ?? "";
                        const characterCaption = Array.isArray(seg.transcript_character) ? seg.transcript_character.join(" ") : (seg.transcript_character ?? "");
                        if (!hasContent(userCaption) && !hasContent(characterCaption)) return null;
                        const voiceCaptionClass = "font-urbanist font-bold italic text-[16px] leading-[24px] text-[#FFFFFF] block";
                        return (
                          <Fragment key={`${message.id}-seg-${i}`}>
                            {hasContent(userCaption) && (
                              <HistoryItem direction="justify-end">
                                <UserMessageItem className="flex flex-col px-4 pt-4">
                                  <span className={voiceCaptionClass} style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                                    {userCaption}
                                  </span>
                                </UserMessageItem>
                              </HistoryItem>
                            )}
                            {hasContent(characterCaption) && (
                              <HistoryItem direction="justify-start">
                                <CharacterMessageItem className="flex flex-col px-4 pt-4">
                                  <span className={voiceCaptionClass} style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                                    {characterCaption}
                                  </span>
                                </CharacterMessageItem>
                              </HistoryItem>
                            )}
                          </Fragment>
                        );
                      }
                    )}
                </>
              );
            })()}
          {message.type !== "voice_call" &&
            (() => {
              const plugin = selectPluginByMessaage(session.id, message, {
                sendingMessages,
                lastUserMessage,
                lastUserSendingMessage,
                onEditMessage,
                onDeleteMessage,
              });
              if (plugin === null) return null;
              return (
                <HistoryItem
                  direction={
                    message.role === "user" ? "justify-end" : "justify-start"
                  }
                >
                  {plugin}
                </HistoryItem>
              );
            })()}
        </Fragment>
      ))}
      {/* 发送消息 */}
      {sendingMessages?.map((message, idx) => {
        return (
          <Fragment key={message.requestId ?? message?.reply?.reply_message_id}>
            {
              //索要图片 和语音童虎这个比较特殊，不是问答式的，所以单独显示
              message.type !== "image" && message.type !== "voice_call" && (
                <HistoryItem
                  direction={
                    message.role === "user" ? "justify-end" : "justify-start"
                  }
                  loading={
                    message.role === "user" && message.status === "loading"
                  }
                >
                  {selectPluginByMessaage(session.id, message as any, {
                    sendingMessages,
                    lastUserMessage,
                    lastUserSendingMessage,
                    onEditMessage,
                    onDeleteMessage,
                  })}
                </HistoryItem>
              )
            }
            {/* 正常回复, 正常回复也能会有图片 */}
            {message.type !== "image" &&
              message.type !== "voice_call" &&
              message.reply && (
                <Fragment
                  key={message.reply?.reply_message_id ?? message.requestId}
                >
                  {(() => {
                    const reply = message.reply;
                    const hasContent = reply?.content && reply.content.trim().length > 0;
                    const hasImage = reply?.reply_picture_url && 
                      reply.reply_picture_url !== "null" && 
                      reply.reply_picture_url !== "undefined" && 
                      !reply.reply_picture_url.endsWith("/null") &&
                      (reply.reply_picture_url.startsWith("http://") || reply.reply_picture_url.startsWith("https://"));
                    const isImageType = reply?.type === "image";
                    
                    if (hasContent && (hasImage || isImageType)) {
                      return (
                        <>
                          <HistoryItem direction="justify-start">
                            {selectPluginByMessaage(
                              session.id,
                              {
                                ...reply,
                                type: "text",
                                content: reply.content,
                              },
                              {
                                sendingMessages,
                                lastUserMessage,
                                lastUserSendingMessage,
                                onEditMessage,
                                onDeleteMessage,
                              }
                            )}
                          </HistoryItem>
                          <HistoryItem direction="justify-start">
                            {selectPluginByMessaage(
                              session.id,
                              {
                                ...reply,
                                type: "image",
                                reply_picture_url: reply.reply_picture_url,
                                status: hasImage ? "success" : "loading",
                              },
                              {
                                sendingMessages,
                                lastUserMessage,
                                lastUserSendingMessage,
                                onEditMessage,
                                onDeleteMessage,
                              }
                            )}
                          </HistoryItem>
                        </>
                      );
                    } else if (hasContent && isImageType) {
                      return (
                        <>
                          <HistoryItem direction="justify-start">
                            {selectPluginByMessaage(
                              session.id,
                              {
                                ...reply,
                                type: "text",
                                content: reply.content,
                              },
                              {
                                sendingMessages,
                                lastUserMessage,
                                lastUserSendingMessage,
                                onEditMessage,
                                onDeleteMessage,
                              }
                            )}
                          </HistoryItem>
                          <HistoryItem direction="justify-start">
                            {selectPluginByMessaage(
                              session.id,
                              {
                                ...reply,
                                type: "image",
                                status: "loading",
                              },
                              {
                                sendingMessages,
                                lastUserMessage,
                                lastUserSendingMessage,
                                onEditMessage,
                                onDeleteMessage,
                              }
                            )}
                          </HistoryItem>
                        </>
                      );
                    } else {
                      return (
                        <HistoryItem direction="justify-start">
                          {selectPluginByMessaage(
                            session.id,
                            reply || (message as any),
                            {
                              sendingMessages,
                              lastUserMessage,
                              lastUserSendingMessage,
                              onEditMessage,
                              onDeleteMessage,
                            }
                          )}
                        </HistoryItem>
                      );
                    }
                  })()}
                </Fragment>
              )}

            {/* 这个是索要图片 */}

            {message.type === "image" && (
              <HistoryItem direction="justify-start">
                {selectPluginByMessaage(
                  session.id,
                  message.reply || (message as any),
                  {
                    sendingMessages,
                    lastUserMessage,
                    lastUserSendingMessage,
                    onEditMessage,
                    onDeleteMessage,
                  }
                )}
              </HistoryItem>
            )}

            {/* 这个是实时通话 */}
            {message.type === "voice_call" && (
              <HistoryItem direction="justify-end">
                {selectPluginByMessaage(
                  session.id,
                  message.reply || (message as any),
                  {
                    sendingMessages,
                    lastUserMessage,
                    lastUserSendingMessage,
                    onEditMessage,
                    onDeleteMessage,
                  }
                )}
              </HistoryItem>
            )}
          </Fragment>
        );
      })}
    </>
  );
};

export const useAutoScroll = () => {
  const { session, sendingMessages } = useChatServices();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop =
        scrollContainerRef.current.scrollHeight;
    }
  }, [session?.messages, sendingMessages]);
  return scrollContainerRef;
};

export type SenderStatus = "sending" | "editing";

export const ChatBox = ({ className, style, loading }: ChatBoxProps) => {
  const { session, sendingMessages, sendMessage, deleteMessage, editMessage } =
    useChatServices();
  const [expandedVoiceCallIds, setExpandedVoiceCallIds] = useState<Set<string>>(() => new Set());
  const handleToggleVoiceCallExpand = (messageId: string) => {
    setExpandedVoiceCallIds((prev) => {
      const next = new Set(prev);
      if (next.has(messageId)) next.delete(messageId);
      else next.add(messageId);
      return next;
    });
  };
  // console.log("sendingMessages =======>>>", sendingMessages);
  const scrollContainerRef = useAutoScroll();
  const senderRef = useRef<SenderRef>(null);
  const statusRef = useRef<{ status: SenderStatus; messageId?: string }>({
    status: "sending",
  });
  // console.log("sendingMessages =======>>>", session);
  const handleEditMessage = async (messageId: string, content: string) => {
    statusRef.current = { status: "editing", messageId };
    senderRef.current?.fillMessage(content);
  };

  const handleSendingMessage = (message: string) => {
    if (statusRef.current.status === "editing") {
      editMessage(statusRef.current.messageId!, message);
    } else {
      sendMessage(message);
    }
    statusRef.current = { status: "sending" };
  };

  const handleDeleteMessage = async (messageId: string) => {
    alertDialog.confirm({
      title: "Are you sure you want to delete this message!",
      content: "this action will permanenlty delete this message",
      confirmText: "delete",
      cancelText: "cancel",
      onConfirm: async () => {
        try {
          if (messageId) {
            await deleteMessage(messageId);
            toast.success("deleted");
          }
        } catch (error) {
          console.error(error);
          toast.error("delete failed");
        }
      },
    });
  };

  return (
    <div className={`flex flex-col flex-1 ${className}`} style={style}>
      <div
        ref={scrollContainerRef}
        className="w-full flex flex-1 flex-col border-b border-[#2C2C38] py-10 px-4 gap-3 relative overflow-y-auto scrollbar-hide"
      >
        {loading && (
          <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center text-6xl">
            <Loading />
          </div>
        )}
        {!loading && session && (
          <>
            {renderMessages(
              session,
              sendingMessages,
              handleEditMessage,
              handleDeleteMessage,
              expandedVoiceCallIds,
              handleToggleVoiceCallExpand
            )}
          </>
        )}
      </div>
      {!loading && session && (
        <Sender ref={senderRef} onSendMessage={handleSendingMessage} />
      )}
    </div>
  );
};
