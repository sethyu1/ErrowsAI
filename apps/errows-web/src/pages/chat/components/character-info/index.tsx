import React from "react";
import { useTranslation } from "react-i18next";
import { Heart, Image, Video } from "lucide-react";
import {
  fetchCharacterDetailApi,
  followCharacterApi,
  unfollowCharacterApi,
} from "@/apis/character";
import { Loading } from "@/components";
import { IntimacyIcon, ChatIcon } from "@errows/icons";
import { useNavigate } from "react-router";
import { useCharacter } from "./use-character";
import { Button } from "@errows/design";
import { useChatServices } from "../../services";

export interface CharacterInfoProps {
  className?: string;
  cardClassName?: string;
  //圆角大小
  roundSize?: number;
  style?: React.CSSProperties;
  loading?: boolean;
  data?: API.Character.CHARACTER;
  onChat?: (cid: string) => void;
}

const CharacterInfo: React.FC<React.PropsWithChildren<CharacterInfoProps>> = ({
  className,
  cardClassName,
  roundSize = 0,
  style,
  data,
  loading,
  children,
  onChat,
}) => {
  const { t } = useTranslation();
  const [followed, setFollowed] = React.useState(data?.followed ?? false);
  const [followedCount, setFollowedCount] = React.useState(
    data?.social?.followed_count ?? 0
  );
  const navigate = useNavigate();
  //同步数据
  React.useEffect(() => {
    setFollowed(data?.followed ?? false);
    setFollowedCount(data?.social?.followed_count ?? 0);
  }, [data]);

  const handleImage = () => {
    data?.id && navigate(`/generate/image/${data?.id}`);
  };
  const handleVideo = () => {
    data?.id && navigate(`/generate/video/${data?.id}`);
  };

  const handleFollow = async () => {
    try {
      if (data?.id) {
        if (followed) {
          setFollowed(false);
          setFollowedCount((prev) => prev - 1);
          await unfollowCharacterApi(data.id);
        } else {
          setFollowed(true);
          setFollowedCount((prev) => prev + 1);
          await followCharacterApi(data.id);
        }
      }
    } catch (error) {
      console.error(error);
      setFollowed(followed);
      setFollowedCount(followedCount);
    }
  };

  return (
    <div
      className={`max-w-[358px] h-full relative shrink-0 transition-all duration-300 ease-in-out ${className}`}
      style={style}
    >
      {loading ? (
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center text-6xl">
          <Loading />
        </div>
      ) : (
        <></>
      )}
      {/* 背景容器 */}
      {!loading && data && (
        <div className="relative overflow-hidden h-full">
          {/* 背景图片区域 */}
          <div
            className="relative max-h-[554px] h-[calc(100%-223px)] bg-gradient-to-b from-[#8b4545] to-[#5a3535] overflow-auto"
            style={
              roundSize > 0 ? { borderRadius: `${roundSize}px` } : undefined
            }
          >
            <img
              src={data.first_background_image_url ?? data.avatar_url}
              alt={data.nickname}
              className="w-full h-full object-cover"
            />

            {/* follow按钮 */}
            {/* <button
              onClick={handleFollow}
              className="absolute top-4 right-4 flex items-center gap-2 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-full px-3 py-2 transition-colors duration-200"
              aria-label="follow"
            >
              <IntimacyIcon
                className={`w-5 h-5 transition-colors duration-200 ${
                  followed ? "text-[#D743A7]" : "text-white"
                }`}
              />
              <span className="text-white text-sm font-semibold">
                {followedCount}
              </span>
            </button> */}
          </div>

          {/* 信息卡片 */}
          <div className={`pt-6 pb-4 shrink-0 ${cardClassName}`}>
            {/* 名字和标签 */}
            <div className="flex justify-between gap-3 mb-6">
              <div className="flex flex-col">
                <h2 className="max-w-[200px] text-[22px] font-bold text-white whitespace-nowrap overflow-hidden text-ellipsis">
                  {data.nickname}
                </h2>
                {data?.owner?.name && (
                  <span className="mt-1 text-[12px] leading-[22px] font-medium text-[#A4ACB9]">
                    {`${t("role.detail.by")} ${data?.owner?.name}`}
                  </span>
                )}
              </div>
              <Button
                className={`rounded-full ${
                  followed ? "bg-[#1D1E27]" : "bg-[#FFFFFF]"
                } ${followed ? "text-[#FCFCFC]" : "text-[#090A0A]"}  ${
                  followed ? "border border-[#2C2C38]" : ""
                }`}
                onClick={handleFollow}
              >
                <IntimacyIcon
                  className={`w-5 h-5 transition-colors duration-200 ${
                    followed ? "text-[#D743A7]" : "text-[#090A0A]"
                  }`}
                />
                {followed ? t('common.following') : t('common.follow')}
              </Button>
            </div>

            {/* 统计信息 */}
            <div className="flex items-center justify-between gap-4 mb-6 text-sm">
              <div className="flex flex-col">
                <span className="font-semibold text-white">
                  {data.social.dialogues_count.toLocaleString()}
                </span>
                <span className="text-gray-400 text-xs">{t("role.detail.chats")}</span>
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-white">
                  {data.social.followed_count.toLocaleString()}
                </span>
                <span className="text-gray-400 text-xs">{t("role.detail.followers")}</span>
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-white">
                  {data.social.likes_count.toLocaleString()}
                </span>
                <span className="text-gray-400 text-xs">{t("role.detail.likes")}</span>
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-white">
                  {data.social.posted_count.toLocaleString()}
                </span>
                <span className="text-gray-400 text-xs">{t("role.detail.posts")}</span>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex items-center gap-3">
              {/* 头像按钮 */}
              {/* <button
                className="flex-shrink-0 w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors duration-200"
                aria-label="用户头像"
              >
                <img
                  src={data.avatar_url}
                  alt={data.nickname}
                  className="w-full h-full rounded-full object-cover"
                />
              </button> */}

              <Button
                className="flex-shrink-0 w-10 h-10 rounded-full"
                style={{
                  background:
                    "linear-gradient(180deg, #D9D9D9 0%, #D6B8D4 100%)",
                }}
                onClick={() => {
                  onChat?.(data.id);
                }}
              >
                <ChatIcon className="size-[14px]" />
              </Button>

              {/* 分隔线 */}
              <div className="w-px h-6 bg-white/10" />

              {/* 图片按钮 */}
              <button
                onClick={handleImage}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-full border border-white/20 hover:border-white/40 text-white hover:bg-white/5 transition-colors duration-200 text-sm font-medium"
              >
                <Image className="w-4 h-4" />
                {t('common.image')}
              </button>

              {/* 视频按钮 */}
              <button
                onClick={handleVideo}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white transition-colors duration-200 text-sm font-medium"
              >
                <Video className="w-4 h-4" />
                {t('common.video')}
              </button>
            </div>
          </div>
        </div>
      )}
      {children}
    </div>
  );
};

const connect = (
  Component: React.FC<React.PropsWithChildren<CharacterInfoProps>>
) => {
  return (
    props: React.PropsWithChildren<
      Partial<CharacterInfoProps> & { cid: string }
    >
  ) => {
    const { cid, ...rest } = props;
    const { character, loading } = useCharacter(cid);
    return <Component data={character} loading={loading} {...rest} />;
  };
};

export default connect(CharacterInfo);
