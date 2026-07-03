import {
  HeartIcon,
  HeartFilledIcon,
} from "@errows/icons";
import { useState } from "react";
import { useNavigate } from "react-router";
import { usePostFeedback } from "@/hooks/use-post-feedback";

interface PostListItemMobileFullscreenProps {
  data: API.POST.POST_SUMMARY;
  onItemClick?: (cid: string) => void;
}

export default function PostListItemMobileFullscreen({
  data,
  onItemClick,
}: PostListItemMobileFullscreenProps) {
  const navigate = useNavigate();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { feedback, count, handleFeedback } = usePostFeedback(
    data?.character?.id,
    data?.feedback ?? "dislike",
    data?.social?.likes_count ?? 0
  );

  const handleClick = () => {
    onItemClick?.(data.character.id);
  };

  const latestImage = Array.isArray(data?.images)
    ? data?.images[data.images?.length - 1]
    : undefined;

  return (
    <div
      className="relative w-full h-full overflow-hidden cursor-pointer bg-gray-800"
      onClick={handleClick}
    >
      {/* 图片容器 - 占满整个高度 */}
      <div className="relative w-full h-full">
        {/* 加载占位符 */}
        {!imageLoaded && !imageError && (
          <div className="w-full h-full bg-gray-700 animate-pulse" />
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
          className={`w-full h-full object-cover ${
            imageLoaded ? "opacity-100" : "opacity-0"
          } transition-opacity duration-300`}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
        />

        {/* 点赞按钮 - 右上角 */}
        <div
          className="absolute top-6 right-6 flex items-center gap-2 bg-black/30 backdrop-blur-sm rounded-full px-2 py-1 h-6"
          onClick={(e) => {
            e.stopPropagation();
            // handleFeedback();
          }}
        >
          {feedback === "like" ? (
            <HeartFilledIcon className="size-4 text-[#D743A7]" />
          ) : (
            <HeartIcon className="size-4 text-white" />
          )}
          <span
            className="text-white font-bold text-[12px]"
            style={{ fontFamily: "Urbanist" }}
          >
            {count}
          </span>
        </div>

        {/* 底部渐变遮罩和文字 */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-6 pt-20">
          <p
            className="line-clamp-4"
            style={{
              fontFamily: "Urbanist",
              fontWeight: 600,
              fontStyle: "normal",
              fontSize: "17px",
              lineHeight: "25px",
              letterSpacing: "0px",
              textAlign: "justify",
              color: "#A4ACB9",
            }}
          >
            {data?.content}
          </p>
        </div>
      </div>
    </div>
  );
}
