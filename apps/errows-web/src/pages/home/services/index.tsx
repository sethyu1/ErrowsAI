import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { useMobile } from "@/hooks/use-mobile-detector";
import { useCharacterOptions } from "@/pages/role/hooks/use-character-options";
import { HomeServicesContext } from "./context";
import type { Tags } from "./context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@errows/design";
// import {
//   Drawer,
//   DrawerContent,
//   DrawerHeader,
//   DrawerTitle,
//   DrawerDescription,
//   DrawerClose,
// } from "@errows/design/components/drawer";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from '@errows/design/components/sheet';

import { useModal } from "@/hooks/use-modal";
import { Button } from "@errows/design";
import { CloseIcon, BackIcon } from "@errows/icons";
import { useLocalStorageState } from "ahooks";

interface OptionItem {
  value: string;
  url?: string;
  color?: string;
  title?: string;
  group?: string | null;
}

interface InputField {
  key: string;
  title: string;
  required: boolean;
  max_select: number;
  depends: Array<[string, string[]]>;
  input_type: string;
  options: OptionItem[];
}

interface GroupedItem {
  label: string;
  value: string;
}

interface GroupedData {
  key: string;
  title: string;
  items: GroupedItem[];
}

/**
 * 将输入字段数组按 key 分组，合并 options 并去重
 * @param fields 输入字段数组
 * @returns 分组后的数据数组
 */
function groupFieldsByKey(fields: InputField[]): GroupedData[] {
  // 使用 Map 来存储每个 key 对应的 items
  const groupedMap = new Map<string, Map<string, GroupedItem>>();

  fields.forEach((field) => {
    const { key, options } = field;

    // 如果这个 key 还没有在 Map 中，创建一个新的 Map
    if (!groupedMap.has(key)) {
      groupedMap.set(key, new Map());
    }

    const itemsMap = groupedMap.get(key)!;

    // 遍历 options，添加到 itemsMap 中（自动去重，因为 Map 的 key 是 value）
    options.forEach((option) => {
      const { value, title } = option;
      // 使用 value 作为 Map 的 key 来去重
      // label 优先使用 title，如果没有 title 则使用 value
      if (!itemsMap.has(value)) {
        itemsMap.set(value, {
          label: title || value,
          value: value,
        });
      }
    });
  });

  // 将 Map 转换为数组格式
  const result: GroupedData[] = [];
  groupedMap.forEach((itemsMap, key) => {
    result.push({
      key,
      title: fields.find((field) => field.key === key)?.title ?? "",
      items: Array.from(itemsMap.values()),
    });
  });

  return result;
}

const STORAGE_KEY = "__tags__";

const FIXED_TAGS_FIRST = ["Realistic", "Anime", "Female", "Male"] as const;

const FIXED_TAGS_REST = [
  "African",
  "Angel",
  "Anime World",
  "Armor",
  "Asian",
  "Beast ears",
  "Beastkin",
  "Black-haired",
  "Blonde",
  "Blue-haired",
  "Braided",
  "Brunette",
  "Casual Wear",
  "Caucasian",
  "Centaur",
  "Cheerful",
  "Cold",
  "Curly hair",
  "Curvy",
  "Dark-skinned",
  "Demon",
  "Deredere",
  "Dragon",
  "Elf",
  "Energetic",
  "Errows World",
  "Fair-skinned",
  "Fairy",
  "Formal Wear",
  "Futa",
  "Gentle",
  "Glasses",
  "Gloves",
  "Gothic Outfit",
  "Green-haired",
  "Harpy",
  "Hats",
  "Horns",
  "Human",
  "Innocent",
  "Intelligent",
  "Introverted",
  "Lamia",
  "Large-breasted",
  "Latina",
  "Lazy",
  "Long-haired",
  "Mage Outfit",
  "Maid Outfit",
  "Mature",
  "Orange-haired",
  "Pink-haired",
  "Ponytail",
  "Purple-haired",
  "Red-haired",
  "School Uniform",
  "Seductive Wear",
  "Short-haired",
  "Silver-haired",
  "Slim",
  "Slime",
  "Stockings",
  "Straight hair",
  "Tail",
  "Tall",
  "Tanned",
  "Twin-tails",
  "Uniform",
  "Vampire",
  "White-haired",
  "Wings",
] as const;

const FIXED_TAGS_ORDER = [
  ...FIXED_TAGS_FIRST,
  ...FIXED_TAGS_REST.filter((t) => !FIXED_TAGS_FIRST.includes(t as any)),
] as const;

const FIXED_TAGS_SET = new Set<string>(FIXED_TAGS_ORDER as unknown as string[]);

export const HomeServicesProvider: React.FC<React.PropsWithChildren> = (
  props
) => {
  const { children } = props;
  const { t } = useTranslation();
  const isMobile = useMobile();
  const navigate = useNavigate();
  const { tagName: tagNameParam } = useParams<{ tagName?: string }>();
  const { characterOptions } = useCharacterOptions();
  const tagOptionsModal = useModal<boolean>();
  const tagOptions = React.useMemo(() => {
    const allOptions = groupFieldsByKey(characterOptions?.options ?? []) || [];

    const tagsOption = allOptions.find((item) => item.key === "tags");
    if (!tagsOption) {
      return [];
    }

    const orderIndex = new Map<string, number>();
    for (let i = 0; i < FIXED_TAGS_ORDER.length; i += 1) {
      orderIndex.set(FIXED_TAGS_ORDER[i] as unknown as string, i);
    }

    const filteredItems = tagsOption.items
      .filter((item) => FIXED_TAGS_SET.has(item.value))
      .sort((a, b) => (orderIndex.get(a.value) ?? 999999) - (orderIndex.get(b.value) ?? 999999));

    return filteredItems.length > 0
      ? [{ ...tagsOption, items: filteredItems }]
      : [];
  }, [characterOptions]);

  const [tags, setTags] = useLocalStorageState<Tags>(STORAGE_KEY, {
    defaultValue: [] as Tags,
  });

  const [selectedTags, setSelectedTags] = React.useState<
    (GroupedItem & { key: string })[]
  >(
    tags
      ?.flatMap(([key, values]) => {
        if (key === "tags") {
          return values
            .filter((value) => FIXED_TAGS_SET.has(value))
            .map((value) => ({ key, value, label: value }));
        }
        return [];
      })
      .filter(Boolean) || []
  );

  React.useEffect(() => {
    if (!tagNameParam) return;
    const decoded = decodeURIComponent(tagNameParam).toLowerCase();
    const canonical = [...FIXED_TAGS_SET].find((t) => t.toLowerCase() === decoded);
    if (!canonical) return;
    const urlTags: Tags = [["tags", [canonical]]];
    setTags(urlTags);
    setSelectedTags([{ key: "tags", value: canonical, label: canonical }]);
  }, [tagNameParam]);

  const handleSelectTag = (key: string, item: GroupedItem) => {
    setSelectedTags((prev) => {
      if (prev.some((tag) => tag.key === key && tag.value === item.value)) {
        return prev.filter(
          (tag) => tag.key !== key || tag.value !== item.value
        );
      } else {
        return [...prev, { key, ...item }];
      }
    });
  };
  const handleClearTags = () => {
    setSelectedTags([]);
  };

  const handleDone = () => {
    tagOptionsModal.close();
    const tagValues = selectedTags?.filter(
      (item) => item.key === "tags" && FIXED_TAGS_SET.has(item.value)
    ) ?? [];
    const tags = tagValues.reduce((acc, item) => {
      if (acc[item.key]) {
        acc[item.key].push(item.value);
      } else {
        acc[item.key] = [item.value];
      }
      return acc;
    }, {} as Record<string, string[]>);
    const newTags = Object.entries(tags).map(([type, values]) => [type, values]) as Tags;
    setTags(newTags);
    if (tagValues.length === 1) {
      navigate(`/${encodeURIComponent(tagValues[0].value.toLowerCase())}`, { replace: true });
    }
  };

  return (
    <HomeServicesContext.Provider value={{ tags, open: tagOptionsModal.open }}>
      {children}

      {!isMobile && (
        <Dialog
          open={tagOptionsModal?.visible}
          onOpenChange={tagOptionsModal.close}
          modal
        >
          <DialogContent className="w-[800px] max-w-[800px] !max-w-none max-h-[90vh] overflow-y-auto overflow-x-hidden bg-[#0A0A0F] border-[#2C2C38]">
            <DialogHeader>
              <DialogTitle className="text-white">{t("common.tags")}</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 h-[400px] overflow-y-auto scrollbar-hide relative">
              {tagOptions.map((item) => (
                <div key={item.key} className="flex flex-col gap-4">
                  <div className="text-[#A4ACB9] text-[14px] font-medium font-roboto leading-[16px]">
                    {/* {t(`characterOptions.titles.${item.key}`)} */}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {item.items.map((c) => {
                      const isSelected = selectedTags.some(
                        (tag) => tag.key === item.key && tag.value === c.value
                      );
                      return (
                        <div
                          key={c.value}
                          className={`cursor-pointer h-6 px-3 text-[#ffffff] rounded-[4px] text-[14px] font-medium font-urbanist leading-[24px] border ${
                            isSelected ? "border-white" : "border-[#FFFFFF1A]"
                          }`}
                          onClick={() => handleSelectTag(item.key, c)}
                        >
                          {t(`characterOptions.labels.${c.label}`)}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              <div
                className="sticky bottom-[-4px] min-h-7 left-0 right-0 w-full pointer-events-none h-7"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(27, 18, 39, 0) 0%, #1B1227 88.46%)",
                }}
              />
            </div>

            <div className="flex flex-wrap justify-start gap-2 h-[144px] overflow-y-auto p-5 bg-[#090A0A] rounded-[8px] border border-[#FFFFFF1A] backdrop-blur-sm">
              {selectedTags.map((item) => (
                <div
                  key={item.value}
                  className={`flex items-center gap-2 cursor-pointer h-6 px-3 bg-[#1D1E27] text-[#ffffff] rounded-[4px] text-[14px] font-medium font-urbanist leading-[24px] border`}
                  onClick={() => handleSelectTag(item.key, item)}
                >
                  {t(`characterOptions.labels.${item.label}`)}
                  <CloseIcon className="w-2 h-2" />
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-[18px]">
              <Button
                shape="round"
                className="w-[126px]"
                style={{ background: "#22232A", color: "#ffffff" }}
                onClick={handleClearTags}
              >
                {t("common.clear")}
              </Button>
              <Button
                appearance="gradientFill"
                className="w-[126px]"
                shape="round"
                onClick={handleDone}
              >
                {t("common.done")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {isMobile && (
        <Sheet
          open={tagOptionsModal?.visible}
          onOpenChange={tagOptionsModal.close}
        >
          <SheetContent
            side="right"
            className="z-1000 w-screen h-screen bg-[#101018] [&>button]:hidden"
          >
            <SheetHeader className="hidden">
              <SheetTitle />
              <SheetDescription />
            </SheetHeader>
            <div className="w-full h-full relative">
              <div className="flex items-center h-[72px] px-6 gap-4 border-b border-[#2C2C38]">
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-6 h-6"
                  onClick={tagOptionsModal.close}
                >
                  <BackIcon className="w-4 h-4" />
                </Button>
                <span className="text-white text-[18px] font-bold text-[#FCFCFC]">
                  {t("common.tags")}
                </span>
              </div>
              <div className="flex flex-col p-3 ">
                <div className="flex flex-col gap-4 h-[calc(100vh-370px)] pb-3 overflow-y-auto scrollbar-hide relative">
                  {tagOptions.map((item) => (
                    <div key={item.key} className="flex flex-col gap-4">
                      <div className="text-[#A4ACB9] text-[14px] font-medium font-roboto leading-[16px]">
                        {t(`characterOptions.titles.${item.key}`)}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {item.items.map((c) => {
                          const isSelected = selectedTags.some(
                            (tag) =>
                              tag.key === item.key && tag.value === c.value
                          );
                          return (
                            <div
                              key={c.value}
                              className={`cursor-pointer h-6 px-3 text-[#ffffff] rounded-[4px] text-[14px] font-medium font-urbanist leading-[24px] border ${
                                isSelected
                                  ? "border-white"
                                  : "border-[#FFFFFF1A]"
                              }`}
                              onClick={() => handleSelectTag(item.key, c)}
                            >
                              {t(`characterOptions.labels.${c.label}`)}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  <div
                    className="sticky bottom-[-14px] min-h-[75px] left-0 right-0 w-full h-[75px] pointer-events-none -mt-[75px]"
                    style={{
                      background:
                        "linear-gradient(180deg, rgba(9, 10, 10, 0) 0%, #090A0A 88.46%)",
                    }}
                  />
                </div>
                <div className="flex flex-wrap justify-start gap-2 h-[144px] overflow-y-auto p-3 bg-[#090A0A] rounded-[8px] border border-[#FFFFFF1A] backdrop-blur-sm">
                  {selectedTags.map((item) => (
                    <div
                      key={item.value}
                      className={`flex items-center gap-2 cursor-pointer h-6 px-3 bg-[#1D1E27] text-[#ffffff] rounded-[4px] text-[14px] font-medium font-urbanist leading-[24px] border`}
                      onClick={() => handleSelectTag(item.key, item)}
                    >
                      {t(`characterOptions.labels.${item.label}`)}
                      <CloseIcon className="w-2 h-2" />
                    </div>
                  ))}
                </div>
                <div className="flex justify-center gap-[18px] h-20 pt-3">
                  <Button
                    shape="round"
                    className="w-[126px]"
                    style={{ background: "#22232A", color: "#ffffff" }}
                    onClick={handleClearTags}
                  >
                    {t("common.clear")}
                  </Button>
                  <Button
                    appearance="gradientFill"
                    className="w-[126px]"
                    shape="round"
                    onClick={handleDone}
                  >
                    {t("common.done")}
                  </Button>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </HomeServicesContext.Provider>
  );
};
