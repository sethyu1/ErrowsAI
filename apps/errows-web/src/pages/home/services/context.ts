import React from "react";

export type Tags = [string, string[]][];

export interface HomeServicesContextValue {
  tags: Tags;
  open: () => void;
}

export const HomeServicesContext = React.createContext<HomeServicesContextValue>(
  {} as HomeServicesContextValue
);

