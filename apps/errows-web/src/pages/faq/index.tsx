import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import QA from "./components/qa";
import { Footer } from "../about-us/components/footer";
import { faqData } from "./faq-data";
import legalConfig from "@/pages/description/config";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@errows/design";
import { useNavigate, useLocation } from "react-router";
import {
  DescriptionServicesProvider,
  useDescriptionServices,
} from "@/pages/description/services";
import { install } from "@/lib/install-service";

const FAQ: React.FC = () => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedIndex, setExpandedIndex] = React.useState<number | null>(null);
  const { legalTerms } = useDescriptionServices();
  const containerRef = React.useRef<HTMLDivElement>(null);
  useEffect(() => {
    // 处理锚点滚动
    if (location.hash) {
      const id = location.hash.substring(1); // 移除 # 符号
      const element = document.getElementById(id);
      if (element && containerRef.current) {
        // 使用 setTimeout 确保 DOM 已完全渲染
        setTimeout(() => {
          const elementTop = element.offsetTop;
          containerRef.current?.scrollTo({
            top: elementTop - 100, // 减去顶部偏移，避免被 header 遮挡
            behavior: "smooth",
          });
        }, 100);
      }
    }
  }, [location.hash]);

  return (
    <div
      ref={containerRef}
      className="flex flex-col gap-0 max-sm:gap-3 h-screen w-full overflow-auto pt-[80px] max-sm:pt-[80px] pb-5 max-sm:px-3 items-center "
    >
      <div
        className="w-full h-[240px] max-sm:h-[180px] flex flex-col shrink-0 items-center pt-[50px] px-[210px] max-sm:px-3"
        style={{
          backgroundImage: "url(/QA-BG.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="font-urbanist font-bold text-[40px] max-sm:text-[24px] text-center">
          {t("faq.pageTitle")}
        </div>
        {!isMobile && (
          <div className="font-urbanist font-medium text-[22px] text-center mt-4 text-[#A4ACB9]">
            {t("faq.pageDescription")}
          </div>
        )}
      </div>
      <div className="max-w-4xl mx-auto mt-11 mb-[73px]">
        <div className="space-y-4">
          {faqData.map((faq, index) => (
            <QA
              key={index}
              title={faq.title}
              description={faq.description}
              isExpanded={expandedIndex === index}
              onToggle={() =>
                setExpandedIndex(expandedIndex === index ? null : index)
              }
            />
          ))}
        </div>
      </div>
      {/* Legal Information */}
      <div
        id="legal-information"
        className="w-full mt-11 max-sm:mt-3 mb-[73px] max-sm:mb-3 flex flex-col items-center px-[200px] max-sm:px-3"
      >
        <h2 className="font-urbanist font-bold text-[32px] max-sm:text-[24px] text-white mb-6">
          {t("faq.legalInformation")}
        </h2>
        <div className="flex flex-wrap gap-5">
          {legalTerms?.map(({ name }, idx) => (
            <Button
              key={idx}
              variant="outline"
              className="rounded-full w-[220px] max-sm:w-[170px]"
              onClick={() => {
                navigate(`/description/${name}`);
              }}
            >
              {name}
            </Button>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default install(FAQ, [DescriptionServicesProvider]);
