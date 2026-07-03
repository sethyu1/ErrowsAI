import React, { useState, useCallback, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSupportDialog } from "@/stores/support";
import { useAuthStore } from "@/stores/auth";
import { useGlobalStore } from "@/stores/global";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import { submitSupportRequest } from "@/apis/support";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogClose,
    Button,
    Input,
    Textarea,
} from "@errows/design";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
} from "@errows/design/components/drawer";
import { BackIcon } from "@errows/icons";
import { cn } from "@errows/design/lib/utils";

const EMAIL_REGEX = /^[^\s@]*@[^\s@]*\.[^\s@]*$/;

interface SupportFormData {
    email: string;
    subject: string;
    detail: string;
}

export const Support: React.FC = () => {
    const { open, closeDialog } = useSupportDialog();
    const { t } = useTranslation();
    const isMobile = useIsMobile();
    const user = useAuthStore((state) => state.user);
    const token = useAuthStore((state) => state.token);
    const setOpenAuth = useGlobalStore((state) => state.setOpenAuth);
    const isLogin = Boolean(token);

    const [formData, setFormData] = useState<SupportFormData>({
        email: "",
        subject: "",
        detail: "",
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Pre-fill email when dialog opens
    useEffect(() => {
        if (open && user?.email) {
            setFormData((prev) => ({ ...prev, email: user.email ?? "" }));
        }
    }, [open, user?.email]);

    // 验证邮箱格式
    const validateEmail = (email: string): boolean => {
        return EMAIL_REGEX.test(email);
    };

    // 防抖提交
    const handleSubmit = useCallback(() => {
        if (isSubmitting) return;

        if (!isLogin) {
            setOpenAuth(true, "login");
            toast.error(t("support.loginRequired"));
            return;
        }

        // 清除之前的防抖计时器
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(async () => {
            // 验证表单
            const validateFormData = (): boolean => {
                if (!formData.email.trim()) {
                    toast.error(t("support.requiredFields"));
                    return false;
                }

                if (!validateEmail(formData.email)) {
                    toast.error(t("support.invalidEmail"));
                    return false;
                }

                if (!formData.subject.trim()) {
                    toast.error(t("support.requiredFields"));
                    return false;
                }

                if (!formData.detail.trim()) {
                    toast.error(t("support.requiredFields"));
                    return false;
                }

                return true;
            };

            if (!validateFormData()) {
                setIsSubmitting(false);
                return;
            }

            setIsSubmitting(true);

            try {
                // 调用提交 API
                await submitSupportRequest({
                    email: formData.email,
                    type: formData.subject,
                    description: formData.detail,
                });

                // Notify user of success (toast) then close after a short delay so the toast is visible
                toast.success(t("support.submitSuccess"));

                setFormData({
                    email: user?.email ?? "",
                    subject: "",
                    detail: "",
                });

                // 关闭对话框/抽屉
                closeDialog();
            } catch (error) {
                toast.error(t("common.failed"));
                console.error("Support submission error:", error);
            } finally {
                setIsSubmitting(false);
            }
        }, 500); // 500ms 防抖延迟
    }, [formData, t, closeDialog, isSubmitting, user?.email, isLogin, setOpenAuth]);

    // 处理输入变化
    const handleInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
            const { name, value } = e.target;
            setFormData((prev) => ({
                ...prev,
                [name]: value,
            }));
        },
        []
    );

    // 处理关闭
    const handleClose = useCallback(() => {
        setFormData({
            email: user?.email ?? "",
            subject: "",
            detail: "",
        });
        setIsSubmitting(false);
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }
        closeDialog();
    }, [closeDialog, user?.email]);

    // 渲染表单字段（不包括按钮）
    const renderFormFields = () => (
        <div className="flex flex-col gap-6">
            <div>
                <p className="text-gray-400 text-sm">
                    {t("support.description")}
                    <br />
                    {t("support.faqLink")} {t("support.faqDesc")}
                </p>
            </div>

            <div className="flex flex-col gap-4 pt-4 border-t border-gray-700">
                <h3 className="text-lg font-semibold">{t("support.contactUs")}</h3>

                {/* Email (read-only, not editable) */}
                <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-1 font-medium">
                        {t("support.email")}
                        <span className="text-red-500">*</span>
                    </label>
                    <div
                        className="min-h-10 w-full rounded-lg border border-gray-600 bg-gray-800/50 px-3 py-2 text-gray-200 select-none pointer-events-none"
                        aria-readonly="true"
                    >
                        {formData.email || t("support.emailPlaceholder")}
                    </div>
                </div>

                {/* Subject Input */}
                <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-1 font-medium">
                        {t("support.subject")}
                        <span className="text-red-500">*</span>
                    </label>
                    <Input
                        type="text"
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        placeholder={t("support.subjectPlaceholder")}
                    />
                </div>

                {/* Detail Textarea */}
                <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-1 font-medium">
                        {t("support.detail")}
                        <span className="text-red-500">*</span>
                    </label>
                    <Textarea
                        name="detail"
                        value={formData.detail}
                        onChange={handleInputChange}
                        placeholder={t("support.detailPlaceholder")}
                        rows={6}
                    />
                </div>
            </div>
        </div>
    );

    // 渲染按钮
    const renderButtons = () => (
        <div className="flex justify-center gap-[18px]">
            <Button
                shape="round"
                className="w-[126px]"
                style={{ background: "#22232A", color: "#ffffff" }}
                onClick={handleClose}
                disabled={isSubmitting}
            >
                {t('common.close')}
            </Button>
            <Button
                appearance="gradientFill"
                className="w-[126px]"
                shape="round"
                onClick={handleSubmit}
                disabled={isSubmitting}
            >
                {isSubmitting ? t("support.sending") : t('common.submit')}
            </Button>
        </div>
    );

    // 在 Web 端，内容和按钮在一起
    const renderContent = () => (
        <>
            {renderFormFields()}
            <div className="pt-6">
                {renderButtons()}
            </div>
        </>
    );

    if (isMobile) {
        return (
            <>
                <Drawer
                    open={open}
                    direction="right"
                    handleOnly
                    onOpenChange={(isOpen) => {
                        if (!isOpen) {
                            handleClose();
                        }
                    }}
                >
                    <DrawerContent className="z-999 data-[vaul-drawer-direction=right]:w-screen bg-[#101018] flex flex-col h-screen">
                        <DrawerHeader className="hidden">
                            <DrawerTitle />
                            <DrawerDescription />
                        </DrawerHeader>
                        <div className={cn('w-full h-full flex flex-col', isMobile ? 'pb-30' : '')}>
                            {/* Header */}
                            <div className="flex items-center h-[72px] px-6 gap-4 border-b border-[#2C2C38]">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="w-6 h-6"
                                    onClick={handleClose}
                                >
                                    <BackIcon className="w-4 h-4" />
                                </Button>
                                <span className="text-white text-[18px] font-bold text-[#FCFCFC]">
                                    {t("support.title")}
                                </span>
                            </div>

                            {/* Scrollable Content */}
                            <div className="flex-1 px-6 py-4 overflow-y-auto custom-scrollbar">
                                {renderFormFields()}
                            </div>
                            <div className="px-6 py-4 bg-[#101018]">
                                {renderButtons()}
                            </div>
                            {/* Sticky Gradient & Buttons */}
                            {/* <div
                                className="sticky bottom-0 min-h-[75px] left-0 right-0 w-full h-[75px] pointer-events-none -mt-[75px]"
                                style={{
                                    background:
                                        "linear-gradient(180deg, rgba(16, 16, 24, 0) 0%, #101018 88.46%)",
                                }}
                            /> */}
                        </div>
                    </DrawerContent>
                </Drawer>
            </>
        );
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent
                className={cn(
                    "w-[680px] max-w-none max-h-[90vh] overflow-y-auto scrollbar-hide",
                    "border border-gray-800/50 rounded-2xl p-6 "
                )}>
                <DialogHeader>
                    <DialogTitle>{t("support.title")}</DialogTitle>
                    <DialogClose onClick={handleClose} />
                </DialogHeader>
                {renderContent()}
            </DialogContent>
        </Dialog>
    );
};
