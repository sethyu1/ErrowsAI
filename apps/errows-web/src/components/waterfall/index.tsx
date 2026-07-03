import React, { useState, useMemo } from "react";
import { InfiniteScroll } from "../infinite-scroll";

interface WaterfallProps<T> {
  items: T[];
  columnCount?: number;
  gap?: number;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loading?: boolean;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
}

export default function Waterfall<T>({
  items,
  columnCount = 4,
  gap = 16,
  onLoadMore,
  hasMore = true,
  loading = false,
  renderItem,
  className = "",
}: WaterfallProps<T>) {
  const [columns, setColumns] = useState<T[][]>([]);

  // 将items分配到不同的列中
  useMemo(() => {
    const newColumns: T[][] = Array.from({ length: columnCount }, () => []);
    const columnHeights = new Array(columnCount).fill(0);

    items.forEach((item) => {
      // 找到当前高度最小的列
      const minHeightIndex = columnHeights.indexOf(Math.min(...columnHeights));
      newColumns[minHeightIndex].push(item);
      // 假设每个项目高度为1，实际高度会由渲染后的DOM决定
      columnHeights[minHeightIndex] += 1;
    });

    setColumns(newColumns);
  }, [items, columnCount]);

  return (
    <InfiniteScroll
      direction="down"
      onLoadMore={onLoadMore}
      loading={loading}
      hasMore={hasMore}
      className={`w-full ${className}`}
    >
      <div
        className="flex justify-center"
        style={{
          gap: `${gap}px`,
          alignItems: "flex-start",
        }}
      >
        {columns.map((column, columnIndex) => (
          <div
            key={columnIndex}
            className="flex flex-col"
            style={{
              gap: `${gap}px`,
              flex: "1 1 0",
              minWidth: 0,
            }}
          >
            {column.map((item, itemIndex) => {
              const globalIndex = columnIndex + itemIndex * columnCount;
              return (
                <div key={globalIndex} className="w-full">
                  {renderItem(item, globalIndex)}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </InfiniteScroll>
  );
}