import React from "react";
import { useNavigate } from "react-router";
import { Button } from "@errows/design";
import { BackIcon, CloseIcon } from "@errows/icons";
import { cn } from "@errows/design/lib/utils";

interface NavBarProps {
  title?: React.ReactNode;
  extra?: React.ReactNode;
  closeable?: boolean;
  onBack?: () => void;
}

export function NavBar(props: NavBarProps) {
  const { title, extra, closeable=false, onBack } = props;

  const navigate = useNavigate();

  const handleBack = (e) => {
    e.stopPropagation();
    if (typeof onBack === "function") {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <div
      className={cn(
        "h-18 flex items-center px-4 gap-4 right-0 z-1001",
        "bg-[#0E0F17] border-b border-[#2C2C38]",
        !closeable && 'fixed top-0 left-0 right-0'
      )}
    >
      <Button variant="ghost" size="icon" onClick={handleBack}>
        { closeable ?  <CloseIcon className="w-5 h-5 text-white" /> : <BackIcon className="w-5 h-5 text-white" />}
      </Button>
      <span
        className="text-2xl font-bold text-[#FCFCFC]"
        style={{ fontFamily: "Urbanist" }}
      >
        {title}
      </span>
      {extra && (
        <div className="absolute right-4 h-full flex items-center">{extra}</div>
      )}
    </div>
  );
}
