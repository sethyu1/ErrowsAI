import React, { useRef, useState, useEffect } from "react";
import { Tabs, toast } from "@errows/design";
import { useChatServices } from "../../services";
import type { ChatBoxProps } from ".";
import { renderMessages, useAutoScroll } from ".";
import { Loading } from "@/components/loading";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sender, type SenderRef } from "../sender";
import { type SenderStatus } from "./index";
import RoleImageList from "@/pages/multimedia/components/role-image-list";
import RoleVideoList from "@/pages/multimedia/components/role-video-list";

export const ChatBoxMobile: React.FC<ChatBoxProps> = (props) => {
  const { className = "", style, loading } = props;
  const [activeTab, setActiveTab] = useState("chat");
  const [expandedVoiceCallIds, setExpandedVoiceCallIds] = useState<Set<string>>(() => new Set());
  const { session, sendingMessages, sendMessage, deleteMessage, editMessage } =
    useChatServices();
  const scrollContainerRef = useAutoScroll();
  const handleToggleVoiceCallExpand = (messageId: string) => {
    setExpandedVoiceCallIds((prev) => {
      const next = new Set(prev);
      if (next.has(messageId)) next.delete(messageId);
      else next.add(messageId);
      return next;
    });
  };
  const isMobile = useIsMobile();
  const tabItems = [
    { key: "chat", label: "Chat" },
    { key: "image", label: "Image" },
    { key: "video", label: "Video" },
  ];
  const senderRef = useRef<SenderRef>(null);
  const statusRef = useRef<{ status: SenderStatus; messageId?: string }>({
    status: "sending",
  });
  const containerRef = useRef<HTMLDivElement>(null);

  // 处理移动端键盘弹出时的布局问题
  // useEffect(() => {
  //   if (!isMobile) return;

  //   const handleResize = () => {
  //     if (containerRef.current) {
  //       // 使用 visualViewport 获取实际可见高度
  //       const viewportHeight =
  //         window.visualViewport?.height || window.innerHeight;
  //       // 减去头部的 72px
  //       containerRef.current.style.height = `${viewportHeight - 72}px`;
  //     }
  //   };

  //   // 监听视口变化
  //   window.visualViewport?.addEventListener("resize", handleResize);
  //   // 初始化时也要设置一次
  //   handleResize();

  //   return () => {
  //     window.visualViewport?.removeEventListener("resize", handleResize);
  //   };
  // }, [isMobile]);

  const handleEditMessage = async (messageId: string, content: string) => {
    // toast.info("编辑功能即将上线");
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

  //TODO暂时没有确认
  const handleDeleteMessage = async (messageId: string) => {
    try {
      if (messageId) {
        await deleteMessage(messageId);
        toast.success("deleted");
      }
    } catch (error) {
      console.error(error);
      toast.error("delete failed");
    }
  };

  return (
    <div
      ref={containerRef}
      className={`${className} flex flex-col bg-[#101018]`}
      style={style}
    >
      {/* Tabs - 44px */}
      <div className="h-[44px] bg-[#0E0F17] border-b border-[#2C2C38] flex items-center shrink-0">
        <Tabs
          items={tabItems}
          activeKey={activeTab}
          onChange={setActiveTab}
          size="small"
          className="w-full justify-around"
        />
      </div>

      {/* 内容区域 */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {activeTab === "chat" && (
          <>
            <div
              ref={scrollContainerRef}
              className="flex-1 flex flex-col pt-[34px] overflow-y-auto scrollbar-hide gap-3 px-5 pb-[203px]"
            >
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
              {loading && (
                <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center text-6xl">
                  <Loading />
                </div>
              )}
            </div>
            <Sender
              ref={senderRef}
              className="w-full bg-[#0E0F17] fixed bottom-0 left-0 right-0 max-h-[203px] px-4 py-2 border-t border-[#2C2C38] shrink-0"
              onSendMessage={handleSendingMessage}
            />
          </>
        )}
        {activeTab === "image" && (
          <div className=" overflow-y-auto scrollbar-hide py-3 px-3">
            {session?.character?.id && (
              <RoleImageList
                // className="flex w-[calc(100%-24px)]"
                roleId={session?.character?.id}
                isMobile={isMobile}
                allowBatchActions={false}
                selectionModeEnabled={false}
              />
            )}
          </div>
        )}
        {activeTab === "video" && (
          <div className=" overflow-y-auto scrollbar-hide py-3 px-3">
            {session?.character?.id && (
              <RoleVideoList
                // className="flex w-[calc(100%-24px)]"
                roleId={session?.character?.id}
                isMobile={isMobile}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
