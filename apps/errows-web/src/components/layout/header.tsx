import React, { useEffect, useState } from "react";
import Logo from "@/assets/logo.png";
import { Link, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import goldImg from "@/assets/images/gold.webp";
import { useLocation } from "react-router";
import { useMemberStore } from "@/stores/member";
import { Button } from "@errows/design/components/button";
import { ArrowRightIcon, AvatarIcon } from "@errows/icons";
import {
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@errows/design/components/dropdown-menu";
import {
  LoginIcon,
  LogoutIcon,
  SignUpIcon,
  BookmarkIcon,
  ImageFilledProIcon,
  MailIcon,
  MenuIcon,
} from "@errows/icons";
import { Badge } from "@errows/design/components/badge";
import { useGlobalServer } from "@/hooks/use-global-server";
import { useShallow } from "zustand/react/shallow";
import { useAuthStore } from "@/stores/auth";
import { useGlobalStore } from "@/stores/global";
import { SystemConfig, LocaleConfig } from "@/config/config";
import { useIsMobile } from "@/hooks/use-mobile";
import { Avatar } from "../avatar";
import type { MemberType } from "@/types";
import { MemberTag } from "./components";
import { useBeamer } from "@/hooks/use-beamer";
import { useAutoHide } from "@/hooks/use-auto-hide";

interface HeaderProps {
  className?: string;
  style?: React.CSSProperties;
  onOpenMobileSidebar?: (open: boolean) => void;
}

export const Header: React.FC<HeaderProps> = (props) => {
  const { className, style, onOpenMobileSidebar } = props;
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { token, user } = useAuthStore(
    useShallow((state) => ({
      token: state.token,
      user: state.user,
    }))
  );
  const { setOpenAuth, setOpenLocale, setOpenChoosePlan, setOpenLogout } =
    useGlobalServer();
  const location = useLocation();
  const isOpcityHeader = React.useMemo(() => {
    return location.pathname === "/" || location.pathname === "/about-us";
  }, [location.pathname]);
  const [scrollOpacity, setScrollOpacity] = useState(0);
  const { info: memberInfo } = useMemberStore(
    useShallow((state) => ({
      info: state.info,
    }))
  );
  const memberPlan = (memberInfo?.plan || "free") as MemberType;
  const { locale } = useGlobalStore(
    useShallow((state) => ({
      locale: state.locale,
    }))
  );
  const currentLocale = LocaleConfig.find((item) => item.value === locale);

  // 获取Beamer打开面板方法
  const { openBeamer } = useBeamer({
    userId: user?.id,
    userEmail: user?.email,
    customUserId: user?.id,
    autoInit: Boolean(token && user?.id),
  });

  // Auto-hide on mobile scroll
  const { isVisible } = useAutoHide({
    enabled: isMobile && location.pathname === "/",
    scrollThreshold: 50,
    showDelay: 3000,
    scrollContainerId: "home-scroll-container",
  });

  useEffect(() => {
    if (!isOpcityHeader) {
      setScrollOpacity(0);
      return;
    }

    const scrollContainer = document.getElementById("home-scroll-container");
    if (!scrollContainer) return;

    const handleScroll = () => {
      const scrollY = scrollContainer.scrollTop;
      // 在 0-200px 之间，从完全透明到完全不透明
      const opacity = Math.min(scrollY / 300, 1);
      setScrollOpacity(opacity);
    };

    scrollContainer.addEventListener("scroll", handleScroll);
    return () => scrollContainer.removeEventListener("scroll", handleScroll);
  }, [isOpcityHeader, isMobile]);

  const onClickLogin = () => {
    setOpenAuth(true, "login");
  };

  const onClickSingIn = () => {
    setOpenAuth(true, "signup");
  };

  const onClickLocale = () => {
    setOpenLocale(true);
  };

  const onClickChoosePlan = () => {
    setOpenChoosePlan(true);
  };

  const onClickLogout = () => {
    setOpenLogout(true);
  };

  const goAccountPage = () => {
    navigate("/account");
  };

  const toGallery = () => {
    navigate("/multimedia?tab=image");
  };

  const handleMessageClick = () => {
    openBeamer();
  };

  const isLogin = Boolean(token);

  return (
    <div
      className={`${className} flex w-full items-center justify-between h-20 opacity-99 max-sm:h-15 px-4 sm:px-0 ${
        isOpcityHeader ? "" : "bg-[#0E0F17] border-b border-[#2C2C38]"
      }`}
      style={{
        ...style,
        ...(isOpcityHeader && {
          backgroundColor: `rgba(14, 15, 23, ${scrollOpacity})`,
          // borderBottom: scrollOpacity === 2 ? `1px solid rgba(22, 22, 22, ${scrollOpacity})` : 'none',
        }),
        transform:
          isMobile && location.pathname === "/"
            ? `translateY(${isVisible ? "0" : "-100%"})`
            : undefined,
        transition: "transform 0.3s ease-in-out",
      }}
    >
      <div className="flex items-center">
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            className="ml-0 sm:ml-[22px]"
            onClick={() => onOpenMobileSidebar?.(true)}
          >
            <MenuIcon className="size-5 text-white" />
          </Button>
        )}
        {/* 顶部菜单按钮 */}

        <Link to="/">
          <div
            className="w-[100px] h-8 ml-2 sm:w-[130px] sm:ml-[124px]"
            style={{
              backgroundImage: `url(${Logo})`,
              backgroundSize: "contain",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
              transition: "all 0.2s ease-in-out",
            }}
          />
        </Link>
      </div>

      <div className="flex items-center gap-2  sm:gap-3 mr-3 sm:mr-11">
        {/* 66% Off 按钮 - 移动端隐藏 */}
        {/* TODO暂时隐藏 */}
        {/* <div className="max-sm:hidden flex items-center gap-2 px-4 h-9 rounded-full bg-[#2A2B35] cursor-pointer hover:bg-[#35363F] transition-colors">
          <span className="text-[20px]">
            <CrownIcon />
          </span>
          <span className="text-white font-semibold text-[14px]">66% Off</span>
        </div> */}

        {/* Earn coins 按钮 - 移动端只显示图标 暂时隐藏*/}
        {/* {isLogin && (
          <div className="flex items-center gap-2 max-sm:px-3 px-4 h-9 rounded-full bg-[#2A2B35] cursor-pointer hover:bg-[#35363F] transition-colors">
            <span className="text-[20px]">
              <img className="size-5" src={goldImg} alt="gold" />
            </span>
            <span className="max-sm:hidden text-white font-semibold text-[14px]">
              Earn coins
            </span>
          </div>
        )} */}
        {isLogin && (
          <div
            className="beamerTrigger flex items-center justify-center gap-2 size-10 rounded-full bg-[#2A2B35] cursor-pointer hover:bg-[#35363F] transition-colors"
            onClick={handleMessageClick}
            tabIndex={0}
          >
            <MailIcon className="size-5" />
            {/* <span className="text-[20px]">
              <MailIcon className="size-5" />
            </span> */}
            {/* {
              <span className="text-white font-semibold text-[14px]">
                {t("common.message")}
              </span>
            } */}
          </div>
        )}

        {!isLogin && (
          <DropdownMenu enableSwipeToClose={isMobile}>
            <DropdownMenuTrigger asChild>
              {!isMobile ? (
                <Button
                  appearance="gradientFill"
                  className="cursor-pointer"
                  shape="round"
                >
                  <span className="text-white font-bold text-[14px]">
                    {t(`auth.startFreeTrial`)}
                  </span>
                  <ArrowRightIcon className="size-4 text-white" />
                </Button>
              ) : (
                <div className="flex relative items-center justify-center size-9 cursor-pointer bg-[#090A0A] rounded-full">
                  <AvatarIcon className="size-3 text-[#F8FAFB]" />
                  <div className="absolute top-0 right-0 size-2 bg-[#D743A7] rounded-full"></div>
                </div>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-[calc(100vw-32px)] max-w-[320px] sm:w-80 p-0 rounded-2xl bg-[rgba(30,26,39,0.82)] backdrop-blur-sm"
              align="end"
              sideOffset={12}
            >
              <DropdownMenuGroup>
                {/* 登录 */}
                <DropdownMenuItem
                  className="px-4 py-4.5 focus:bg-transparent cursor-pointer"
                  onClick={onClickLogin}
                >
                  <div className="flex flex-1 gap-5">
                    <div className="size-5 flex items-center justify-center">
                      <LoginIcon className="size-4 text-white" />
                    </div>
                    <div>{t(`auth.login`)}</div>
                  </div>
                  <Badge>
                    {t(`auth.newModels`, { count: SystemConfig.newModels })}
                  </Badge>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-0" />

                {/* 注册 */}
                <DropdownMenuItem
                  className="px-4 py-4.5 focus:bg-transparent cursor-pointer"
                  onClick={onClickSingIn}
                >
                  <div className="flex flex-1 gap-5">
                    <div className="size-5 flex items-center justify-center">
                      <SignUpIcon className="size-4 text-white" />
                    </div>
                    <div>{t(`auth.signUp`)}</div>
                  </div>
                  <Badge>
                    {t(`auth.freeCoins`, { count: SystemConfig.freeCoins })}
                  </Badge>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-0" />

                {/* 会员订阅 */}
                <DropdownMenuItem
                  className="px-4 py-4.5 focus:bg-transparent cursor-pointer"
                  onClick={onClickChoosePlan}
                >
                  <div className="flex flex-1 gap-5">
                    <div className="size-5 flex items-center justify-center">
                      <BookmarkIcon className="size-4 text-white" />
                    </div>
                    <span className="text-[#F4C04D]">
                      {t(`auth.subscription`)}
                    </span>
                  </div>
                  <Badge className="bg-[#F4C04D] text-black">
                    {SystemConfig.subscription * 100}%
                  </Badge>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-0" />

                {/* 切换语言 */}
                {currentLocale && (
                  <DropdownMenuItem
                    className="px-4 py-4.5 focus:bg-transparent cursor-pointer"
                    onClick={onClickLocale}
                  >
                    <div className="flex flex-1 gap-5">
                      <div className="size-5 flex items-center justify-center">
                        {currentLocale.icon}
                      </div>
                      <span>{currentLocale.label}</span>
                    </div>
                  </DropdownMenuItem>
                )}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {isLogin && (
          <DropdownMenu enableSwipeToClose={true}>
            <DropdownMenuTrigger asChild>
              <Avatar
                src={user?.profile?.avatar}
                fallback={user?.name?.[0] || "E"}
                member={memberPlan}
              />
            </DropdownMenuTrigger>

            <DropdownMenuContent
              className="w-[calc(100vw-32px)] max-w-[320px] sm:w-80 p-0 rounded-2xl bg-[rgba(30,26,39,0.82)] backdrop-blur-sm"
              align="end"
              sideOffset={12}
            >
              <DropdownMenuGroup>
                <DropdownMenuItem
                  className="pl-2 pr-4 py-4.5 focus:bg-transparent cursor-pointer"
                  onClick={goAccountPage}
                >
                  <div className="flex w-full gap-3">
                    <div className="flex items-center">
                      <Avatar
                        src={user?.profile?.avatar}
                        animate={false}
                        fallback={user?.name?.[0] || "A"}
                        member={memberPlan}
                      />
                    </div>
                    <div className="flex flex-1 w-full items-center">
                      <div className="flex flex-col flex-1 text-base font-bold">
                        <span>{user?.name}</span>
                        <MemberTag className="mt-1.5" member={memberPlan} />
                      </div>

                      <div className="flex justify-center items-center">
                        <div>
                          <Badge className="font-bold">{t("common.set")}</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-0" />

                {/* Gallery */}
                <DropdownMenuItem
                  className="px-4 py-4.5 focus:bg-transparent cursor-pointer"
                  onClick={toGallery}
                >
                  <div className="flex flex-1 gap-5">
                    <div className="size-5 flex items-center justify-center">
                      <ImageFilledProIcon className="size-4 text-white" />
                    </div>
                    <span>{t("common.gallery")}</span>
                  </div>
                  <Badge className="font-bold">{t("common.get")}</Badge>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-0" />

                {/* 切换语言 */}
                {currentLocale && (
                  <DropdownMenuItem
                    className="px-4 py-4.5 focus:bg-transparent cursor-pointer"
                    onClick={onClickLocale}
                  >
                    <div className="flex flex-1 gap-5">
                      <div className="size-5 flex items-center justify-center">
                        {currentLocale.icon}
                      </div>
                      <span>{currentLocale.label}</span>
                    </div>
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator className="my-0" />

                {/* 退出登录 */}
                <DropdownMenuItem
                  className="px-4 py-4.5 focus:bg-transparent cursor-pointer"
                  onClick={onClickLogout}
                >
                  <div className="flex flex-1 gap-5">
                    <div className="size-5 flex items-center justify-center">
                      <LogoutIcon className="size-4 text-white" />
                    </div>
                    <span>{t("auth.logout")}</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
};
