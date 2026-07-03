import { use, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Loading } from "../loading";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@errows/design/lib/utils";
import { Button, Dialog, DialogContent } from "@errows/design";
import { NImageIcon, NVideoStarIcon, IntimacyIcon, ChatIcon } from "@errows/icons";
import { fetchCharacterDetailApi } from "@/apis/character";
import { useMobile } from "@/hooks/use-mobile-detector";
import { CharacterAvatar } from "./character-avatar";
import { Multimedia } from "./multimedia";
import { CharacterInfo } from "./character-info";
import { PostList } from "./post-list";
import { NavBar } from "../nav-bar";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@errows/design/components/drawer";
import { useSelfFollow } from "@/hooks/use-self-follow";
import { useAuthCheck } from "@/hooks/use-auth-check";
import { useGlobalStore } from '@/stores/global';
import { useShallow } from "zustand/react/shallow";

export interface RoleDetailProps {
  /** 是否打开（PC端模态框） */
  open?: boolean;
  /** 打开状态变化回调 */
  onOpenChange?: (open: boolean) => void;
  /** 角色ID */
  characterId: string;
  /** Chat 回调 */
  onChat?: () => void;
}

const btnStyle = {
  width: 121,
  maxWidth: 121,
  height: 38,
  borderRadius: 100,
};

const InnerLoading = (props: { className?: string }) => (
  <div
    className={cn(
      "flex items-center justify-center h-full text-6xl",
      props.className
    )}
  >
    <Loading />
  </div>
);

/**
 * 角色详情组件
 * - PC 端：模态框布局（左侧图片，右侧内容）
 * - 移动端：页面布局（上下堆叠）
 */
export function RoleDetail({
  open = false,
  onOpenChange,
  characterId,
  onChat,
}: RoleDetailProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isMobile = useMobile();
  const { isLogin, gotoLogin } = useAuthCheck();
  const [followCount, setFollowCount] = useState(0);
  const { setFromHomePage, fromHomePage } = useGlobalStore(useShallow(state =>{
    return {
      setFromHomePage:state.setFromHomePage,
      fromHomePage:state.fromHomePage
    }
  }));
  const { handleFollow, followed, setFollowed, isLoading } = useSelfFollow(characterId, false, (followed) => {
    setFollowCount(followed ? followCount + 1 : (followCount - 1 >= 0 ? followCount - 1 : 0));
  });

  const { data: character, status } = useQuery({
    queryKey: ["characterDetail", characterId],
    queryFn: () => fetchCharacterDetailApi(characterId),
    enabled: isMobile ? true : open,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    retry: false,
  });

  const owner = useMemo(() => {
    return character?.owner?.name ?? '';
  }, [character])

  useEffect(() => {
    if (character) {
      setFollowCount(character.social?.followed_count ?? 0);
    }
  }, [character]);

  useEffect(() => {
    setFollowed(character?.followed ?? false);
  }, [character?.followed, setFollowed]);

  const handleToGenerate = (type: "image" | "video") => {
    if (!isLogin) {
      gotoLogin("signup");
      return;
    }
    setFromHomePage(isMobile);
    navigate(`/generate/${type}/${characterId}`);
  };

  const handleMobileDrawerClose = () => {
    if(window.location.pathname !== '/' && isMobile && fromHomePage) {
      navigate('/');
      setFromHomePage(false);
    }
    else { onOpenChange?.(false);}
  };

  const FollowButton = useMemo(() => {
    return (
      <Button
        className={`cursor-pointer rounded-full ${followed ? "bg-[#1D1E27]" : "bg-[#FFFFFF]"
          } ${followed ? "text-[#FCFCFC]" : "text-[#090A0A]"}  ${followed ? "border border-[#2C2C38]" : ""
          }`}
        style={{
          width: 95,
          height: 38
        }}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          if (!isLogin) {
            gotoLogin();
            return;
          }
          if (!isLoading) handleFollow();
        }}
      >
        <IntimacyIcon
          className={`w-5 h-5 transition-colors duration-200 ${followed ? "text-[#D743A7]" : "text-[#090A0A]"
            }`}
        />
        {followed ? t('common.following') : t('common.follow')}
      </Button>
    );
  }, [followed, isLoading, isLogin, gotoLogin, handleFollow, t]);

  const Operation = useMemo(() => {
    return (
      <div className='flex justify-between items-center'>
        <Button
          className="flex-1 h-10 rounded-lg font-urbanist text-sm font-bold mr-3 flex items-center justify-center gap-2"
          style={{
            background:
              "linear-gradient(180deg, #D9D9D9 0%, #D6B8D4 100%)",
            ...btnStyle,
          }}
          onClick={() => {
            if (!isLogin) {
              gotoLogin("signup");
              return;
            }
            else {
              onChat?.();
            }
          }}
        >
          {t('common.chat')}
          <ChatIcon className="size-[14px]" />
        </Button>
        <div className="flex justify-end gap-3 border-t border-b border-gray-800/30 py-3">
          <Button
            appearance="gradientOutline"
            className={cn(
              "flex-1 h-10 rounded-lg font-urbanist text-sm font-medium",
              "flex items-center justify-center gap-2",
              "border border-gray-700 bg-gray-900/50 text-gray-300",
              "hover:bg-gray-800/50 transition-colors"
            )}
            onClick={() => handleToGenerate("image")}
            style={btnStyle}
          >
            {t('common.image')}
            <NImageIcon className="w-4 h-4" />
          </Button>
          <Button
            appearance="gradientFill"
            className={cn(
              "flex-1 h-10 rounded-lg font-urbanist text-sm font-medium",
              "flex items-center justify-center gap-2",
              "bg-gradient-to-r from-purple-600 to-pink-600 text-white",
              "hover:from-purple-700 hover:to-pink-700 transition-colors"
            )}
            onClick={() => handleToGenerate("video")}
            style={btnStyle}
          >
            {t('common.video')}
            <NVideoStarIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }, [t]);

  if (status === "error") {
    return null;
  }

  // 移动端页面布局
  if (isMobile) {
    return (
      <Drawer open={open} direction="right" handleOnly>
        <DrawerContent className="data-[vaul-drawer-direction=right]:w-screen h-screen z-1000 bg-[#1b1227]">
          <DrawerHeader className="hidden">
            <DrawerTitle />
            <DrawerDescription />
          </DrawerHeader>
          <div className="w-full h-full overflow-y-auto">
            {status === "pending" ? (
              <InnerLoading />
            ) : character ? (
              <div className="flex flex-col gap-4 pb-20 w-full">
                <NavBar
                  title={t('role.detail.profile')}
                  onBack={handleMobileDrawerClose}
                />
                {/* 头像和底部操作区 */}
                <div className="px-4 mt-20">
                  <CharacterAvatar
                    characterId={characterId}
                    followCount={followCount}
                    imageUrl={character.avatar_url}
                    social={character?.social}
                    isMobile={true}
                    owner={owner}
                    slot={Operation}
                  />
                </div>
                <div className="px-4">
                  {/* 基本信息 */}
                  <CharacterInfo
                    nickname={character.nickname}
                    assortment={character.assortment}
                    type={character.type}
                    updatedAt={character.updated_at}
                    description={character.introduction || character.description}
                    age={character.age}
                    color={character.color}
                    gender={character.gender}
                    stats={{
                      mood: character?.assortment || '',
                      intimacy: character.social?.intimacy_score || 0,
                      videoCount: character.social?.video_count || 0,
                      imageCount: character.social?.posted_count || 0,
                    }}
                    isMobile={true}
                    followContent={FollowButton}
                  />
                </div>
                <Multimedia characterId={characterId} owner={owner} />

                {/* 帖子列表 */}
                <div className="px-4">
                  <PostList
                    roleId={characterId}
                    onMorePosts={() => navigate(`/post/${characterId}`)}
                    isMobile={true}
                  />
                </div>
              </div>
            ) : null}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  // PC 端模态框布局
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "w-[900px] max-w-none overflow-y-auto scrollbar-hide",
          "border border-gray-800/50 rounded-2xl p-6 "
        )}
        style={{
          maxWidth: "unset",
          height: "calc(100vh - 100px)",
        }}
      >
        {/* 模态框头部 */}
        <div className="flex items-center justify-between border-b border-gray-800/30">
          <h2 className="text-2xl font-bold text-white font-urbanist">
            {t('role.detail.profile')}
          </h2>
        </div>
        {status === "pending" ? (
          <InnerLoading className="h-90" />
        ) : character ? (
          <div className="grid grid-cols-5 gap-8">
            {/* 左侧：头像和底部操作区 */}
            <div className="col-span-2">
              <CharacterAvatar
                characterId={characterId}
                imageUrl={character.avatar_url}
                social={character?.social}
                isMobile={false}
                followCount={followCount}
                owner={owner}
                slot={<Multimedia characterId={characterId} owner={owner} />}
              />
            </div>
            {/* 右侧：内容区 */}
            <div className="col-span-3 flex flex-col gap-2 overflow-y-auto max-h-[600px]">
              {/* 基本信息 */}
              <CharacterInfo
                nickname={character.nickname}
                assortment={character.assortment}
                type={character.type}
                updatedAt={character?.updated_at}
                description={character.introduction || character.description}
                age={character.age}
                color={character.color}
                gender={character.gender}
                stats={{
                  mood: character?.assortment || '',
                  intimacy: character.social?.intimacy_score || 0,
                  videoCount: character.social?.video_count || 0,
                  imageCount: character.social?.posted_count || 0,
                }}
                isMobile={false}
                followContent={FollowButton}
              />

              {/* 操作按钮 */}
              {Operation}

              {/* 帖子列表 */}
              <PostList
                roleId={characterId}
                onMorePosts={() => {
                  if (!isLogin) {
                    gotoLogin();
                    return;
                  }
                  navigate(`/post/${characterId}`);
                }}
                isMobile={false}
              />
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export default RoleDetail;
