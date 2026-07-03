import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Switch } from "@errows/design";
import { ChevronRight } from "lucide-react";
import { useChatServices } from "../../services";

interface ChatMenuProps {
  close: () => void;
}

export function ChatMenu({ close }: ChatMenuProps) {
  const { t } = useTranslation();
  const { chatSettings, session, updateSessionSettings } = useChatServices();
  // console.log("session============>>>", session);
  const [ttsEnabled, setTtsEnabled] = useState(session?.settings.auto_tts);
  const [inChatImageEnabled, setInChatImageEnabled] = useState(
    session?.settings.auto_picture
  );

  const handleTtsChange = (checked: boolean) => {
    try {
      setTtsEnabled(checked);
      updateSessionSettings({
        ...session?.settings,
        auto_tts: checked,
      } as API.SESSION.SESSION_SETTING);
    } catch (error) {
      setTtsEnabled(!checked);
      console.error(error);
    }
  };

  const handleInChatImageChange = (checked: boolean) => {
    try {
      setInChatImageEnabled(checked);
      updateSessionSettings({
        ...session?.settings,
        auto_picture: checked,
      } as API.SESSION.SESSION_SETTING);
    } catch (error) {
      setInChatImageEnabled(!checked);
      console.error(error);
    }
  };
  return (
    <div className="flex flex-col gap-2 py-2 w-[191px]">
      {/* TTS Toggle */}
      {/* <div className="flex items-center justify-between px-4 py-3">
        <span className="text-base font-medium text-white">{t("chat.setting.tts")}</span>
        <Switch checked={ttsEnabled} onCheckedChange={handleTtsChange} />
      </div> */}

      {/* In-chat image Toggle */}
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-base font-medium text-white">{t("chat.setting.inChatImage")}</span>
        <Switch
          checked={inChatImageEnabled}
          onCheckedChange={handleInChatImageChange}
        />
      </div>

      {/* Chat Setting Navigation */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-white/5 active:bg-white/10 transition-colors"
        onClick={() => {
          // onOpenSettings?.();
          chatSettings.open({
            sid: session?.id,
            cid: session?.character.id!,
            pid: session?.persona.id,
            memory: session?.settings.memory,
            model: session?.settings.model,
          });
          close();
        }}
      >
        <span className="text-base font-medium text-white">{t("chat.setting.chatSetting")}</span>
        <ChevronRight className="w-5 h-5 text-white/60" />
      </div>
    </div>
  );
}
