import { Button, alertDialog } from "@errows/design";
import { DeleteIcon } from "@errows/icons";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";

export interface ChatListItemProps {
  data: API.SESSION.SESSION_SUMMARY;
  /** 删除回调函数 */
  onDelete?: () => void;
  /** 点击回调函数 */
  onClick?: () => void;
  /** 是否被选中 */
  isActive?: boolean;
}

export const ChatListItem = ({
  data,
  onDelete,
  onClick,
  isActive = false,
}: ChatListItemProps) => {
  const { t } = useTranslation();
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    alertDialog.confirm({
      title: t("chat.list.deleteChat"),
      content: t("chat.list.deleteChatConfirm"),
      confirmText: t("common.delete"),
      cancelText: t("common.cancel"),
      onConfirm: onDelete,
    });
  };
  
  return (
    <div
      className={`
        flex items-center gap-3 p-[14px] rounded-lg cursor-pointer
        transition-colors duration-200 backdrop-blur
        h-20 relative hover:bg-[#3A3A48]
        ${isActive ? "bg-[#3A3A48]" : "bg-[#2c2c38b3]"}
      `}
      style={{
        border: "1px solid #FFFFFF1A",
      }}
      onClick={onClick}
    >
      {/* 头像 */}
      <div className="flex-shrink-0">
        <img
          src={data?.character?.avatar_url}
          alt={data?.character?.nickname}
          className="w-12 h-12 rounded-full object-cover"
        />
      </div>

      {/* 内容区域 */}
      <div className="flex-1 min-w-0">
        {/* 第一行：名字和时间 */}
        <div className="flex items-center justify-between gap-2 mb-1">
          <h3 className="text-sm font-semibold text-white truncate">
            {data?.character?.nickname}
          </h3>
          <span className="text-xs text-gray-400 whitespace-nowrap">
            {dayjs(data?.last_message_at).format("MM-DD HH:mm")}
          </span>
        </div>

        {/* 第二行：消息预览 */}
        <p className="text-sm text-gray-400 truncate w-[calc(100%-30px)] min-h-[20px]">
          {data?.last_message_preview}
        </p>
      </div>

      {/* 删除按钮 */}
      {onDelete && (
        <Button
          onClick={handleDeleteClick}
          variant="ghost"
          size="icon"
          aria-label="delete"
          className="absolute w-6 h-6 bottom-[14px] right-[12px] z-10"
        >
          <DeleteIcon className="w-3 h-3 text-[#A4ACB9]" />
        </Button>
      )}
    </div>
  );
};

export default ChatListItem;
