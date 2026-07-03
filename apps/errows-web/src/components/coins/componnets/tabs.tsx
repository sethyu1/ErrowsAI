// 通用等分 Tabs 组件，可复用
type TabItem = { key: string; label: string };

interface SegmentTabsProps {
  items: TabItem[];
  activeKey: string;
  onChange: (key: string) => void;
  lineColor?: string;
  indicatorColor?: string;
  indicatorHeight?: number; // px
  className?: string;
}

export function Tabs({
  items,
  activeKey,
  onChange,
  lineColor = 'rgba(44,44,56,1)',
  indicatorColor = '#ffffff',
  indicatorHeight = 4,
  className,
}: SegmentTabsProps) {
  const count = items.length;
  const activeIndex = Math.max(0, items.findIndex((i) => i.key === activeKey));
  const segmentWidth = count > 0 ? 100 / count : 0;

  return (
    <div className={className} style={{ height: '25px' }}>
      <div className="flex h-full">
        {items.map((item) => {
          const isActive = item.key === activeKey;
          return (
            <button
              key={item.key}
              onClick={() => onChange(item.key)}
              className={`text-center transition-colors flex-1 flex items-center justify-center ${
                isActive ? 'text-white' : 'text-gray-400'
              }`}
              style={{ height: '21px', fontSize: '12px' }}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {/* 底部横线与选中高亮 */}
      <div className="relative" style={{ height: '4px' }}>
        {/* 底部横线 */}
        <div
          className="absolute left-0 right-0"
          style={{ height: 1, backgroundColor: lineColor }}
        />
        {/* 选中高亮（等分宽度，高度可配置） */}
        <div
          className="absolute top-0 transition-all duration-300"
          style={{
            height: indicatorHeight,
            width: `${segmentWidth}%`,
            left: `${activeIndex * segmentWidth}%`,
            backgroundColor: indicatorColor,
          }}
        />
      </div>
    </div>
  );
}

