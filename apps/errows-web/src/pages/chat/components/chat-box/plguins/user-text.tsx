import React from "react";
import { UserMessageItem } from "../history-item";
import { MoreIcon, DeleteIcon } from "@errows/icons";
import dayjs from "dayjs";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  Button,
} from "@errows/design";
import { cn } from "@errows/design/lib/utils";
import { useMobile } from "@/hooks/use-mobile-detector";
import { formatMessage } from "../utils";
import { type PluginProps } from "./base";
import { useTranslation } from "react-i18next";

interface UserTextProps extends PluginProps {
  action?: boolean;
  messageId: string;
  onEdit?: (messageId: string, content: string) => void;
  onDelete?: (messageId: string) => void;
}

export const UserText: React.FC<UserTextProps> = (props) => {
  const { message, action, messageId, onEdit, onDelete } = props;
  const { sended_at, content } = message;
  const isMobile = useMobile();
  const [open, setOpen] = React.useState(false);
  const { t } = useTranslation();
  const formatContent = React.useMemo(() => {
    return formatMessage(content);
  }, [content]);

  const handleOpenChange = (newOpen: boolean) => {
    console.log("Popover open change:", newOpen, "isMobile:", isMobile);
    setOpen(newOpen);
  };

  const handleEdit = () => {
    if (messageId && onEdit) {
      onEdit(messageId, content);
    }
    setOpen(false);
  };

  const handleDelete = () => {
    if (messageId && onDelete) {
      onDelete(messageId);
    }
    setOpen(false);
  };

  const menuItems = [
    { label: t("common.edit"), onClick: handleEdit },
    { label: t("common.delete"), onClick: handleDelete, isDangerous: true },
  ];

  return (
    <UserMessageItem className="flex flex-col px-4 pt-4">
      <span
        className="font-urbanist font-bold not-italic text-[16px] leading-[24px] text-[#F5F5F5] block"
        style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
      >
        {formatContent?.map((item, index) => {
          if (item.type === "text") {
            return <span key={index}>{item.data}</span>;
          }
          if (item.type === "speech") {
            return <span key={index}>{`"${item.data}"`}</span>;
          }
          return (
            <span
              key={index}
              className="font-urbanist font-normal italic text-[13px] leading-[18px] text-justify text-[#D7DADA]"
            >
              {`*${item.data}*`}
            </span>
          );
        })}
      </span>
      <div className="flex items-center justify-between h-8">
        <Popover modal={isMobile} open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            {action ? (
              <Button
                variant="ghost"
                size="icon"
                className="w-6 h-6 p-0 hover:bg-[#2C2C38] rounded transition-colors"
              >
                <MoreIcon className="w-4 h-4 text-[#A4ACB9]" />
              </Button>
            ) : (
              <div />
            )}
          </PopoverTrigger>
          <PopoverContent
            side="top"
            align="start"
            sideOffset={8}
            className={cn(
              "w-28 p-0 rounded-lg overflow-hidden z-[9999]",
              "bg-gradient-to-b from-gray-900/95 to-gray-950/95",
              "border border-gray-700/50 backdrop-blur-md"
            )}
          >
            <div className="flex flex-col gap-1">
              {menuItems.map((item, index) => (
                <button
                  // variant={'ghost'}
                  key={item.label}
                  onClick={(e) => {
                    e.stopPropagation();
                    item.onClick?.();
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3",
                    "text-sm font-urbanist font-medium transition-colors duration-150",
                    "hover:bg-white/10",
                    item.isDangerous
                      ? "text-red-400 hover:bg-red-500/10"
                      : "text-white",
                    index !== menuItems.length - 1 &&
                      "border-b border-gray-700/30"
                  )}
                >
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <span className="font-[Static] font-normal not-italic text-[10px] text-right text-[#A4ACB9]">
          {dayjs(sended_at).format("HH:mm")}
        </span>
      </div>
    </UserMessageItem>
  );
};
