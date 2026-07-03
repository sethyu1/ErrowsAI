import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router";
import {
  Dialog,
  DialogContent,
  DialogClose,
} from "@errows/design/components/dialog";
import { CloseIcon, DiamondFillIcon } from "@errows/icons";
import { SafePrivacy } from "@/components/safe-privacy";
import { useMobile } from "@/hooks/use-mobile-detector";
import { cn } from "@errows/design/lib/utils";
import { fetchCharacterDiscoverListApi } from "@/apis";

const FEATURES = [
  "Unlimited Chat with thousands of different Characters",
  "Enhanced Model to Use During Chatting",
  "Exclusive Premium Scenes With NSFW Content",
  "Better Image and Video Generate Experience",
  "Free Coins Every Month",
];

const RPMASTER_FEATURES = [...FEATURES];

const VOICECALL_IMAGE_FEATURES = [
  "Unlimited Chat with thousands of different Characters",
  "Enhanced Model to Use During Chatting",
  "Create freely, upgrade for premium styles.",
  "Better Image and Video Generate Experience",
  "Free Coins Every Month",
];

const VOICECALL_FEATURES = ["Voice Call", ...VOICECALL_IMAGE_FEATURES];
const IMAGE_FEATURES = ["Image Request", ...VOICECALL_IMAGE_FEATURES];

interface VoiceCallSubscribeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDismiss?: () => void;
  characterImageUrl?: string | null;
  variant?: "default" | "rpmaster" | "voicecall" | "image";
}

export function VoiceCallSubscribeModal({
  open,
  onOpenChange,
  onDismiss,
  characterImageUrl,
  variant = "default",
}: VoiceCallSubscribeModalProps) {
  const isRpmaster = variant === "rpmaster";
  const isVoicecallOrImage = variant === "voicecall" || variant === "image";
  const featureName = variant === "voicecall" ? "Voice call" : variant === "image" ? "Image Request" : "";
  const title = isRpmaster
    ? "Upgrade to Unlock RPMaster Chat Model"
    : isVoicecallOrImage
    ? `Subscribe Now to Unlock ${featureName}`
    : "Subscribe Now to Have Full Experience";
  const subtitle = isRpmaster
    ? "Hurry up，Upgrade now to enjoy"
    : "With subscriptions you will get access to";
  const features = isRpmaster
    ? RPMASTER_FEATURES
    : variant === "voicecall"
    ? VOICECALL_FEATURES
    : variant === "image"
    ? IMAGE_FEATURES
    : FEATURES;
  const getButtonText = (compact: boolean) =>
    isRpmaster
      ? "Subscribe Now"
      : isVoicecallOrImage
      ? "Upgrade to Premium"
      : compact
      ? "Subscribe Now"
      : "Upgrade to Premium";
  const navigate = useNavigate();
  const isMobile = useMobile();
  const [fallbackImage, setFallbackImage] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const closingByUpgradeRef = useRef(false);

  const characterImage = characterImageUrl
    ? (imageError ? null : characterImageUrl)
    : fallbackImage;

  useEffect(() => {
    if (!open) return;
    setImageError(false);
    if (characterImageUrl) return;
    setFallbackImage(null);
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchCharacterDiscoverListApi({
          size: 50,
          sort: "popular",
        });
        const list = res.data?.filter((c) => c?.avatar_url) ?? [];
        if (cancelled) return;
        if (list.length > 0) {
          const idx = Math.floor(Math.random() * list.length);
          setFallbackImage(list[idx].avatar_url);
        }
      } catch {
        if (!cancelled) setFallbackImage(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, characterImageUrl]);

  const handleUpgrade = () => {
    closingByUpgradeRef.current = true;
    onOpenChange(false);
    navigate("/choose-plan");
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      if (!closingByUpgradeRef.current) onDismiss?.();
      closingByUpgradeRef.current = false;
    }
    onOpenChange(next);
  };

  const contentBlock = (compact: boolean) => (
    <>
      <h2
        className={cn(
          "font-bold text-white",
          compact ? "text-xl" : "text-2xl md:text-3xl"
        )}
        style={{ lineHeight: 1.25 }}
      >
        {title}
      </h2>
      <p
        className={cn(
          "text-[#A4ACB9]",
          compact ? "text-base" : "text-base md:text-lg"
        )}
      >
        {subtitle}
      </p>
      <ul className="flex flex-col gap-3">
        {features.map((text, i) => (
          <li key={i} className="flex items-start gap-3">
            <span
              className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white overflow-hidden"
              style={{
                background: "linear-gradient(96.61deg, #DD429D 0%, #B14BF4 50%, #485CFB 100%)",
                backgroundSize: "cover",
              }}
            >
              <svg className="h-3 w-3 shrink-0 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12l5 5L20 7" />
              </svg>
            </span>
            <span className="text-[#A4ACB9] text-sm md:text-base">{text}</span>
          </li>
        ))}
      </ul>
      <div className="flex flex-col items-center gap-4 pt-0">
        <button
          type="button"
          className={cn(
            "rounded-full bg-gradient-to-r from-[#B83DD4] via-[#7C3AED] to-[#4F46E5] text-white font-semibold border-0 hover:opacity-90 flex items-center justify-center gap-2 cursor-pointer transition-opacity whitespace-nowrap",
            compact ? "h-11 px-8 text-sm" : "h-12 px-16 text-base"
          )}
          onClick={handleUpgrade}
        >
          {getButtonText(compact)}
          <DiamondFillIcon className="w-5 h-5" />
        </button>
        <SafePrivacy size={compact ? "mini" : "default"} iconVariant={compact ? "green" : "white"} className="justify-center" />
      </div>
    </>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          "z-[2001] p-0 overflow-hidden [&>button]:hidden",
          isMobile
            ? "!left-0 !top-0 !right-0 !bottom-0 !translate-x-0 !translate-y-0 w-full h-full max-w-none rounded-none border-0 overflow-y-auto"
            : "w-[min(880px,calc(100vw-48px))] min-h-[560px] max-h-[90vh] rounded-2xl"
        )}
        style={{
          background: isMobile ? "#0A0A0F" : "#161420",
          border: isMobile ? "none" : "1px solid rgba(255,255,255,0.15)",
        }}
      >
        <div
          className={cn(
            "absolute z-10",
            isMobile ? "top-4 left-4" : "top-4 right-4"
          )}
        >
          <DialogClose asChild>
            <button
              type="button"
              className={cn(
                "rounded-full p-2 transition-colors outline-none focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0",
                isMobile
                  ? "text-white hover:bg-white/10"
                  : "bg-white/20 text-white hover:bg-white/30"
              )}
              aria-label="Close"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          </DialogClose>
        </div>

        {isMobile ? (
          <div className="flex flex-col h-[100dvh] min-h-[100dvh] overflow-y-auto">
            <div className="relative flex-1 min-h-[40vh] shrink-0 bg-[#1a1525]">
              {characterImage ? (
                <img
                  src={characterImage}
                  alt=""
                  className="w-full h-full object-cover object-top"
                  onError={() => setImageError(true)}
                />
              ) : null}
              <div className="absolute bottom-4 left-4 right-4 z-10">
                <h2 className="text-white font-bold text-2xl leading-tight">
                  {title}
                </h2>
              </div>
            </div>
            <div className="relative shrink-0 -mt-6">
              <div
                className="pointer-events-none absolute -top-12 left-0 right-0 h-12"
                style={{
                  background:
                    "linear-gradient(to bottom, transparent 0%, #0A0A0F 85%)",
                }}
              />
              <div
                className="flex flex-col gap-3 p-5 pt-8"
                style={{ background: "#0A0A0F" }}
              >
<p className="text-[#A4ACB9] text-base">
                {subtitle}
              </p>
              <ul className="flex flex-col gap-4">
                {features.map((text, i) => (
                  <li key={i} className="flex items-start gap-3">
<span
                      className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white overflow-hidden"
                      style={{
                        background: "linear-gradient(96.61deg, #DD429D 0%, #B14BF4 50%, #485CFB 100%)",
                        backgroundSize: "cover",
                      }}
                    >
                      <svg className="h-3 w-3 shrink-0 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12l5 5L20 7" />
                      </svg>
                    </span>
                    <span className="text-[#A4ACB9] text-sm">{text}</span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-col items-center gap-4 pt-0 my-4">
                <button
                  type="button"
                  className="whitespace-nowrap rounded-full h-11 px-14 text-sm bg-gradient-to-r from-[#B83DD4] via-[#7C3AED] to-[#4F46E5] text-white font-semibold border-0 hover:opacity-90 flex items-center justify-center gap-2 cursor-pointer transition-opacity"
                  onClick={handleUpgrade}
                >
                  {getButtonText(true)}
                  <DiamondFillIcon className="w-5 h-5" />
                </button>
                <SafePrivacy size="mini" className="justify-center" />
              </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-row min-h-[560px]">
            <div
              className="flex flex-col gap-9 px-8 py-4 flex-1 justify-center min-w-0"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(135deg, #1A1525 0%, #1E1A2E 50%, #161420 100%)",
                backgroundSize: "20px 20px, 20px 20px, 100% 100%",
                backgroundPosition: "0 0, 0 0, 0 0",
              }}
            >
              {contentBlock(false)}
            </div>
            <div className="w-[380px] min-h-[560px] flex-shrink-0 overflow-hidden rounded-r-2xl relative bg-[#1a1525]">
              {characterImage ? (
                <img
                  src={characterImage}
                  alt=""
                  className="w-full h-full object-cover"
                  style={{ objectPosition: "center 75%" }}
                  onError={() => setImageError(true)}
                />
              ) : null}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
