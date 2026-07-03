import { useTranslation } from 'react-i18next';
import { cn } from '@errows/design/lib/utils';

export type AuthTab = 'signup' | 'login';

interface AuthTabsProps {
  active: AuthTab;
  onChange: (tab: AuthTab) => void;
}

// 通用等分 Tabs 组件，可复用
type TabItem = { key: string; label: string };

interface SegmentTabsProps {
  items: TabItem[];
  activeKey: string;
  onChange: (key: string) => void;
  lineColor?: string;
  indicatorColor?: string;
  indicatorHeight?: number;
  className?: string;
}

export function SegmentTabs({
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
    <div className={cn('h-6', className)}>
      <div className="flex h-full">
        {items.map((item) => {
          const isActive = item.key === activeKey;
          return (
            <button
              key={item.key}
              onClick={() => onChange(item.key)}
              className={cn(
                'h-5 text-xs text-center transition-colors flex-1 flex items-center justify-center',
                isActive ? 'text-white' : 'text-gray-400'
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {/* 底部横线与选中高亮 */}
      <div className="relative h-1">
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

// 保持兼容旧用法的 AuthTabs 包装
export function AuthTabs({ active, onChange }: AuthTabsProps) {
  const { t } = useTranslation();

  return (
    <SegmentTabs
      items={[
        { key: 'signup', label: t('auth.signUp') },
        { key: 'login', label: t('auth.login') },
      ]}
      activeKey={active}
      onChange={(key) => onChange(key as AuthTab)}
      lineColor="rgba(44,44,56,1)"
      indicatorColor="#ffffff"
      indicatorHeight={4}
    />
  );
}


