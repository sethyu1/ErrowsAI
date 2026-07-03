import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "../components/button.js";
import { Toaster, toast, ThemeProvider } from "../components/toaster.js";

const meta: Meta = {
  title: "Components/Toast",
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <div className="min-h-screen bg-[#0E0F17] p-8">
          <Story />
          <Toaster />
        </div>
      </ThemeProvider>
    ),
  ],
  parameters: {
    layout: "fullscreen",
    backgrounds: {
      default: "dark",
      values: [
        { name: "dark", value: "#0E0F17" },
      ],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Button onClick={() => toast.message("这是一个普通消息")}>
        普通消息
      </Button>
      <p className="text-sm text-gray-500">点击按钮查看普通消息提示</p>
    </div>
  ),
};

export const Success: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Button onClick={() => toast.success("操作成功！")}>
        成功提示
      </Button>
      <p className="text-sm text-gray-500">点击按钮查看成功提示</p>
    </div>
  ),
};

export const Error: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Button
        variant="destructive"
        onClick={() => toast.error("操作失败，请重试")}
      >
        错误提示
      </Button>
      <p className="text-sm text-gray-500">点击按钮查看错误提示</p>
    </div>
  ),
};

export const Warning: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Button onClick={() => toast.warning("这是一个警告信息")}>
        警告提示
      </Button>
      <p className="text-sm text-gray-500">点击按钮查看警告提示</p>
    </div>
  ),
};

export const Info: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Button onClick={() => toast.info("这是一条提示信息")}>
        信息提示
      </Button>
      <p className="text-sm text-gray-500">点击按钮查看信息提示</p>
    </div>
  ),
};

export const Loading: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Button onClick={() => toast.loading("正在加载中...")}>
        加载提示
      </Button>
      <p className="text-sm text-gray-500">点击按钮查看加载提示</p>
    </div>
  ),
};

export const WithDescription: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Button
        onClick={() =>
          toast.success("文件上传成功", {
            description: "你的文件已经成功上传到服务器",
          })
        }
      >
        带描述的提示
      </Button>
      <p className="text-sm text-gray-500">提示可以包含描述文本</p>
    </div>
  ),
};

export const WithAction: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Button
        onClick={() =>
          toast.message("文件已删除", {
            description: "你可以在回收站中恢复",
            action: {
              label: "撤销",
              onClick: () => console.log("撤销删除"),
            },
          })
        }
      >
        带操作按钮
      </Button>
      <p className="text-sm text-gray-500">提示可以包含操作按钮</p>
    </div>
  ),
};

export const WithCancel: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Button
        onClick={() =>
          toast.message("确认删除？", {
            description: "此操作无法撤销",
            action: {
              label: "确认",
              onClick: () => console.log("已确认"),
            },
            cancel: {
              label: "取消",
              onClick: () => console.log("已取消"),
            },
          })
        }
      >
        带取消按钮
      </Button>
      <p className="text-sm text-gray-500">提示可以包含取消按钮</p>
    </div>
  ),
};

export const CustomDuration: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button
        onClick={() =>
          toast.success("1秒后关闭", {
            duration: 1000,
          })
        }
      >
        1秒
      </Button>
      <Button
        onClick={() =>
          toast.success("3秒后关闭", {
            duration: 3000,
          })
        }
      >
        3秒
      </Button>
      <Button
        onClick={() =>
          toast.success("10秒后关闭", {
            duration: 10000,
          })
        }
      >
        10秒
      </Button>
      <Button
        onClick={() =>
          toast.success("不会自动关闭", {
            duration: Infinity,
          })
        }
      >
        不关闭
      </Button>
    </div>
  ),
};

export const PromiseToast: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Button
        onClick={() => {
          const promise = new Promise((resolve, reject) => {
            setTimeout(() => {
              Math.random() > 0.5 ? resolve("成功") : reject("失败");
            }, 2000);
          });

          toast.promise(promise, {
            loading: "正在处理...",
            success: "处理完成！",
            error: "处理失败！",
          });
        }}
      >
        Promise 提示
      </Button>
      <p className="text-sm text-gray-500">
        自动处理 loading → success/error 状态
      </p>
    </div>
  ),
};

export const CustomContent: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Button
        onClick={() =>
          toast.custom((id: string | number) => (
            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg shadow-lg">
              <div className="text-2xl">🎉</div>
              <div>
                <div className="font-bold">自定义提示</div>
                <div className="text-sm opacity-90">完全自定义的内容</div>
              </div>
            </div>
          ))
        }
      >
        自定义内容
      </Button>
      <p className="text-sm text-gray-500">可以渲染完全自定义的内容</p>
    </div>
  ),
};

export const AllTypes: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Button onClick={() => toast.message("普通消息")}>普通</Button>
      <Button onClick={() => toast.success("操作成功")}>成功</Button>
      <Button
        variant="destructive"
        onClick={() => toast.error("操作失败")}
      >
        错误
      </Button>
      <Button onClick={() => toast.warning("警告信息")}>警告</Button>
      <Button onClick={() => toast.info("提示信息")}>信息</Button>
      <Button onClick={() => toast.loading("加载中...")}>加载</Button>
    </div>
  ),
};

export const MultipleToasts: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Button
        onClick={() => {
          toast.success("第一个消息");
          setTimeout(() => toast.info("第二个消息"), 200);
          setTimeout(() => toast.warning("第三个消息"), 400);
        }}
      >
        显示多个提示
      </Button>
      <p className="text-sm text-gray-500">可以同时显示多个提示</p>
    </div>
  ),
};

export const DismissToast: Story = {
  render: () => {
    let toastId: string | number;
    return (
      <div className="flex gap-3">
        <Button
          onClick={() => {
            toastId = toast.loading("这个提示不会自动关闭", {
              duration: Infinity,
            });
          }}
        >
          显示提示
        </Button>
        <Button variant="outline" onClick={() => toast.dismiss(toastId)}>
          关闭提示
        </Button>
      </div>
    );
  },
};

export const StyleShowcase: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">
          Errows 设计风格展示
        </h3>
        <p className="text-sm text-gray-400 mb-4">
          Toast 组件已适配 Errows 设计系统，采用了暗色主题、模糊背景、柔和圆角和彩色边框
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button
          onClick={() =>
            toast.success("数据保存成功", {
              description: "所有更改已自动同步到云端",
            })
          }
        >
          成功样式
        </Button>

        <Button
          variant="destructive"
          onClick={() =>
            toast.error("网络连接失败", {
              description: "请检查您的网络设置后重试",
            })
          }
        >
          错误样式
        </Button>

        <Button
          onClick={() =>
            toast.warning("存储空间不足", {
              description: "建议清理一些不必要的文件",
            })
          }
        >
          警告样式
        </Button>

        <Button
          onClick={() =>
            toast.info("系统更新可用", {
              description: "发现新版本，建议尽快更新",
            })
          }
        >
          信息样式
        </Button>

        <Button
          onClick={() =>
            toast.message("新消息通知", {
              description: "您有 3 条未读消息",
              action: {
                label: "查看",
                onClick: () => console.log("查看消息"),
              },
            })
          }
        >
          带操作按钮
        </Button>

        <Button
          onClick={() => {
            const promise = new Promise((resolve) => {
              setTimeout(() => resolve("完成"), 2000);
            });

            toast.promise(promise, {
              loading: "正在上传文件...",
              success: "上传成功！",
              error: "上传失败",
              description: "文件已保存到您的账户",
            });
          }}
        >
          Promise 状态
        </Button>
      </div>

      <div className="mt-6 p-4 bg-white/5 rounded-lg border border-white/10">
        <h4 className="text-sm font-medium text-white mb-2">样式特性：</h4>
        <ul className="text-sm text-gray-400 space-y-1 list-disc list-inside">
          <li>半透明暗色背景 (rgba(34, 35, 42, 0.95))</li>
          <li>模糊效果 (backdrop-filter: blur(12px))</li>
          <li>柔和圆角 (12px)</li>
          <li>根据类型显示不同颜色的图标（成功=绿色、错误=红色、警告=橙色、信息=蓝色）</li>
          <li>优雅的阴影和悬停效果</li>
          <li>自适应主题切换</li>
        </ul>
      </div>
    </div>
  ),
};

