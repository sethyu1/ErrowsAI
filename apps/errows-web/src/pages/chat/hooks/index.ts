import {
  listSessionApi,
  getSessionApi,
  deleteSessionApi,
  listSessionGiftApi,
} from "@/apis/session";
import {
  sendMessageStreamApi,
  deleteMessageApi,
  applyImageApi,
  editMessageApi,
  hangupApi,
  sendGiftApi,
} from "@/apis/chat";
import { sanitizeText } from "@/utils";
import { useState, useEffect, useReducer, useRef } from "react";
import { useLocation, useNavigate } from "react-router";
import { v4 as uuidv4 } from "uuid";

export interface SendingMessage extends Omit<API.SESSION.SESSION_MESSAGE, 'id'>{
  requestId: string;
  // type: "image" | "text" | "voice_call" | "gift";
  // message: string;
  reply?: API.SESSION.MESSAGE_REPLY & Omit<SendingMessage, 'reply'>;
  // status: "loading" | "success" | "failed";
  // role: "user" | "character";
  // time: string;
}

export const useChat = () => {
  const [sessions, setSessions] = useState<API.SESSION.SESSION_SUMMARY[]>([]);
  const [session, setSession] = useState<API.SESSION.SESSION_CHAT_HISTORY>();
  const [loading, setLoading] = useState(false);
  const [sessionDetailLoading, setSessionDetailLoading] = useState(false);
  // const [notFoundSession, setNotFoundSession] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const sessionId = location.hash?.slice(1); // 去掉 # 号，得到聊天ID
  const [_, refresh] = useReducer((x) => x + 1, 0);
  const [sendingMessages, setSendingMessages] = useState<SendingMessage[]>([]);
  const [gifts, setGifts] = useState<API.SESSION.SESSION_GIFT[]>([]);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const pollingIntervalsRef = useRef<Map<string, number>>(new Map());
  useEffect(() => {
    (async () => {
      //TODO: 这里需要优化,后面通过参数配置来实现
      const isHome = location.pathname === "/";
      if (isHome) {
        return;
      }
      try {
        setLoading(true);
        const [sessions, gifts] = await Promise.all([
          listSessionApi(),
          listSessionGiftApi(),
        ]);
        setSessions(sessions);
        setGifts(gifts);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    })();
  }, [_]);

  useEffect(() => {
    setSendingMessages([]);
  }, [sessionId]);

  useEffect(() => {
    (async () => {
      try {
        if (sessionId) {
          setSessionDetailLoading(true);
          const res = await getSessionApi(sessionId);
          setSession(res);
          
          const messagesNeedingPoll = res.messages?.filter(
            (m) => m.type === "image" && m.image_url && 
            (m.image_url === "null" || m.image_url === "undefined" || m.image_url.endsWith("/null"))
          ) || [];
          
          messagesNeedingPoll.forEach((msg) => {
            const pollKey = `session-${msg.id}`;
            if (!pollingIntervalsRef.current.has(pollKey)) {
              const pollInterval = setInterval(async () => {
                try {
                  const updatedSession = await getSessionApi(sessionId);
                  const updatedMessage = updatedSession.messages?.find(
                    (m) => m.id === msg.id
                  );
                  
                  const imageUrl = updatedMessage?.image_url;
                  const isValidImageUrl = imageUrl && 
                    imageUrl !== "null" && 
                    imageUrl !== "undefined" && 
                    !imageUrl.endsWith("/null") &&
                    (imageUrl.startsWith("http://") || imageUrl.startsWith("https://"));
                  
                  if (isValidImageUrl) {
                    if (pollingIntervalsRef.current.has(pollKey)) {
                      clearInterval(pollingIntervalsRef.current.get(pollKey)!);
                      pollingIntervalsRef.current.delete(pollKey);
                    }
                    setSession((prevSession) => {
                      if (!prevSession) return prevSession;
                      return {
                        ...prevSession,
                        messages: prevSession.messages?.map((m) =>
                          m.id === msg.id
                            ? { ...m, image_url: imageUrl }
                            : m
                        ) || [],
                      };
                    });
                  }
                } catch (error) {
                  console.error("Failed to poll for image:", error);
                }
              }, 500);
              
              pollingIntervalsRef.current.set(pollKey, pollInterval);
              
              setTimeout(() => {
                if (pollingIntervalsRef.current.has(pollKey)) {
                  clearInterval(pollingIntervalsRef.current.get(pollKey)!);
                  pollingIntervalsRef.current.delete(pollKey);
                }
              }, 120000);
            }
          });
        }
      } catch (error) {
        console.error(error);
        // setNotFoundSession(true);
        navigate("/chat");
      } finally {
        setSessionDetailLoading(false);
      }
    })();
  }, [sessionId, _]);
  
  useEffect(() => {
    return () => {
      pollingIntervalsRef.current.forEach((interval) => {
        clearInterval(interval);
      });
      pollingIntervalsRef.current.clear();
    };
  }, []);

  const selectSession = (selectedId: string) => {
    if (sessionId === selectedId) {
      return;
    }
    setSendingMessages([]);
    navigate(`/chat/#${selectedId}`);
  };

  const back = () => {
    navigate(location.pathname);
  };

  const deleteSession = async (sid: string) => {
    try {
      await deleteSessionApi(sid);
      if (sid === sessionId) {
        back();
        setSession(undefined);
        setSessionDetailLoading(false);
      }
      refresh();
    } catch (error) {
      console.error(error);
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (session?.id && messageId) {
      await deleteMessageApi(session.id, messageId);
      //删除对应的状态
      const sessionMessage = session.messages?.find((m) => m.id === messageId);
      if (sessionMessage) {
        const characterMessage = session.messages?.find(
          (m) => m.reply_to_id === messageId
        );
        setSession((session) => ({
          ...session!,
          messages: session?.messages!?.filter(
            (i) => i.id !== messageId && i.id !== characterMessage?.id
          ),
        }));
        return;
      }

      const senddingMessage = sendingMessages?.find(
        (m) => m.reply?.send_message_id === messageId
      );
      console.log("在发送的消息里面", senddingMessage, messageId);
      if (senddingMessage) {
        setSendingMessages((messages) =>
          messages?.filter((m) => m.reply?.send_message_id !== messageId)
        );
        return;
      }
    }
  };

  const sendMessage = async (message: string) => {
    if (session) {
      const sanitizedMessage = sanitizeText(message);
      if (!sanitizedMessage) return;

      const requestId = uuidv4();
      let streamingContent = "";

      setSendingMessages((sendingMessages) => {
        return [
          ...sendingMessages,
          {
            requestId,
            content: sanitizedMessage,
            type: "text",
            status: "loading",
            role: "user",
            sended_at: new Date().toISOString(),
            id: uuidv4(),
            reply_to_id: "",
            voice_url: null,
            image_url: null,
            edited_at: new Date().toISOString(),
            feedback: null,
          },
        ];
      });

      try {
        for await (const event of sendMessageStreamApi(
          session.id,
          sanitizedMessage
        )) {
          if (event.type === "start") {
            const data = event.data as {
              send_message_id: string;
              reply_message_id: string;
            };

            setSendingMessages((sendingMessages) =>
              sendingMessages.map((item) =>
                item.requestId === requestId
                  ? {
                      ...item,
                      status: "success" as const,
                      reply: {
                        ...item,
                        status: "loading" as const,
                        role: "character" as const,
                        content: "",
                        send_message_id: data.send_message_id,
                        reply_message_id: data.reply_message_id,
                        type: "text" as const,
                        reply_picture_url: null,
                        reply_voice_url: null,
                        send_voice_url: null,
                      },
                    }
                  : item
              )
            );
          } else if (event.type === "chunk") {
            const chunk = event.data as string;
            streamingContent += chunk;

            setSendingMessages((sendingMessages) =>
              sendingMessages.map((item) =>
                item.requestId === requestId && item.reply
                  ? {
                      ...item,
                      reply: {
                        ...item.reply,
                        content: streamingContent,
                      },
                    }
                  : item
              )
            );
          } else if (event.type === "done") {
            const data = event.data as {
              reply_message_id: string;
              content: string;
              type: "text" | "image" | "voice_call" | "gift";
              reply_voice_url: string | null;
              reply_picture_url: string | null;
            };

            setSendingMessages((sendingMessages) =>
              sendingMessages.map((item) =>
                item.requestId === requestId && item.reply
                  ? {
                      ...item,
                      reply: {
                        ...item.reply,
                        status: "success" as const,
                        content: data.content,
                        type: data.type,
                        reply_voice_url: data.reply_voice_url,
                        reply_picture_url: data.reply_picture_url,
                      },
                    }
                  : item
              )
            );

            if (data.type === "image" && !data.reply_picture_url) {
              const pollKey = `${requestId}-${data.reply_message_id}`;

              if (pollingIntervalsRef.current.has(pollKey)) {
                clearInterval(pollingIntervalsRef.current.get(pollKey)!);
              }

              const pollInterval = setInterval(async () => {
                try {
                  const updatedSession = await getSessionApi(session.id);
                  const updatedMessage = updatedSession.messages?.find(
                    (m) => m.id === data.reply_message_id
                  );

                  const imageUrl = updatedMessage?.image_url;
                  const isValidImageUrl =
                    imageUrl &&
                    imageUrl !== "null" &&
                    imageUrl !== "undefined" &&
                    !imageUrl.endsWith("/null") &&
                    (imageUrl.startsWith("http://") ||
                      imageUrl.startsWith("https://"));

                  if (isValidImageUrl) {
                    if (pollingIntervalsRef.current.has(pollKey)) {
                      clearInterval(pollingIntervalsRef.current.get(pollKey)!);
                      pollingIntervalsRef.current.delete(pollKey);
                    }
                    setSendingMessages((sendingMessages) => {
                      const updated = sendingMessages.map((item) =>
                        item.requestId === requestId
                          ? {
                              ...item,
                              reply: {
                                ...item.reply!,
                                reply_picture_url: imageUrl,
                              },
                            }
                          : item
                      );
                      return updated;
                    });
                    setSession((prevSession) => {
                      if (!prevSession) return prevSession;
                      const updated = {
                        ...prevSession,
                        messages:
                          prevSession.messages?.map((msg) =>
                            msg.id === data.reply_message_id
                              ? { ...msg, image_url: imageUrl }
                              : msg
                          ) || [],
                      };
                      return updated;
                    });
                  }
                } catch (error) {
                  console.error("Failed to poll for image:", error);
                }
              }, 500);

              pollingIntervalsRef.current.set(pollKey, pollInterval);

              setTimeout(() => {
                if (pollingIntervalsRef.current.has(pollKey)) {
                  clearInterval(pollingIntervalsRef.current.get(pollKey)!);
                  pollingIntervalsRef.current.delete(pollKey);
                }
              }, 120000);
            }
          } else if (event.type === "image_done") {
            const data = event.data as {
              reply_message_id: string;
              reply_picture_url: string;
            };

            const pollKey = `${requestId}-${data.reply_message_id}`;
            if (pollingIntervalsRef.current.has(pollKey)) {
              clearInterval(pollingIntervalsRef.current.get(pollKey)!);
              pollingIntervalsRef.current.delete(pollKey);
            }

            setSendingMessages((sendingMessages) =>
              sendingMessages.map((item) =>
                item.requestId === requestId && item.reply
                  ? {
                      ...item,
                      reply: {
                        ...item.reply,
                        reply_picture_url: data.reply_picture_url,
                      },
                    }
                  : item
              )
            );
          } else if (event.type === "image_failed") {
            const data = event.data as {
              reply_message_id: string;
            };

            const pollKey = `${requestId}-${data.reply_message_id}`;
            if (pollingIntervalsRef.current.has(pollKey)) {
              clearInterval(pollingIntervalsRef.current.get(pollKey)!);
              pollingIntervalsRef.current.delete(pollKey);
            }

            setSendingMessages((sendingMessages) =>
              sendingMessages.map((item) =>
                item.requestId === requestId && item.reply
                  ? {
                      ...item,
                      reply: {
                        ...item.reply,
                        type: "text" as const,
                      },
                    }
                  : item
              )
            );
          } else if (event.type === "error") {
            const data = event.data as { message: string };
            console.error("Stream error:", data.message);
            setSendingMessages((sendingMessages) =>
              sendingMessages.map((item) =>
                item.requestId === requestId
                  ? { ...item, status: "failed" }
                  : item
              )
            );
          }
        }
      } catch (error) {
        console.error(error);
        setSendingMessages((sendingMessages) =>
          sendingMessages.map((item) =>
            item.requestId === requestId ? { ...item, status: "failed" } : item
          )
        );
      }
    } else {
      console.error("Session does not exist");
    }
  };

  //软删除某条消息
  const softDeleteMessage = async (messageId: string) => {
    if (session) {
      const message = session.messages?.find((m) => m.id === messageId);
      if (message) {
        setSession((session) => ({
          ...session!,
          messages: (session?.messages ?? [])?.filter(
            (m) => m.id !== messageId
          ),
        }));
        return;
      }
      const senddingMessage = sendingMessages?.find(
        (m) => m.reply?.send_message_id === messageId
      );
      if (senddingMessage) {
        setSendingMessages((messages) =>
          messages?.filter((m) => m.reply?.send_message_id !== messageId)
        );
        return;
      }
    }
  };

  const editMessage = async (messageId: string, content: string) => {
    if (session?.id && messageId) {
      const requestId = uuidv4();
      // Sanitize message content to prevent XSS attacks
      const sanitizedContent = sanitizeText(content);
      if (!sanitizedContent) return; // Don't send empty messages
      
      softDeleteMessage(messageId);
      setSendingMessages((sendingMessages) => {
        return [
          ...sendingMessages,
          {
            requestId,
            content: sanitizedContent,
            type: "text",
            status: "loading",
            role: "user",
            sended_at: new Date().toISOString(),
            id: uuidv4(),
            reply_to_id: "",
            voice_url: null,
            image_url: null,
            edited_at: new Date().toISOString(),
            feedback: null,
          },
        ];
      });
      editMessageApi(session.id, messageId, sanitizedContent)
        .then((res) => {
          setSendingMessages((sendingMessages) =>
            sendingMessages.map((item) =>
              item.requestId === requestId
                ? { ...item, status: "success", reply: {...item, ...res} }
                : item
            )
          );
        })
        .catch((error) => {
          console.error(error);
          setSendingMessages((sendingMessages) =>
            sendingMessages.map((item) =>
              item.requestId === requestId
                ? { ...item, status: "failed" }
                : item
            )
          );
        });
    }
  };

  //TODO 索要图片要放到这里来实现
  const applyImage = async () => {
    if (session && !isGeneratingImage) {
      const requestId = uuidv4();
      setIsGeneratingImage(true);
      try {
        if (session.id) {
          setSendingMessages((sendingMessages) => {
            return [
              ...sendingMessages,
              {
                requestId,
                content: "",
                type: "image",
                status: "loading",
                role: "character",
                sended_at: new Date().toISOString(),
                id: uuidv4(),
                reply_to_id: "",
                voice_url: null,
                image_url: null,
                edited_at: new Date().toISOString(),
                feedback: null,
              },
            ];
          });
          const res = await applyImageApi(session!.id);
          setSendingMessages((sendingMessages) =>
            sendingMessages.map((item) =>
              item.requestId === requestId
                ? {
                    ...item,
                    status: "success",
                    message: res.reply_picture_url,
                    reply: {...item, status: "success", ...res},
                  }
                : item
            )
          );
        }
      } catch (error) {
        console.error(error);
        setSendingMessages((sendingMessages) =>
          sendingMessages.map((item) =>
            item.requestId === requestId ? { ...item, status: "failed" } : item
          )
        );
      } finally {
        setIsGeneratingImage(false);
      }
    }
  };

  const hangup = async (callId: string) => {
    if (session) {
      const requestId = uuidv4();
      try {
        if (session.id) {
          setSendingMessages((sendingMessages) => {
            return [
              ...sendingMessages,
              {
                requestId,
                content: "",
                type: "voice_call",
                status: "loading",
                role: "user",
                sended_at: new Date().toISOString(),
                id: uuidv4(),
                reply_to_id: "",
                voice_url: null,
                image_url: null,
                edited_at: new Date().toISOString(),
                feedback: null,
              },
            ];
          });
          const res = await hangupApi(session.id, callId);
          setSendingMessages((sendingMessages) =>
            sendingMessages.map((item) =>
              item.requestId === requestId
                ? { ...item, status: "success", reply: {...item, status: "success", ...res} }
                : item
            )
          );
        }
      } catch (error) {
        console.error(error);
        setSendingMessages((sendingMessages) =>
          sendingMessages.map((item) =>
            item.requestId === requestId ? { ...item, status: "failed" } : item
          )
        );
      }
    }
  };
  const sendGift = async (gift: API.SESSION.SESSION_GIFT) => {
    if (session) {
      const requestId = uuidv4();
      try {
        if (session.id) {
          setSendingMessages((sendingMessages) => {
            return [
              ...sendingMessages,
              {
                requestId,
                content: "",
                image_url: gift.picture_url,
                type: "gift",
                status: "loading",
                role: "user",
                sended_at: new Date().toISOString(),
                id: uuidv4(),
                reply_to_id: "",
                voice_url: null,
                edited_at: new Date().toISOString(),
                feedback: null,
              },
            ];
          });
          const res = await sendGiftApi(session.id, gift.id);
          setSendingMessages((sendingMessages) =>
            sendingMessages.map((item) =>
              item.requestId === requestId
                ? { ...item, status: "success", reply: {...item, status: "success", ...res} }
                : item
            )
          );
        }
      } catch (error) {
        console.error(error);
        setSendingMessages((sendingMessages) =>
          sendingMessages.map((item) =>
            item.requestId === requestId ? { ...item, status: "failed" } : item
          )
        );
      }
    }
  };

  return {
    sessionId,
    sendingMessages,
    setSendingMessages,
    deleteMessage,
    sendMessage,
    loading,
    session,
    sessions,
    selectSession,
    back,
    sessionDetailLoading,
    currentSessionSummary: sessions.find((session) => session.id === sessionId),
    deleteSession,
    // notFoundSession,
    refresh,
    setSession,
    applyImage,
    softDeleteMessage,
    editMessage,
    hangup,
    gifts,
    sendGift,
    isGeneratingImage,
  };
};
