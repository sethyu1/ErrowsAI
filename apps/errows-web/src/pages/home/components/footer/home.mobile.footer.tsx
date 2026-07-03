import React from "react";
import { useTranslation } from "react-i18next";
import { reactive } from "@/components/reactive";
import { FooterWeb } from "./footer.web";
import { FooterMobile } from "./footer.mobile";
//这个是移动端首页的footer
export const Footer = () => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center pb-6 max-sm:pb-6 md:pb-[109px]">
      <div
        className="text-center"
        style={{
          fontFamily: "Urbanist",
          fontWeight: 400,
          fontSize: "11px",
          lineHeight: "21.08px",
          background: "linear-gradient(270deg, #AB3EB6 0%, #9145DF 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        {t("footer.legalInformation")}
      </div>
      <div
        className="text-center"
        style={{
          fontFamily: "Urbanist",
          fontWeight: 400,
          fontSize: "8px",
          color: "#FFFFFF99",
          lineHeight: "21.08px",
        }}
      >
        {t("footer.ownedBy")} {t("footer.companyAddress")}
      </div>
    </div>
  );
};

export default reactive({
  web: <FooterWeb />,
  mobile: <FooterMobile />,
});
