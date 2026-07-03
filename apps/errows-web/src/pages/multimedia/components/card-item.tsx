import { useState } from 'react';
import { MediaTag } from '@/components';
import { Checkbox } from '@errows/design/components/checkbox';
import { CardFooter } from './card-footer';
import { FOOTER_OPERATIONS } from '../constants';
import { cn } from '@errows/design/lib/utils';
import type { RoleMedia } from '../type';
import dayjs from 'dayjs';
import { MediaCardMenu } from './media-card-menu';
import { useTranslation } from 'react-i18next';

interface CardItemProps {
    size?: 'large' | 'small';
    role: RoleMedia;
    type: 'image' | 'video';
    batchMode: boolean;
    hoverEnabled?: boolean;
    /**是否展示统计 */
    statisticsMode?: boolean;
    selected: boolean;
    children?: React.ReactNode;
    isGroup?: boolean;
    /** 是否有删除入口 */
    showDeleteEntry?: boolean;
    onClick: () => void;
    onOperation: (operation: typeof FOOTER_OPERATIONS[keyof typeof FOOTER_OPERATIONS]) => void;
    /** 删除回调 */
    onDelete?: () => void;
}

const normalCardStyle = {
    borderRadius: 8,
    background: `linear-gradient(360deg, rgba(0, 0, 0, 0.32) 5.37%, rgba(0, 0, 0, 0) 42.95%)`,

}
// 移动端卡片宽度：保证一行2个卡片 (屏幕宽度 - 左右padding 24px - gap 8px) / 2，最大179px
const getMobileCardWidth = () => Math.min(179, Math.floor((window.innerWidth - 32) / 2));

const cardStyle = {
    large: {
        width: 184,
        height: 284,
    },
    small: {
        width: getMobileCardWidth(),
        height: 276,
    }
}

export function CardItem(props: CardItemProps) {
    const { size = 'large', role, type, batchMode, selected, isGroup = true, hoverEnabled, onClick, children, onOperation, statisticsMode = true, showDeleteEntry = false, onDelete } = props;
    const { t } = useTranslation();
    const [hover, setHover] = useState(false);

    const handleClickAndTouch = (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (hoverEnabled) {
            setHover(true);
        }
        onClick();
    };

    return (
        <div style={{
            width: cardStyle[size].width,
        }}>
            {children ? children : <div className="relative overflow-hidden cursor-pointer"
                style={{
                    ...cardStyle[size],
                    ...normalCardStyle,
                    ...selected ? {
                        border: '2px solid #fff',
                    } : {}
                }}
                onClick={handleClickAndTouch}
                // onTouchEnd={handleClickAndTouch}
                onMouseEnter={hoverEnabled ? () => setHover(true) : undefined}
                onMouseLeave={hoverEnabled ? () => setHover(false) : undefined}
            >
                <img src={role.avatar} className="absolute inset-0 w-full h-full object-cover" />
                {/* 顶部统计 */}
                {isGroup && statisticsMode && <div className="absolute left-2 top-2">
                    <MediaTag type={type} count={role.count} />
                </div>
                }
                {/* 删除菜单 */}
                {showDeleteEntry && onDelete && (
                    <MediaCardMenu
                        items={[
                            {
                                key: 'delete',
                                label: t('common.delete'),
                                onClick: onDelete,
                                // isDangerous: true,
                            },
                        ]}
                    />
                )}
                {/* 底部名称 */}
                {role.nickname && isGroup && <div className="absolute left-3 right-3 bottom-4.5 text-white font-urbanist font-[700] text-sm line-clamp-1 z-10">{role.nickname}</div>}

                {hover && <CardFooter type={type} onOperation={onOperation} />}
                {/* 底部深色渐变层 */}
                { statisticsMode &&<div
                    className="absolute  bottom-0 left-0 right-0 pointer-events-none"
                    style={{
                        borderRadius: 8,
                        height: '52px',
                        background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.5))',
                    }}
                />}
            </div>
            }
            {/* 选择框 */}
            {!isGroup &&
                <div className={cn('left-3 right-3 bottom-4.5', size === 'small' ? 'mt-3' : 'mt-2')}>
                    <div className='flex items-center justify-center'>
                        {
                            batchMode && <Checkbox checked={selected} onCheckedChange={onClick} className='mr-2 cursor-pointer' />
                        }
                        <div className="text-[#A4ACB9] font-urbanist text-sm">{
                            dayjs(role.generated_at || role.created_at).format('YYYYMMDD-HHmmss')
                        }</div>
                    </div>
                </div>}
        </div>
    );
}

export function EmptyCardItem({ size }: { size: 'large' | 'small' }) {
    return (
        <div style={{
            width: cardStyle[size].width,
        }}>
        </div>
    );
}