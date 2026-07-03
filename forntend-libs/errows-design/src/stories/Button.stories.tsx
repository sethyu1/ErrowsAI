import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../components/button.js';
import { storyStyles } from './story-styles.js';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

// 主展示页面 - 展示所有变体
export const Overview: Story = {
  render: () => (
    <div style={storyStyles.container}>
      <h1 style={storyStyles.h1}>Button Component</h1>

      {/* Variants Section */}
      <section style={storyStyles.section}>
        <h2 style={storyStyles.h2}>Variants</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          <Button variant="default">Default</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
        </div>
      </section>

      {/* Sizes Section */}
      <section style={storyStyles.section}>
        <h2 style={storyStyles.h2}>Sizes</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          <Button size="mini">Mini</Button>
          <Button size="sm">Small</Button>
          <Button size="default">Default</Button>
          <Button size="lg">Large</Button>
          <Button size="icon">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0z"/>
            </svg>
          </Button>
        </div>
      </section>

      {/* States Section */}
      <section style={storyStyles.section}>
        <h2 style={storyStyles.h2}>States</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          <Button>Normal</Button>
          <Button disabled>Disabled</Button>
          <Button loading>Loading</Button>
          <Button loading variant="outline">Loading Outline</Button>
        </div>
      </section>

       {/* States Section */}
      <section style={storyStyles.section}>
        <h2 style={storyStyles.h2}>Appearance</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          <Button appearance="gradientFill" shape="round">GradientFill</Button>
          <Button appearance="gradientOutline" shape="round">GradientOutline</Button>
        </div>
      </section>

      {/* Usage Example */}
      <section style={storyStyles.section}>
        <h2 style={storyStyles.h2}>Usage</h2>
        <pre style={storyStyles.codeBlock}>
{`import { Button } from '@errows/design';

function MyComponent() {
  const [loading, setLoading] = React.useState(false);
  
  const handleSubmit = async () => {
    setLoading(true);
    // 执行异步操作
    await someAsyncOperation();
    setLoading(false);
  };

  return (
    <>
      <Button variant="default">Click me</Button>
      <Button variant="outline" size="sm">Small button</Button>
      <Button variant="destructive" disabled>Disabled</Button>
      <Button loading={loading} onClick={handleSubmit}>Submit</Button>
    </>
  );
}`}
        </pre>
      </section>
    </div>
  ),
};

// Loading States - 展示所有loading状态
export const LoadingStates: Story = {
  render: () => (
    <div style={storyStyles.container}>
      <h1 style={storyStyles.h1}>Loading States</h1>

      {/* Loading Variants */}
      <section style={storyStyles.section}>
        <h2 style={storyStyles.h2}>Loading Variants</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          <Button loading variant="default">Default</Button>
          <Button loading variant="destructive">Destructive</Button>
          <Button loading variant="outline">Outline</Button>
          <Button loading variant="secondary">Secondary</Button>
          <Button loading variant="ghost">Ghost</Button>
        </div>
      </section>

      {/* Loading Sizes */}
      <section style={storyStyles.section}>
        <h2 style={storyStyles.h2}>Loading Sizes</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          <Button loading size="mini">Mini</Button>
          <Button loading size="sm">Small</Button>
          <Button loading size="default">Default</Button>
          <Button loading size="lg">Large</Button>
        </div>
      </section>

      {/* Loading with Gradient */}
      <section style={storyStyles.section}>
        <h2 style={storyStyles.h2}>Loading with Gradient</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          <Button loading appearance="gradientFill" shape="round">Processing</Button>
          <Button loading appearance="gradientOutline" shape="round">Submitting</Button>
        </div>
      </section>
    </div>
  ),
};

// Playground - 用于交互式测试
export const Playground: Story = {
  args: {
    children: 'Button',
    variant: 'default',
    size: 'default',
    loading: false,
    disabled: false,
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon'],
    },
    shape: {
      control: 'select',
      options: ['default', 'round'],
    },
    appearance: {
      control: 'select',
      options: [undefined, 'gradientFill', 'gradientOutline'],
    },
    disabled: {
      control: 'boolean',
    },
    loading: {
      control: 'boolean',
    },
  },
};
