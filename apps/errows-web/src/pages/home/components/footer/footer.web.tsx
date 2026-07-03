import React from "react";
import { useTranslation } from "react-i18next";

import Logo from "@/assets/logo.png";
import {
  VisaIcon,
  UnitIcon,
  DoubleIcon,
  RoundIcon,
} from "@errows/icons";
import { Social } from "@/components/layout/components/social";
import {
  platform,
  resource,
  handleResourceClick,
  handlePlatformClick,
} from "@/pages/home/components/footer/config";
import { useNavigate } from "react-router";
import { useSupportDialog } from "@/stores/support";

export const FooterWeb = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { openDialog: openSupportDialog } = useSupportDialog();
  return (
    <div className="flex w-full h-[457px] bg-[#090A0A] shrink-0 justify-between">
      <div className="flex flex-col w-[494px] mt-[70px] pl-[96px]">
        <img src={Logo} alt="logo" className="w-[200px] h-[44px]" />
        <div
          className="text-[14px] text-[#FFFFFF] mt-[30px]"
          style={{
            fontFamily: "Urbanist",
            fontWeight: 400,
            fontStyle: "normal",
            fontSize: "14px",
            lineHeight: "24px",
          }}
        >
          {t("footer.description")}
        </div>
        <div
          className="mt-3"
          style={{
            fontFamily: "Urbanist",
            fontWeight: 500,
            fontStyle: "Medium",
            fontSize: "16px",
            textAlign: "justify",
            lineHeight: "34px",
          }}
        >
          {t("footer.ownedBy")}
        </div>
        <div
          style={{
            fontFamily: "Urbanist",
            fontWeight: 400,
            fontStyle: "Regular",
            fontSize: "14px",
            color: "#A4ACB9",
            lineHeight: "24px",
          }}
        >
          {t("footer.companyAddress")}
        </div>
        <div
          className="mt-3"
          style={{
            fontFamily: "Urbanist",
            fontWeight: 500,
            fontStyle: "Medium",
            fontSize: "16px",
            textAlign: "justify",
            height: "34px",
            lineHeight: "34px",
          }}
        >
          {t("footer.sitemap")}
        </div>
        <div
          style={{
            fontFamily: "Urbanist",
            fontWeight: 400,
            fontStyle: "Regular",
            fontSize: "14px",
            color: "#4A4E58",
            marginTop: 30,
            height: 28,
            lineHeight: "28px",
          }}
        >
          {t("footer.copyright")}
        </div>
      </div>
      <div className="flex flex-col  pt-[94px]">
        <div
          className="text-base font-bold leading-[22px]"
          style={{ fontFamily: "Urbanist" }}
        >
          {t("footer.followUs")}
        </div>
        <div className="flex gap-[21px] mt-[30px] mb-[20px]">
          <Social className="size-6 text-[#C1C7D0]" />
        </div>
        <div className="flex gap-[6px] items-center">
          <UnitIcon className="w-[25px] h-[16px] " />
          <VisaIcon className="w-[25px] h-[8px] " />
          <DoubleIcon className="w-[25px] h-[16px] " />
          <RoundIcon className="w-[22px] h-[19px] " />
        </div>
      </div>

      <div className="flex flex-col gap-5 pt-[94px]">
        <div
          className="text-base font-bold leading-[22px]"
          style={{ fontFamily: "Urbanist" }}
        >
          {t("footer.platform")}
        </div>
        {platform.map((item) => (
          <div
            key={item.key}
            style={{
              fontFamily: "Urbanist",
              fontWeight: 400,
              fontStyle: "Regular",
              fontSize: "14px",
              color: "#A4ACB9",
              cursor: "pointer",
            }}
            onClick={() => handlePlatformClick(item.key, navigate)}
          >
            {t(item.nameKey)}
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-5  pt-[94px] pr-[93px]">
        <div
          className="text-base font-bold leading-[22px]"
          style={{ fontFamily: "Urbanist" }}
        >
          {t("footer.resources")}
        </div>
        {resource.map((item) => (
          <div
            key={item.key}
            style={{
              fontFamily: "Urbanist",
              fontWeight: 400,
              fontStyle: "Regular",
              fontSize: "14px",
              color: "#A4ACB9",
              cursor: "pointer",
            }}
            onClick={() =>
              handleResourceClick(item.key, navigate, openSupportDialog)
            }
          >
            {t(item.nameKey)}
          </div>
        ))}
      </div>
    </div>
  );
};
