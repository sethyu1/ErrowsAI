import { useTranslation } from "react-i18next";
import { NavBar } from "@/components/nav-bar";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
} from "@errows/design/components/drawer";

export interface GeneratingViewProps {
    /** 是否打开 */
    open?: boolean;
    /** 是否是PC端 */
    isPc?: boolean;
    /** 打开状态变化回调 */
    onOpenChange?: (open: boolean) => void;
    children?: React.ReactNode;
}

export function GeneratingView({
    open = false,
    isPc = false,
    children,
    onOpenChange,
}: GeneratingViewProps) {
    const { t } = useTranslation();
    return isPc ? children :
        <Drawer open={open} onOpenChange={close} direction="right" handleOnly>
        <DrawerContent className="data-[vaul-drawer-direction=right]:w-screen h-screen z-1000">
            <DrawerHeader className="hidden">
                <DrawerTitle />
                <DrawerDescription />
            </DrawerHeader>
            <div className="w-full h-full overflow-y-auto flex flex-col">
                <div className="flex flex-col gap-4 pb-8 flex-1 min-h-0 flex">
                    <NavBar
                        title={t('generate.generator')}
                        closeable
                        onBack={() => onOpenChange?.(false)}
                    />
                    <div className="flex-1 flex flex-col justify-center min-h-0 overflow-y-auto">
                        {children}
                    </div>
                </div>
            </div>
        </DrawerContent>
    </Drawer>
}

export default GeneratingView;
