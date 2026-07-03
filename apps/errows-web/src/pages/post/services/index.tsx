import React, { useRef } from "react";
import { useTranslation } from "react-i18next";
import { useModal } from "@/hooks/use-modal";
import { install } from "@/lib/install-service";
import { useChatServices, ChatServicesProvider } from "@/pages/chat/services";
import { PostCreator } from "../components/post-creator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  toast,
} from "@errows/design";
import type { CreateCommentParams, CreatePostParams } from "@/apis/post";
import {
  createPostApi,
  createCommentApi,
  postFeedbackApi,
  updatePostApi,
} from "@/apis/post";
import { useInfiniteScroll } from "@/components/infinite-scroll";
import { fetchPostsApi, deletePostApi } from "@/apis/post";
import {
  Drawer,
  DrawerContent,
  DrawerClose,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@errows/design/components/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMobileKeyboard } from "@/hooks/use-mobile-keyboard";
import { BackIcon, CloseIcon } from "@errows/icons";
import { Button } from "@errows/design";

export const useCharacterPost = (cid: string) => {
  const { t } = useTranslation();
  const { data, loading, onLoadMore, setData, hasMore } = useInfiniteScroll(
    fetchPostsApi,
    {
      cid,
    }
  );

  const comment = async (
    pid: string,
    data: CreateCommentParams
  ): Promise<string> => {
    console.log(pid, data);
    try {
      if (!pid) {
        throw new Error("Post ID is required");
      }
      const { id } = await createCommentApi(pid, data);
      toast.success(t("post.commentCreatedSuccessfully"));
      return id;
    } catch (e) {
      console.error(e);
      toast.error(t("post.failedToCreateComment"));
      throw e;
    }
  };

  const feedback = async (pid: string, feedback: "like" | "dislike") => {
    console.log(pid, feedback);
    try {
      if (pid) {
        await postFeedbackApi(pid, feedback);
        setData((prev) => {
          return prev?.map((i) => {
            if (i.id === pid) {
              return {
                ...i,
                feedback: i.feedback === feedback ? null : feedback,
              };
            } else {
              return i;
            }
          });
        });
        // toast.success("Feedback created successfully");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const remove = async (cid: string, pid: string) => {
    try {
      await deletePostApi(cid, pid);
      setData((prev) => prev?.filter((i) => i.id !== pid));
    } catch (error) {
      console.error(error);
    }
  };

  return { data, loading, onLoadMore, hasMore, feedback, comment, remove };
};

interface PostServicesContextValue {
  create: (cid: string, params?: any) => void;
  update: (cid: string, postData: API.POST.POST) => void;
}

const PostServicesContext = React.createContext<PostServicesContextValue>(
  {} as PostServicesContextValue
);

export type PostData = {
  cid: string;
  data?: API.POST.POST;
};

export const PostServicesProvider: React.FC<React.PropsWithChildren> = install(
  (props) => {
    const { t } = useTranslation();
    const { children } = props;
    const isMobile = useIsMobile();
    //这个是创建post的cid
    const { data, visible, open, close } = useModal<PostData>();
    const [submitting, setSubmitting] = React.useState(false);
    const drawerContainerRef = useRef<HTMLDivElement>(null);
    const [postParams, setPostParams] = React.useState<any>(null);

    // 处理移动端键盘弹出时的布局问题
    useMobileKeyboard(isMobile, visible, drawerContainerRef);

    const handleCreatePost = async (
      cid: string,
      data: CreatePostParams & { pid?: string }
    ) => {
      try {
        setSubmitting(true);
        if (data?.pid) {
          const params = { ...data };
          delete params.pid;
          await updatePostApi(cid, data.pid, params);
          toast.success(t("post.postUpdatedSuccessfully"));
        } else {
          await createPostApi(cid, data);
          toast.success(t("post.postCreatedSuccessfully"));
        }
        setSubmitting(false);
        close();
      } catch (error) {
        console.error(error);
        toast.error(t("post.failedToCreatePost"));
        setSubmitting(false);
      }
    };

    const create = (cid: string, roleParams?: any) => {
      open({ cid });
      if (roleParams) {
        setPostParams(roleParams);
      } else {
        setPostParams(null);
      }
    };

    const update = (cid: string, data: API.POST.POST) => {
      open({ cid, data });
    };

    return (
      <PostServicesContext.Provider
        value={{
          create,
          update,
        }}
      >
        {children}
        {!isMobile && (
          <Dialog open={visible} onOpenChange={close} modal>
            <DialogContent className="!w-[800px] !max-w-[800px] border-[#2C2C38]  overflow-visible">
              <DialogHeader>
                <DialogTitle className="text-white">{t("post.post")}</DialogTitle>
              </DialogHeader>
              <div className="max-h-[calc(90vh-120px)] overflow-y-auto overflow-x-hidden">
                {data && (
                  <PostCreator
                    data={data}
                    roleParams={postParams}
                    onSubmit={handleCreatePost}
                    submitting={submitting}
                  />
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
        {isMobile && (
          <Drawer open={visible} onOpenChange={close} direction="left" dismissible={false}>
            <DrawerContent
              ref={drawerContainerRef}
              className="data-[vaul-drawer-direction=left]:w-screen !h-screen z-1000 bg-[#1b1227]"
            >
              <DrawerHeader className="hidden">
                <DrawerTitle />
                <DrawerDescription />
              </DrawerHeader>
              <div className="w-full h-full flex flex-col overflow-hidden">
                <div className="flex items-center h-[72px] shrink-0 px-6 gap-4 border-b border-[#2C2C38]">
                  <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => close()}>
                    <CloseIcon className="w-4 h-4" />
                  </Button>
                  <span className="text-white text-[18px] font-bold text-[#FCFCFC]">
                    Al Hentai Generator
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto overflow-x-hidden">
                  {data && (
                    <PostCreator
                      className="p-3 pb-24"
                      data={data}
                      roleParams={postParams}
                      onSubmit={handleCreatePost}
                      submitting={submitting}
                    />
                  )}
                </div>
              </div>
            </DrawerContent>
          </Drawer>
        )}
      </PostServicesContext.Provider>
    );
  },
  []
);

export const usePostServices = () => {
  return React.useContext(PostServicesContext);
};
