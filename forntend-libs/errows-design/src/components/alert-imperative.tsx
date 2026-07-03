"use client";

import * as React from "react";
import { createRoot } from "react-dom/client";
import { AlertDialog } from "./alert.js";
import type { AlertType } from "./alert.js";

interface ImperativeAlertDialogOptions {
  /** 标题 */
  title: string;
  /** 内容 */
  content: string | React.ReactNode;
  /** 类型 */
  type?: AlertType;
  /** 确认按钮文本 */
  confirmText?: string;
  /** 取消按钮文本 */
  cancelText?: string;
  /** 是否显示取消按钮 */
  showCancel?: boolean;
  /** 确认回调 */
  onConfirm?: () => void | Promise<void>;
  /** 取消回调 */
  onCancel?: () => void;
}

interface AlertDialogInstance {
  destroy: () => void;
}

/**
 * 函数式调用 AlertDialog
 */
function showAlertDialog(
  options: ImperativeAlertDialogOptions
): AlertDialogInstance {
  const div = document.createElement("div");
  document.body.appendChild(div);
  const root = createRoot(div);

  let isDestroyed = false;

  const destroy = () => {
    if (isDestroyed) return;
    isDestroyed = true;

    // 等待动画完成后再销毁
    setTimeout(() => {
      root.unmount();
      if (div.parentNode) {
        div.parentNode.removeChild(div);
      }
    }, 200);
  };

  const handleConfirm = async () => {
    try {
      await options.onConfirm?.();
    } finally {
      destroy();
    }
  };

  const handleCancel = () => {
    options.onCancel?.();
    destroy();
  };

  const render = (open: boolean) => {
    if (isDestroyed) return;

    root.render(
      <AlertDialog
        open={open}
        onOpenChange={(newOpen: boolean) => {
          if (!newOpen) {
            destroy();
          }
        }}
        title={options.title}
        content={options.content}
        type={options.type}
        confirmText={options.confirmText}
        cancelText={options.cancelText}
        showCancel={options.showCancel}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    );
  };

  // 先渲染关闭状态，然后立即打开，以触发动画
  render(false);
  setTimeout(() => render(true), 0);

  return {
    destroy,
  };
}

/**
 * AlertDialog 的函数式 API
 */
export const alertDialog = {
  /**
   * 显示确认对话框
   */
  confirm: (
    options: Omit<ImperativeAlertDialogOptions, "type" | "showCancel">
  ) => {
    return showAlertDialog({
      ...options,
      type: "warning",
      showCancel: true,
    });
  },

  /**
   * 显示信息对话框
   */
  info: (
    options: Omit<ImperativeAlertDialogOptions, "type" | "showCancel">
  ) => {
    return showAlertDialog({
      ...options,
      type: "info",
      showCancel: false,
    });
  },

  /**
   * 显示错误对话框
   */
  error: (
    options: Omit<ImperativeAlertDialogOptions, "type" | "showCancel">
  ) => {
    return showAlertDialog({
      ...options,
      type: "error",
      showCancel: false,
    });
  },

  /**
   * 显示警告对话框
   */
  warning: (
    options: Omit<ImperativeAlertDialogOptions, "type" | "showCancel">
  ) => {
    return showAlertDialog({
      ...options,
      type: "warning",
      showCancel: false,
    });
  },

  /**
   * 自定义对话框
   */
  show: showAlertDialog,
};

export type { ImperativeAlertDialogOptions, AlertDialogInstance };
