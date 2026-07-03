import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { cn } from "@errows/design/lib/utils";
import {
  TopTitle,
  LeftCharacter,
  TabBar,
  TaskStatusDisplay,
  GeneratingView,
} from "../components";
import { Loading } from "@/components";
import { ImageList } from "./components/image-list";
import { SummarySection } from "./components/summary-section";
import { MobileBottomBar } from "./components/mobile-bottom-bar";
import { PcBottomButton } from "./components/pc-bottom-button";
import { useMobile } from "@/hooks/use-mobile-detector";
import { Textarea, alertDialog } from "@errows/design";
import type { TopTitleRef } from "../components/top-title";
import { useCharacterDetail } from "@/hooks/use-character-detail";
import { useImageGenerationOptions } from "../hooks/use-character-image-option";
import {
  createCharacterImageGenTaskApi,
  fetchCharacterImageGenTaskStatusApi,
  fetchImageGenTaskStatusByRoleApi,
  retryCharacterImageGenTaskApi,
  speedUpTaskApi,
} from "@/apis/character";
import { useMutation, useQuery } from "@tanstack/react-query";
import { confirmExitGenerating, getRandomItem, getSortAction, isTaskSpedUp, markTaskSpedUp } from "../util";
import { useShallow } from "zustand/react/shallow";
import { useMemberStore } from "@/stores/member";
import { fetchMemberInfoApi } from "@/apis/member";
import { useGlobalStore } from "@/stores/global";
import {
  CharacterServicesProvider,
  useCharacterServices,
} from "@/pages/role/services";
import { install } from "@/lib/install-service";

const MODE_DEFAULT = "Basic";
const IMAGE_GEN_STALL_MS = 120000;

interface GenerateResult {
  status: "pending" | "generating" | "completed" | "failed";
  asset: null | API.Character.AssetImage;
  setting?: API.Character.ImageGenSetting;
  createdAt?: string;
  spedUp?: boolean;
}

function GenerateImage() {
  const { t: translate } = useTranslation();
  const { info } = useMemberStore(
    useShallow((state) => ({
      info: state.info,
    }))
  );
  const fromHomePage = useGlobalStore(useShallow(state => state.fromHomePage));
  
  const isMember = useMemo(() => {
    return info.plan !== "free";
  }, [info]);
  const navigate = useNavigate();
  const { roleId } = useParams<{ roleId: string }>();
  const [mode, setMode] = useState<string>(MODE_DEFAULT);
  const isMobile = useMobile();

  const editRef = useRef<TopTitleRef>(null);
  const { roleInfo, isLoading } = useCharacterDetail(roleId ?? "");
  const [activeType, setActiveType] = useState<string>("");
  const [imageList, setImgList] = useState<
    API.Character.ImageGenerationOptions["options"]
  >([]);
  const [setting, setSetting] = useState<Record<string, string[]>>({});
  const [promptSetting, setPromptSetting] = useState<string>("");
  const { options, isLoading: isLoadingOptions } = useImageGenerationOptions();
  const gender = (roleInfo?.gender?.toLocaleLowerCase() || "female") as
    | "male"
    | "female";
  const [generateResult, setGenerateResult] = useState<
    Record<string, GenerateResult>
  >({});
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [stallClock, setStallClock] = useState(() => Date.now());
  const [imageGenRetryingTaskId, setImageGenRetryingTaskId] = useState<
    string | null
  >(null);
  const { open } = useCharacterServices();
  const highMode = mode !== MODE_DEFAULT;
  const hasGeneratingTask = !!Object.keys(generateResult).length;

  const sortedDicConfigs = useMemo(() => {
    const dictConfigs = gender && options ? options[gender] : [];
    if (!dictConfigs || dictConfigs.length === 0) return [];
    return [...dictConfigs].sort((a, b) => getSortAction(a.title) - getSortAction(b.title));
  }, [gender, options]);

  const generateEnabled = useMemo(() => {
    if(setting['Action*']?.length || setting['Action']?.length) return true
    else return false 
  }, [setting]);

  // 获取角色生成未完成的图片任务状态
  const { data: imageGenTaskStatusData } = useQuery({
    queryKey: ["imageGenTaskStatus", roleId],
    queryFn: async () => {
      if (!roleId) return null;
      return await fetchImageGenTaskStatusByRoleApi(roleId);
    },
    enabled: !!roleId,
  });

  useEffect(() => {
    if (imageGenTaskStatusData && Array.isArray(imageGenTaskStatusData)) {
      type TaskWithMetadata = API.Character.ImageGenTaskStatusResponse;
      const tasksMap = imageGenTaskStatusData.reduce(
        (acc: Record<string, GenerateResult>, task: TaskWithMetadata) => {
          if (task.id) {
            acc[task.id] = {
              status: task.status,
              asset: task.asset || null,
              setting: task.setting,
              createdAt: task.created_at,
              spedUp: isTaskSpedUp(task.id),
            };
          }
          return acc;
        },
        {}
      );
      setGenerateResult(tasksMap);
    }
  }, [imageGenTaskStatusData]);

  // 创建生图任务的 mutation
  const createImageGenTaskMutation = useMutation({
    mutationFn: async (data: API.Character.ImageGenSetting) => {
      return await createCharacterImageGenTaskApi(roleId ?? "", data);
    },
    onSuccess: (
      data: { id: string },
      setting: API.Character.ImageGenSetting
    ) => {
      if (data.id) {
        setGenerateResult((prev) => ({
          ...prev,
          [data.id]: {
            status: "generating",
            asset: null,
            setting: setting,
            createdAt: new Date().toISOString(),
          },
        }));
        // 生成成功后，重置设置和prompt设置
        // setSetting({});
        // setPromptSetting({});
        if (isMobile) setDrawerOpen(true);
      }
    },
    onError: (error) => {
      console.error("Failed to create task:", error);
    },
  });

  // 获取生成中的任务数据
  const fetchImageGenTaskStatusMutation = useMutation({
    mutationFn: async (taskId: string) => {
      return await fetchCharacterImageGenTaskStatusApi(roleId ?? "", taskId);
    },
    onSuccess: (
      data: API.Character.ImageGenTaskStatusResponse,
      taskId: string
    ) => {
      setGenerateResult((prev) => ({
        ...prev,
        [taskId]: {
          ...prev[taskId],
          status: data.status,
          asset: data.asset || null,
          setting: data.setting,
        },
      }));
    },
    onError: (error, taskId: string) => {
      console.error(`Failed to fetch task status for ${taskId}:`, error);
      // 如果查询失败，将任务状态设置为失败
      setGenerateResult((prev) => ({
        ...prev,
        [taskId]: {
          ...(prev[taskId] || {}),
          status: "failed",
          asset: null,
        },
      }));
    },
  });

  // 获取当前激活类型的配置
  const getCurrentConfig = useCallback(() => {
    return sortedDicConfigs?.find(
      (config) => config.title === activeType
    );
  }, [sortedDicConfigs, activeType]);

  // 根据选中的图片生成 prompts 字符串（已翻译）
  const generatePromptsFromSelected = useCallback(
    (typeKey: string, selectedValues: string[]) => {
      const config = sortedDicConfigs?.find(
        (config) => config.title === typeKey
      );
      if (!config) return "";

      const prompts = selectedValues
        .map((value) => {
          const option = config.options.find((opt) => opt.value === value);
          const optionPrompts = option?.prompts || [];
          // 从 prompts 数组中随机选择一项
          const selectedPrompt = getRandomItem(optionPrompts);
          if (!selectedPrompt) return "";
          
          // 按逗号分割，翻译每个部分，然后拼接
          const parts = selectedPrompt.split(",").map(part => part.trim()).filter(Boolean);
          const translatedParts = parts.map(part => translate(`prompt.${part}`));
          return translatedParts.join(", ");
        })
        .filter(Boolean);

      return prompts.join(", ");
    },
    [sortedDicConfigs, translate]
  );

  // 重新生成所有 prompts（用于高级模式）
  const regenerateAllPrompts = useCallback((newSetting: Record<string, string[]>) => {
    const allPrompts: string[] = [];
    Object.entries(newSetting).forEach(([typeKey, selectedValues]) => {
      if (selectedValues.length > 0) {
        const promptsText = generatePromptsFromSelected(typeKey, selectedValues);
        if (promptsText) {
          allPrompts.push(promptsText);
        }
      }
    });
    setPromptSetting(allPrompts.join(", "));
  }, [generatePromptsFromSelected]);

  // 处理图片点击
  const handleImageClick = (itemValue: string) => {
    const config = getCurrentConfig();
    const maxSelect = config?.max_select ?? 1;
    const currentSelected = setting[activeType] || [];
    const isSelected = currentSelected.includes(itemValue);

    // 如果已选中，直接取消选择
    if (isSelected) {
      setSetting((pre) => {
        const current = pre[activeType] || [];
        const newSelected = current.filter((v) => v !== itemValue);
        const newSetting = {
          ...pre,
          [activeType]: newSelected,
        };

        // 如果是高级模式，重新生成所有 prompts
        if (highMode) {
          regenerateAllPrompts(newSetting);
        }

        return newSetting;
      });
    } else {
      // 未选中，检查是否达到限制
      if (currentSelected.length >= maxSelect) {
        // 只有当 maxSelect > 1 时才显示提示
        if (maxSelect > 1) {
          alertDialog.warning({
            title: translate('generate.maximumSelectionReached'),
            content: translate('generate.canOnlySelectUpTo', { maxSelect, plural: maxSelect > 1 ? 's' : '' }),
            confirmText: translate('common.confirm'),
            cancelText: translate('common.cancel'),
          });
          return;
        } else {
          // maxSelect === 1，直接替换选中项
          setSetting((pre) => {
            const newSetting = {
              ...pre,
              [activeType]: [itemValue],
            };

            // 如果是高级模式，重新生成所有 prompts
            if (highMode) {
              regenerateAllPrompts(newSetting);
            }

            return newSetting;
          });
          return;
        }
      }

      // 未达到限制，直接添加
      setSetting((pre) => {
        const current = pre[activeType] || [];
        const newSetting = {
          ...pre,
          [activeType]: [...current, itemValue],
        };

        // 如果是高级模式，重新生成所有 prompts
        if (highMode) {
          regenerateAllPrompts(newSetting);
        }

        return newSetting;
      });
    }
  };

  // 处理 SummarySection 中的图片点击
  const handleSummaryImageClick = (typeKey: string, itemValue: string) => {
    setSetting((pre) => {
      const current = pre[typeKey] || [];
      const newSelected = current.filter((v) => v !== itemValue);
      const newSetting = {
        ...pre,
        [typeKey]: newSelected,
      };

      // 如果是高级模式，重新生成所有 prompts
      if (highMode) {
        regenerateAllPrompts(newSetting);
      }

      return newSetting;
    });
  };

  // 处理 Prompt 输入变化
  const handlePromptChange = (value: string) => {
    setPromptSetting(value);
  };

  // 处理 Suggestions 点击 - 自动推荐选择选项
  const handleSuggestionsClick = useCallback(() => {
    if (!sortedDicConfigs || sortedDicConfigs.length === 0) return;

    const allPrompts: string[] = [];

    // 为每个类型随机选择选项并生成 prompts
    sortedDicConfigs.forEach((config) => {
      const maxSelect = config.max_select ?? 1;
      const availableOptions = config.options || [];

      if (availableOptions.length === 0) return;

      // 随机选择 1 到 maxSelect 个选项（不超过可用选项数量）
      const maxPossibleSelect = Math.min(maxSelect, availableOptions.length);
      const selectCount = Math.floor(Math.random() * maxPossibleSelect) + 1;

      // 随机打乱数组并选择前 selectCount 个
      const shuffled = [...availableOptions].sort(() => Math.random() - 0.5);
      const selectedValues = shuffled
        .slice(0, selectCount)
        .map((opt) => opt.value);

      // 生成 prompts
      if (selectedValues.length > 0) {
        const promptsText = generatePromptsFromSelected(
          config.title,
          selectedValues
        );
        if (promptsText) {
          allPrompts.push(promptsText);
        }
      }
    });

    // 只更新 promptSetting
    setPromptSetting(allPrompts.join(", "));
  }, [sortedDicConfigs, generatePromptsFromSelected]);


  const handleGenerate = () => {
    // 检查是否所有配置都已选择
    if (!generateEnabled) {
      alertDialog.error({
        title: translate('generate.requiredFields'),
        content: translate('generate.selectOneOption'),
      });
      return;
    }

    const formatSetting: Partial<API.Character.ImageGenSetting> = {
      outfit: [],
      action: [],
      background: [],
    };
    Object.entries(setting).forEach(([typeKey, selectedValues]) => {
      const config = sortedDicConfigs?.find(
        (config) => config.title === typeKey
      );
      if (!config) return;
      const configKey = config.key as keyof API.Character.ImageGenSetting;
      if (Array.isArray(formatSetting[configKey])) {
        formatSetting[configKey].push(...(selectedValues as string[]));
      }
    });
    if (highMode && promptSetting.trim().length > 0) {
      formatSetting.prompt = promptSetting;
    }
    // 使用 mutation 提交请求
    createImageGenTaskMutation.mutate(
      formatSetting as API.Character.ImageGenSetting
    );
  };

  const tasksPending = useMemo(() => {
    return Object.keys(generateResult).filter(
      (key) =>
        generateResult[key].status === "pending" ||
        generateResult[key].status === "generating"
    );
  }, [generateResult]);

  useEffect(() => {
    const id = window.setInterval(() => setStallClock(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const stalledImageGenTaskIds = useMemo(() => {
    return tasksPending.filter((taskId) => {
      const created = generateResult[taskId]?.createdAt;
      if (!created) return false;
      return stallClock - new Date(created).getTime() >= IMAGE_GEN_STALL_MS;
    });
  }, [tasksPending, generateResult, stallClock]);

  const handleImageGenRetry = useCallback(
    async (taskId: string) => {
      if (!roleId) return;
      setImageGenRetryingTaskId(taskId);
      try {
        let data = await fetchCharacterImageGenTaskStatusApi(roleId, taskId);
        if (data.status !== "completed") {
          await retryCharacterImageGenTaskApi(roleId, taskId);
          data = await fetchCharacterImageGenTaskStatusApi(roleId, taskId);
        }
        setGenerateResult((prev) => ({
          ...prev,
          [taskId]: {
            ...prev[taskId],
            status: data.status,
            asset: data.asset ?? null,
            setting: data.setting ?? prev[taskId]?.setting,
            ...(data.status !== "completed"
              ? { createdAt: new Date().toISOString() }
              : {}),
          },
        }));
      } catch (err: unknown) {
        let detail = translate("generate.retryFailed");
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
        setImageGenRetryingTaskId(null);
      }
    },
    [roleId, translate]
  );

  // 轮询任务状态
  useEffect(() => {
    if (tasksPending.length === 0) return;

    const interval = setInterval(() => {
      tasksPending.forEach((taskId) => {
        fetchImageGenTaskStatusMutation.mutate(taskId);
      });
    }, 8000); // 每8秒轮询一次

    return () => {
      clearInterval(interval);
    };
  }, [tasksPending, fetchImageGenTaskStatusMutation]);

  // 当角色ID变化时，重置所有状态
  useEffect(() => {
    setDrawerOpen(false);
    setMode(MODE_DEFAULT);
    // 重置生成结果
    setGenerateResult({});
    // 重置设置
    setSetting({});
    // 重置prompt设置
    setPromptSetting("");
    // 重置激活类型
    setActiveType("");
    // 重置图片列表
    setImgList([]);
    // 取消正在进行的 mutation
    createImageGenTaskMutation.reset();
    fetchImageGenTaskStatusMutation.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleId]);

  // 当角色切换或配置数据变化时，重置 activeType
  useEffect(() => {
    // 如果 roleId 存在但 roleInfo 还在加载，不执行
    if (roleId && isLoading) return;
    // 如果配置数据还没加载完成，不执行
    if (isLoadingOptions) return;
    if (roleId && roleInfo && roleInfo.id !== roleId) return;
    if (sortedDicConfigs && sortedDicConfigs.length > 0) {
      setActiveType(sortedDicConfigs[0].title);
    }
  }, [sortedDicConfigs, roleId, isLoading, isLoadingOptions, roleInfo]);

  useEffect(() => {
    if (!activeType) return;
    const config = getCurrentConfig();
    if (config) {
      const title = config.title;
      setImgList(config.options);
      if (title) {
        setSetting((pre) => {
          const hasExisting = !!pre[title];
          if (!hasExisting) {
            // 如果不存在，初始化为空数组
            return {
              ...pre,
              [title]: [],
            };
          }
          return pre;
        });
      }
    }
  }, [activeType, getCurrentConfig]);

  // 当切换到高级模式时，自动生成所有选项的 promptSetting
  useEffect(() => {
    if (highMode) {
      const allPrompts: string[] = [];
      Object.entries(setting).forEach(([typeKey, selectedValues]) => {
        if (selectedValues.length > 0) {
          const promptsText = generatePromptsFromSelected(
            typeKey,
            selectedValues
          );
          if (promptsText) {
            allPrompts.push(promptsText);
          }
        }
      });
      setPromptSetting(allPrompts.join(", "));
    } else {
      setPromptSetting("");
    }
  }, [mode, setting, generatePromptsFromSelected, highMode]);

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
            // minWidth: 1000
          }),
      }}
    >
      {isLoading || isLoadingOptions ? (
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
            isMember={isMember}
            onModeChange={(v) => setMode(v)}
            onClose={() => {
              confirmExitGenerating(async() => {
               if(fromHomePage && isMobile) {
                open(roleId ?? "");
               } else {
                history.back();
               }
              });
            }}
            onUserSelect={(id) => {
              navigate(`/generate/image/${id}`, { replace: true });
            }}
            ref={editRef}
            showMode={true}
          />
          <div
            className={cn(
              "flex gap-12 justify-between",
              isMobile ? "flex-col pt-0" : "flex-row pt-8"
            )}
          >
            {!isMobile && (
              <LeftCharacter
                isMobile={isMobile}
                roleId={roleId}
                roleInfo={roleInfo}
                advancedMode={highMode}
                onEdit={() => {
                  editRef.current?.roleSelectorOpen();
                }}
              />
            )}
            <div
              className={cn(
                "flex-1",
                // isMobile && "pb-[280px]"
              )}
            >
              {highMode && (
                <div className="flex flex-col gap-3.5 mb-4">
                  <div className="text-sm text-white font-urbanist font-[700] flex justify-center">
                    {translate('generate.prompt')}
                  </div>
                  <Textarea
                    style={{ width: "100%" }}
                    value={promptSetting}
                    onChange={(e) => handlePromptChange(e.target.value)}
                    placeholder="(ball gag, saliva),"
                    rows={isMobile ? 3 : 4}
                    maxLength={1000}
                    className="w-full  bg-[#1D1E27] border-[#2C2C38] text-white placeholder:text-gray-500 resize-y  overflow-y-auto scrollbar-hide min-h-[100px]"
                  // className="w-full text-justify bg-[#1D1E27] border-[#2C2C38] text-white placeholder:text-gray-500 resize-y  overflow-y-auto scrollbar-hide"
                  />
                </div>
              )}
              <TabBar
                options={sortedDicConfigs.map((option) => ({
                  label: translate(`generateOptions.${option.title}`),
                  value: option.title,
                }))}
                highMode={highMode}
                onChange={setActiveType}
                onSuggestionsClick={handleSuggestionsClick}
              />
              <ImageList
                imageList={imageList}
                activeType={activeType}
                setting={setting}
                isMobile={isMobile}
                highMode={highMode}
                onImageClick={handleImageClick}
              />
              {!isMobile && !highMode && (
                <div className="mt-6">
                  <SummarySection
                    setting={setting}
                    configs={sortedDicConfigs}
                    isMobile={isMobile}
                    hasGeneratingTask={hasGeneratingTask}
                    highMode={highMode}
                    onGeneratingIconClick={() => {
                      setDrawerOpen(true);
                    }}
                    onImageClick={handleSummaryImageClick}
                  />
                </div>
              )}
            </div>
            <div className="flex flex-col gap-4">
              {!isMobile && (
                <div className="font-[700] text-sm text-white">{translate('generate.generated')}</div>
              )}
              <GeneratingView
                open={drawerOpen}
                isPc={!isMobile}
                onOpenChange={setDrawerOpen}
              >
                <TaskStatusDisplay
                  allTaskResults={generateResult}
                  stalledImageGenTaskIds={stalledImageGenTaskIds}
                  onImageGenRetry={handleImageGenRetry}
                  imageGenRetryingTaskId={imageGenRetryingTaskId}
                  onSpeedUp={async (taskId) => {
                    if (!roleId) return;
                    await speedUpTaskApi(roleId, taskId);
                    markTaskSpedUp(taskId);
                    setGenerateResult((prev) => ({
                      ...prev,
                      [taskId]: { ...prev[taskId], spedUp: true },
                    }));
                    fetchMemberInfoApi().then((info) => {
                      useMemberStore.getState().setInfo(info);
                    });
                  }}
                  onRegenerate={(taskId) => {
                    if (taskId) {
                      void handleImageGenRetry(taskId);
                    } else {
                      handleGenerate();
                    }
                  }}
                />
              </GeneratingView>
            </div>
          </div>

          {isMobile ? (
            <MobileBottomBar
              setting={setting}
              configs={sortedDicConfigs}
              hasGeneratingTask={hasGeneratingTask}
              highMode={highMode}
              roleId={roleId}
              isLoading={isLoading}
              isPending={createImageGenTaskMutation.isPending}
              onGenerate={handleGenerate}
              onRoleSelectOpen={() => {
                editRef.current?.roleSelectorOpen();
              }}
              onGeneratingIconClick={() => {
                setDrawerOpen(true);
              }}
              onImageClick={handleSummaryImageClick}
            />
          ) : (
            <PcBottomButton
              roleId={roleId}
              isLoading={isLoading}
              isPending={createImageGenTaskMutation.isPending}
              generateEnabled={generateEnabled}
              onGenerate={handleGenerate}
              onRoleSelectOpen={() => {
                editRef.current?.roleSelectorOpen();
              }}
            />
          )}
        </>
      )}
    </div>
  );
}

export default install(GenerateImage, [CharacterServicesProvider]);
