import { followCharacterApi, unfollowCharacterApi } from "@/apis/character";
import React from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import mitt from "mitt";

export const emitter = mitt<{ follow: { id: string; followed: boolean } }>();

export const useSelfFollow = (
  id: string,
  defaultIsFollow: boolean,
  onSuccess?: (followed: boolean) => void
) => {
  const { t } = useTranslation();
  const [followed, setFollowed] = React.useState(defaultIsFollow);
  const [isLoading, setIsLoading] = React.useState(false);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  const handleFollow = async () => {
    // 防抖：如果已经在加载中，直接返回
    if (isLoading) return;

    // 取消之前的请求（如果有）
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      setIsLoading(true);
      const newFollowState = !followed;
      setFollowed(newFollowState);

      if (newFollowState) {
        await followCharacterApi(id);
        toast.success(t("common.followCharacterSuccessfully"), {
          position: "top-center",
        });
        onSuccess?.(true);
        // console.log("follow", { id, followed: true });
        emitter.emit("follow", { id, followed: true });
      } else {
        await unfollowCharacterApi(id);
        toast.success(t("common.unfollowCharacterSuccessfully"), {
          position: "top-center",
        });
        onSuccess?.(false);
        // console.log("unfollow", { id, followed: false });
        emitter.emit("follow", { id, followed: false });
      }
    } catch (error) {
      // 如果是取消的请求，不显示错误
      if (error instanceof Error && error.name === "AbortError") {
        console.log("Request cancelled");
        return;
      }

      console.error(error);
      setFollowed(followed); // 恢复之前的状态
      toast.error(t("common.failedToFollowCharacter"), {
        position: "top-center",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 清理资源
  React.useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return { followed, setFollowed, handleFollow, isLoading };
};
