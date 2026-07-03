import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { cn } from "@errows/design/lib/utils";
import { useMobile } from "@/hooks/use-mobile-detector";
import girlBg from "@/assets/generate-girl.webp";
import { Button } from "@errows/design";
import { MagicWandIcon } from "@errows/icons";

export function CreateEntryCard(props: { type?: 'image' | 'video' }) {
    const { type ="image" } = props;
    const { t } = useTranslation();
    const navigate = useNavigate();
    const isMobile = useMobile();

    const mobileCardWidth = Math.min(179, Math.floor((window.innerWidth - 32) / 2));

    return (
        <div
            className={cn(
                "relative overflow-hidden rounded-4 cursor-pointer shrink-0 group",
                !isMobile && "w-[184px] h-[284px]",
                "bg-gray-900"
            )}
            style={{
                ...(isMobile ? { width: mobileCardWidth, height: 276 } : {}),
                borderRadius: 14,
                borderTopLeftRadius: 8,
                borderTopRightRadius: 8,
                backgroundImage: `url(${girlBg})`,
                backgroundPosition: "center",
                backgroundSize: "cover",
                backgroundRepeat: "no-repeat",
            }}
            onClick={() => navigate(`/generate/${type}`)}
        >
            <div />
            <div
                className="absolute w-full h-full left-0 right-0 z-1"
                style={{
                    background: "linear-gradient(360deg, rgba(0, 0, 0, 0.6) 9.86%, rgba(0, 0, 0, 0) 82.75%)",
                }}
            />
            <div
                className="absolute left-0 px-2 w-full right-0 z-2 font-urbanist  mx-auto bottom-16 flex justify-center items-center font-[700] text-xl leading-6"
                style={{
                    whiteSpace: "wrap",
                    textAlign: "center",
                }}
            >
                &nbsp; {t(`multimedia.createYourOwn${type === 'image' ? 'Image' : 'Video'}`)}
            </div>
            <Button
                appearance="gradientFill"
                className="flex items-center justify-center absolute z-2 left-0 right-0 mx-auto bottom-4 px-6 py-2 text-sm font-[700] text-[#090A0A] font-urbanist cursor-pointer"
                style={{
                    background:
                        "linear-gradient(96.61deg, #DD429D 0%, #B14BF4 50%, #485CFB 100%)",
                    color: "#fff",
                    width: isMobile ? 146 : 150,
                }}
            >
                <span className="mr-1">{t('common.createNew')}</span>
                <MagicWandIcon />
            </Button>
        </div>
    );
}
