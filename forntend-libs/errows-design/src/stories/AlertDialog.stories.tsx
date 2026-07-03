import type { Meta, StoryObj } from '@storybook/react';
import { AlertDialog } from '../components/alert.js';
import { Button } from '../components/button.js';
import { storyStyles } from './story-styles.js';
import { useState } from 'react';

const meta: Meta<typeof AlertDialog> = {
  title: 'Components/AlertDialog',
  component: AlertDialog,
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof AlertDialog>;

// 主展示页面 - 展示所有类型
export const Overview: Story = {
  render: () => {
    const [infoOpen, setInfoOpen] = useState(false);
    const [errorOpen, setErrorOpen] = useState(false);
    const [warningOpen, setWarningOpen] = useState(false);
    const [withCancelOpen, setWithCancelOpen] = useState(false);

    return (
      <div style={storyStyles.container}>
        <h1 style={storyStyles.h1}>AlertDialog Component</h1>

        {/* Types Section */}
        <section style={storyStyles.section}>
          <h2 style={storyStyles.h2}>Alert Types</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
            <Button onClick={() => setInfoOpen(true)}>Info Alert</Button>
            <Button onClick={() => setErrorOpen(true)} variant="destructive">
              Error Alert
            </Button>
            <Button onClick={() => setWarningOpen(true)} variant="secondary">
              Warning Alert
            </Button>
          </div>

          <AlertDialog
            open={infoOpen}
            onOpenChange={setInfoOpen}
            type="info"
            title="信息提示"
            content="这是一条信息提示消息，用于告知用户一些重要信息。"
            onConfirm={() => console.log('Info confirmed')}
          />

          <AlertDialog
            open={errorOpen}
            onOpenChange={setErrorOpen}
            type="error"
            title="错误提示"
            content="操作失败！请检查您的输入并重试。"
            confirmText="我知道了"
            onConfirm={() => console.log('Error confirmed')}
          />

          <AlertDialog
            open={warningOpen}
            onOpenChange={setWarningOpen}
            type="warning"
            title="警告提示"
            content="此操作存在风险，建议您仔细确认后再继续。"
            onConfirm={() => console.log('Warning confirmed')}
          />
        </section>

        {/* With Cancel Button */}
        <section style={storyStyles.section}>
          <h2 style={storyStyles.h2}>With Cancel Button</h2>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Button onClick={() => setWithCancelOpen(true)}>
              Delete Item
            </Button>
          </div>

          <AlertDialog
            open={withCancelOpen}
            onOpenChange={setWithCancelOpen}
            type="error"
            title="确认删除"
            content="删除后将无法恢复，确定要继续吗？"
            showCancel={true}
            confirmText="删除"
            cancelText="取消"
            onConfirm={() => console.log('Delete confirmed')}
            onCancel={() => console.log('Delete cancelled')}
          />
        </section>

        {/* Trigger Mode Section */}
        <section style={storyStyles.section}>
          <h2 style={storyStyles.h2}>Trigger 模式（包裹触发器）</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
            <AlertDialog
              type="info"
              title="信息提示"
              content="您点击了按钮，这是通过包裹模式触发的弹窗。"
              onConfirm={() => console.log('Trigger mode confirmed')}
            >
              <Button>点击触发（Info）</Button>
            </AlertDialog>

            <AlertDialog
              type="error"
              title="删除确认"
              content="确定要删除这个项目吗？此操作不可恢复。"
              showCancel={true}
              confirmText="删除"
              onConfirm={() => console.log('Delete confirmed')}
            >
              <Button variant="destructive">删除项目</Button>
            </AlertDialog>

            <AlertDialog
              type="warning"
              title="警告"
              content="此操作需要谨慎处理。"
              showCancel={true}
            >
              <Button variant="secondary">危险操作</Button>
            </AlertDialog>
          </div>
        </section>

        {/* Usage Example */}
        <section style={storyStyles.section}>
          <h2 style={storyStyles.h2}>使用方法</h2>
          <pre style={storyStyles.codeBlock}>
{`import { AlertDialog, Button } from '@errows/design';
import { useState } from 'react';

// 方式1: 受控模式（手动控制状态）
function ControlledExample() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        显示提示
      </Button>

      <AlertDialog
        open={open}
        onOpenChange={setOpen}
        type="info"
        title="提示标题"
        content="这是提示内容"
        onConfirm={() => {
          console.log('用户点击了确认');
        }}
      />
    </>
  );
}

// 方式2: Trigger模式（自动控制状态）
function TriggerExample() {
  return (
    <AlertDialog
      type="error"
      title="删除确认"
      content="确定要删除吗？"
      showCancel={true}
      onConfirm={() => console.log('删除')}
    >
      <Button variant="destructive">
        删除
      </Button>
    </AlertDialog>
  );
}`}
          </pre>
        </section>
      </div>
    );
  },
};

// Playground - 用于交互式测试
export const Playground: Story = {
  render: (args) => {
    const [open, setOpen] = useState(false);

    return (
      <>
        <Button onClick={() => setOpen(true)}>打开弹窗</Button>
        <AlertDialog {...args} open={open} onOpenChange={setOpen} />
      </>
    );
  },
  args: {
    type: 'info',
    title: '提示标题',
    content: '这是一条提示消息',
    confirmText: '确定',
    cancelText: '取消',
    showCancel: false,
  },
  argTypes: {
    type: {
      control: 'select',
      options: ['info', 'error', 'warning'],
    },
    title: {
      control: 'text',
    },
    content: {
      control: 'text',
    },
    confirmText: {
      control: 'text',
    },
    cancelText: {
      control: 'text',
    },
    showCancel: {
      control: 'boolean',
    },
  },
};

// Info Type
export const Info: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>显示信息提示</Button>
        <AlertDialog
          open={open}
          onOpenChange={setOpen}
          type="info"
          title="操作成功"
          content="您的更改已保存成功！"
        />
      </>
    );
  },
};

// Error Type
export const Error: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="destructive" onClick={() => setOpen(true)}>
          显示错误提示
        </Button>
        <AlertDialog
          open={open}
          onOpenChange={setOpen}
          type="error"
          title="操作失败"
          content="网络连接失败，请检查您的网络设置后重试。"
        />
      </>
    );
  },
};

// Warning Type
export const Warning: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="secondary" onClick={() => setOpen(true)}>
          显示警告提示
        </Button>
        <AlertDialog
          open={open}
          onOpenChange={setOpen}
          type="warning"
          title="注意"
          content="此操作可能影响系统性能，建议在非高峰期执行。"
          showCancel={true}
        />
      </>
    );
  },
};

// Trigger Mode - 包裹按钮触发
export const TriggerMode: Story = {
  render: () => {
    return (
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <AlertDialog
          type="info"
          title="提示"
          content="这是通过Trigger模式触发的弹窗，无需手动管理状态。"
        >
          <Button>点击我</Button>
        </AlertDialog>

        <AlertDialog
          type="error"
          title="删除确认"
          content="确定要删除这个项目吗？删除后无法恢复。"
          showCancel={true}
          confirmText="删除"
          cancelText="取消"
          onConfirm={() => alert('已删除')}
        >
          <Button variant="destructive">删除</Button>
        </AlertDialog>

        <AlertDialog
          type="warning"
          title="警告"
          content="此操作有风险，请谨慎处理。"
          showCancel={true}
          onConfirm={() => console.log('确认操作')}
          onCancel={() => console.log('取消操作')}
        >
          <Button variant="secondary">危险操作</Button>
        </AlertDialog>

        {/* 可以包裹任何元素 */}
        <AlertDialog
          type="info"
          title="自定义触发器"
          content="你也可以包裹其他任何可点击的元素。"
        >
          <div
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(96.61deg, #DD429D 0%, #B14BF4 50%, #485CFB 100%)',
              borderRadius: '8px',
              color: 'white',
              cursor: 'pointer',
            }}
          >
            自定义元素
          </div>
        </AlertDialog>
      </div>
    );
  },
};

