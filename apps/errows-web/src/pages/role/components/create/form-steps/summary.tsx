import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { RoleImageCard } from "@/components";
import { useMobile } from "@/hooks/use-mobile-detector";
import { cn } from "@errows/design/lib/utils";
import { CharacterAttributesWrap } from "./character-attributes-wrap";
import { useMobileStyle } from "@/hooks/use-mobile-style";

interface CharacterOptionItem {
  value: string;
  prompt?: string;
  url?: string;
  color?: string;
  label?: string;
  group?: string | null;
  title?: string;
}

interface CharacterOptionGroup {
  key: string;
  title?: string;
  input_type?: string;
  options?: CharacterOptionItem[];
  depends?: Array<[string, string[]]>;
  max_select?: number;
  required?: boolean;
}

interface OptionSelection {
  group: CharacterOptionGroup;
  option: CharacterOptionItem;
}

interface GalleryItem {
  key: string;
  label: string;
  imageUrl: string | undefined;
}

interface SizeCardItem {
  key: string;
  label: string;
  imageUrl: string | undefined;
}

export interface CharacterSummaryProps {
  /** 角色创建的所有数据 */
  data?: Partial<API.Character.Setting>;
  /** 角色字段配置（来自 characterOptions） */
  optionGroups?: CharacterOptionGroup[];
}

const buildOptionIndex = (
  groups: CharacterOptionGroup[] = []
): Map<string, CharacterOptionGroup[]> => {
  const map = new Map<string, CharacterOptionGroup[]>();
  groups.forEach((group) => {
    if (!group?.key) return;
    const list = map.get(group.key) || [];
    list.push(group);
    map.set(group.key, list);
  });
  return map;
};

const matchesDepends = (
  group: CharacterOptionGroup,
  context: Record<string, string>
): boolean => {
  if (!group.depends || group.depends.length === 0) {
    return true;
  }

  return group.depends.every(([depKey, depValues]) => {
    if (!depValues || depValues.length === 0) {
      return true;
    }
    const ctxValue = context[depKey];
    if (!ctxValue) {
      return false;
    }
    return depValues.some((dep) => dep === ctxValue);
  });
};

const findMatchingOption = (
  group: CharacterOptionGroup,
  value: string
): CharacterOptionItem | undefined => {
  return group.options?.find((opt) => {
    if (opt.value === value) return true;
    if (opt.prompt && opt.prompt === value) return true;
    if (opt.label && opt.label === value) return true;
    return false;
  });
};

const findOptionSelection = (
  optionIndex: Map<string, CharacterOptionGroup[]>,
  key: string,
  value?: string | null,
  context: Record<string, string> = {}
): OptionSelection | null => {
  if (!value) return null;

  const groups = optionIndex.get(key);
  if (!groups || groups.length === 0) {
    return null;
  }

  for (const group of groups) {
    if (!matchesDepends(group, context)) {
      continue;
    }
    const option = findMatchingOption(group, value);
    if (option) {
      return { group, option };
    }
  }

  for (const group of groups) {
    const option = findMatchingOption(group, value);
    if (option) {
      return { group, option };
    }
  }

  return null;
};

const formatFallbackLabel = (value: string): string => {
  if (!value) return "";
  return value
    .replace(/[_-]+/g, " ")
    .split(" ")
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : ""))
    .join(" ");
};

const getDisplayLabel = (
  value?: string | null,
  selection?: OptionSelection | null
): string => {
  if (selection?.option) {
    return (
      selection.option.prompt ||
      selection.option.label ||
      selection.option.value ||
      value ||
      ""
    );
  }
  if (!value) {
    return "";
  }
  return formatFallbackLabel(value);
};

/**
 * 角色创建摘要组件
 * Summary - 显示所有选择项的总结，并提供提交按钮
 * 严格按照 Figma 设计实现
 */
export function CharacterSummary({
  data,
  optionGroups = [],
}: CharacterSummaryProps) {
  const { t } = useTranslation();
  const isMobile = useMobile();
  const characterData = (data ?? {}) as Record<string, string>;
  const mobileStyle = useMobileStyle({
    cardWidth: 114,
    isMobile,
    columnCount: 3,
  });

  const optionIndex = useMemo(
    () => buildOptionIndex(optionGroups),
    [optionGroups]
  );

  const selectOption = (key: string, value?: string | null) =>
    findOptionSelection(optionIndex, key, value, characterData);

  const typeSelection = selectOption("type", characterData.type);
  const assortmentSelection = selectOption(
    "assortment",
    characterData.assortment
  );
  const raceSelection = selectOption("race", characterData.race);
  const ageSelection = selectOption("age", characterData.age);
  const eyeColorSelection = selectOption("eye_color", characterData.eye_color);
  const hairLengthSelection = selectOption(
    "hair_length",
    characterData.hair_length
  );
  const hairStyleSelection = selectOption(
    "hair_style",
    characterData.hair_style
  );
  const hairBangsSelection = selectOption(
    "hair_bangs",
    characterData.hair_bangs
  );
  const hairColorSelection = selectOption(
    "hair_color",
    characterData.hair_color
  );
  const bodyTypeSelection = selectOption("body_type", characterData.body_type);
  const breastSizeSelection = selectOption(
    "breast_size",
    characterData.breast_size
  );
  const buttSizeSelection = selectOption("butt_size", characterData.butt_size);
  const penisSizeSelection = selectOption(
    "penis_size",
    characterData.penis_size
  );

  const primaryImageUrl =
    typeSelection?.option.url ||
    assortmentSelection?.option.url ||
    raceSelection?.option.url ||
    bodyTypeSelection?.option.url ||
    undefined;

  const galleryItems = [
    { key: "race", selection: raceSelection, value: characterData.color },
    {
      key: "eye_color",
      selection: eyeColorSelection,
      value: characterData.eye_color,
    },
    {
      key: "hair_length",
      selection: hairLengthSelection,
      value: characterData.hair_length,
    },
    {
      key: "assortment",
      selection: assortmentSelection,
      value: characterData.assortment,
    },
    {
      key: "hair_style",
      selection: hairStyleSelection,
      value: characterData.hair_style,
    },
    {
      key: "hair_bangs",
      selection: hairBangsSelection,
      value: characterData.hair_bangs,
    },
  ]
    .filter((item) => item.value)
    .reduce<GalleryItem[]>((acc, item) => {
      const label = t(`characterOptions.labels.${item.value}`);
      if (!label) {
        return acc;
      }
      acc.push({
        key: item.key,
        label,
        imageUrl: item.selection?.option.url,
      });
      return acc;
    }, []);

  const sizeCardItems = [
    {
      key: "body_type",
      selection: bodyTypeSelection,
      value: characterData.body_type,
    },
    {
      key: "breast_size",
      selection: breastSizeSelection,
      value: characterData.breast_size,
    },
    {
      key: "butt_size",
      selection: buttSizeSelection,
      value: characterData.butt_size,
    },
    {
      key: "penis_size",
      selection: penisSizeSelection,
      value: characterData.penis_size,
    },
  ]
    .filter((item) => item.value)
    .reduce<SizeCardItem[]>((acc, item) => {
      const label = t(`characterOptions.labels.${item.value}`);
      if (!label) {
        return acc;
      }
      acc.push({
        key: item.key,
        label,
        imageUrl: item.selection?.option.url,
      });
      return acc;
    }, []);

  const hairColorMeta = characterData.hair_color
    ? hairColorSelection?.group.options?.find(
      (opt) => opt.value === characterData.hair_color
    )
    : null;

  const resolvedTags = Array.isArray(characterData.tags)
    ? characterData.tags
      .map((tag) => ({
        raw: tag,
        label: typeof tag === "string" ? tag : tag.value,
      }))
      .filter((tag) => Boolean(tag.label))
    : [];

  const ageLabel = getDisplayLabel(characterData.age, ageSelection);
  const hairColorLabel = t(`characterOptions.labels.${characterData.hair_color}`);

  // 获取 voice 字段的配置和选项（只显示选中的那一个）
  const voiceOptions = useMemo(() => {
    if (!characterData.voice) {
      return [];
    }

    const voiceGroups = optionIndex.get("voice") || [];
    // 找到匹配当前依赖的配置
    const matchingGroup = voiceGroups.find((group) =>
      matchesDepends(group, characterData)
    );
    const group = matchingGroup || voiceGroups[0];

    if (!group || !group.options) {
      return [];
    }

    // 找到与 characterData.voice 匹配的选项
    const selectedOption = group.options.find(
      (opt) =>
        opt.value === characterData.voice ||
        opt.prompt === characterData.voice ||
        opt.label === characterData.voice
    );

    if (!selectedOption) {
      return [];
    }

    // 只返回选中的那一个选项
    return [
      {
        value: selectedOption.value,
        label:selectedOption.title,
        url: selectedOption.url || "",
      },
    ];
  }, [optionIndex, characterData]);

  return (
    <div
      className={cn(
        "relative w-full max-w-[800px] mx-auto overflow-y-auto",
        isMobile ? "px-2" : "px-6 sm:px-8 mg-0 lg:px-12 py-8"
      )}
      style={{
        paddingTop: "0px",
      }}
    >
      {/* 顶部导航 - Summary 标题居中 */}
      <div className="relative flex items-center justify-center mb-8">
        <h1 className="text-white font-bold text-xl font-urbanist">{t('generate.summary')}</h1>
      </div>

      {/* 角色视觉效果和选项部分 */}
      <section className="mb-4" style={isMobile ? mobileStyle : {}}>
        {/* 主图片 - 浮动在左侧 */}
        <div
          className={`float-left shrink-0 mr-2 mb-2`}
        >
          <RoleImageCard
            imageUrl={primaryImageUrl}
            name={characterData.nickname || "Character"}
            // isMobile={isMobile}
            style={{
              ...isMobile ? { width: 236 } : {},
              height: isMobile ? 262 : 286,
            }}
          />
        </div>

        {/* 其他元素围绕主图片排列 */}
        <CharacterAttributesWrap
          galleryItems={galleryItems}
          voiceOptions={voiceOptions}
          voiceUrl={characterData.voice}
          ageLabel={ageLabel}
          hairColorLabel={hairColorLabel}
          hairColorMeta={hairColorMeta}
          sizeCardItems={sizeCardItems}
          isMobile={isMobile}
        />

        {/* 清除浮动 */}
        <div className="clear-both" />
      </section>

      {/* 角色详情部分 */}
      {resolvedTags.length > 0 && (
        <section className="mb-2" style={{
          borderRadius: 8,
          backgroundColor: '#1D1E27',
          padding: '8px 12px',
        }}>
          <div className="flex flex-wrap">
            {resolvedTags.map((tag) => (
              <span
                key={tag.raw}
                className="px-3 py-1  text-white text-xs font-urbanist font-medium"
              >
                {t(`characterOptions.labels.${tag.label}`)}
              </span>
            ))}
          </div>
        </section>
      )}
      <section className="mb-8 space-y-4 border rounded-md">
        {[
          { key: "nickname", labelKey: "nickname" },
          { key: "introduction", labelKey: "introduction" },
          { key: "settings", labelKey: "settings" },
          { key: "greeting", labelKey: "greeting" },
          { key: "personality", labelKey: "personality" },
          { key: "scenario", labelKey: "scenario" },
        ]
          .filter((item) => characterData?.[item.key])
          .map((item: any) => {
            const value = characterData[item.key];

            return (
              <div
                key={item.key}
                className={`flex items-start border-b border-[#2C2C38] ${isMobile ? 'p-2' : 'p-4'}`}
              >
                <label className="text-white w-20 text-sm font-urbanist font-medium">
                  {item.labelKey ? t(`characterOptions.titles.${item.labelKey}`) : t(`characterOptions.labels.${item.label}`)}
                </label>
                <div className="text-gray-400 font-urbanist font-normal text-sm leading-relaxed whitespace-pre-wrap ml-2 text-justify overflow-y-auto scrollbar-hide">
                  {value}
                </div>
              </div>
            );
          })}
        {/* 示例对话部分 */}
        {characterData?.conversation &&
          Array.isArray(characterData.conversation) &&
          characterData.conversation.length > 0 && (
            <div className={`flex rounded-md ${isMobile ? 'p-2' : 'p-4'}`}>
              <label className="block text-white text-sm font-urbanist font-medium mr-4  w-20 ">
                {t('createCharacter.exampleConversation')}
              </label>
              <div >
                {characterData.conversation.filter(i => i.user || i.character).map(
                  (c: { user: string; character: string }, index: number) => (
                    <div key={index}
                      style={{
                        marginTop: index > 0 ? 10 : 0,
                      }}
                    >
                      <div className="flex items-center">
                        <div className="bg-white flex items-center justify-center font-urbanist font-normal text-xs mr-3.5"
                          style={{
                            width: 77,
                            height: 22,
                            borderRadius: 12,
                            color: '#020202',
                            marginBottom: 8,
                          }}
                        >
                          {t('createCharacter.user')}
                        </div>
                        <div className="text-gray-400 font-urbanist font-normal text-sm">
                          {c.user}
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="bg-white flex items-center justify-center font-urbanist font-normal text-xs mr-3.5"
                          style={{
                            width: 77,
                            height: 22,
                            borderRadius: 12,
                            color: '#020202',
                          }}
                        >
                          {t('common.character')}
                        </div>
                        <div className="text-gray-400 font-urbanist font-normal text-sm">
                          {c.character}
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}
      </section>
    </div>
  );
}
