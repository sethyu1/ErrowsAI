import type { Meta, StoryObj } from '@storybook/react';
import { InputGroup, InputGroupInput, InputGroupAddon } from '../components/input-group.js';
import { SearchIcon, SendIcon } from '@errows/icons';

const meta: Meta<typeof InputGroup> = {
  title: 'Components/InputGroup',
  component: InputGroup,
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof InputGroup>;

// 主展示页面 - 展示所有变体
export const Overview: Story = {
  render: () => (
    <div style={{ padding: '40px', maxWidth: '1200px' }}>
      <h1 style={{ marginBottom: '30px', fontSize: '32px', fontWeight: 'bold' }}>InputGroup Component</h1>
      
      {/* Basic Examples */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: '600' }}>Basic Examples</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '500px' }}>
          {/* Search with Icon */}
          <div>
            <h3 style={{ marginBottom: '8px', fontSize: '16px', fontWeight: '500' }}>Search Input</h3>
            <InputGroup>
              <InputGroupInput placeholder="Search..." />
              <InputGroupAddon>
                <SearchIcon style={{ width: '20px', height: '20px' }} />
              </InputGroupAddon>
            </InputGroup>
          </div>

          {/* Send Message */}
          <div>
            <h3 style={{ marginBottom: '8px', fontSize: '16px', fontWeight: '500' }}>Message Input</h3>
            <InputGroup>
              <InputGroupInput placeholder="Type a message..." />
              <InputGroupAddon>
                <button style={{ 
                  background: 'linear-gradient(to right, #a855f7, #ec4899)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}>
                  <SendIcon style={{ width: '20px', height: '20px', color: 'white' }} />
                </button>
              </InputGroupAddon>
            </InputGroup>
          </div>

          {/* Custom Styled */}
          <div>
            <h3 style={{ marginBottom: '8px', fontSize: '16px', fontWeight: '500' }}>Custom Styled</h3>
            <InputGroup className="bg-transparent rounded-full">
              <InputGroupInput 
                placeholder="Rounded input..." 
                style={{ background: 'transparent' }}
              />
              <InputGroupAddon className="bg-transparent">
                <SearchIcon style={{ width: '20px', height: '20px', color: '#9ca3af' }} />
              </InputGroupAddon>
            </InputGroup>
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
{`import { InputGroup, InputGroupInput, InputGroupAddon } from '@errows/design';
import { SearchIcon } from '@errows/icons';

function MyComponent() {
  return (
    <InputGroup>
      <InputGroupInput placeholder="Search..." />
      <InputGroupAddon>
        <SearchIcon />
      </InputGroupAddon>
    </InputGroup>
  );
}`}
        </pre>
      </section>
    </div>
  ),
};

// Playground - 用于交互式测试
export const Playground: Story = {
  render: (args) => (
    <InputGroup {...args}>
      <InputGroupInput placeholder="Enter text..." />
      <InputGroupAddon>
        <SearchIcon style={{ width: '20px', height: '20px' }} />
      </InputGroupAddon>
    </InputGroup>
  ),
};
