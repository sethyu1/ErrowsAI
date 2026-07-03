import { CardList } from "./card-list";
import type { RoleMedia } from "../type";

interface BatchCardListProps {
    list: RoleMedia[];
    selectedList: string[];
    type: "image" | "video";
    /**是否展示统计 */
    statisticsMode?: boolean;
    onSelectedChange: (selectedList: string[]) => void;
    generatingImageIds?: string[]; // 正在生成中的图片ID列表
    onGenerateVideo?: (id: string) => void;
    batchModeEnabled?: boolean;
    showDeleteEntry?: boolean;
    onDelete?: (id: string) => void;
}

export function BatchCardList(props: BatchCardListProps) {
    const {
        type,
        list = [],
        onSelectedChange,
        selectedList,
        generatingImageIds = [],
        onGenerateVideo,
        batchModeEnabled = true,
        statisticsMode = false,
        showDeleteEntry = false,
        onDelete,
    } = props;
    const isBatchMode = type === 'image' && batchModeEnabled;

    const handleItemClick = (id: string) => {
        // 如果图片正在生成中，不允许选择
        if (generatingImageIds.includes(id)) {
            return;
        }
        // 批量模式下仅在图片类型时进行选择
        if (isBatchMode) {
            const newList = [...selectedList];
            if (newList.includes(id)) {
                newList.splice(newList.indexOf(id), 1);
            } else {
                newList.push(id);
            }
            onSelectedChange(newList);
        }
    }

    return (
        <CardList
            list={list}
            loadingIds={generatingImageIds}
            type={type}
            batchMode={isBatchMode}
            selectedList={isBatchMode ? selectedList : []}
            handleItemClick={handleItemClick}
            isGroup={!isBatchMode}
            hoverEnabled={true}
            onGenerateVideo={onGenerateVideo}
            statisticsMode={statisticsMode}
            showDeleteEntry={showDeleteEntry}
            onDelete={onDelete}
        />
    );
}
