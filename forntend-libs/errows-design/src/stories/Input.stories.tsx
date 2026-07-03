import type { Meta, StoryObj } from '@storybook/react';
import { Input } from '../components/input.js';

const meta: Meta<typeof Input> = {
  title: 'Components/Input',
  component: Input,
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

// 主展示页面 - 展示所有变体
export const Overview: Story = {
  render: () => (
    <div style={{ padding: '40px', maxWidth: '1200px' }}>
      <h1 style={{ marginBottom: '30px', fontSize: '32px', fontWeight: 'bold' }}>Input Component</h1>
      
      {/* Types Section */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: '600' }}>Input Types</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '400px' }}>
          <Input type="text" placeholder="Text input" />
          <Input type="email" placeholder="Email input" />
          <Input type="password" placeholder="Password input" />
          <Input type="number" placeholder="Number input" />
          <Input type="search" placeholder="Search input" />
          <Input type="tel" placeholder="Telephone input" />
          <Input type="url" placeholder="URL input" />
        </div>
      </section>

      {/* States Section */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: '600' }}>States</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '400px' }}>
          <Input placeholder="Normal input" />
          <Input placeholder="Disabled input" disabled />
          <Input placeholder="Read-only input" readOnly value="Read-only value" />
        </div>
      </section>

      {/* Usage Example */}
      <section>
        <h2 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: '600' }}>Usage</h2>
        <pre style={{ 
          background: '#f5f5f5', 
          padding: '16px', 
          borderRadius: '8px',
          overflow: 'auto',
          fontSize: '14px',
          lineHeight: '1.5'
        }}>
{`import { Input } from '@errows/design';

function MyComponent() {
  return (
    <>
      <Input type="text" placeholder="Enter your name" />
      <Input type="email" placeholder="Enter your email" />
      <Input type="password" placeholder="Enter password" disabled />
    </>
  );
}`}
        </pre>
      </section>
    </div>
  ),
};

// Playground - 用于交互式测试
export const Playground: Story = {
  args: {
    placeholder: 'Enter text...',
    type: 'text',
  },
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'search', 'tel', 'url'],
    },
    disabled: {
      control: 'boolean',
    },
    readOnly: {
      control: 'boolean',
    },
  },
};
