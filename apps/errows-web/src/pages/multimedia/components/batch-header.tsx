import React from "react";
import { useTranslation } from "react-i18next";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
    Avatar,
    AvatarImage,
} from "@errows/design";
import { Checkbox } from "@errows/design/components/checkbox";
import { cn } from "@errows/design/lib/utils";
import { ArrowLeftIcon, TimeSorterIcon } from "@errows/icons";

const BATCH_SORTS = [
    { value: "desc", labelKey: "multimedia.sortByLatest" },
    { value: "asc", labelKey: "multimedia.oldest" },
];

interface BatchSortProps {
    isMobile: boolean;
    onSortChange?: (sort: string) => void;
}

export const BatchSort = (props: BatchSortProps) => {
    const { t } = useTranslation();
    const [value, setValue] = React.useState<string>("desc");
    const { isMobile, onSortChange } = props;
    return (
        <Select value={value} onValueChange={(v) => {
            setValue(v);
            onSortChange?.(v);
        }}>
            <SelectTrigger 
            className={cn("w-[140px]", isMobile ? "w-24" : "")}
            icon={
                <svg 
                    width={isMobile ? 18 : 16} 
                    height={isMobile ? 18 : 16} 
                    viewBox="0 0 16 16" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                    className="shrink-0"
                    style={{
                        opacity: 0.7,
                        flexShrink: 0,
                    }}
                >
                    <path 
                        d="M4 6L8 2L12 6H4Z" 
                        fill="currentColor"
                    />
                    <path 
                        d="M4 10L8 14L12 10H4Z" 
                        fill="currentColor"
                    />
                </svg>
            }
            >
                <SelectValue placeholder={t('multimedia.time')} />
            </SelectTrigger>
            <SelectContent>
                {BATCH_SORTS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                        {t(option.labelKey)}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
};

export const RoleInfo = (props: { url: string; name: string, isMobile?: boolean }) => {
    const { url, name, isMobile = false } = props;
    return (
        <div className="flex flex-col items-center gap-1">
            {isMobile ? <Avatar className="size-8">
                <AvatarImage src={url} />
            </Avatar>
                : <div style={{
                    width: 60,
                    height: 60,
                    borderRadius: 16,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundImage: `url(${url})`,
                    backgroundSize: 'contain',
                    backgroundPosition: 'center',
                }}>
                </div>}
            <div className="text-white font-urbanist font-[700] text-sm">{name}</div>
        </div>
    );
};

interface BatchHeaderProps {
    checked?: boolean;
    generateSelected: boolean;
    roleInfo?: API.Character.CHARACTER;
    onBack: () => void;
    onSortChange?: (sort: string) => void;
    onToggleSelectionMode?: (checked: boolean) => void;
}

export const BatchCheckBox = (props: { checked: boolean, onChange?: (checked: boolean) => void }) => {
    const { t } = useTranslation();
    const { checked, onChange } = props;
    return (
        <div className={`flex items-center gap-2 ${onChange ? 'visible' : 'invisible'}`}>
            <Checkbox checked={checked} onCheckedChange={onChange} className="mr-2 cursor-pointer" style={{ background: '#fff'}} />
            <div className="text-[A4ACB9] font-urbanist text-sm">{t('multimedia.batchGenerateVideos')}</div>
        </div>
    );
}

export function BatchHeader(props: BatchHeaderProps) {
    const { roleInfo = {} as API.Character.CHARACTER, checked, onSortChange, onToggleSelectionMode } = props;
    return (
        <div className="flex items-start justify-between h-21 mt-3.5 mb-3.5">
            <div className="flex items-center">
                {/* <div className="w-[24px] h-[24px] flex items-center justify-center cursor-pointer mr-8" onClick={onBack}>
                    <ArrowLeftIcon className="w-full h-full text-white" />
                </div> */}
                <BatchSort isMobile={false} onSortChange={onSortChange} />
            </div>
            <RoleInfo url={roleInfo.avatar_url} name={roleInfo.nickname} />
            <BatchCheckBox checked={!!checked} onChange={onToggleSelectionMode} />
        </div>
    );
}

export function MobileBatchHeader(props: BatchHeaderProps) {
    const { roleInfo = {} as API.Character.CHARACTER, onBack } = props;
    return (
        <div className="relative flex justify-center items-center h-18 border-b border-[#2C2C38]">
            <div className="absolute left-2 top-[50%]  translate-y-[-50%]">
                <div className="w-[16px] h-[16px] flex items-center justify-center cursor-pointer mr-8" onClick={onBack}>
                    <ArrowLeftIcon className="w-full h-full text-white" />
                </div>
            </div>
            <RoleInfo url={roleInfo.avatar_url} name={roleInfo.nickname} isMobile={true} />
        </div>
    );
}