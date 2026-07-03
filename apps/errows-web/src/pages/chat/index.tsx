import React from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  InputGroupInput,
  InputGroupAddon,
  InputGroup,
} from "@errows/design";
import { InfiniteScroll } from "@/components/infinite-scroll";
import { ChatListItem } from "./components/chat-list-item";
import CharacterInfo from "./components/character-info";
import { ChatBox } from "./components/chat-box";
import { ChatBoxMobile } from "./components/chat-box/index.mobile";
import { SearchIcon, RoleShowIcon, RoleHideIcon } from "@errows/icons";
import { HeartIcon, HeartFilledIcon, BackIcon } from "@errows/icons";
import { useLocation, useNavigate } from "react-router";
import { useMobile } from "@/hooks/use-mobile-detector";
import { avatarUrl } from "@/utils/mock";
import { install } from "@/lib/install-service";
import { ChatServicesProvider, useChatServices } from "./services";
import { toast } from "@errows/design";
import { cn } from "@errows/design/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetClose,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@errows/design/components/sheet";
import { IntimacyIcon } from "@errows/icons";
import { useCharacter } from "./components/character-info/use-character";
import { useFollow } from "@/hooks/use-like";
import { MediaViewerProvider } from "@/components/media-viewer/use-media-viewer";
import {
  CharacterServicesProvider,
  useCharacterServices,
} from "@/pages/role/services";

const FollowButton: React.FC<{ character: API.Character.CHARACTER }> = ({
  character,
}) => {
  const { followed, followedCount, handleFollow } = useFollow(
    character.id,
    character.followed,
    character.social.followed_count
  );
  return (
    <div
      className="flex min-w-[74px] items-center gap-1 px-3 py-1 h-10 rounded-[10px] bg-[#FFFFFF1A]"
      onClick={handleFollow}
    >
      {/* {followed ? (
        <HeartFilledIcon className="text-[#D743A7] w-5 h-5" />
      ) : (
        <HeartIcon className="w-5 h-5 text-white" />
      )} */}
      <IntimacyIcon
        className={`w-5 h-5 ${followed ? "text-[#D743A7]" : "text-white"}`}
      />
      <span
        className="text-white text-[12px] font-semibold ml-2"
        style={{ fontFamily: "Urbanist" }}
      >
        {followedCount}
      </span>
    </div>
  );
};

function Chat() {
  const { t } = useTranslation();
  const [showRoleInfo, setShowRoleInfo] = React.useState(true);
  const isMobile = useMobile();

  const { chatSettings } = useChatServices();
  const { open } = useCharacterServices();

  const {
    loading,
    sessions,
    selectSession,
    back,
    currentSessionSummary,
    session,
    sessionDetailLoading,
    deleteSession,
  } = useChatServices();

  const handleDelete = (chatId: string) => {
    console.log("删除聊天 ID:", chatId);
    deleteSession(chatId);
  };

  const { character } = useCharacter(currentSessionSummary?.character.id);

  const [searchText, setSearchText] = React.useState("");

  const filterSessions = React.useMemo(() => {
    if (!searchText.trim()) {
      return sessions;
    }
    const lowerSearchText = searchText.toLowerCase();
    return sessions?.filter((session) =>
      session.character.nickname.toLowerCase().includes(lowerSearchText)
    );
  }, [searchText, sessions]);

  return (
    <div className="flex-1 flex  h-screen w-full overflow-hidden pt-[80px] max-sm:pt-[60px]">
      <div className="max-sm:w-full w-[360px]  h-full flex flex-col items-center shrink-0">
        <InputGroup className="max-sm:w-[calc(100%-24px)] max-sm:mt-3 max-sm:h-[48px] bg-transparent rounded-none h-[64px] shrink-0">
          <InputGroupInput
            placeholder={t("sidebar.chat")}
            style={{ background: "none" }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <InputGroupAddon className="bg-transparent">
            <SearchIcon className="w-5 h-5 text-white" />
          </InputGroupAddon>
        </InputGroup>
        <div className="w-full h-full p-4 overflow-y-auto pb-3 scrollbar-hide">
          <InfiniteScroll
            className="flex flex-col gap-3"
            direction="down"
            onLoadMore={() => {}}
            loading={loading}
            hasMore={false}
          >
            {filterSessions?.map((item) => (
              <ChatListItem
                key={item.id}
                data={item}
                isActive={currentSessionSummary?.id === item.id}
                onClick={() => selectSession(item.id as string)}
                onDelete={() => handleDelete(item.id as string)}
              />
            ))}
          </InfiniteScroll>
        </div>
      </div>

      {/* web端显示 */}
      {currentSessionSummary && !isMobile && (
        <div className="flex w-[calc(100%-360px)]">
          <div className="w-full h-full relative overflow-hidden">
            <div className="w-full h-16 border-t-[1px] border-b-[1px] border-[#2C2C38]"></div>
            <ChatBox
              style={{ height: "calc(100% - 64px)" }}
              loading={sessionDetailLoading}
            />
          </div>
          <CharacterInfo
            cid={currentSessionSummary.character.id}
            className={`border-l-[1px] border-[#2C2C38] ${
              showRoleInfo ? "w-[358px]" : "w-0"
            }`}
            cardClassName="px-6"
          >
            <div
              className={`absolute top-[22px] size-5`}
              onClick={() => setShowRoleInfo((prev) => !prev)}
              style={{
                left: showRoleInfo ? "-25px" : "-15px",
              }}
            >
              {showRoleInfo ? (
                <RoleShowIcon className="w-[15px] h-[15px] text-white" />
              ) : (
                <RoleHideIcon className="w-[15px] h-[15px] text-white" />
              )}
            </div>
          </CharacterInfo>
        </div>
      )}
      {/* mobile端显示 */}
      {currentSessionSummary && isMobile && (
        <Sheet
          open={!!currentSessionSummary}
          onOpenChange={back}
          // dismissible={false}
        >
          <SheetContent
            side="right"
            className={cn(
              "z-1000 [&>button]:hidden border-l-0",
              "w-screen h-screen flex flex-col",
              "bg-[#101018]"
            )}
          >
            <div className="h-[72px] flex items-center justify-between px-4 border-b border-[#2C2C38] shrink-0">
              {/* 返回按钮 */}
              <div
                className="w-10 h-10 flex items-center justify-center cursor-pointer"
                onClick={back}
              >
                <BackIcon className="w-4 h-4 text-white" />
              </div>

              {/* 用户信息 */}
              <div
                className="flex flex-col items-center"
                onClick={() => open(currentSessionSummary?.character.id)}
              >
                {session?.character?.avatar_url && (
                  <div className="w-6 h-6 rounded-full overflow-hidden mb-1">
                    <img
                      // src={session?.character?.avatar_url}
                      src={character?.avatar_url}
                      alt={session?.character?.nickname}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <span
                  className="text-white text-[14px] font-semibold"
                  style={{ fontFamily: "Urbanist" }}
                >
                  {session?.character?.nickname}
                </span>
              </div>

              {/* 收藏数 */}
              {/* <div className="flex items-center gap-1 px-3 py-1 h-10 rounded-[10px] bg-[#FFFFFF1A]">
                <HeartIcon className="w-5 h-5 text-white" />
                <span
                  className="text-white text-[12px] font-semibold"
                  style={{ fontFamily: "Urbanist" }}
                >
                  {character?.social?.likes_count}
                </span>
              </div> */}
              {character && <FollowButton character={character} />}
            </div>
            <ChatBoxMobile
              className="h-[calc(100%-72px)]"
              loading={sessionDetailLoading}
            />
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}

export default install(Chat, [
  ChatServicesProvider,
  MediaViewerProvider,
  CharacterServicesProvider,
]);
