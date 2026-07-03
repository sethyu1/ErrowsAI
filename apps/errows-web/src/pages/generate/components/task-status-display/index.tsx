import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { RoleImageCard, RoleLoadingCard } from "@/components";
import { useMobile } from "@/hooks/use-mobile-detector";
import { cn } from "@errows/design/lib/utils";
import { MediaViewer, type MediaViewerRef, type MediaItem } from "@/components/media-viewer";

interface GenerateResult {
  status: "pending" | "generating" | "completed" | "failed";
  asset: null | API.Character.AssetImage | API.Character.AssetVideo;
  createdAt?: string;
  spedUp?: boolean;
}

interface TaskResult {
  taskId: string;
  status: GenerateResult["status"];
  asset: GenerateResult["asset"];
  createdAt?: string;
  spedUp?: boolean;
}

interface TaskStatusDisplayProps {
  allTaskResults: Record<string, GenerateResult>;
  onRegenerate?: (taskId?: string) => void;
  onSpeedUp?: (taskId: string) => void | Promise<void>;
  containerStyle?: React.CSSProperties;
  type?: "image" | "video";
  taskIdToPercent?: Record<string, number>;
  stalledImageGenTaskIds?: string[];
  onImageGenRetry?: (taskId: string) => void | Promise<void>;
  imageGenRetryingTaskId?: string | null;
  stalledVideoGenTaskIds?: string[];
  onVideoGenRetry?: (taskId: string) => void | Promise<void>;
  videoGenRetryingTaskId?: string | null;
}

const PC_STYLE = {
  width: 120,
  height: 170,
}

const MOBILE_STYLE ={
  width: 180,
  height: 254,
}

export function TaskStatusDisplay({
  allTaskResults,
  onRegenerate,
  onSpeedUp,
  containerStyle,
  type = "image",
  taskIdToPercent,
  stalledImageGenTaskIds,
  onImageGenRetry,
  imageGenRetryingTaskId,
  stalledVideoGenTaskIds,
  onVideoGenRetry,
  videoGenRetryingTaskId,
}: TaskStatusDisplayProps) {
  const { t } = useTranslation();
  const isMobile = useMobile();
  const contentType = type === "video" ? t('common.video') : t('common.image');
  const mediaViewerRef = useRef<MediaViewerRef>(null);

  const [mobileStyle, setMobileStyle] = useState<React.CSSProperties>({});
  const cardStyle = isMobile ? MOBILE_STYLE : PC_STYLE;
  const speedUpFooterStyle: React.CSSProperties = isMobile ? { bottom: 40 } : { bottom: 24 };

  const defaultContainerStyle: React.CSSProperties = {
    width: isMobile ? "100%" : 281,
    ... !isMobile && {
      height: 401,
      borderRadius: 16,
      borderWidth: 0.57,
      background: "#23232E",
      borderColor: "#FFFFFF1A",
      border: "1px solid",
      backdropFilter: "blur(76px)"
    },
    ...containerStyle,
  };

  // 将所有任务结果转换为数组，并按时间倒序排列（最新的在前）
  const taskResultsArray: TaskResult[] = Object.keys(allTaskResults)
    .map((taskId) => ({
      taskId,
      ...allTaskResults[taskId],
    }))
    .reverse(); // 最新的任务显示在最前面

  const completedTaskResults = useMemo(
    () =>
      taskResultsArray.filter(
        (taskResult): taskResult is TaskResult & { asset: Exclude<TaskResult["asset"], null> } =>
          taskResult.status === "completed" && !!taskResult.asset
      ),
    [taskResultsArray]
  );

  const mediaItems: MediaItem[] = useMemo(
    () =>
      completedTaskResults.map((taskResult) => ({
        url: taskResult.asset.url,
        type,
      })),
    [completedTaskResults, type]
  );

  const taskIdToMediaIndex = useMemo(() => {
    const map = new Map<string, number>();
    completedTaskResults.forEach((taskResult, index) => {
      map.set(taskResult.taskId, index);
    });
    return map;
  }, [completedTaskResults]);

  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      const width = window.innerWidth;
      const gapWidth = width - MOBILE_STYLE.width*2 - 16;
      setMobileStyle(gapWidth>0 ? {paddingLeft: gapWidth/2, paddingRight: gapWidth/2 }: {});
    });
    resizeObserver.observe(document.body);
    return () => resizeObserver.disconnect();
  }, [])

  const renderTaskItem = (taskResult: TaskResult) => {
    const { status, asset } = taskResult;

    if (status === "pending" || status === "generating") {
      const stalled =
        (type === "image" &&
          !!stalledImageGenTaskIds?.includes(taskResult.taskId)) ||
        (type === "video" &&
          !!stalledVideoGenTaskIds?.includes(taskResult.taskId));
      const onStallRetry =
        type === "image" ? onImageGenRetry : onVideoGenRetry;
      const showRetryFooter = stalled && !!onStallRetry;
      const retrying =
        (type === "image"
          ? imageGenRetryingTaskId
          : videoGenRetryingTaskId) === taskResult.taskId;
      return (
        <RoleLoadingCard
          key={`${taskResult.taskId}-${showRetryFooter ? "retry" : "speed"}`}
          style={cardStyle}
          smaller
          isLoading={true}
          createdAt={taskResult.createdAt}
          defaultSpedUp={taskResult.spedUp}
          progressDurationMs={type === "video" ? 90000 : undefined}
          speedUpRampMs={type === "video" ? 30000 : undefined}
          progressPercent={taskIdToPercent?.[taskResult.taskId]}
          footer={
            showRetryFooter
              ? {
                  text: t("generate.retry"),
                  icon: null,
                  style: speedUpFooterStyle,
                  skipSpeedUpBehavior: true,
                  disabled: retrying,
                  onClick: () => {
                    void onStallRetry?.(taskResult.taskId);
                  },
                }
              : {
                  text: "Speed Up",
                  icon: null,
                  style: speedUpFooterStyle,
                  onClick: () => onSpeedUp?.(taskResult.taskId),
                }
          }
        />
      );
    }

    // 任务完成，显示图片或视频封面
    if (status === "completed" && asset) {
      const imageUrl =
        type === "video" && "cover" in asset
          ? asset.cover
          : asset.url;
      const mediaIndex = taskIdToMediaIndex.get(taskResult.taskId);
      return (
        <RoleImageCard
          style={cardStyle}
          imageUrl={imageUrl}
          name=""
          size="small"
          isMobile={isMobile}
          noShadow
          onClick={() => {
            if (typeof mediaIndex === "number") {
              mediaViewerRef.current?.show(mediaIndex);
            }
          }}
        />
      );
    }

    // 任务失败
    if (status === "failed") {
      return (
        <RoleLoadingCard
          style={cardStyle}
          smaller
          title={t('common.failed')}
          description={contentType}
          isLoading={false}
          footer={
            onRegenerate
              ? {
                text: t('generate.reGenerate'),
                onClick: () => onRegenerate(taskResult.taskId),
              }
              : undefined
          }
        />
      );
    }

    return null;
  };

  return (
    <>
      <div
        className={cn(
          "relative flex flex-wrap gap-2 p-3",
          taskResultsArray.length > 0
            ? "overflow-y-auto scrollbar-hide"
            : ""
        )}
        style={{
          ...defaultContainerStyle,
          ...isMobile ? mobileStyle : {},
        }}
      >
        {/* 显示所有任务历史记录 */}
        {taskResultsArray.length > 0 && (
          <>
            {taskResultsArray.map((taskResult) => (
              <React.Fragment key={taskResult.taskId}>
                {renderTaskItem(taskResult)}
              </React.Fragment>
            ))}
          </>
        )}
      </div>
      <MediaViewer ref={mediaViewerRef} list={mediaItems} />
    </>
  );
}

