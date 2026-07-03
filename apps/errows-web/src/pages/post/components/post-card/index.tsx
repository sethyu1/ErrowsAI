import React, { useState } from "react";
import {
  Button,
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@errows/design";
import {
  MoreIcon,
  CommentIcon,
  UnlikeIcon,
  HeartIcon,
  UnlikeFilledIcon,
  HeartFilledIcon,
  SendIcon,
} from "@errows/icons";
import dayjs from "dayjs";
import PostComment from "../post-comment";
import { Textarea } from "@errows/design";
import { ImageGallary } from "../image-gallary";
import { getPostApi, type CreateCommentParams } from "@/apis/post";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "@/stores/auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@errows/design/lib/utils";
import { usePostServices } from "../../services";
import { useGetState } from "ahooks";
import { alertDialog } from "@errows/design";
import { useTranslation } from "react-i18next";

interface PostCardProps {
  data: API.POST.POST_SUMMARY;
  className?: string;
  comment: (pid: string, data: CreateCommentParams) => Promise<string>;
  feedback: (pid: string, feedback: "like" | "dislike") => Promise<void>;
  onDelete?: (cid: string, pid: string) => void;
}

const useComment = (pid?: string, showCommonInput?: boolean) => {
  const [comments, setComments] = useState<API.POST.POST_COMMENT[]>([]);
  const [loading, setLoading] = useState(false);
  React.useEffect(() => {
    (async () => {
      try {
        if (pid && showCommonInput && !loading) {
          setLoading(true);
          const res = await getPostApi(pid);
          setComments(
            res.comments?.sort((a, b) =>
              dayjs(b.created_at).diff(dayjs(a.created_at))
            )
          );
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    })();
  }, [pid, showCommonInput]);
  return { comments, loading, setComments };
};

const PostCard: React.FC<PostCardProps> = (props) => {
  const { data, className, comment, feedback, onDelete } = props;
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const [showCommonInput, setShowCommonInput] = useState(true);
  const [message, setMessage] = useState("");
  const commentsContainerRef = React.useRef<HTMLDivElement>(null);
  const [commenting, setCommenting, getCommenting] = useGetState(false);
  const isMobile = useIsMobile();
  const [open, setOpen] = React.useState(false);

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
  };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && message && /\S/.test(message)) {
      e.preventDefault();
      handleSend();
    }
  };
  const { update } = usePostServices();
  const handleEdit = () => {
    update(data.character.id, data);
  };

  const handleDelete = () => {
    alertDialog.confirm({
      title: t("post.deletePost"),
      content: t("post.deletePostConfirm"),
      confirmText: t("common.delete"),
      cancelText: t("common.cancel"),
      onConfirm: () => {
        onDelete?.(data.character.id, data?.id);
      },
    });
  };
  const menuItems = [
    // { label: t("common.edit"), onClick: handleEdit },
    { label: t("common.delete"), onClick: handleDelete, isDangerous: true },
  ];

  const { comments, loading, setComments } = useComment(
    data?.id,
    showCommonInput
  );

  // 打开评论或评论加载完成后自动滚动到底部
  // React.useEffect(() => {
  //   if (showCommonInput && !loading && comments.length > 0) {
  //     setTimeout(() => {
  //       if (commentsContainerRef.current) {
  //         commentsContainerRef.current.scrollTop =
  //           commentsContainerRef.current.scrollHeight;
  //       }
  //     }, 100);
  //   }
  // }, [showCommonInput, loading, comments.length]);

  const handleSend = async () => {
    if (getCommenting()) {
      console.log("正在发布评论, 请稍后...");
    }
    try {
      setCommenting(true);
      const id = await comment(data?.id, {
        content: message,
      });
      setComments([
        {
          id,
          reply_to_id: null,
          owner: {
            name: user?.name || "",
            //@ts-ignore
            avatar_url: user?.avatar_url || null,
          },
          content: message,
          created_at: String(dayjs()),
          updated_at: String(dayjs()),
        },
        ...comments,
      ]);
      // 滚动到底部
      setTimeout(() => {
        if (commentsContainerRef.current) {
          commentsContainerRef.current.scrollTop = 0;
        }
      }, 100);
      setMessage("");
    } catch (error) {
      console.error("Failed to send comment:", error);
    } finally {
      setCommenting(false);
    }
  };
  return (
    <div
      className={`flex flex-col w-[575px] overflow-auto bg-[#0E0F17] scrollbar-hide ${className}`}
      style={{ border: "1px solid #FFFFFF1A" }}
    >
      <div className="w-full flex items-center justify-between px-[18px] h-15 shrink-0">
        <div className="flex items-center gap-3">
          <img
            src={data?.character?.avatar_url}
            alt={data?.character?.nickname}
            className="w-9 h-9 rounded-full"
          />
          <span
            className="text-white"
            style={{
              fontFamily: "Urbanist",
              fontWeight: 700,
              fontSize: "14px",
            }}
          >
            {data?.character?.nickname}
          </span>
          <span
            className="text-gray-500"
            style={{
              fontFamily: "Urbanist",
              fontWeight: 400,
              fontSize: "14px",
            }}
          >
            {dayjs(data?.created_at).format("YYYY-MM-DD HH:mm:ss")}
          </span>
        </div>

        <Popover modal={isMobile} open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            {user?.id === data?.owner?.id && (
              <Button variant="ghost" size="icon">
                <MoreIcon className="w-5 h-5 text-white" />
              </Button>
            )}
          </PopoverTrigger>
          <PopoverContent
            side="bottom"
            align="end"
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
      </div>
      <ImageGallary
        data={data?.images}
        className="w-full max-w-[520px] mx-auto h-[420px] sm-max:h-[320px]"
      />
      <div
        className="px-4 pt-4"
        style={{
          fontFamily: "Urbanist",
          fontWeight: 700,
          fontStyle: "normal",
          fontSize: "16px",
          lineHeight: "1.5",
          color: "#A4ACB9",
          textAlign: "justify",
        }}
      >
        {data?.content}
      </div>
      <div className="flex justify-end gap-2 my-6 px-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => feedback(data.id, "like")}
        >
          {/* <HeartIcon
            className={cn(`w-5 h-5`)}
            style={{
              color: data?.feedback === "like" ? "#f00" : "#fff",
            }}
          /> */}
          {data?.feedback === "like" ? (
            <HeartFilledIcon
              className={cn(`w-5 h-5`)}
              style={{
                color: '#D743A7',
              }}
            />
          ) : (
            <HeartIcon
              className={cn(`w-5 h-5`)}
              style={{
                color: '#A4ACB9',
              }}
            />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => feedback(data.id, "dislike")}
        >
          {data?.feedback === "dislike" ? (
            <UnlikeFilledIcon
              className={cn(`w-5 h-5`)}
              style={{
                color: '#D743A7',
              }}
            />
          ) : (
            <UnlikeIcon
              className={cn(`w-5 h-5`)}
              style={{
                color: '#A4ACB9',
              }}
            />
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowCommonInput((prev) => !prev)}
        >
          <CommentIcon className="w-5 h-5 text-white" />
        </Button>
      </div>
      {/* <div className="h-[1px] bg-[#2C2C38] my-6 shrink-0 ml-[18px] mr-6" /> */}
      {/* 这里加入一个loading状态 */}
      {/* <div
        ref={commentsContainerRef}
        className="max-h-[500px] overflow-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {showCommonInput && loading && (
          <div className="flex items-center justify-center min-h-[100px]">
            <Loader2 className="w-5 h-5 text-white animate-spin" />
          </div>
        )}
        {showCommonInput &&
          comments?.map((comment) => (
            <PostComment
              key={comment.id}
              data={comment}
              className="mx-4 border-t border-[#2C2C38]"
            />
          ))}
      </div> */}

      {showCommonInput && (
        <div className="flex items-center gap-3 mb-3 px-4">
          <div
            className="flex w-full p-[2px] gap-2 border border-input rounded-full focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[1px] transition-[border-color,box-shadow]"
            style={{ borderRadius: "20px" }}
          >
            <Textarea
              // ref={textareaRef}
              placeholder={t("chat.sender.placeholder")}
              className="bg-transparent shrink-0 flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none h-10"
              style={{
                fontFamily: "Urbanist",
                // fontWeight: 700,
                fontSize: "14px",
                background: "none",
              }}
              autoResize
              minHeight={40}
              maxHeight={90}
              value={message}
              onChange={handleMessageChange}
              onKeyDown={handleKeyDown}
            />
            <Button
              onClick={handleSend}
              disabled={!message.trim() || commenting}
              className="w-9 h-9 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shrink-0 self-end"
            >
              {commenting ? (
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              ) : (
                <SendIcon className="w-5 h-5 text-white" />
              )}
            </Button>
          </div>
        </div>
      )}
      <div
        ref={commentsContainerRef}
        className="max-h-[500px] overflow-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {showCommonInput && loading && (
          <div className="flex items-center justify-center min-h-[100px]">
            <Loader2 className="w-5 h-5 text-white animate-spin" />
          </div>
        )}
        {showCommonInput &&
          comments?.map((comment) => (
            <PostComment
              key={comment.id}
              data={comment}
              className="mx-4 border-t border-[#2C2C38]"
            />
          ))}
      </div>
    </div>
  );
};

export default PostCard;
