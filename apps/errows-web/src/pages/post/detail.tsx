import { useNavigate, useParams } from "react-router";
import CharacterInfo from "../chat/components/character-info";
import { BackIcon } from "@errows/icons";
import { Button } from "@errows/design";
import PostCard from "./components/post-card";
import { useMobile } from "@/hooks/use-mobile-detector";
import { PostServicesProvider, useCharacterPost } from "./services";
import { install } from "@/lib/install-service";
import { InfiniteScroll } from "@/components/infinite-scroll";
import {
  ChatServicesProvider,
  useChatServices,
} from "@/pages/chat/services";
import { useTranslation } from "react-i18next";

function PostDetail() {
  const { id: cid } = useParams<{ id: string }>(); //角色id
  const { t } = useTranslation();
  if (!cid) {
    return <div>{t("common.characterNotFound")}</div>;
  }
  const {
    data: postList,
    loading,
    onLoadMore,
    hasMore,
    comment,
    feedback,
    remove,
  } = useCharacterPost(cid);
  const isMobile = useMobile();
  const navigate = useNavigate();
  const handleBack = () => {
    navigate("/post");
  };
  const { chatSettings } = useChatServices();

  // console.log("postList ===>>", postList);
  return isMobile ? (
    <div className="fixed top-0 left-0 right-0 bottom-0 bg-[#0E0F17] z-1000 overflow-auto">
      <div className="h-[72px] flex items-center px-4 bg-[#0E0F17] border-b border-[#2C2C38] gap-4 fixed top-0 left-0 right-0 z-1001">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <BackIcon className="w-5 h-5 text-white" />
        </Button>
        <span
          className="text-[24px] font-bold text-[#FCFCFC]"
          style={{ fontFamily: "Urbanist" }}
        >
          {t("common.profile")}
        </span>
      </div>
      <div className="flex flex-col h-auto pt-[84px] items-center px-[14px]">
        {cid && (
          <CharacterInfo
            cid={cid}
            roundSize={24}
            className="w-full min-h-[800px]"
            onChat={(cid) => {
              console.log("cid ===>>", cid);
              chatSettings.open({ cid })
            }}
          />
        )}
        <InfiniteScroll
          direction="down"
          onLoadMore={onLoadMore}
          loading={loading}
          hasMore={hasMore}
        >
          {postList.map((post, index) => (
            <PostCard
              key={post.id}
              data={post}
              comment={comment}
              feedback={feedback}
              onDelete={remove}
              className={`w-full ${
                postList.length === 1
                  ? "rounded-[24px]"
                  : index === 0
                  ? "rounded-t-[24px]"
                  : index === postList.length - 1
                  ? "rounded-b-[24px]"
                  : ""
              }`}
            />
          ))}
        </InfiniteScroll>
      </div>
    </div>
  ) : (
    <div className="flex-1 flex flex-col h-screen w-full overflow-auto">
      <div className="flex justify-center pt-[110px] gap-6 h-full relative">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <BackIcon className="w-5 h-5 text-white" />
        </Button>
        {cid && (
          <CharacterInfo
            cid={cid}
            roundSize={24}
            className="w-full"
            onChat={(cid) => chatSettings.open({ cid })}
          />
        )}
        <div className="overflow-auto w-[574px] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <InfiniteScroll
            direction="down"
            onLoadMore={onLoadMore}
            loading={loading}
            hasMore={hasMore}
          >
            {postList.map((post, index) => (
              <PostCard
                key={post.id}
                data={post}
                className={`w-full ${
                  postList.length === 1
                    ? "rounded-[24px]"
                    : index === 0
                    ? "rounded-t-[24px]"
                    : index === postList.length - 1
                    ? "rounded-b-[24px]"
                    : ""
                }`}
                comment={comment}
                feedback={feedback}
                onDelete={remove}
              />
            ))}
          </InfiniteScroll>
        </div>
      </div>
    </div>
  );
}
export default install(PostDetail, [
  ChatServicesProvider,
  PostServicesProvider,
]);
