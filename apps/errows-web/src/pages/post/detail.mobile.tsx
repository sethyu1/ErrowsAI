import React from "react";
import { Button } from "@errows/design";
import { BackIcon } from "@errows/icons";
import { useTranslation } from "react-i18next";
import CharacterInfo from "../chat/components/character-info";
import { InfiniteScroll } from "@/components/infinite-scroll";
import PostCard from "./components/post-card";
import { useChatServices } from "../chat/services";
import { useCharacterPost } from "./services";

interface PostDetailMobileProps {
  cid: string;
  handleBack: () => void;
}

export default function PostDetailMobile(props: PostDetailMobileProps) {
  const { cid, handleBack } = props;
  const { t } = useTranslation();
  const { chatSettings } = useChatServices();
  const {
    data: postList,
    loading,
    onLoadMore,
    hasMore,
    comment,
    feedback,
    remove,
  } = useCharacterPost(cid);
  return (
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
              chatSettings.open({ cid });
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
  );
}
