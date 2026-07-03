//这个footer和全局那个footer不一样
import React from "react";
import { FooterWeb as GlobalFooterWeb } from "@/pages/home/components/footer/footer.web";
import { useMobile } from "@/hooks/use-mobile-detector";
import { FooterMobile } from "../../../home/components/footer/footer.mobile";

export const Footer = () => {
  const isMobile = useMobile();
  return isMobile ? <FooterMobile /> : <GlobalFooterWeb />;
};
