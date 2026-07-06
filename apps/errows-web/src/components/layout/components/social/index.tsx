import React from "react";
import {
  FacebookIcon,
  CamIcon,
  DiscordFillIcon,
  TwitterIcon,
} from "@errows/icons";
import { useNavigate } from "react-router";

interface SocialProps {
  className?: string;
  style?: React.CSSProperties;
}

export const Social: React.FC<SocialProps> = (props) => {
  const { className, style } = props;
  const navigate = useNavigate();
  return (
    <>
      <FacebookIcon
        onClick={() =>
          window.open(
            "https://www.facebook.com/YOUR_PAGE",
            "_blank"
          )
        }
        className={`size-5 text-[rgba(215,218,218,1)] ${className}`}
        style={style}
      />
      <CamIcon
        onClick={() => navigate("/upcoming")}
        className={`size-5 text-[rgba(215,218,218,1)] ${className}`}
        style={style}
      />
      <DiscordFillIcon
        onClick={() => window.open("https://discord.gg/YOUR_INVITE", "_blank")}
        className={`size-5 text-[rgba(215,218,218,1)] ${className}`}
        style={style}
      />
      <TwitterIcon
        onClick={() => window.open("https://x.com/YOUR_HANDLE", "_blank")}
        className={`size-5 text-[rgba(215,218,218,1)] ${className}`}
        style={style}
      />
    </>
  );
};
