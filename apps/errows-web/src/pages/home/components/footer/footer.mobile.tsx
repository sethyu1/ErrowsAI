import React from "react";
import { useTranslation } from "react-i18next";
import Logo from "@/assets/logo.png";
import {
  VisaIcon,
  UnitIcon,
  DoubleIcon,
  RoundIcon,
} from "@errows/icons";
import { platform, resource, handleResourceClick, handlePlatformClick } from "@/pages/home/components/footer/config";
import { Social } from "@/components/layout/components/social";
import { useNavigate } from "react-router";
import { useSupportDialog } from "@/stores/support";

export const FooterMobile = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { openDialog: openSupportDialog } = useSupportDialog();
  return (
    <div className="flex flex-col px-3 pt-11 pb-3">
      <img src={Logo} alt="logo" className="w-[181px] h-[44px]" />
      <div
        className="mt-5"
        style={{
          fontFamily: "Urbanist",
          fontWeight: 400,
          fontStyle: "normal",
          fontSize: "14px",
          lineHeight: "22px",
          color: "#FFFFFF",
        }}
      >
        {t("footer.description")}
      </div>
      <div
        className="mt-6"
        style={{
          fontFamily: "Urbanist",
          fontWeight: 500,
          fontStyle: "medium",
          fontSize: "16px",
          lineHeight: "24px",
          color: "#FFFFFF",
        }}
      >
        {t("footer.ownedBy")}
      </div>
      <div
        className="mt-[10px]"
        style={{
          fontFamily: "Urbanist",
          fontWeight: 400,
          fontStyle: "normal",
          fontSize: "14px",
          lineHeight: "22px",
          color: "#A4ACB9",
        }}
      >
        {t("footer.companyAddress")}
      </div>
      <div
        className="mt-3"
        style={{
          fontFamily: "Urbanist",
          fontWeight: 500,
          fontStyle: "medium",
          fontSize: "16px",
          lineHeight: "24px",
          color: "#FFFFFF",
        }}
      >
        {t("footer.sitemap")}
      </div>
      <div
        className="mt-6"
        style={{
          fontFamily: "Urbanist",
          fontWeight: 700,
          fontStyle: "medium",
          fontSize: "24px",
          lineHeight: "22px",
          color: "#FCFCFC",
        }}
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

      <div className="flex gap-5 mt-8">
        <div className="flex flex-col gap-5 w-[50%]">
          <div
            className="text-base font-bold leading-[22px]"
            style={{ fontFamily: "Urbanist" }}
          >
            {t("footer.platform")}
          </div>
          {platform.map((item) => (
            <div
              key={item.key}
              onClick={() => handlePlatformClick(item.key, navigate)}
              style={{
                fontFamily: "Urbanist",
                fontWeight: 400,
                fontStyle: "Regular",
                fontSize: "14px",
                color: "#A4ACB9",
              }}
            >
              {t(item.nameKey)}
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-5 w-[50%]">
          <div
            className="text-base font-bold leading-[22px]"
            style={{ fontFamily: "Urbanist" }}
          >
            {t("footer.resources")}
          </div>
          {resource.map((item) => (
            <div
              key={item.key}
              onClick={() =>
                handleResourceClick(item.key, navigate, openSupportDialog)
              }
              style={{
                fontFamily: "Urbanist",
                fontWeight: 400,
                fontStyle: "Regular",
                fontSize: "14px",
                color: "#A4ACB9",
              }}
            >
              {t(item.nameKey)}
            </div>
          ))}
        </div>
      </div>

      <div
        className="mt-[50px]"
        style={{
          fontFamily: "Urbanist",
          fontWeight: 400,
          fontStyle: "normal",
          fontSize: "14px",
          lineHeight: "18px",
          color: "#4A4E58",
          textAlign: "center",
        }}
      >
        {t("footer.copyright")}
      </div>
      <div
        className="mt-[10px]"
        style={{
          fontFamily: "Urbanist",
          fontWeight: 400,
          fontStyle: "normal",
          fontSize: "12px",
          lineHeight: "18px",
          color: "#A4ACB9",
          textAlign: "center",
        }}
      >
        {t("footer.compliance")}
      </div>
    </div>
  );
};
