import React from "react";
import { RoleDetail } from "@/components/role-detail";
import { useModal } from "@/hooks/use-modal";
import { install } from "@/lib/install-service";
import { useChatServices, ChatServicesProvider } from "@/pages/chat/services";
import type { UseModalReturn } from "@/hooks/use-modal";
import type { ChatSettingsValue } from "@/pages/chat/components/chat-settings";

interface CharacterServicesContextValue {
  open: (id: string) => void;
  chatSettings: UseModalReturn<ChatSettingsValue>;
}

const CharacterServicesContext =
  React.createContext<CharacterServicesContextValue>(
    {} as CharacterServicesContextValue
  );

export const CharacterServicesProvider: React.FC<React.PropsWithChildren> =
  install((props) => {
    const { children } = props;
    const { chatSettings } = useChatServices();
    const { data: id, visible, open, close } = useModal<string>();


    const handleChat = () => {
      if (id && chatSettings?.open) {
        chatSettings.open({
          cid: id,
        });
      }
    };

    return (
      <CharacterServicesContext.Provider value={{ open, chatSettings }}>
        {children}
        {id && (
          <RoleDetail
            characterId={id}
            open={visible}
            onOpenChange={close}
            onChat={handleChat}
          />
        )}
      </CharacterServicesContext.Provider>
    );
  }, [ChatServicesProvider]);

export const useCharacterServices = () => {
  return React.useContext(CharacterServicesContext);
};
