import React, { useRef } from "react";
import {
    MultimediaActiveIcon,
    MultimediaStarIcon,
} from "@errows/icons";
import { useAuthCheck } from "@/hooks/use-auth-check";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";


export interface MultimediaProps {
    characterId: string;
    owner?: string;
}

/**
 * 多媒体按钮区域
 */
export const Multimedia: React.FC<MultimediaProps> = ({
    characterId,
    owner,
}) => {
    const { t } = useTranslation();
    const { isLogin, gotoLogin } = useAuthCheck();
    const navigate = useNavigate();

    const handleToMultimedia = () => {
        if (!isLogin) {
            gotoLogin();
            return;
        }
        navigate(`/multimedia/info/${characterId}?tab=image`);
    };

    return (
        <div
            className="h-18 rounded-lg border border-solid mt-3 flex items-center relative cursor-pointer"
            style={{ border: '1px solid #2C2C38' }}
            onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                handleToMultimedia();
            }}
        >
            <div
                className="size-13 ml-4 flex items-center justify-center relative"
                style={{
                    borderRadius: 12,
                    background: 'linear-gradient(96.61deg, #DD429D 0%, #B14BF4 50%, #485CFB 100%)',
                    padding: '2px',
                }}
            >
                <div
                    className="w-full h-full flex items-center justify-center rounded-[10px]"
                    style={{
                        background: '#0a0e27',
                    }}
                >
                    <MultimediaActiveIcon className="size-5" />
                </div>

                {/* 右下角装饰星星 */}
                <div className="absolute right-0 bottom-0 transform translate-x-1 translate-y-1 bg-[#0E0F17]" style={{
                    padding: 2
                }}>
                    <MultimediaStarIcon className="size-3.5" />
                </div>
            </div>

            <div className="flex flex-col font-urbanist ml-4">
                <span className="text-white font-[700] text-sm leading-[22px]">{t('common.multimedia')}</span>
                {owner && <span className="text-gray-400 font-[400] text-sm leading-[24px]">{`${t('role.detail.by')} ${owner.charAt(0).toUpperCase() + owner.slice(1)}`}</span>}
            </div>
        </div>
    );
};

export default Multimedia;
