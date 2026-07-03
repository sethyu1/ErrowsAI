import { useTranslation } from "react-i18next";
import { cn } from "@errows/design/lib/utils";

interface MultimediaTabProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    tabs?: { key: string; labelKey: string; label?: never }[] | { key: string; label: string; labelKey?: never }[];
    isMobile?: boolean;
}

export function MultimediaTab({ activeTab, setActiveTab, tabs, isMobile = false }: MultimediaTabProps) {
    const { t } = useTranslation();
    const defaultTabs: { key: string; labelKey: string }[] = [{ key: 'image', labelKey: 'multimedia.images' }, { key: 'video', labelKey: 'multimedia.videos' }];
    const finalTabs = (tabs || defaultTabs) as { key: string; labelKey?: string; label?: string }[];
    return (
        <div className={cn("flex flex-nowrap justify-center text-center", isMobile ? '' : 'border-b border-[#2C2C38]')}
        style={{...(isMobile ? {
            paddingTop: 8
        } : {
            marginBottom: 24,
        })}}
        >
            {finalTabs.map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                    <div
                        key={tab.key}
                        onClick={() => {
                            setActiveTab(tab.key);
                        }}
                        className={cn(
                            'relative cursor-pointer text-sm font-medium font-urbanist whitespace-nowrap transition-all duration-200',
                            'pb-2 px-1',
                            activeTab === tab.key
                                ? 'text-white font-[700]'
                                : 'text-[#A4ACB9]'
                        )}
                        style={{
                            ...(isMobile ? {
                                width: '50%',
                            } : {
                                width: '160px',
                            }),
                        }}
                    >
                        {tab.labelKey ? t(tab.labelKey) : tab.label}
                        {/* 下划线动画 */}
                        {isActive && (
                            <div className="absolute left-0 right-0  bg-white h-1" style={{
                                transform: 'translateY(100%)'
                            }} />
                        )}
                    </div>
                )
            })}
        </div>
    );
}