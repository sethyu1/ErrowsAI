import React from "react";
import { HomeServicesContext } from "./context";

export const useHomeServices = () => {
  return React.useContext(HomeServicesContext);
};

