import React, { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  toast,
  Button,
} from "@errows/design";
import ChatSettings from "../components/chat-settings";
import { VoiceCall } from "../components/voice-call";
import { useModal } from "@/hooks/use-modal";
import { useGlobalStore } from "@/stores/global";
import type { UseModalReturn } from "@/hooks/use-modal";
import type {
  ChatSettingsValue,
  SubmitParams,
} from "../components/chat-settings";
import {
  createSessionPersonaApi,
  updateSessionPersonaApi,
  createSessionApi,
  updateSessionSettingApi,
  listSessionApi,
  deleteSessionApi,
} from "@/apis/session";
import { useNavigate } from "react-router";
import { useChat } from "../hooks";
import { hangupApi } from "@/apis/chat";
import { useMemberInfo } from "@/services/member";
import { useAuthStore } from "@/stores/auth";
import { useTranslation } from "react-i18next";
import {
  Sheet,
  SheetContent,
  SheetClose,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@errows/design/components/sheet";
import { NavBar } from "@/components/nav-bar";
import { useIsMobile } from "@/hooks/use-mobile";
import { CloseIcon } from "@errows/icons";

interface ChatServicesContextValue extends ReturnType<typeof useChat> {
  chatSettings: UseModalReturn<ChatSettingsValue>;
  voiceCall: UseModalReturn<boolean>;
  updateSessionSettings: (
    settings: API.SESSION.SESSION_SETTING
  ) => Promise<void>;
  openVoiceCall: () => Promise<void>;
  openImageGenerate: () => void;
}

const ChatServicesContext = React.createContext<ChatServicesContextValue>(
  {} as ChatServicesContextValue
);

export const ChatServicesProvider: React.FC<React.PropsWithChildren> = (
  props
) => {
  const { children } = props;
  const chatSettings = useModal<ChatSettingsValue>();
  const voiceCall = useModal<boolean>();
  const setOpenSubscribeModal = useGlobalStore(
    (s) => s.setOpenSubscribeModal
  );
  const token = useAuthStore((s) => s.token);
  const { data: memberData } = useMemberInfo(!!token);
  const memberPlan = memberData?.plan;
  const isMember = memberPlan === "star" || memberPlan === "galaxy" || memberPlan === "luna" || memberPlan === "cd-key";
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [submitting, setSubmitting] = useState(false);
  const myChat = useChat();
  const { refresh, session, setSession, hangup, setSendingMessages, applyImage } = myChat;
  const drawerContainerRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();
  const handleHangup = (
    callId: string,
    segments?: { transcript_user: string; transcript_character: string[] }[]
  ) => {
    voiceCall.close();
    setSendingMessages((prev) =>
      prev.filter((m) => !String(m.requestId ?? "").startsWith("voice-"))
    );
    if (session?.id) {
      hangupApi(session.id, callId, segments?.length ? { segments } : undefined)
        .then(() => {
          refresh();
        })
        .catch((err) => {
          console.warn("[VoiceCall] Hangup API failed", err);
          refresh();
        });
    }
  };

  const startVoiceCall = async () => {
    try {
      if (window.location.protocol !== "https:" && window.location.hostname !== "localhost") {
        alert("Voice call requires HTTPS.\n\nPlease use: https://" + window.location.host + window.location.pathname);
        return;
      }
      if (!navigator.mediaDevices) {
        const reason = !window.isSecureContext
          ? "\n\nUse HTTPS to enable voice call."
          : "\n\nTry Safari (iOS) or Chrome (Android).";
        alert("Your browser does not support voice call." + reason);
        return;
      }
      if (!navigator.mediaDevices.getUserMedia) {
        alert("Your browser is too old for voice call. Please update.");
        return;
      }
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
      stream.getTracks().forEach((t) => t.stop());
      voiceCall.open();
    } catch (error: any) {
      if (error?.name === "NotAllowedError" || error?.name === "PermissionDeniedError") {
        alert("Microphone permission denied. Please allow microphone in browser settings.");
      } else if (error?.name === "NotFoundError") {
        alert("No microphone found. Please check your device.");
      } else {
        alert("Failed to start voice call: " + (error?.message || "Unknown error"));
      }
    }
  };

  const handleOpenVoiceCall = async () => {
    if (isMember) {
      startVoiceCall();
    } else {
      setOpenSubscribeModal(true, {
        characterImageUrl: session?.character?.avatar_url,
        variant: "voicecall",
      });
    }
  };

  const handleOpenImageGenerate = () => {
    if (isMember) {
      applyImage?.();
    } else {
      setOpenSubscribeModal(true, {
        characterImageUrl: session?.character?.avatar_url,
        variant: "image",
      });
    }
  };

  // 处理移动端键盘弹出时的布局问题
  useEffect(() => {
    if (!isMobile || !chatSettings?.visible) return;

    const handleResize = () => {
      if (drawerContainerRef.current) {
        // 使用 visualViewport 获取实际可见高度
        const viewportHeight =
          window.visualViewport?.height || window.innerHeight;
        drawerContainerRef.current.style.height = `${viewportHeight}px`;
      }
    };

    // 监听视口变化
    window.visualViewport?.addEventListener("resize", handleResize);
    // 初始化时也要设置一次
    handleResize();

    return () => {
      window.visualViewport?.removeEventListener("resize", handleResize);
    };
  }, [isMobile, chatSettings?.visible]);

  const updateSessionSettings = async (
    settings: API.SESSION.SESSION_SETTING
  ) => {
    try {
      if (session?.id) {
        await updateSessionSettingApi(session?.id!, settings);
        //更新一下内存中的会话设置
        setSession((prev) => (prev ? { ...prev, settings } : undefined));
        toast.success(t("chat.setting.settingsUpdatedSuccessfully"));
      }
    } catch (error) {
      console.error(error);
      toast.error(t("chat.setting.failedToUpdateSettings"));
      throw error;
    }
  };

  const handleChatSettingsSubmit = async (params: SubmitParams) => {
    // console.log(params);
    try {
      if (params.cid && params.identity) {
        setSubmitting(true);
        const sessionList: API.SESSION.SESSION_SUMMARY[] =
          await listSessionApi();
        //未激活状态，需要先创建人设
        let pid = params.identity.id;
        if (params.identity?.inactive) {
          //创建人设
          const { id } = await createSessionPersonaApi({
            name: params.identity.name,
            description: params.identity.description,
          });
          pid = id;
          console.log("创建人设成功========>>", id);
        } else {
          //已激活状态，需要先更新人设
          const res = await updateSessionPersonaApi(params.identity.id, {
            name: params.identity.name,
            description: params.identity.description,
          });
          console.log("更新人设成功========>>", res);
        }
        console.log("当前人设id========>>", pid, params.sid);
        //在此过程中会更新角色身份，这个时候需要先判断是否已经存在会话，如果存在则更新会话设置，否则创建会话
        const currentSession = sessionList?.find(
          (item) =>
            item.character?.id === params.cid && item.persona?.id === pid
        );
        if (!currentSession) {
          console.log("创建对话...");
          const { id } = await createSessionApi(pid, params.cid, {
            memory: params.memory,
            model: params.model,
          } as API.SESSION.SESSION_SETTING);
          console.log("创建对话成功========>>", id);
          if (params.sid) {
            try {
              await deleteSessionApi(params.sid);
              console.log("删除旧对话成功========>>", params.sid);
            } catch (e) {
              console.error("删除旧对话失败:", e);
            }
          }
          setSession(undefined);
          navigate(`/chat/#${id}`);
          refresh();
        } else {
          //更新对话设置
          const sid = params.sid || currentSession?.id;
          if (!sid) {
            toast.error("会话不存在，请先创建会话");
            return;
          }
          await updateSessionSettingApi(sid, {
            memory: params.memory,
            model: params.model,
          } as API.SESSION.SESSION_SETTING);
          setSession((prev) =>
            prev
              ? {
                  ...prev,
                  settings: {
                    memory: params.memory,
                    model: params.model,
                  } as API.SESSION.SESSION_SETTING,
                }
              : undefined
          );
          navigate(`/chat/#${sid}`);
          console.log("更新对话设置成功========>>");
          refresh();
        }
        chatSettings.close();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSelf = () => {
    chatSettings.close();
    navigate("/chat");
    setSession(undefined);
    // 延迟一下，让页面有时间跳转
    setTimeout(() => {
      refresh();
    }, 100);

  };

  return (
    <ChatServicesContext.Provider
      value={{ ...myChat, chatSettings, voiceCall, updateSessionSettings, openVoiceCall: handleOpenVoiceCall, openImageGenerate: handleOpenImageGenerate }}
    >
      {children}
      {!isMobile && (
        <Dialog
          open={chatSettings?.visible}
          onOpenChange={chatSettings.close}
          modal
        >
          <DialogContent
            className="flex flex-col w-full max-w-[500px] max-sm:w-[calc(100vw-32px)] max-h-[90vh] overflow-y-auto overflow-x-hidden bg-[#0A0A0F] border-[#2C2C38] "
            aria-describedby={undefined}
          >
            <DialogHeader>
              <DialogTitle className="text-white">{t("chat.setting.chatSetting")}</DialogTitle>
            </DialogHeader>
            <ChatSettings
              onSubmit={handleChatSettingsSubmit}
              value={chatSettings?.data}
              submitting={submitting}
              onDeleteSelf={handleDeleteSelf}
            />
          </DialogContent>
        </Dialog>
      )}

      {isMobile && (
        <Sheet open={chatSettings?.visible} onOpenChange={chatSettings.close}>
          <SheetContent
            ref={drawerContainerRef}
            className="w-screen h-screen fixed top-0 left-0 right-0 bottom-0 z-1000 bg-[#1b1227] [&>button]:hidden"
          >
            <div className="w-full h-full flex flex-col">
              {/* <NavBar title={"Profile"} onBack={() => chatSettings.close()} /> */}
              <div className="flex items-center px-3 h-[72px] gap-4 border-b border-[#2C2C38] flex-shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-6 h-6"
                  onClick={chatSettings.close}
                >
                  <CloseIcon className="w-4 h-4" />
                </Button>
                <span className="text-white text-[18px] font-bold text-[#FCFCFC]">
                  {t("chat.setting.chatSetting")}
                </span>
              </div>
              <ChatSettings
                onSubmit={handleChatSettingsSubmit}
                value={chatSettings?.data}
                submitting={submitting}
                className="p-3"
                onDeleteSelf={handleDeleteSelf}
              />
            </div>
          </SheetContent>
        </Sheet>
      )}

      {!isMobile && (
        <Dialog open={voiceCall?.visible} onOpenChange={voiceCall.close}>
          <DialogContent
            className="w-[300px] h-[380px] p-0 overflow-hidden"
            showCloseButton={false}
            onInteractOutside={(e) => e.preventDefault()}
            onEscapeKeyDown={(e) => e.preventDefault()}
            aria-describedby={undefined}
          >
            <DialogTitle className="sr-only">Voice call</DialogTitle>
            {session?.id && (
              <VoiceCall
                sid={session?.id}
                username={session?.character?.nickname || "AI"}
                avatar={session?.character?.avatar_url}
                onHangup={handleHangup}
              />
            )}
          </DialogContent>
        </Dialog>
      )}
      {isMobile && (
        <Sheet open={voiceCall?.visible} onOpenChange={voiceCall.close}>
          <SheetContent className="w-screen h-screen flex justify-center items-center fixed top-0 left-0 right-0 bottom-0 z-1001 bg-[#000]/50 [&>button]:hidden">
            {session?.id && (
              <VoiceCall
                sid={session?.id}
                username={session?.character?.nickname || "AI"}
                avatar={session?.character?.avatar_url}
                onHangup={handleHangup}
              />
            )}
          </SheetContent>
        </Sheet>
      )}
    </ChatServicesContext.Provider>
  );
};

export const useChatServices = () => {
  return React.useContext(ChatServicesContext);
};
