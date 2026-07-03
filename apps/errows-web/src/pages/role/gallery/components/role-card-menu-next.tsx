import { useState } from 'react';
import { Popover, PopoverTrigger, PopoverContent } from '@errows/design';
import { cn } from '@errows/design/lib/utils';
import { MoreIcon } from '@errows/icons';
import { useMobile } from '@/hooks/use-mobile-detector';

export interface MenuItem {
    label: string;
    key
    onClick?: () => void;
    isDangerous?: boolean;
}

export interface RoleCardMenuProps {
    items: MenuItem[];
    editEnable?: boolean;
}

const DisableItems = ['delete', 'rebuildFace', 'post'];

/**
 * 角色卡片菜单组件 - 自定义实现，支持动态位置计算和移动端
 */
export function RoleCardMenu({ items, editEnable }: RoleCardMenuProps) {
    const isMobile = useMobile();
    const [isOpen, setIsOpen] = useState(false);
    const handleMenuItemClick = (onClick?: () => void) => {
        onClick?.();
        setIsOpen(false);
    };

    const menuItems = items.filter((item) => !editEnable || (!DisableItems.includes(item.key)));

    return (
        <Popover modal={isMobile} open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                {/* 触发按钮 */}
                <div
                    className="absolute right-2 top-2 w-6 h-6 flex items-center justify-center cursor-pointer transition-all duration-150 hover:bg-white/20"
                    style={{
                        background: 'rgba(0, 0, 0, 0.3)',
                        backdropFilter: 'blur(4px)',
                        borderRadius: '50%',
                        fontSize: '1rem',
                    }}
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsOpen(true)
                    }}
                >
                    <MoreIcon className="text-white" />
                </div>
            </PopoverTrigger>

            {/* 菜单弹出框 - 使用 fixed 定位基于窗口坐标 */}
            <PopoverContent align='center' className='p-2'>
                <div>
                    <div className="flex flex-col items-center  scrollbar-hide gap-2 max-h-[70vh] overflow-y-auto">
                        {menuItems.map((item, idx) => (
                            <div
                                key={item.label}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleMenuItemClick(item.onClick);
                                }}
                                className={cn(
                                    'font-urbanist text-white font-bold rounded-lg text-nowrap',
                                    'w-full flex items-center gap-3 px-2 py-2',
                                    'text-sm transition-colors duration-150',
                                    'hover:bg-white/10'
                                )}
                            >
                                {item.label}
                            </div>
                        ))}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}

