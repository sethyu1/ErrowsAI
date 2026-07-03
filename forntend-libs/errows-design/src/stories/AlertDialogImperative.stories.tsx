import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "../components/button";
import { alertDialog } from "../components/alert-imperative";

const meta = {
  title: "Components/AlertDialog/Imperative",
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Confirm: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Button
        onClick={() => {
          alertDialog.confirm({
            title: "删除确认",
            content: "你确定要删除这个项目吗？此操作无法撤销。",
            confirmText: "删除",
            cancelText: "取消",
            onConfirm: () => {
              console.log("用户点击了确认");
            },
            onCancel: () => {
              console.log("用户点击了取消");
            },
          });
        }}
      >
        显示确认对话框
      </Button>
      <p className="text-sm text-gray-500">
        点击按钮查看确认对话框（带取消按钮）
      </p>
    </div>
  ),
};

export const Info: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Button
        onClick={() => {
          alertDialog.info({
            title: "操作成功",
            content: "你的更改已经保存成功！",
            confirmText: "知道了",
            onConfirm: () => {
              console.log("用户点击了确认");
            },
          });
        }}
      >
        显示信息对话框
      </Button>
      <p className="text-sm text-gray-500">
        点击按钮查看信息对话框（无取消按钮）
      </p>
    </div>
  ),
};

export const Error: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Button
        variant="destructive"
        onClick={() => {
          alertDialog.error({
            title: "操作失败",
            content: "发生了一个错误，请稍后重试。",
            confirmText: "我知道了",
            onConfirm: () => {
              console.log("用户点击了确认");
            },
          });
        }}
      >
        显示错误对话框
      </Button>
      <p className="text-sm text-gray-500">
        点击按钮查看错误对话框
      </p>
    </div>
  ),
};

export const Warning: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Button
        onClick={() => {
          alertDialog.warning({
            title: "警告",
            content: "这个操作可能会影响其他用户，请谨慎操作。",
            confirmText: "知道了",
            onConfirm: () => {
              console.log("用户点击了确认");
            },
          });
        }}
      >
        显示警告对话框
      </Button>
      <p className="text-sm text-gray-500">
        点击按钮查看警告对话框
      </p>
    </div>
  ),
};

export const AsyncConfirm: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Button
        onClick={() => {
          alertDialog.confirm({
            title: "删除用户",
            content: "确定要删除这个用户吗？",
            confirmText: "删除",
            cancelText: "取消",
            onConfirm: async () => {
              console.log("开始删除...");
              // 模拟异步操作
              await new Promise((resolve) => setTimeout(resolve, 1000));
              console.log("删除完成");
            },
          });
        }}
      >
        异步确认对话框
      </Button>
      <p className="text-sm text-gray-500">
        支持异步的 onConfirm 回调
      </p>
    </div>
  ),
};

export const CustomContent: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Button
        onClick={() => {
          alertDialog.confirm({
            title: "自定义内容",
            content: (
              <div className="space-y-2">
                <p>这是一个自定义的内容区域。</p>
                <ul className="list-disc list-inside text-sm">
                  <li>支持 React 节点</li>
                  <li>可以包含任意内容</li>
                  <li>样式完全可控</li>
                </ul>
              </div>
            ),
            confirmText: "确认",
            cancelText: "取消",
          });
        }}
      >
        自定义内容对话框
      </Button>
      <p className="text-sm text-gray-500">
        content 参数支持 React 节点
      </p>
    </div>
  ),
};

export const AllTypes: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button
        onClick={() => {
          alertDialog.confirm({
            title: "确认对话框",
            content: "这是一个确认对话框",
            confirmText: "确认",
            cancelText: "取消",
          });
        }}
      >
        Confirm
      </Button>
      <Button
        onClick={() => {
          alertDialog.info({
            title: "信息对话框",
            content: "这是一个信息对话框",
            confirmText: "知道了",
          });
        }}
      >
        Info
      </Button>
      <Button
        variant="destructive"
        onClick={() => {
          alertDialog.error({
            title: "错误对话框",
            content: "这是一个错误对话框",
            confirmText: "知道了",
          });
        }}
      >
        Error
      </Button>
      <Button
        onClick={() => {
          alertDialog.warning({
            title: "警告对话框",
            content: "这是一个警告对话框",
            confirmText: "知道了",
          });
        }}
      >
        Warning
      </Button>
    </div>
  ),
};

