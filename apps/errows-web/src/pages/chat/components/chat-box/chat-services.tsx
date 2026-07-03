// import React, { useState } from "react";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
// } from "@errows/design";
// import {
//   Drawer,
//   DrawerContent,
//   DrawerClose,
//   DrawerHeader,
//   DrawerTitle,
//   DrawerDescription,
// } from "@errows/design/components/drawer";
// import ChatSettings from "../chat-settings";
// import { VoiceCall } from "../voice-call";
// import { useModal } from "@/hooks/use-modal";
// import type { UseModalReturn } from "@/hooks/use-modal";
// import type { ChatSettingsValue, SubmitParams } from "../chat-settings";
// import {
//   createSessionPersonaApi,
//   updateSessionPersonaApi,
//   createSessionApi,
//   updateSessionSettingApi,
// } from "@/apis/session";
// import { useNavigate } from "react-router";
// import { useIsMobile } from "@/hooks/use-mobile";
// import { cn } from "@errows/design/lib/utils";

// interface ChatServicesProps {
//   chatSettings: UseModalReturn<ChatSettingsValue>;
//   voiceCall: UseModalReturn<boolean>;
// }

// export const ChatServices: React.FC<ChatServicesProps> = (props) => {
//   const { chatSettings, voiceCall } = props;
//   const navigate = useNavigate();
//   const [submitting, setSubmitting] = useState(false);
//   const isMobile = useIsMobile();
//   const handleChatSettingsSubmit = async (params: SubmitParams) => {
//     // console.log(params);
//     try {
//       if (params.cid && params.identity) {
//         setSubmitting(true);
//         //未激活状态，需要先创建人设
//         let pid = params.identity.id;
//         if (params.identity?.inactive) {
//           //创建人设
//           const { id } = await createSessionPersonaApi({
//             name: params.identity.name,
//             description: params.identity.description,
//           });
//           pid = id;
//           console.log("创建人设成功========>>", id);
//         } else {
//           //已激活状态，需要先更新人设
//           const res = await updateSessionPersonaApi(params.identity.id, {
//             name: params.identity.name,
//             description: params.identity.description,
//           });
//           console.log("更新人设成功========>>", res);
//         }
//         console.log("当前人设id========>>", pid, params.sid);
//         if (!params.sid) {
//           //创建对话
//           console.log("创建对话...");
//           const { id } = await createSessionApi(pid, params.cid, {
//             memory: params.memory,
//             model: params.model,
//           } as API.SESSION.SESSION_SETTING);
//           console.log("创建对话成功========>>", id);
//           navigate(`#${id}`);
//         } else {
//           //更新对话设置
//           await updateSessionSettingApi(params.sid, {
//             memory: params.memory,
//             model: params.model,
//           } as API.SESSION.SESSION_SETTING);
//           console.log("更新对话设置成功========>>");
//         }
//         chatSettings.close();
//       }
//     } catch (error) {
//       console.error(error);
//     } finally {
//       setSubmitting(false);
//     }
//   };
//   return (
//     <>
//       {!isMobile ? (
//         <Dialog
//           open={chatSettings?.visible}
//           // onOpenChange={()=>{}}
//           onOpenChange={chatSettings.close}
//           modal
//         >
//           <DialogContent className="w-full max-w-[500px] max-sm:w-[calc(100vw-32px)] max-h-[90vh] overflow-y-auto overflow-x-hidden bg-[#0A0A0F] border-[#2C2C38]">
//             <DialogHeader>
//               <DialogTitle className="text-white">Chat Settings</DialogTitle>
//             </DialogHeader>
//             <ChatSettings
//               onSubmit={handleChatSettingsSubmit}
//               value={chatSettings?.data}
//               submitting={submitting}
//             />
//           </DialogContent>
//         </Dialog>
//       ) : (
//         <Drawer
//           open={chatSettings?.visible}
//           onOpenChange={chatSettings.close}
//           direction="right"
//         >
//           <DrawerContent
//             className={cn(
//               "z-1000 data-[vaul-drawer-direction=right]:w-screen",
//               "bg-[#101018]"
//             )}
//           >
//             <DrawerHeader>
//               <DrawerTitle className="text-white">Chat Settings</DrawerTitle>
//             </DrawerHeader>
//             <ChatSettings
//               onSubmit={handleChatSettingsSubmit}
//               value={chatSettings?.data}
//               submitting={submitting}
//             />
//           </DrawerContent>
//         </Drawer>
//       )}
//       {/* 语音聊天 */}
//       <Dialog
//         open={voiceCall?.visible}
//         //  onOpenChange={voiceCall.close}
//       >
//         <DialogContent
//           className="w-[300px] h-[380px] p-0 overflow-hidden"
//           showCloseButton={false}
//           onInteractOutside={(e) => e.preventDefault()}
//           onEscapeKeyDown={(e) => e.preventDefault()}
//         >
//           <VoiceCall
//             username="Alice"
//             onHangup={() => voiceCall?.close()}
//             isActive={true} // 控制音频波形动画
//           />
//         </DialogContent>
//       </Dialog>
//     </>
//   );
// };

// interface ChatServicesContextValue {
//   chatSettings: UseModalReturn<ChatSettingsValue>;
//   voiceCall: UseModalReturn<boolean>;
// }

// const ChatServicesContext = React.createContext<ChatServicesContextValue>(
//   {} as ChatServicesContextValue
// );

// export const ChatServicesProvider: React.FC<React.PropsWithChildren> = (
//   props
// ) => {
//   const { children } = props;
//   const chatSettings = useModal<ChatSettingsValue>();
//   const voiceCall = useModal<boolean>();
//   return (
//     <ChatServicesContext.Provider value={{ chatSettings, voiceCall }}>
//       {children}
//       <ChatServices chatSettings={chatSettings} voiceCall={voiceCall} />
//     </ChatServicesContext.Provider>
//   );
// };

// export const useChatServices = () => {
//   return React.useContext(ChatServicesContext);
// };
