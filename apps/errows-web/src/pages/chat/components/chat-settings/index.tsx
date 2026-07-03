import React from "react";
import { useTranslation } from "react-i18next";
import { Textarea, Input, Button, alertDialog } from "@errows/design";
import {
  AiIcon,
  IdentityIcon,
  MemoryIcon,
  ModelSelectIcon,
  ModelIcon,
  ChatSettingIcon,
  PlusIcon,
} from "@errows/icons";
import { Section } from "./section";
import { RadioButtons } from "./radio-buttons";
import { ModelSelect } from "./model-select";
import { Loading } from "@/components";
import { listSessionPersonaApi } from "@/apis/session";
import { useMemberStore } from "@/stores/member";
import { useGlobalStore } from "@/stores/global";
import { useShallow } from "zustand/react/shallow";
import { deleteSessionPersonaApi } from "@/apis/session";
import { useNavigate } from "react-router";

const getMemoryItems = (t: (key: string) => string) => [
  { label: t("chat.setting.memoryShort"), value: "short" },
  { label: t("chat.setting.memoryDefault"), value: "default" },
  { label: t("chat.setting.memoryMedium"), value: "medium" },
  { label: t("chat.setting.memoryLong"), value: "long" },
];

const modelOptions = [
  {
    id: "Butter v1.0",
    name: "Butter V1.0",
    version: "V1.0",
    tier: "Basic",
    chatType: "Basic Chat",
  },
  {
    id: "RPMaster",
    name: "RPMaster",
    version: "2.0",
    tier: "Preminum / Ultimate",
    chatType: "Advanced Chat",
  },
];

export type ChatSettingsValue = Partial<API.SESSION.SESSION_SETTING> &
  Partial<API.SESSION.SESSION_PERSONA> & {
    cid: string;
    pid?: string;
    sid?: string;
  };

type IdentityItem = {
  id: string;
  name: string;
  description: string;
  inactive?: boolean;
};

export type SubmitParams = {
  sid?: string; //sessionId
  cid: string;
  identity: IdentityItem;
  memory: string;
  model: string;
};

interface ChatSettingsProps {
  items: IdentityItem[];
  onSubmit?: (params: SubmitParams) => void;
  submitting?: boolean;
  value?: ChatSettingsValue;
  onChange?: (value: ChatSettingsValue) => void;
  className?: string;
  onDeleteSelf?: () => void; //删除当前id身份卡回调
}

export const ChatSettings: React.FC<ChatSettingsProps> = (props) => {
  const { t } = useTranslation();
  const { items, value, onSubmit, submitting, className, onDeleteSelf } = props;
  const memoryItems = getMemoryItems(t);
  const [identityItems, setIdentityItems] =
    React.useState<IdentityItem[]>(items);
  const sid = value?.sid; //sessionId
  const cid = value?.cid; //角色id
  const pid = value?.pid; //身份id
  const memory = value?.memory; //记忆
  const model = value?.model; //模型
  // const autoTts = value?.auto_tts; //自动回复语音
  // const autoPicture = value?.auto_picture; //自动回复图片
  const currentIdentity =
    identityItems.find((item) => item.id === pid) ?? identityItems?.[0];
  //当前选中的身份
  const [selectedIdentity, setSelectedIdentity] =
    React.useState(currentIdentity);
  //当前选中的模型
  const [selectedModel, setSelectedModel] = React.useState<string>(
    model ?? modelOptions[0].id
  );
  //当前选中的记忆
  const [selectedMemory, setSelectedMemory] = React.useState<string>(
    memory ?? memoryItems[0].value
  );
  const navigate = useNavigate();
  const { info: memberInfo } = useMemberStore(useShallow((s) => ({ info: s.info })));
  const setOpenSubscribeModal = useGlobalStore((s) => s.setOpenSubscribeModal);
  const isMember = memberInfo?.plan && memberInfo.plan !== "free";
  const handlePlusClick = () => {
    console.log("plus click");
    const newIdentity = {
      id: `identity-${identityItems.length + 1}`,
      name: `Identity ${identityItems.length + 1}`,
      description: `Identity ${identityItems.length + 1}`,
      inactive: true,
    };
    setIdentityItems((prev) => {
      return [...prev, newIdentity];
    });
    setSelectedIdentity(newIdentity);
  };

  const handleDelete = (id: string) => {
    // 至少保留一个 identity
    if (identityItems.length <= 1) {
      return;
    }

    alertDialog.confirm({
      title: t("chat.setting.deleteIdentity"),
      content: t("chat.setting.deleteIdentityConfirm"),
      confirmText: t("common.delete"),
      cancelText: t("common.cancel"),
      onConfirm: async () => {
        try {
          const currentIdentity = identityItems.find((item) => item.id === id);
          if (!currentIdentity?.inactive) {
            await deleteSessionPersonaApi(id);
          }
          setIdentityItems((prev) => {
            const newItems = prev.filter((item) => item.id !== id);

            // 如果删除的是当前选中的，自动选中第一个
            if (selectedIdentity?.id === id) {
              setSelectedIdentity(newItems[0]);
            }

            return newItems;
          });
          //如果当前选中的身份被删除，则自动选中第一个
          if(pid === id){
            // navigate("/chat");
            onDeleteSelf?.();
          }
        } catch (error) {
          console.error(error);
        }
      },
    });
  };

  return (
    <div
      className={`flex flex-col w-full max-w-full relative h-full max-sm:pt-3 ${className}`}
    >
      <div className="flex-1 overflow-y-auto scrollbar-hide pb-10">
        <Section
          title={t("chat.setting.identityCard")}
          icon={<IdentityIcon />}
        />
        <RadioButtons
          items={identityItems.map((item) => ({
            label: item.name,
            value: item.id,
          }))}
          value={selectedIdentity?.id}
          onChange={(id) => {
            const item = identityItems.find((item) => item.id === id);
            if (item) {
              setSelectedIdentity(item);
            }
          }}
          onPlusClick={handlePlusClick}
          onDelete={handleDelete}
          deletable={identityItems.length > 1}
        >
          <div
            className="sticky right-0 top-0 w-[60px] min-w-[60px] h-full "
            style={{
              background:
                "linear-gradient(90deg, rgba(27, 18, 39, 0) 0%, #1b1227cc 88.46%)",
            }}
          />
        </RadioButtons>

        {/* Username Input */}
        <div className="flex items-center mt-4">
          <span className="text-gray-400 w-[93px] shrink-0 text-sm">
            {t("chat.setting.username")}
          </span>
          <Input
            key={selectedIdentity?.id}
            placeholder={t("chat.setting.usernamePlaceholder")}
            className="flex-1 max-w-[333px] bg-[#0A0A0F] border-[#2C2C38]"
            value={selectedIdentity?.name}
            onChange={(e) => {
              const item = identityItems.find(
                (item) => item.id === selectedIdentity?.id
              );
              if (item) {
                // item.name = e.target.value;
                // setSelectedIdentity({
                //   ...item,
                //   name: e.target.value,
                // });
                setSelectedIdentity((prev) => {
                  return {
                    ...prev,
                    name: e.target.value,
                  };
                });
              }
            }}
          />
        </div>

        {/* Description Textarea */}
        <div className="flex mt-3 mb-[14px]">
          <span className="text-gray-400 w-[93px] shrink-0 text-sm pt-2">
            {t("chat.setting.description")}
          </span>
          <Textarea
            key={selectedIdentity?.id}
            placeholder={t("chat.setting.descriptionPlaceholder")}
            rows={4}
            className="flex-1 max-w-[333px] bg-[#0A0A0F] border-[#2C2C38] resize-none"
            value={selectedIdentity?.description}
            onChange={(e) => {
              const item = identityItems.find(
                (item) => item.id === selectedIdentity?.id
              );

              if (item) {
                setSelectedIdentity((prev) => {
                  return {
                    ...prev,
                    description: e.target.value,
                  };
                });
              }
            }}
          />
        </div>

        <Section title={t("chat.setting.memory")} icon={<MemoryIcon />} />
        <RadioButtons
          items={memoryItems}
          value={selectedMemory}
          onChange={(value) => {
            const item = memoryItems.find((item) => item.value === value);
            if (item) {
              setSelectedMemory(item.value);
            }
          }}
        />
        <Section
          title={t("chat.setting.modelChoose")}
          icon={<ModelIcon />}
          className="mt-6"
        />
        <ModelSelect
          options={modelOptions}
          value={selectedModel}
          onChange={(id) => {
            const item = modelOptions.find((item) => item.id === id);
            if (!item) return;
            if (item.id === "RPMaster" && !isMember) {
              setOpenSubscribeModal(true, { variant: "rpmaster" });
              return;
            }
            setSelectedModel(item.id);
          }}
        />
      </div>

      <div className="flex items-center justify-center h-40 pb-15">
        <Button
          appearance="gradientFill"
          shape="round"
          className="w-[210px]"
          loading={submitting}
          disabled={!selectedIdentity?.name}
          onClick={() => {
            if (pid && pid !== selectedIdentity?.id) {
              alertDialog.confirm({
                title: t("chat.setting.changeIdentity"),
                content: t("chat.setting.changeIdentityConfirm"),
                confirmText: t("chat.setting.change"),
                cancelText: t("common.cancel"),
                onConfirm: () => {
                  onSubmit?.({
                    sid,
                    cid: cid!,
                    identity: selectedIdentity,
                    memory: selectedMemory,
                    model: selectedModel,
                  });
                },
              });
            } else {
              onSubmit?.({
                sid,
                cid: cid!,
                identity: selectedIdentity,
                memory: selectedMemory,
                model: selectedModel,
              });
            }
          }}
        >
          {t("common.save")}
        </Button>
      </div>
    </div>
  );
};

const init = (Component: React.ComponentType<ChatSettingsProps>) => {
  return (props: Omit<ChatSettingsProps, "items">) => {
    const [loaded, setLoaded] = React.useState(false);
    const [items, setItems] = React.useState<IdentityItem[]>([]);
    React.useEffect(() => {
      (async () => {
        try {
          const items = await listSessionPersonaApi();
          // console.log("当前人设列表 ========>>>", items);
          // const needFillLength = 20 - items.length;
          // const fillItems = Array.from(
          //   { length: needFillLength },
          //   (_, index) => {
          //     return {
          //       id: `identity-${items.length + index}`,
          //       name: `Identity ${items.length + index}`,
          //       description: `Identity ${items.length + index}`,
          //       inactive: true,
          //     };
          //   }
          // );
          // setItems([...items, ...fillItems]);
          setItems(items);
          setLoaded(true);
        } catch (error) {
          console.error(error);
        }
      })();
    }, []);
    return (
      <>
        {!loaded && (
          <div className="w-full h-full flex items-center justify-center text-6xl min-h-[400px]">
            <Loading />
          </div>
        )}
        {loaded && <Component {...props} items={items} />}
      </>
    );
  };
};

export default init(ChatSettings);
