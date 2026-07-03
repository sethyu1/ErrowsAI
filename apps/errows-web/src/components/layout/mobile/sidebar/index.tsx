import {
  Drawer,
  DrawerContent,
  DrawerClose,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@errows/design/components/drawer";
import { Separator } from "@errows/design/components/separator";
import {
  CloseIcon,
  MagicIcon
} from "@errows/icons";
import { useGlobalServer } from "@/hooks/use-global-server";
import { cn } from "@errows/design/lib/utils";
import { MenuItem } from "./menu-item";
import { ActiveItem } from "./active-item";
import { Button } from "./button";
import { items, actions } from "../../sidebar-config";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Social } from "../../components/social";
import { useAuthStore } from "@/stores/auth";
import { useShallow } from "zustand/react/shallow";
import { useGlobalStore } from '@/stores/global';
import { usePWAInstall } from "@/hooks/use-pwa-install";
import { useSupportDialog } from "@/stores/support";

interface MobileSidebarProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function MobileSidebar(props: MobileSidebarProps) {
  const { t } = useTranslation();
  const { open = false, onOpenChange } = props;
  const navigate = useNavigate();
  const { setOpenChoosePlan, setOpenGetCoins } = useGlobalServer();
  const { token } = useAuthStore(
    useShallow((state) => ({
      token: state.token
    }))
  );
  const setOpenAuth = useGlobalStore.getState().setOpenAuth;
  const isLogin = Boolean(token);
  const { isInstallable, installPWA } = usePWAInstall();
  const { openDialog: openSupportDialog } = useSupportDialog();
  const handleItemClick = (item: (typeof items)[0]) => {
    if (!isLogin) {
      setOpenAuth(true, 'login');
      return;
    }
    if (item?.path === '/choose-plan') {
      setOpenChoosePlan(true);
      onOpenChange?.(false);
      return;
    }

    if (item?.path === '/coins') {
      setOpenGetCoins(true);
      onOpenChange?.(false);
      return;
    }

    if (item?.path) {
      navigate(item.path);
      onOpenChange?.(false);
    }
  };

  const handleActionClick = async (item: (typeof actions)[0]) => {
    switch (item.key) {
      case "support":
        openSupportDialog();
        onOpenChange?.(false);
        break;
      case "about-us":
        navigate("/about-us");
        onOpenChange?.(false);
        break;
      case "install-app":
        if (!isInstallable) {
          toast.error("PWA is not available or already installed");
          return;
        }
        const result = await installPWA();
        if (result.success) {
          toast.success("App installed successfully!");
        } else {
          toast.error(result.message);
        }
        break;
      case "become-affiliate":
        toast.success(t("common.comingSoon"));
        break;
    }
  };

  return (
    <Drawer direction="left" open={open} onOpenChange={onOpenChange}>
      <DrawerContent
        className={cn(
          "z-1000 data-[vaul-drawer-direction=left]:w-screen",
          "bg-[#101018]"
        )}
      >
        <DrawerHeader className="hidden">
          <DrawerTitle />
          <DrawerDescription />
        </DrawerHeader>

        <div className="w-full h-full overflow-auto pt-22.5 px-3">
          <DrawerClose>
            <div className="absolute flex items-center justify-center size-6 top-6 left-5">
              <CloseIcon className="size-4" />
            </div>
          </DrawerClose>

          {items.map((item) => {
            return (
              <MenuItem
                key={item.titleKey}
                title={t(item.titleKey)}
                icon={item.icon}
                onClick={() => handleItemClick(item)}
              />
            );
          })}
          <MenuItem
            title={t("sidebar.generate")}
            icon={MagicIcon}
          />
          <div className="flex gap-2">
            <Button
              onClick={() => {
                navigate("/character");
                onOpenChange?.(false);
              }}
            >
              {t("sidebar.character")}
            </Button>
            <Button
              onClick={() => {
                navigate("/generate/image");
                onOpenChange?.(false);
              }}
            >
              {t("sidebar.image")}
            </Button>
            <Button
              onClick={() => {
                navigate("/generate/video");
                onOpenChange?.(false);
              }}
            >
              {t("sidebar.video")}
            </Button>
          </div>

          <Separator className="my-8" />

          <div className="py-5 px-5.5">
            <div className="flex flex-col gap-6">
              {actions.map((item) => {
                return (
                  <ActiveItem
                    key={item.key}
                    title={t(item.titleKey)}
                    icon={item.icon}
                    onClick={() => handleActionClick(item)}
                  />
                );
              })}
            </div>

            <div className="mt-11 flex gap-12.5">
              <Social className="size-6 text-[rgba(215,218,218,1)]" />
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
