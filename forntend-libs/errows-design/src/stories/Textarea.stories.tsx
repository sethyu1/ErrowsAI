import type { Meta, StoryObj } from '@storybook/react';
import { Textarea } from '../components/textarea.js';

const meta: Meta<typeof Textarea> = {
  title: 'Components/Textarea',
  component: Textarea,
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof Textarea>;

// 主展示页面 - 展示所有变体
export const Overview: Story = {
  render: () => (
    <div style={{ padding: '40px', maxWidth: '1200px' }}>
      <h1 style={{ marginBottom: '30px', fontSize: '32px', fontWeight: 'bold' }}>Textarea Component</h1>
      
      {/* Sizes Section */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: '600' }}>Sizes</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '600px' }}>
          <Textarea placeholder="Default height (80px min)" />
          <Textarea placeholder="Custom rows" rows={3} />
          <Textarea placeholder="Tall textarea" rows={8} />
          <Textarea placeholder="Fixed height (no resize)" rows={5} className="resize-none" />
        </div>
      </section>

      {/* States Section */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: '600' }}>States</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '600px' }}>
          <Textarea placeholder="Normal textarea" />
          <Textarea placeholder="Disabled textarea" disabled />
          <Textarea placeholder="Read-only textarea" readOnly value="This is a read-only textarea with some example content." />
          <Textarea placeholder="Invalid textarea" aria-invalid={true} defaultValue="This textarea has an error" />
        </div>
      </section>

      {/* Resize Options */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: '600' }}>Resize Options</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '600px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Vertical resize (default)</label>
            <Textarea placeholder="Can resize vertically" />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>No resize</label>
            <Textarea placeholder="Cannot resize" className="resize-none" />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Both directions</label>
            <Textarea placeholder="Can resize both ways" className="resize" />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Horizontal resize</label>
            <Textarea placeholder="Can resize horizontally" className="resize-x" />
          </div>
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
{`import { Textarea } from '@errows/design';

function MyComponent() {
  return (
    <>
      <Textarea placeholder="Enter your message..." />
      <Textarea placeholder="Fixed height" rows={5} className="resize-none" />
      <Textarea 
        placeholder="With onChange" 
        onChange={(e) => console.log(e.target.value)}
      />
      <Textarea 
        placeholder="Disabled" 
        disabled 
      />
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
    placeholder: 'Enter your text...',
    rows: 4,
  },
  argTypes: {
    placeholder: {
      control: 'text',
    },
    rows: {
      control: { type: 'number', min: 1, max: 20 },
    },
    disabled: {
      control: 'boolean',
    },
    readOnly: {
      control: 'boolean',
    },
  },
};
