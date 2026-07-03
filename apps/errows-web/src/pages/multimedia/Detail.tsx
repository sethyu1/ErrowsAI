import { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams } from "react-router";
import { useMobile } from "@/hooks/use-mobile-detector";
import { useMobileStyle } from "@/hooks/use-mobile-style";
import { MultimediaWrapper } from "./wrapper";
import { useCharacterDetail } from "@/hooks/use-character-detail";
import RoleImageList from "./components/role-image-list";
import RoleVideoList from "./components/role-video-list";
import {
  MultimediaTab,
  BatchHeader,
  MobileBatchHeader,
  BatchSort,
  BatchCheckBox,
} from "./components";
import { ArrowLeftIcon } from "@errows/icons";

function MultimediaDetail({ padding }: { padding?: number }) {
  const isMobile = useMobile();
  const { roleId } = useParams<{ roleId: string }>();
  const [searchParams] = useSearchParams();
  const type = searchParams.get("tab") || searchParams.get("type"); // 兼容旧参数
  const [activeTab, setActiveTab] = useState<string>(type || "image");
  const [order, setOrder] = useState<string>("desc");
  const mobileCardWidth = Math.min(179, Math.floor((window.innerWidth - 32) / 2));
  const mobileStyle = useMobileStyle({
    cardWidth: mobileCardWidth,
    isMobile,
  });
  const { roleInfo } = useCharacterDetail(roleId ?? "");
  const [selectionModeEnabled, setSelectionModeEnabled] = useState(false);
  type RoleBatchSettings = API.Character.CHARACTER & {
    multimedia_settings?: {
      enable_batch_generate?: boolean;
    };
  };
  const batchParam = searchParams.get("batch");
  const roleBatchSettings = (roleInfo as RoleBatchSettings | undefined)
    ?.multimedia_settings;
  const allowBatchActions =
    batchParam === "false"
      ? false
      : roleBatchSettings?.enable_batch_generate ?? true;
  const isImageTab = activeTab === "image";
  const showBatchControls = isImageTab && allowBatchActions;

  const handleToggleSelectionMode = useCallback(
    (checked: boolean) => {
      if (!allowBatchActions) return;
      setSelectionModeEnabled(!!checked);
    },
    [allowBatchActions]
  );

  useEffect(() => {
    setActiveTab(type || "image");
  }, [type]);

  useEffect(() => {
    if (!showBatchControls && selectionModeEnabled) {
      setSelectionModeEnabled(false);
    }
  }, [showBatchControls, selectionModeEnabled]);


  return (
    <div>
      <div>
        {isMobile ? (
          <MobileBatchHeader
            roleInfo={roleInfo}
            onBack={() => {
              history.back();
            }}
            generateSelected={false}
          />
        ) : (
          <>
            <div
              className="w-[22px] h-[22px] absolute top-[20px]  flex items-center justify-center cursor-pointer mr-8"
              onClick={() => history.back()}
              style={{
                left: padding && padding > 56 ? padding - 56 : 56,
              }}
            >
              <ArrowLeftIcon className="w-full h-full text-white" />
            </div>
            <BatchHeader
              checked={selectionModeEnabled}
              roleInfo={roleInfo}
              generateSelected={false}
              onBack={() => {
                history.back();
              }}
              onSortChange={setOrder}
              onToggleSelectionMode={
                showBatchControls ? handleToggleSelectionMode : undefined
              }
            />
          </>
        )}
        <MultimediaTab
          isMobile={isMobile}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
        {isMobile && (
          <div className="flex items-center justify-between mt-3.5 mb-3.5">
            <BatchSort isMobile={true} onSortChange={setOrder} />
            {showBatchControls && (
              <BatchCheckBox
                checked={selectionModeEnabled}
                onChange={handleToggleSelectionMode}
              />
            )}
          </div>
        )}
      </div>

      <div className="overflow-y-auto scrollbar-hide"
        style={isMobile ? {...mobileStyle, paddingBottom: 100}: {
          maxHeight: `calc(100vh - 256px)`
        }}
      >
        {isImageTab ? (
          <RoleImageList
            order={order}
            roleId={roleId!}
            isMobile={isMobile}
            allowBatchActions={allowBatchActions}
            selectionModeEnabled={selectionModeEnabled}
            showGeneratingStatus
            showDeleteEntry
          />
        ) : (
          <RoleVideoList roleId={roleId!} isMobile={isMobile} order={order} showDeleteEntry />
        )}
      </div>
    </div>
  );
}

export default function MultimediaDetailPage() {
  return (
    <MultimediaWrapper className="mt-0">
      <MultimediaDetail />
    </MultimediaWrapper>
  );
}
