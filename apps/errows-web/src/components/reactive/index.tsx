import React from "react";
import { useMobile } from "@/hooks/use-mobile-detector";
interface ReactiveProps {
  web: React.ReactNode;
  mobile: React.ReactNode;
}

export const reactive = (props: ReactiveProps) => {
  return () => {
    const { web, mobile } = props;
    const isMobile = useMobile();
    return isMobile ? mobile : web;
  };
};
