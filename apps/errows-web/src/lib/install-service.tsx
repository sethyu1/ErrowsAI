import React from "react";

export const install = (
  Component: React.ComponentType<any>,
  Providers: React.ComponentType<any>[]
) => {
  return (props: any) => {
    return Providers.reduceRight(
      (children, Provider) => <Provider>{children}</Provider>,
      <Component {...props} />
    );
  };
};
