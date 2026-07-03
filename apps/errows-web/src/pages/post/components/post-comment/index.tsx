import React from "react";
import { MoreIcon } from "@errows/icons";
import { cn } from "@errows/design/lib/utils";
import { Button } from "@errows/design";
import dayjs from "dayjs";

interface PostCommentProps {
  data: API.POST.POST_COMMENT;
  className?: string;
  onMenuClick?: (comment: API.POST.POST_COMMENT) => void;
  onReply?: (comment: API.POST.POST_COMMENT) => void;
}

const PostComment: React.FC<PostCommentProps> = (props) => {
  const { data, className, onMenuClick, onReply } = props;

  // 格式化时间
  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diff = now.getTime() - date.getTime();

      // 如果是今天
      if (diff < 24 * 60 * 60 * 1000) {
        return dayjs(date).format("HH:mm:ss");
      }

      // 如果是昨天
      if (diff < 48 * 60 * 60 * 1000) {
        const hours = date.getHours().toString().padStart(2, "0");
        const minutes = date.getMinutes().toString().padStart(2, "0");
        const seconds = date.getSeconds().toString().padStart(2, "0");
        return `Yesterday ${hours}:${minutes}:${seconds}`;
      }

      // 其他日期
      return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return dateString;
    }
  };

  return (
    <div className={cn("flex gap-3 flex-col", className)}>
      <div className="flex justify-end h-4 shrink-0 my-1">
        <Button variant="ghost" className="w-6 h-6 ">
          <MoreIcon className="w-4 h-4 text-gray-400" />
        </Button>
      </div>
      <div className={cn("flex gap-3")}>
        {/* 头像 */}
        <div className="flex-shrink-0">
          {data?.owner?.avatar_url ? (
            <img
              src={data.owner.avatar_url}
              alt={data?.owner?.name}
              className="w-8 h-8 rounded-full object-cover bg-gray-700"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#2C2C38] flex items-center justify-center">
              <span className="text-[#FCFCFC] text-[14px] font-bold uppercase">
                {data?.owner?.name?.[0] ?? "?"}
              </span>
            </div>
          )}
        </div>
        {/* 内容区域 */}
        <div className="flex-1 flex flex-col gap-1 pb-[22px]">
          {/* 头部：用户名和时间 */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <span 
              className="text-[#FCFCFC] text-[14px] font-bold"
              style={{ fontFamily: 'Urbanist' }}
            >
              {data?.owner?.name}
            </span>
            <span className="text-[#A4ACB9] text-[13px] font-normal">
              {formatTime(data?.created_at)}
            </span>
          </div>

          {/* 评论内容 */}
          <div
            className="text-[#A4ACB9] text-[13px] font-normal leading-[18px] text-justify whitespace-pre-wrap break-words"
            style={{ fontFamily: 'Urbanist' }}
          >
            {data?.content}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostComment;
