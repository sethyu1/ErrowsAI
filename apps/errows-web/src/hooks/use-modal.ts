import React from "react";

export interface UseModalReturn<T = unknown> {
  visible: boolean;
  data?: T;
  open: (data?: T) => void;
  close: () => void;
}

export const useModal = <T = unknown>(): UseModalReturn<T> => {
  const [visible, setVisible] = React.useState(false);
  const [data, setData] = React.useState<T | undefined>();

  const open = (data?: T) => {
    setVisible(true);
    setData(data);
  };

  const close = () => {
    setVisible(false);
    setData(undefined);
  };

  return {
    visible,
    data,
    open,
    close,
  };
};
