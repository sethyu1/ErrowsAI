import {
  GiftIcon,
  ImageIcon,
  VoiceIcon,
  TelephoneIcon,
  TakePhotoIcon,
  ChatSettingIcon,
  SendIcon,
  ResetIcon,
  PlusIcon,
  MinusIcon,
} from "@errows/icons";

import { useState, useRef, forwardRef, useImperativeHandle, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  Button,
  Textarea,
} from "@errows/design";
import { ChatMenu } from "../chat-menu";
import { useMobile } from "@/hooks/use-mobile-detector";
import { suggestMessageApi } from "@/apis/chat";
import { useGetState } from "ahooks";
import { useChatServices } from "../../services";
import { useNavigate } from "react-router";
import { Gifts } from "../gifts";
interface SenderProps {
  className?: string;
  style?: React.CSSProperties;
  onSendMessage?: (message: string) => void;
}

export interface SenderRef {
  sendMessage: () => void;
  fillMessage: (message: string) => void;
}

export const SenderStatus = {
  SuggestReply: "suggest_reply",
  Act: "act",
  Default: "default",
} as const;

export const Sender = forwardRef<SenderRef, SenderProps>(
  ({ className, style, onSendMessage }, ref) => {
    const { t } = useTranslation();
    const { session, openImageGenerate, voiceCall, openVoiceCall, gifts, sendGift, isGeneratingImage, sendingMessages } =
      useChatServices();
    const navigate = useNavigate();
    const [message, setMessage] = useState("");
    const isMobile = useMobile();
    const [status, setStatus] = useState<
      (typeof SenderStatus)[keyof typeof SenderStatus]
    >(SenderStatus.Default);
    const [suggesting, setSuggesting, getSuggesting] = useGetState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [popover, setPopover] = useState<boolean>(false);
    const [giftPopover, setGiftPopover] = useState<boolean>(false);
    const [bottomBarVisible, setBottomBarVisible] = useState<boolean>(true);
    const [currentTime, setCurrentTime] = useState<number>(Date.now());

    const MAX_WAIT_TIME_MS = 15000; // 15 seconds

    // Update current time every second when waiting for reply (for timeout check)
    useEffect(() => {
      const latestUserMessage = sendingMessages
        ?.filter((m) => m.role === "user" && m.type === "text")
        .slice(-1)[0];

      const isWaiting = latestUserMessage && (
        latestUserMessage.status === "loading" ||
        (latestUserMessage.status === "success" && !latestUserMessage.reply?.content?.trim() && latestUserMessage.reply?.type !== "image")
      );

      if (!isWaiting) {
        return;
      }

      const interval = setInterval(() => {
        setCurrentTime(Date.now());
      }, 1000);

      return () => clearInterval(interval);
    }, [sendingMessages]);

    // Check if we're waiting for character text reply
    const isWaitingForTextReply = useMemo(() => {
      if (!sendingMessages || sendingMessages.length === 0) {
        return false;
      }

      // Find the most recent user text message
      const latestUserMessage = sendingMessages
        .filter((m) => m.role === "user" && m.type === "text")
        .slice(-1)[0];

      if (!latestUserMessage) {
        return false;
      }

      // Check timeout: if 15 seconds have passed since message was sent, enable input
      const sentTime = new Date(latestUserMessage.sended_at).getTime();
      const elapsed = currentTime - sentTime;
      if (elapsed >= MAX_WAIT_TIME_MS) {
        return false; // Timeout reached, enable input
      }

      // If still loading, wait
      if (latestUserMessage.status === "loading") {
        return true;
      }

      // If failed, don't block (enable input)
      if (latestUserMessage.status === "failed") {
        return false;
      }

      // If success, check reply
      const reply = latestUserMessage.reply;
      if (!reply) {
        return true; // No reply yet
      }

      // If reply type is "image" and no content, enable (image-only reply, don't wait)
      if (reply.type === "image" && !reply.content?.trim()) {
        return false;
      }

      // If reply has text content, enable
      if (reply.content?.trim()) {
        return false;
      }

      // Otherwise wait
      return true;
    }, [sendingMessages, currentTime]);
    const handleSend = () => {
      if (message.trim() && !isWaitingForTextReply) {
        // TODO: 发送消息逻辑
        console.log("Sending message:", message);
        setMessage("");
        onSendMessage?.(message);
      }
    };
    const handleSendGift = (gift: API.SESSION.SESSION_GIFT) => {
      sendGift(gift);
      setGiftPopover(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (!isWaitingForTextReply) {
          handleSend();
        }
      }
    };

    const handleSuggestReply = async () => {
      if (getSuggesting()) {
        return;
      }
      setStatus(SenderStatus.SuggestReply);
      setMessage("");
      try {
        setSuggesting(true);
        const { content } = await suggestMessageApi(session!.id);
        setMessage(content);
      } catch (error) {
        console.error(error);
      } finally {
        setSuggesting(false);
      }
    };

    const handleAct = () => {
      if (getSuggesting()) {
        return;
      }
      setStatus(SenderStatus.Act);
      setMessage((prev) => {
        const newMessage = prev + "**";
        const cursorPosition = prev.length + 1; // 光标位置在第一个*之后

        // 将光标置于两个星号之间
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.setSelectionRange(
              cursorPosition,
              cursorPosition
            );
          }
        }, 0);

        return newMessage;
      });
    };

    const handleReset = () => {
      handleSuggestReply();
    };

    // const applyImage = async () => {
    //   console.log("Applying image...");
    //   if (getSuggesting()) {
    //     return;
    //   }
    //   try {
    //     if (session?.id) {
    //       await applyImageApi(session!.id);
    //     }
    //   } catch (error) {
    //     console.error("Failed to apply image:", error);
    //   }
    // };

    const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (getSuggesting()) {
        //如果用户现在正在生成建议，暂时不让用户输入
        return;
      }
      setMessage(e.target.value);
      setStatus(SenderStatus.Default);
    };

    const handleFillMessage = (message: string) => {
      setMessage(message);
      setStatus(SenderStatus.Default);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }, 0);
    };

    useImperativeHandle(ref, () => ({
      sendMessage: handleSend,
      fillMessage: handleFillMessage,
    }));

    return (
      <div
        className={`flex flex-col w-full px-4 py-2 ${className}`}
        style={style}
      >
        {/* suggest reply  */}
        {status === SenderStatus.SuggestReply && (
          <div className="flex justify-between items-center mb-3">
            <span
              style={{
                fontFamily: "Urbanist",
                fontWeight: 400,
                fontStyle: "italic",
                fontSize: "13px",
                textAlign: "justify",
                color: "#A4ACB9",
              }}
            >
              {t("chat.sender.suggestedReply")}
            </span>
            <div className="flex items-center gap-1">
              <Button
                onClick={handleReset}
                variant="ghost"
                className="w-5 h-5"
                disabled={suggesting}
              >
                <ResetIcon
                  className={`w-4 h-4 ${suggesting ? "animate-spin" : ""}`}
                />
              </Button>

              <span
                style={{
                  color: "#FCFCFC",
                  fontFamily: "Urbanist",
                  fontWeight: 400,
                  fontSize: "12px",
                }}
              >
                {t("chat.sender.reset")}
              </span>
            </div>
          </div>
        )}
        {/* 输入区域 */}
        <div className="flex items-center gap-[10px] mb-3">
          <div
            className="flex w-full p-[2px] gap-2 border border-input rounded-full focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[1px] transition-[border-color,box-shadow]"
            style={{ borderRadius: "20px" }}
          >
            <Textarea
              ref={textareaRef}
              placeholder={isWaitingForTextReply ? "Please wait for a response..." : t("chat.sender.placeholder")}
              className="bg-transparent shrink-0 flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none h-10 overflow-y-auto scrollbar-hide"
              style={{
                fontFamily: "Urbanist",
                // fontWeight: 700,
                fontSize: "14px",
                background: "none",
              }}
              autoResize
              minHeight={40}
              maxHeight={90}
              value={message}
              onChange={handleMessageChange}
              onKeyDown={handleKeyDown}
              disabled={isWaitingForTextReply}
            />
            <Button
              onClick={handleSend}
              disabled={!message.trim() || isWaitingForTextReply}
              className="w-9 h-9 rounded-full mb-[2px] bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shrink-0 self-end"
            >
              <SendIcon className="w-5 h-5 text-white" />
            </Button>
          </div>
          {isMobile && (
            <Button
              variant="secondary"
              size="icon"
              className="size-9 rounded-full"
              onClick={() => setBottomBarVisible(prev => !prev)}
            >
              {bottomBarVisible ? <MinusIcon className="w-5 h-5" /> : <PlusIcon />}
            </Button>
          )}
        </div>

        {/* 底部功能栏 */}
        <div className={`flex items-center gap-1 overflow-hidden flex-shrink-0 transition-all duration-300 ${bottomBarVisible ? "opacity-100" : "opacity-0"}`}
          style={{
            height: (bottomBarVisible || !isMobile) ? "36px" : "0px",
          }}
        >
          <Button
            appearance={
              status === SenderStatus.SuggestReply
                ? "gradientOutline"
                : undefined
            }
            onClick={handleSuggestReply}
            className="py-1.5 bg-[#1A1B23] text-gray-400 text-sm rounded-full hover:bg-[#2A2B33] transition-colors whitespace-nowrap flex-shrink min-w-[60px] px-2 sm:px-4"
          >
            <span className="hidden sm:inline">
              {t("chat.sender.suggestReply")}
            </span>
            <span className="inline sm:hidden">{t("chat.sender.suggest")}</span>
          </Button>
          <Button
            appearance={
              status === SenderStatus.Act ? "gradientOutline" : undefined
            }
            onClick={handleAct}
            className="px-4 py-1.5 bg-[#1A1B23] text-gray-400 text-sm rounded-full hover:bg-[#2A2B33] transition-colors whitespace-nowrap flex-shrink-0"
          >
            {t("chat.sender.act")}
          </Button>
          <div className="flex items-center gap-[6px] ml-auto flex-shrink-0">
            {/* <Popover
              modal={isMobile}
              open={giftPopover}
              onOpenChange={setGiftPopover}
            >
              <PopoverTrigger asChild>
                <Button className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-[#1A1B23] flex items-center justify-center hover:bg-[#2A2B33] transition-colors">
                  <GiftIcon className="w-5 h-5 text-gray-400" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                side="top"
                align="end"
                sideOffset={8}
                className="z-[9999]"
              >
                <Gifts gifts={gifts} onSendGift={handleSendGift} />
              </PopoverContent>
            </Popover> */}
            <Button
              onClick={openImageGenerate}
              disabled={isGeneratingImage}
              className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-[#1A1B23] flex items-center justify-center hover:bg-[#2A2B33] transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
            >
              <ImageIcon className="w-5 h-5 text-gray-400" />
            </Button>
            <Button
              className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-[#1A1B23] flex items-center justify-center hover:bg-[#2A2B33] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => openVoiceCall()}
              disabled={!session?.id}
              title={t("chat.voiceCall", "Voice call")}
            >
              <TelephoneIcon className="w-5 h-5 text-gray-400" />
            </Button>
            <Popover modal={isMobile} open={popover} onOpenChange={setPopover}>
              <PopoverTrigger asChild>
                <Button
                  onClick={() => setPopover(true)}
                  className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-[#1A1B23] flex items-center justify-center hover:bg-[#2A2B33] transition-colors"
                >
                  <ChatSettingIcon className="w-5 h-5 text-gray-400" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                side="top"
                align="end"
                sideOffset={8}
                className="z-[9999]"
              >
                <ChatMenu close={() => setPopover(false)} />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>
    );
  }
);

Sender.displayName = "Sender";
