import React, { useEffect, useState } from "react";
import { fetchLegalTermsApi } from "@/apis/legals";

interface DescriptionServicesContextValue {
  legalTerms: API.Legal.LEGAL_TERM[];
}
const DescriptionServicesContext =
  React.createContext<DescriptionServicesContextValue>(
    {} as DescriptionServicesContextValue
  );

export const DescriptionServicesProvider: React.FC<React.PropsWithChildren> = (
  props
) => {
  const { children } = props;
  const [legalTerms, setLegalTerms] = useState<API.Legal.LEGAL_TERM[]>([]);
  useEffect(() => {
    fetchLegalTermsApi().then((res) => {
      setLegalTerms(res);
    });
  }, []);
  return (
    <DescriptionServicesContext.Provider value={{ legalTerms }}>
      {children}
    </DescriptionServicesContext.Provider>
  );
};

export const useDescriptionServices = () => {
  return React.useContext(DescriptionServicesContext);
};