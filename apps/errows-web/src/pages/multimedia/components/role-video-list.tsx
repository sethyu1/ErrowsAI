import { useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";
import { alertDialog, toast } from "@errows/design";
import { Loading, ListEmpty } from "@/components";
import { BatchCardList } from './batch-card-list';
import { fetchMyCharacterVideosByCidApi, deleteMyCharacterVideoApi } from "@/apis/character";
import { Button } from "@errows/design";
import { ArrowRightIcon } from "@errows/icons";
import { useNavigate } from "react-router";

interface RoleVideoListProps {
  roleId: string;
  isMobile: boolean;
  order?: string;
  /** 是否有删除入口 */
  showDeleteEntry?: boolean;
}

function RoleVideoList({
  roleId,
  isMobile,
  order,
  showDeleteEntry = false,
}: RoleVideoListProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    data: videoData,
    status: videoStatus,
    error: videoError,
    refetch: refetchVideos,
  } = useQuery({
    queryKey: ["myCharacterVideos", roleId, order],
    queryFn: async () => {
      return await fetchMyCharacterVideosByCidApi(roleId ?? "", order ? { order } : {});
    },
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    retry: false,
    enabled: !!roleId,
  });

  const videoList = useMemo(() => {
    if (!videoData?.data) return [];
    return videoData.data.map((item) => ({
      id: item.id,
      avatar: item.cover,
      url: item.url,
      created_at: item.created_at,
      nickname: "",
      count: 0,
    }));
  }, [videoData]);

  const handleDeleteVideo = useCallback((videoId: string) => {
    alertDialog.confirm({
      title: t('common.delete'),
      content: t('multimedia.deleteVideoConfirm'),
      confirmText: t('common.delete'),
      cancelText: t('common.cancel'),
      onConfirm: async () => {
        try {
          if (!roleId) return;
          await deleteMyCharacterVideoApi(roleId, videoId);
          toast.success(t('common.deletedSuccessfully'), {
            position: 'top-center',
            closeButton: false
          });
          await refetchVideos();
        } catch {
          // 保持静默失败，不改变当前 UI 状态
        }
      },
    });
  }, [roleId, refetchVideos, t]);

  return (
    <div>
      {videoStatus === "pending" && (
        <div
          className="h-full flex flex-col items-center justify-center"
          style={{
            padding: isMobile ? "60px  0" : "100px  0",
            gap: isMobile ? 16 : 20,
            fontSize: 40,
          }}
        >
          <Loading />
          <p className="text-gray-400 font-urbanist text-lg">
            {t('common.loading')}
          </p>
        </div>
      )}

      {videoStatus === "error" && (
        <div className="h-full flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Icon
              icon="mdi:alert-circle"
              className="w-12 h-12 text-red-500"
            />
            <p className="text-red-400 font-urbanist text-sm">
              {t('multimedia.failedLoadMedia')}
            </p>
            <p className="text-gray-500 font-urbanist text-xs">
              {videoError instanceof Error
                ? videoError.message
                : "Unknown error"}
            </p>
          </div>
        </div>
      )}

      {videoStatus === "success" && videoList.length === 0 && (
        <div className="h-full flex items-center justify-center">
          <div
            className="flex flex-col items-center gap-3"
            style={{
              padding: "60px  0",
              fontSize: 80,
            }}
          >
            <ListEmpty />
            {roleId && <Button
              appearance="gradientFill"
              className="px-6 py-2 mt-6 text-sm font-medium text-white font-urbanist"
              onClick={() => navigate(`/generate/video/${roleId}`)}
              style={{width: 160}}
            >
              {t('common.createNew')} <ArrowRightIcon />
            </Button>}
          </div>
        </div>
      )}

      {videoStatus === "success" && videoList.length > 0 && (
        <BatchCardList
          type="video"
          list={videoList}
          selectedList={[]}
          onSelectedChange={() => void 0}
          generatingImageIds={[]}
          showDeleteEntry={showDeleteEntry}
          onDelete={showDeleteEntry ? handleDeleteVideo : undefined}
        />
      )}
    </div>
  );
}

export default RoleVideoList;

