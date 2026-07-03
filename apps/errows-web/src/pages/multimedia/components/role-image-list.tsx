import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";
import { alertDialog, toast } from "@errows/design";
import { Loading, ListEmpty } from "@/components";
import { BatchCardList } from "./batch-card-list";
import { Operation } from "./operation";
import {
  fetchMyCharacterImagesByCidApi,
  createCharacterImageToVideoTaskApi,
  fetchCharacterImageToVideoTaskStatusApi,
  fetchVideoGenTaskStatusByRoleApi,
  deleteMyCharacterImageApi,
} from "@/apis/character";
import { Button } from "@errows/design";
import { ArrowRightIcon } from "@errows/icons";
import { useNavigate } from "react-router";

interface VideoTaskStatus {
  status: "pending" | "generating" | "completed" | "failed";
  imageId: string;
  image_id: string;
  uniqueTaskId: string | null;
}

interface RoleImageListProps {
  roleId: string;
  isMobile: boolean;
  allowBatchActions: boolean;
  selectionModeEnabled: boolean;
  className?: string;
  order?: string;
  /** 是否需要展示生产中的状态 */
  showGeneratingStatus?: boolean;
  /** 是否有删除入口 */
  showDeleteEntry?: boolean;
}

const RoleImageList = ({
  roleId,
  isMobile,
  allowBatchActions,
  selectionModeEnabled,
  order,
  className,
  showGeneratingStatus = false,
  showDeleteEntry = false,
}: RoleImageListProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selectedList, setSelectedList] = useState<string[]>([]);
  const [videoTasks, setVideoTasks] = useState<
    Record<string, VideoTaskStatus>
  >({});
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );
  const videoTasksRef = useRef(videoTasks);

  const {
    data: imageData,
    status: imageStatus,
    error: imageError,
    refetch: refetchImages,
  } = useQuery({
    queryKey: ["myCharacterImages", roleId, order],
    queryFn: async () => {
      return await fetchMyCharacterImagesByCidApi(roleId ?? "", order ? { order } : {});
    },
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    retry: false,
    enabled: !!roleId,
  });

  // 获取角色生成未完成的视频任务状态
  const { data: videoGenTaskStatusData } = useQuery({
    queryKey: ["videoGenTaskStatus", roleId],
    queryFn: async () => {
      if (!roleId) return null;
      return await fetchVideoGenTaskStatusByRoleApi(roleId);
    },
    enabled: !!roleId && showGeneratingStatus,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    retry: false,
  });

  const imageList = useMemo(() => {
    if (!imageData?.data) return [];
    return imageData.data.map((item) => ({
      id: item.id,
      avatar: item.url,
      url: item.url,
      created_at: item.created_at,
      nickname: "",
      count: 0,
    }));
  }, [imageData]);

  const generatingImageIds = useMemo(() => {
    return Object.values(videoTasks)
      .filter(
        (task) => task.status === "pending" || task.status === "generating"
      )
      .map((task) => task.imageId || task.image_id)
      .filter((id): id is string => !!id);
  }, [videoTasks]);

  const canSelect = allowBatchActions && selectionModeEnabled;

  useEffect(() => {
    if (!canSelect && selectedList.length > 0) {
      setSelectedList([]);
    }
  }, [canSelect, selectedList.length]);

  useEffect(() => {
    if (videoGenTaskStatusData && Array.isArray(videoGenTaskStatusData)) {
      setVideoTasks(videoGenTaskStatusData.filter(task => task.status === 'pending' || task.status === 'generating').reduce((acc, task) => {
        acc[task.image_id] = { status: task.status, imageId: task.image_id, image_id: task.image_id, uniqueTaskId: task.id };
        return acc;
      }, {} as Record<string, VideoTaskStatus>));
    }
  }, [videoGenTaskStatusData]);

  useEffect(() => {
    if (canSelect) {
      setSelectedList([]);
    }
  }, [canSelect]);


  useEffect(() => {
    setSelectedList([]);
    setVideoTasks({});
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, [roleId]);

  useEffect(() => {
    videoTasksRef.current = videoTasks;
  }, [videoTasks]);

  const { mutate: createVideoGenTask } = useMutation({
    mutationFn: async (imageId: string) => {
      if (!roleId) throw new Error("roleId is required");
      return await createCharacterImageToVideoTaskApi(roleId, imageId);
    },
    onSuccess: (data, imageId) => {
      const uniqueTaskId = data.id;
      setVideoTasks((prev) => ({
        ...prev,
        [imageId]: {
          status: "generating",
          imageId,
          image_id: imageId,
          uniqueTaskId,
        },
      }));
    },
    onError: (_error, imageId) => {
      setVideoTasks((prev) => ({
        ...prev,
        [imageId]: {
          ...prev[imageId],
          status: "failed",
          imageId,
        },
      }));
    },
  });

  const { mutate: fetchVideoGenTaskStatus } = useMutation({
    mutationFn: async ({
      uniqueTaskId
    }: {
      imageId: string;
      uniqueTaskId: string;
    }) => {
      if (!roleId) throw new Error("roleId is required");
      return await fetchCharacterImageToVideoTaskStatusApi(roleId, uniqueTaskId);
    },
    onSuccess: (data, variables) => {
      const { imageId } = variables;
      setVideoTasks((prev) => {
        const prevTask = prev[imageId];
        return {
          ...prev,
          [imageId]: {
            ...prevTask,
            status: data.status,
          },
        };
      });
    },
    onError: (_error, variables) => {
      const { imageId } = variables;
      setVideoTasks((prev) => {
        const prevTask = prev[imageId];
        return {
          ...prev,
          [imageId]: {
            ...prevTask,
            status: "failed",
          },
        };
      });
    },
  });

  useEffect(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    if (!roleId) {
      return;
    }

    pollingIntervalRef.current = setInterval(() => {
      const currentPendingTasks = Object.values(videoTasksRef.current).filter(
        (task: VideoTaskStatus) =>
          task.status === "pending" || task.status === "generating"
      );
      if (currentPendingTasks.length > 0) {
        currentPendingTasks.forEach((task) => {
          if (task.imageId && task.uniqueTaskId) {
            fetchVideoGenTaskStatus({
              imageId: task.imageId,
              uniqueTaskId: task.uniqueTaskId,
            });
          }
        });
      }
    }, 1000 * 10);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [roleId, fetchVideoGenTaskStatus]);

  const generateVideosForIds = async (imageIds: string[]) => {
    if (imageIds.length === 0) return;

    const selectableImageIds = imageIds.filter(
      (id) => !generatingImageIds.includes(id)
    );

    if (selectableImageIds.length === 0) {
      alertDialog.warning({
        title: t('multimedia.noSelectableImages'),
        content: t('multimedia.allImagesGenerating'),
      });
      return;
    }

    alertDialog.show({
      title:
        selectableImageIds.length > 1 ? t('multimedia.generateVideos') : t('multimedia.generateVideo'),
      content: `${t('multimedia.selected')}: ${selectableImageIds.length} ${t('common.image')}
\n${t('multimedia.willGenerate')} ${selectableImageIds.length} ${t('common.video')}`,
      type: "info",
      showCancel: true,
      confirmText: t('common.confirm'),
      cancelText: t('common.cancel'),
      onConfirm: async () => {
        for (const imageId of selectableImageIds) {
          setVideoTasks((prev) => ({
            ...prev,
            [imageId]: {
              status: "pending",
              imageId,
              image_id: imageId,
              uniqueTaskId: null,
            },
          }));

          createVideoGenTask(imageId);

          await new Promise((resolve) => setTimeout(resolve, 500));
        }
        setSelectedList([]);
      },
      onCancel: () => { },
    });
  };

  const handleBatchGenerateVideos = async () => {
    if (selectedList.length === 0) return;
    generateVideosForIds(selectedList);
  };

  const handleGenerateVideo = (id: string) => {
    generateVideosForIds([id]);
  };

  const handleDeleteImage = useCallback((imageId: string) => {
    alertDialog.confirm({
      title: t('common.delete'),
      content: t('multimedia.deleteImageConfirm'),
      confirmText: t('common.delete'),
      cancelText: t('common.cancel'),
      onConfirm: async () => {
        try {
          if (!roleId) return;
          await deleteMyCharacterImageApi(roleId, imageId);
          toast.success(t('common.deletedSuccessfully'), {
            position: 'top-center',
            closeButton: false
          });
          await refetchImages();
        } catch {
          // 保持静默失败，不改变当前 UI 状态
        }
      },
    });
  }, [roleId, refetchImages, t]);

  return (
    <div className={className}>
      {imageStatus === "pending" && (
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

      {imageStatus === "error" && (
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
              {imageError instanceof Error
                ? imageError.message
                : "Unknown error"}
            </p>
          </div>
        </div>
      )}

      {imageStatus === "success" && imageList.length === 0 && (
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
              onClick={() => navigate(`/generate/image/${roleId}`)}
              style={{ width: 160 }}
            >
              {t('common.createNew')} <ArrowRightIcon />
            </Button>}
          </div>
        </div>
      )}

      {imageStatus === "success" && imageList.length > 0 && (
        <BatchCardList
          type="image"
          list={imageList}
          selectedList={canSelect ? selectedList : []}
          onSelectedChange={canSelect ? setSelectedList : () => { }}
          generatingImageIds={generatingImageIds}
          onGenerateVideo={handleGenerateVideo}
          batchModeEnabled={canSelect}
          showDeleteEntry={showDeleteEntry}
          onDelete={showDeleteEntry ? handleDeleteImage : undefined}
        />
      )}

      {!!selectedList?.length && canSelect && (
        <Operation
          onCancel={() => {
            setSelectedList([]);
          }}
          onGenerate={handleBatchGenerateVideos}
          count={selectedList.length}
        />
      )}
    </div>
  );
};

export default RoleImageList;
