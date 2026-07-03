import { cn } from "@errows/design/lib/utils";
import React from "react";
import config from "./config";
import { useParams } from "react-router";
import {
  DescriptionServicesProvider,
  useDescriptionServices,
} from "./services";
import { install } from "@/lib/install-service";

const Description: React.FC = () => {
  const { id } = useParams();
  const { legalTerms } = useDescriptionServices();
  const term = legalTerms?.find((term) => term?.name === id);
  // const { title, description } = config[id as keyof typeof config];
  return (
    <div
      className={cn(
        "flex flex-col gap-0 max-sm:gap-3 h-screen w-full overflow-auto pt-[110px] max-sm:pt-[90px] pb-5 max-sm:px-3 items-center"
      )}
    >
      <div className="w-[513px] max-sm:w-full font-bold text-sm max-sm:text-[22px] text-[#FCFCFC] leading-[22px]">
        {term?.name}
      </div>
      <div className="w-[513px] max-sm:w-full font-normal text-xs max-sm:text-[14px] text-[#A4ACB9] leading-[22px] tracking-normal text-justify whitespace-pre-line">
        {/* {description} */}
        <div dangerouslySetInnerHTML={{ __html: term?.content || "" }}></div>
      </div>
    </div>
  );
};

export default install(Description, [DescriptionServicesProvider]);
