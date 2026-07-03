import { useState } from 'react';
import { Popover, PopoverTrigger, PopoverContent } from '@errows/design';
import { cn } from '@errows/design/lib/utils';
import { MoreIcon } from '@errows/icons';
import { useMobile } from '@/hooks/use-mobile-detector';

export interface MediaMenuItem {
    label: string;
    key: string;
    onClick?: () => void;
    isDangerous?: boolean;
}

export interface MediaCardMenuProps {
    items: MediaMenuItem[];
}

/**
 * 媒体卡片菜单组件 - 参考 RoleCardMenu 实现
 */
export function MediaCardMenu({ items }: MediaCardMenuProps) {
    const isMobile = useMobile();
    const [isOpen, setIsOpen] = useState(false);
    
    const handleMenuItemClick = (onClick?: () => void) => {
        onClick?.();
        setIsOpen(false);
    };

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
                        setIsOpen(true);
                    }}
                >
                    <MoreIcon className="text-white" />
                </div>
            </PopoverTrigger>

            {/* 菜单弹出框 */}
            <PopoverContent align='center' className='p-2'>
                <div>
                    <div className="flex flex-col items-center scrollbar-hide gap-2 max-h-[70vh] overflow-y-auto">
                        {items.map((item) => (
                            <div
                                key={item.key}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleMenuItemClick(item.onClick);
                                }}
                                className={cn(
                                    'font-urbanist text-white font-bold rounded-lg text-nowrap',
                                    'w-full flex items-center gap-3 px-2 py-2',
                                    'text-sm transition-colors duration-150',
                                    'hover:bg-white/10',
                                    item.isDangerous && 'text-red-400'
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
