import type { Meta, StoryObj } from '@storybook/react';
import { Label } from '../components/label.js';
import { Input } from '../components/input.js';

const meta: Meta<typeof Label> = {
  title: 'Components/Label',
  component: Label,
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof Label>;

// 主展示页面 - 展示所有变体
export const Overview: Story = {
  render: () => (
    <div style={{ padding: '40px', maxWidth: '1200px' }}>
      <h1 style={{ marginBottom: '30px', fontSize: '32px', fontWeight: 'bold' }}>Label Component</h1>
      
      {/* Basic Label */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: '600' }}>Basic Label</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '400px' }}>
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="Enter your name" style={{ marginTop: '8px' }} />
          </div>
          
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" type="email" placeholder="Enter your email" style={{ marginTop: '8px' }} />
          </div>
        </div>
      </section>

      {/* Label with Required Indicator */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: '600' }}>Required Fields</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '400px' }}>
          <div>
            <Label htmlFor="username">
              Username <span style={{ color: '#ef4444' }}>*</span>
            </Label>
            <Input id="username" placeholder="Enter username" style={{ marginTop: '8px' }} />
          </div>
          
          <div>
            <Label htmlFor="password">
              Password <span style={{ color: '#ef4444' }}>*</span>
            </Label>
            <Input id="password" type="password" placeholder="Enter password" style={{ marginTop: '8px' }} />
          </div>
        </div>
      </section>

      {/* Disabled State */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: '600' }}>Disabled State</h2>
        <div style={{ maxWidth: '400px' }} data-disabled="true">
          <Label htmlFor="disabled">Disabled Field</Label>
          <Input id="disabled" placeholder="This field is disabled" disabled style={{ marginTop: '8px' }} />
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
{`import { Label } from '@errows/design';
import { Input } from '@errows/design';

function MyComponent() {
  return (
    <div>
      <Label htmlFor="email">Email Address</Label>
      <Input id="email" type="email" placeholder="Enter email" />
    </div>
  );
}`}
        </pre>
      </section>
    </div>
  ),
};

// Playground - 用于交互式测试
export const Playground: Story = {
  render: () => (
    <div style={{ maxWidth: '400px' }}>
      <Label htmlFor="playground">Label Text</Label>
      <Input id="playground" placeholder="Enter value" style={{ marginTop: '8px' }} />
    </div>
  ),
};
