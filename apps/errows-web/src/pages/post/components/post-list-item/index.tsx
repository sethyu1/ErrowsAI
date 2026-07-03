import {
  HeartIcon,
  HeartFilledIcon,
} from "@errows/icons";
import { useState } from "react";
import { useNavigate } from "react-router";
import { usePostFeedback } from "@/hooks/use-post-feedback";

interface PostListItemProps {
  data: API.POST.POST_SUMMARY;
}

export default function PostListItem({ data }: PostListItemProps) {
  const navigate = useNavigate();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { feedback, count, handleFeedback } = usePostFeedback(
    data?.character?.id,
    data?.feedback ?? "dislike",
    data?.social?.likes_count ?? 0
  );

  const handleClick = () => {
    navigate(`/post/${data.character.id}`);
  };
  const latestImage = Array.isArray(data?.images)
    ? data?.images[data.images?.length - 1]
    : undefined;
  return (
    <div
      className="relative w-[243px] max-sm:w-[calc(50vw-24px)] rounded-lg overflow-hidden group cursor-pointer bg-gray-800 hover:scale-[1.02] transition-transform duration-200"
      onClick={handleClick}
    >
      {/* 图片容器 - 瀑布流自适应高度 */}
      <div className="relative w-full">
        {/* 加载占位符 */}
        {!imageLoaded && !imageError && (
          <div className="w-full min-h-[200px] max-sm:min-h-[128px] bg-gray-700 animate-pulse" />
        )}

        {/* 错误占位符 */}
        {imageError && (
          <div className="absolute inset-0 bg-gray-700 flex items-center justify-center">
            <span className="text-gray-500 text-sm">加载失败</span>
          </div>
        )}

        <img
          src={latestImage?.url || data?.character?.avatar_url}
          alt=""
          className={`w-full h-auto object-cover ${
            imageLoaded ? "opacity-100" : "opacity-0"
          } transition-opacity duration-300`}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
        />

        {/* 点赞按钮 - 右上角 */}
        <div
          className="absolute top-3 right-3 flex items-center gap-1 bg-black/30 backdrop-blur-sm rounded-full px-3 py-1.5 h-8 max-sm:h-6"
          onClick={(e) => {
            e.stopPropagation();
            // handleFeedback();
          }}
        >
          {feedback === "like" ? (
            <HeartFilledIcon className="size-5 max-sm:size-3 text-[#D743A7]" />
          ) : (
            <HeartIcon className="size-5 max-sm:size-3 text-white" />
          )}
          <span
            className="text-white font-bold text-base max-sm:text-[12px]"
            style={{ fontFamily: "Urbanist" }}
          >
            {count}
          </span>
        </div>
      </div>

      {/* Post text - 显示在图片下方 */}
      <div className="p-3 bg-[#0E0F17] border-t border-[#FFFFFF1A]">
        <p
          className="line-clamp-2"
          style={{
            fontFamily: "Urbanist",
            fontWeight: 700,
            fontSize: "16px",
            lineHeight: "1.45",
            color: "#A4ACB9",
          }}
        >
          {data?.content}
        </p>
      </div>
    </div>
  );
}
