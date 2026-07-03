import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  Dialog,
  DialogContent,
  DialogClose,
} from "@errows/design/components/dialog";
import { CloseIcon, DiamondFillIcon } from "@errows/icons";
import { useMobile } from "@/hooks/use-mobile-detector";
import { cn } from "@errows/design/lib/utils";
import { fetchCharacterDiscoverListApi } from "@/apis";

const FALLBACK_IMAGE =
  "https://butter1.s3.us-east-1.amazonaws.com/banner.webp";

function Countdown({
  endsAt,
  compact = false,
}: {
  endsAt: Date;
  compact?: boolean;
}) {
  const [remaining, setRemaining] = useState({ h: 12, m: 24, s: 45 });
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const diff = Math.max(0, endsAt.getTime() - now.getTime());
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining({ h, m, s });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAt]);
  const boxCls =
    "rounded-lg bg-[#2a2438] px-4 py-2.5 min-w-[56px] border border-[#A756F7] shadow-[0_0_0_1px_rgba(167,86,247,0.4)]";
  const numCls = compact
    ? "text-xl font-bold tabular-nums text-white"
    : "text-2xl font-bold tabular-nums text-white";
  const unitCls = "text-white/70 text-xs font-medium";
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5">
        <div className={boxCls}>
          <span className={numCls}>{String(remaining.h).padStart(2, "0")}</span>
        </div>
        <span className={unitCls}>hr</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className={boxCls}>
          <span className={numCls}>{String(remaining.m).padStart(2, "0")}</span>
        </div>
        <span className={unitCls}>min</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className={boxCls}>
          <span className={numCls}>{String(remaining.s).padStart(2, "0")}</span>
        </div>
        <span className={unitCls}>sec</span>
      </div>
    </div>
  );
}

interface ChristmasSaleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChristmasSaleModal({ open, onOpenChange }: ChristmasSaleModalProps) {
  const navigate = useNavigate();
  const isMobile = useMobile();
  const endsAt = new Date(Date.now() + 12 * 3600000 + 24 * 60000 + 45 * 1000);
  const [characterImage, setCharacterImage] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setCharacterImage(null);
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchCharacterDiscoverListApi({
          size: 50,
          sort: "popular",
        });
        const list = res.data?.filter((c) => c?.avatar_url) ?? [];
        if (cancelled) return;
        if (list.length === 0) {
          setCharacterImage(FALLBACK_IMAGE);
          return;
        }
        const idx = Math.floor(Math.random() * list.length);
        setCharacterImage(list[idx].avatar_url);
      } catch {
        if (!cancelled) setCharacterImage(FALLBACK_IMAGE);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const handleSubscribe = () => {
    onOpenChange(false);
    navigate("/choose-plan");
  };

  const saleBadge = (compact: boolean) => (
    <div
      className={cn(
        "rounded-full bg-gradient-to-r from-[#D743A7] to-[#D743A7] px-4 inline-block w-fit",
        compact ? "py-2.5" : "py-1.5"
      )}
    >
      <span className="text-white font-bold text-sm">Up To 75% Off</span>
    </div>
  );
  const titleCls = (compact: boolean) =>
    cn(
      "font-bold bg-clip-text text-transparent",
      compact
        ? "bg-gradient-to-r from-[#E879F9] via-[#A855F7] to-[#8B5CF6]"
        : "bg-gradient-to-r from-[#C026D3] via-[#7C3AED] to-[#5B21B6]"
    );
  const descCls = "text-[#A4ACB9]";
  const btnCls =
    "w-fit rounded-full bg-gradient-to-r from-[#B83DD4] via-[#7C3AED] to-[#4F46E5] text-white font-semibold border-0 hover:opacity-90 flex items-center justify-center gap-2 cursor-pointer transition-opacity whitespace-nowrap";

  const contentBlock = (isCompact: boolean) => (
    <>
      {!isCompact && saleBadge(isCompact)}
      <h2
        className={cn(
          titleCls(isCompact),
          isCompact ? "text-2xl" : "text-3xl md:text-4xl"
        )}
        style={{ lineHeight: 1.25 }}
      >
        Christmas Sale For New Users
      </h2>
      <p className={cn(descCls, isCompact ? "text-base" : "text-base md:text-lg")}>
        Discount is running away
        <br />
        Don&apos;t miss out !
      </p>
      <div className="flex flex-col gap-6">
        <span className="inline-block w-fit rounded-full bg-white text-black px-3.5 py-1 text-xs font-medium">
          ends in
        </span>
        <div className="flex justify-center">
          <Countdown endsAt={endsAt} compact={isCompact} />
        </div>
      </div>
      <div className="flex justify-center mt-4">
        <button
          type="button"
          className={cn(btnCls, isCompact ? "h-11 px-22 text-sm" : "h-12 px-28 text-base")}
          onClick={handleSubscribe}
        >
          Subscribe Now
          <DiamondFillIcon className="w-5 h-5" />
        </button>
      </div>
    </>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            <div className="relative flex-1 min-h-[48vh] shrink-0 bg-[#1a1525]">
              {characterImage && (
                <img
                  src={characterImage}
                  alt=""
                  className="w-full h-full object-cover object-top"
                  onError={() => setCharacterImage(FALLBACK_IMAGE)}
                />
              )}
              </div>
            <div className="relative shrink-0">
              <div className="absolute -top-9 left-4 z-10">
                {saleBadge(true)}
              </div>
              <div
                className="pointer-events-none absolute -top-12 left-0 right-0 h-12"
                style={{
                  background:
                    "linear-gradient(to bottom, transparent 0%, #0A0A0F 85%)",
                }}
              />
              <div
                className="flex flex-col gap-4 p-6"
                style={{
                  background: "#0A0A0F",
                }}
              >
                {contentBlock(true)}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-row min-h-[560px]">
            <div
              className="flex flex-col gap-6 p-10 flex-1 justify-center min-w-0"
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
              {characterImage && (
                <img
                  src={characterImage}
                  alt=""
                  className="w-full h-full object-cover"
                  style={{ objectPosition: "center 75%" }}
                  onError={() => setCharacterImage(FALLBACK_IMAGE)}
                />
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
