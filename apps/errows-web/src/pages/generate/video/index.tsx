import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { cn } from "@errows/design/lib/utils";
import { TopTitle, LeftCharacter, TaskStatusDisplay, GeneratingView } from "../components";
import { RoleImageCard, RoleLoadingCard, Loading, GeneratingIcon, ListEmpty } from "@/components";
import { useMobile } from "@/hooks/use-mobile-detector";
import { Button, alertDialog } from "@errows/design";
import { ArrowRightIcon } from "@errows/icons";
import { useCharacterDetail } from "@/hooks/use-character-detail";
import type { TopTitleRef } from "../components/top-title";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  fetchMyCharacterImagesByCidApi,
  createCharacterImageToVideoTaskApi,
  fetchCharacterImageToVideoTaskStatusApi,
  fetchVideoGenTaskStatusByRoleApi,
  retryCharacterVideoGenTaskApi,
  speedUpTaskApi,
} from "@/apis/character";
import { confirmExitGenerating, isTaskSpedUp, markTaskSpedUp } from "../util";
import {
  CharacterServicesProvider,
  useCharacterServices,
} from "@/pages/role/services";
import { install } from "@/lib/install-service";
import { useGlobalStore } from "@/stores/global";
import { useMemberStore } from "@/stores/member";
import { useShallow } from "zustand/react/shallow";
import { fetchMemberInfoApi } from "@/apis/member";


const VIDEO_PROGRESS_DURATION_MS = 90000;
const VIDEO_SPEED_UP_RAMP_MS = 30000;
const VIDEO_PROGRESS_TICK_MS = 150;
const VIDEO_GEN_STALL_MS = 300000;

interface GenerateResult {
  status: "pending" | "generating" | "completed" | "failed";
  asset: null | API.Character.AssetVideo;
  imageId?: string;
  createdAt?: string;
  spedUp?: boolean;
  speedUpClickedAt?: number;
  percentAtSpeedUp?: number;
}

function GenerateVideo() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { roleId } = useParams<{ roleId: string }>();
  const isMobile = useMobile();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [stallClock, setStallClock] = useState(() => Date.now());
  const [videoGenRetryingTaskId, setVideoGenRetryingTaskId] = useState<
    string | null
  >(null);

  const [selectedImageId, setSelectedImageId] = useState<string>("");
  const editRef = useRef<TopTitleRef>(null);
  const { roleInfo, isLoading } = useCharacterDetail(roleId ?? "");
  const [generateResult, setGenerateResult] = useState<
    Record<string, GenerateResult>
  >({});
  const [taskIdToPercent, setTaskIdToPercent] = useState<Record<string, number>>({});
  const taskIdToPercentRef = useRef<Record<string, number>>({});
  const fromHomePage = useGlobalStore(useShallow(state => state.fromHomePage));
  const { open } = useCharacterServices();
  // 查询角色图片列表
  const { data: imageData, isLoading: isLoadingImages } = useQuery({
    queryKey: ["myCharacterImages", roleId],
    queryFn: async () => {
      if (!roleId) return null;
      return await fetchMyCharacterImagesByCidApi(roleId);
    },
    enabled: !!roleId,
  });

  const imageList = useMemo(() => {
    const data = imageData?.data || [];
    return data.map((item) => {
      return {
        id: item.id,
        url: item.url,
        created_at: item.created_at,
      };
    });
  }, [imageData]);


  // 获取角色生成未完成的视频任务状态
  const { data: videoGenTaskStatusData } = useQuery({
    queryKey: ["videoGenTaskStatus", roleId],
    queryFn: async () => {
      if (!roleId) return null;
      return await fetchVideoGenTaskStatusByRoleApi(roleId);
    },
    enabled: !!roleId,
  });

  // 创建视频生成任务的 mutation
  const createVideoGenTaskMutation = useMutation({
    mutationFn: async (imageId: string) => {
      if (!roleId) throw new Error("roleId is required");
      return await createCharacterImageToVideoTaskApi(roleId, imageId);
    },
    onSuccess: (data, imageId) => {
      const taskId = data.id;
      setGenerateResult((prev) => ({
        ...prev,
        [taskId]: {
          status: "generating",
          asset: null,
          imageId: imageId,
          createdAt: new Date().toISOString(),
        }
      }));
      // 生成成功后，清空选中状态
      setSelectedImageId("");
      if (isMobile) setDrawerOpen(true);
    },
    onError: (error) => {
      console.error("Failed to create video task:", error);
    },
  });

  // 获取生成中的任务数据
  const fetchVideoGenTaskStatusMutation = useMutation({
    mutationFn: async (taskId: string) => {
      if (!roleId) throw new Error("roleId is required");
      return await fetchCharacterImageToVideoTaskStatusApi(
        roleId,
        taskId,
      );
    },
    onSuccess: (data: API.Character.VideoGenTaskStatusResponse, taskId: string) => {
      setGenerateResult((prev) => {
        return {
          ...prev,
          [taskId]: {
            ...prev[taskId],
            status: data.status,
            imageId: data.image_id,
            asset: data.asset as API.Character.AssetVideo | null,
          },
        };
      });
    },
    onError: (error, taskId) => {
      console.error(`Failed to fetch video task status for ${taskId}:`, error);
      // 如果查询失败，将任务状态设置为失败
      setGenerateResult((prev) => {
        return {
          ...prev,
          [taskId]: {
            ...prev[taskId],
            status: "failed",
            asset: null,
          },
        };
      });
    },
  });

  useEffect(() => {
    if (videoGenTaskStatusData && Array.isArray(videoGenTaskStatusData)) {
      const tasksMap = videoGenTaskStatusData.reduce((acc, task: API.Character.VideoGenTaskStatusResponse) => {
        if (['pending', 'generating', 'failed'].includes(task.status)) {
          acc[task.id] = {
            status: task.status,
            asset: null,
            imageId: task.image_id,
            createdAt: task.created_at,
            spedUp: isTaskSpedUp(task.id),
          };
        }
        return acc;
      }, {} as Record<string, GenerateResult>);
      setGenerateResult(tasksMap);
    }
  }, [videoGenTaskStatusData]);

  const tasksPending = useMemo(() => {
    return Object.keys(generateResult).filter((taskId) => generateResult[taskId].status === "pending" || generateResult[taskId].status === "generating");
  }, [generateResult]);

  useEffect(() => {
    const id = window.setInterval(() => setStallClock(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const stalledVideoGenTaskIds = useMemo(() => {
    return tasksPending.filter((taskId) => {
      const created = generateResult[taskId]?.createdAt;
      if (!created) return false;
      return stallClock - new Date(created).getTime() >= VIDEO_GEN_STALL_MS;
    });
  }, [tasksPending, generateResult, stallClock]);

  const handleVideoGenRetry = useCallback(
    async (taskId: string) => {
      if (!roleId) return;
      setVideoGenRetryingTaskId(taskId);
      try {
        let data = await fetchCharacterImageToVideoTaskStatusApi(roleId, taskId);
        const mergeFromStatus = (
          d: API.Character.VideoGenTaskStatusResponse,
          bumpCreated: boolean
        ) =>
          setGenerateResult((prev) => ({
            ...prev,
            [taskId]: {
              ...prev[taskId],
              status: d.status,
              imageId: d.image_id,
              asset: (d.asset ?? null) as API.Character.AssetVideo | null,
              ...(bumpCreated ? { createdAt: new Date().toISOString() } : {}),
            },
          }));
        mergeFromStatus(data, false);
        if (data.status === "completed") {
          return;
        }
        await retryCharacterVideoGenTaskApi(roleId, taskId);
        data = await fetchCharacterImageToVideoTaskStatusApi(roleId, taskId);
        mergeFromStatus(
          data,
          data.status !== "completed" && data.status !== "failed"
        );
      } catch (err: unknown) {
        let detail = t("generate.retryFailed");
        if (typeof err === "string" && err.trim()) {
          detail = err.trim();
        } else if (err && typeof err === "object") {
          const o = err as Record<string, unknown>;
          const m = o.message ?? o.error ?? o.msg;
          if (typeof m === "string" && m.trim()) {
            detail = m.trim();
          }
        }
        alertDialog.error({
          title: detail,
          content: detail,
        });
      } finally {
        setVideoGenRetryingTaskId(null);
      }
    },
    [roleId, t]
  );

  const generatingImageIds = useMemo(() => {
    return Object.values(generateResult)
      .filter(
        (task) =>
          task.status === "pending" || task.status === "generating"
      )
      .map((task) => task.imageId)
      .filter((id): id is string => !!id);
  }, [generateResult]);

  const imageIdTaskInfo = useMemo(() => {
    const map = new Map<string, { createdAt?: string; spedUp?: boolean }>();
    Object.values(generateResult).forEach((task) => {
      if (task.imageId &&
        (task.status === "pending" || task.status === "generating")) {
        map.set(task.imageId, {
          createdAt: task.createdAt,
          spedUp: task.spedUp,
        });
      }
    });
    return map;
  }, [generateResult]);

  useEffect(() => {
    const generating = Object.entries(generateResult).filter(
      ([_, t]) => t.status === "pending" || t.status === "generating"
    );
    if (generating.length === 0) return;
    const tick = () => {
      const now = Date.now();
      const next: Record<string, number> = {};
      generating.forEach(([taskId, task]) => {
        const createdAt = task.createdAt ? new Date(task.createdAt).getTime() : now;
        if (task.speedUpClickedAt != null && task.percentAtSpeedUp != null) {
          const elapsed = now - task.speedUpClickedAt;
          const pct = task.percentAtSpeedUp + (99 - task.percentAtSpeedUp) * Math.min(1, elapsed / VIDEO_SPEED_UP_RAMP_MS);
          next[taskId] = Math.round(Math.min(99, pct));
        } else {
          const elapsed = now - createdAt;
          const pct = 1 + (79 * Math.min(1, elapsed / VIDEO_PROGRESS_DURATION_MS));
          next[taskId] = Math.round(Math.min(80, pct));
        }
      });
      setTaskIdToPercent((prev) => (Object.keys(next).length ? { ...prev, ...next } : prev));
      taskIdToPercentRef.current = { ...taskIdToPercentRef.current, ...next };
    };
    tick();
    const id = setInterval(tick, VIDEO_PROGRESS_TICK_MS);
    return () => clearInterval(id);
  }, [generateResult]);

  // 轮询任务状态
  useEffect(() => {
    if (tasksPending.length === 0) return;

    // 视频只需要一分钟轮询一次
    const interval = setInterval(() => {
      tasksPending.forEach((taskId) => {
        fetchVideoGenTaskStatusMutation.mutate(taskId);
      });
    }, 1000 * 6);

    return () => {
      clearInterval(interval);
    };
  }, [tasksPending, generateResult, fetchVideoGenTaskStatusMutation]);

  // 当角色ID变化时，重置所有状态
  useEffect(() => {
    // 重置生成结果
    setGenerateResult({});
    // 重置选中的图片
    setSelectedImageId("");
    // 取消正在进行的 mutation
    createVideoGenTaskMutation.reset();
    fetchVideoGenTaskStatusMutation.reset();
  }, [roleId]);

  const handleImageClick = (imageId: string) => {
    // 如果当前图片正在生成中，不允许选择
    if (generatingImageIds.includes(imageId)) {
      return;
    }
    // 一次只能选择一张图片
    setSelectedImageId((prev) => (prev === imageId ? "" : imageId));
  };

  const handleGenerate = () => {
    if (!selectedImageId) {
      alertDialog.error({
        title: t('generate.requiredFields'),
        content: t('generate.selectImage'),
      });
      return;
    }

    // 使用 mutation 提交请求
    createVideoGenTaskMutation.mutate(selectedImageId);
  };

  const taskResultsForDisplay = useMemo(() => {
    const result: Record<
      string,
      {
        status: "pending" | "generating" | "completed" | "failed";
        asset: null | API.Character.AssetVideo;
        createdAt?: string;
        spedUp?: boolean;
      }
    > = {};
    Object.keys(generateResult).forEach((taskId) => {
      const task = generateResult[taskId];
      result[taskId] = {
        status: task.status,
        asset: task.asset,
        createdAt: task.createdAt,
        spedUp: task.spedUp,
      };
    });
    return result;
  }, [generateResult]);

  return (
    <div
      className={cn(
        "w-full ml-auto mr-auto",
        isMobile ? "pl-3 pr-3" : "ml-16 mr-16"
      )}
      style={{
        ...(isMobile
          ? {}
          : {
            minWidth: 1000,
          }),
      }}
    >
      {isLoading || isLoadingImages ? (
        <div
          className="flex justify-center items-center h-lvh"
          style={{
            fontSize: 40,
          }}
        >
          <Loading />
        </div>
      ) : (
        <>
          <TopTitle
            roleId={roleId}
            title={t('barTitle.videoGenerator')}
            onClose={() => {
              confirmExitGenerating(async () => {
                if(fromHomePage && isMobile) {
                  open(roleId ?? "");
                } else {
                  history.back();
                }
              });
            }}
            onUserSelect={(id) => {
              navigate(`/generate/video/${id}`, { replace: true });
            }}
            ref={editRef}
          />
          <div
            className={cn(
              "flex gap-12 justify-between",
              isMobile ? "flex-col pt-4" : "flex-row pt-8"
            )}
          >
            {(!isMobile || !roleId) && (
              <LeftCharacter
                isMobile={isMobile}
                roleId={roleId}
                roleInfo={roleInfo!}
                onEdit={() => {
                  editRef.current?.roleSelectorOpen();
                }}
              />
            )}
            <div className="flex-1">
              {/* <div className="font-roboto text-sm text-[#A4ACB9] mb-2 flex items-center justify-center">
                {t('generate.chooseOutfit')}
              </div> */}
              <div
                className={cn(
                  'flex flex-wrap gap-2 overflow-y-auto  scrollbar-hide',
                  !isMobile ? "max-h-[600px] " : "justify-center"
                )}
              >
                {roleId && imageList.length === 0 ? (
                  <div className="w-full flex flex-col items-center justify-center py-12">
                    <ListEmpty title="Please create an image for this character first" />
                  </div>
                ) : imageList.map((item, idx) => {
                  const isSelected = selectedImageId === item.id;
                  const isGenerating = generatingImageIds.includes(item.id);
                  return (
                    <div className="flex flex-col items-center gap-2" key={idx}>
                      {isGenerating ? (
                        <RoleLoadingCard
                          noPadding={true}
                          title={t('common.generating')}
                          description={t('common.video')}
                          isLoading={true}
                          smaller
                          createdAt={imageIdTaskInfo.get(item.id)?.createdAt}
                          defaultSpedUp={imageIdTaskInfo.get(item.id)?.spedUp}
                          progressDurationMs={90000}
                          speedUpRampMs={30000}
                          progressPercent={(() => {
                            const taskId = Object.entries(generateResult).find(
                              ([_, t]) => t.imageId === item.id && (t.status === "pending" || t.status === "generating")
                            )?.[0];
                            return taskId ? taskIdToPercent[taskId] : undefined;
                          })()}
                          style={{
                            width: isMobile ? 113 : 113,
                            height: isMobile ? 135 : 135,
                            borderRadius: 8,
                          }}
                        />
                      ) : (
                        <RoleImageCard
                          imageUrl={item.url}
                          name=""
                          selected={isSelected}
                          onClick={() => handleImageClick(item.id)}
                          size="small"
                          locked={false}
                          isMobile={isMobile}
                          noShadow
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            {isMobile && !!Object.keys(generateResult)?.length && <div className="flex flex-row-reverse mr-2"><GeneratingIcon onClick={() => { setDrawerOpen(true); }} /></div>}
            <div className="flex flex-col gap-4">
              {!isMobile && <div className="font-bold text-sm text-white">{t('generate.generated')}</div>}
              <GeneratingView open={drawerOpen} isPc={!isMobile} onOpenChange={setDrawerOpen}>
                <TaskStatusDisplay
                  allTaskResults={taskResultsForDisplay}
                  stalledVideoGenTaskIds={stalledVideoGenTaskIds}
                  onVideoGenRetry={handleVideoGenRetry}
                  videoGenRetryingTaskId={videoGenRetryingTaskId}
                  onSpeedUp={async (taskId) => {
                    if (!roleId) return;
                    const currentPercent = taskIdToPercentRef.current[taskId] ?? 80;
                    await speedUpTaskApi(roleId, taskId);
                    markTaskSpedUp(taskId);
                    setGenerateResult((prev) => ({
                      ...prev,
                      [taskId]: {
                        ...prev[taskId],
                        spedUp: true,
                        speedUpClickedAt: Date.now(),
                        percentAtSpeedUp: currentPercent,
                      },
                    }));
                    fetchMemberInfoApi().then((info) => {
                      useMemberStore.getState().setInfo(info);
                    });
                  }}
                  onRegenerate={(taskId) => {
                    if (!taskId) {
                      handleGenerate();
                      return;
                    }
                    void handleVideoGenRetry(taskId);
                  }}
                  type="video"
                  taskIdToPercent={taskIdToPercent}
                />
              </GeneratingView>
            </div>
          </div>

          <Button
            appearance="gradientFill"
            className="text-white font-urbanist font-medium text-base"
            onClick={handleGenerate}
            disabled={
              !roleId || isLoading ||
              !selectedImageId ||
              generatingImageIds.includes(selectedImageId)
            }
            loading={createVideoGenTaskMutation.isPending}
            size="sm"
            shape="round"
            style={{
              padding: "8px 26px",
              position: "fixed",
              left: 0,
              right: 0,
              bottom: 40,
              width: 240,
              margin: "0 auto",
            }}
          >
            {t('generate.generateBtn')} <ArrowRightIcon />
          </Button>
        </>
      )}
    </div>
  );
}

export default install(GenerateVideo, [CharacterServicesProvider]);
