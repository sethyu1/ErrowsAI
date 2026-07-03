import type { Meta, StoryObj } from '@storybook/react';
import { Popover, PopoverTrigger, PopoverContent } from '../components/popover.js';
import { Button } from '../components/button.js';
import { storyStyles } from './story-styles.js';

const meta: Meta<typeof Popover> = {
  title: 'Components/Popover',
  component: Popover,
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof Popover>;

// 主展示页面 - 展示所有变体
export const Overview: Story = {
  render: () => (
    <div style={storyStyles.container}>
      <h1 style={storyStyles.h1}>Popover Component</h1>
      
      {/* Basic Popover */}
      <section style={storyStyles.section}>
        <h2 style={storyStyles.h2}>Basic Popover</h2>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">Open Popover</Button>
          </PopoverTrigger>
          <PopoverContent>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h3 style={storyStyles.h3}>Popover Title</h3>
              <p style={storyStyles.text}>
                This is a popover with a beautiful glassmorphism effect.
              </p>
            </div>
          </PopoverContent>
        </Popover>
      </section>

      {/* Different Positions */}
      <section style={storyStyles.section}>
        <h2 style={storyStyles.h2}>Positions</h2>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">Top</Button>
            </PopoverTrigger>
            <PopoverContent side="top">
              <p style={storyStyles.text}>Popover on top</p>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">Bottom</Button>
            </PopoverTrigger>
            <PopoverContent side="bottom">
              <p style={storyStyles.text}>Popover on bottom</p>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">Left</Button>
            </PopoverTrigger>
            <PopoverContent side="left">
              <p style={storyStyles.text}>Popover on left</p>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">Right</Button>
            </PopoverTrigger>
            <PopoverContent side="right">
              <p style={storyStyles.text}>Popover on right</p>
            </PopoverContent>
          </Popover>
        </div>
      </section>

      {/* Rich Content */}
      <section style={storyStyles.section}>
        <h2 style={storyStyles.h2}>Rich Content</h2>
        <Popover>
          <PopoverTrigger asChild>
            <Button>User Profile</Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ 
                  width: '48px', 
                  height: '48px', 
                  borderRadius: '50%', 
                  background: 'linear-gradient(135deg, #DD429D 0%, #B14BF4 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 'bold',
                  fontSize: '20px'
                }}>
                  JD
                </div>
                <div>
                  <h4 style={storyStyles.h3}>John Doe</h4>
                  <p style={storyStyles.textMuted}>john@example.com</p>
                </div>
              </div>
              <div style={{ borderTop: '1px solid #FFFFFF1A', paddingTop: '12px' }}>
                <p style={storyStyles.text}>
                  Software Engineer passionate about building beautiful user interfaces.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button size="sm" variant="outline" style={{ flex: 1 }}>Message</Button>
                <Button size="sm" style={{ flex: 1 }}>Follow</Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </section>

      {/* Usage Example */}
      <section style={storyStyles.section}>
        <h2 style={storyStyles.h2}>Usage</h2>
        <pre style={storyStyles.codeBlock}>
{`import { Popover, PopoverTrigger, PopoverContent } from '@errows/design';
import { Button } from '@errows/design';

function MyComponent() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button>Open</Button>
      </PopoverTrigger>
      <PopoverContent>
        <div>
          <h3>Popover Title</h3>
          <p>Popover content goes here.</p>
        </div>
      </PopoverContent>
    </Popover>
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
    <Popover>
      <PopoverTrigger asChild>
        <Button>Click me</Button>
      </PopoverTrigger>
      <PopoverContent>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={storyStyles.h3}>Glassmorphism Popover</h3>
          <p style={storyStyles.text}>
            This popover features a beautiful glassmorphism effect with backdrop blur.
          </p>
          <div style={{ 
            padding: '8px 12px', 
            background: '#FFFFFF0D', 
            borderRadius: '8px',
            fontSize: '12px',
            color: '#9ca3af'
          }}>
            backdrop-filter: blur(15.7px)
          </div>
        </div>
      </PopoverContent>
    </Popover>
  ),
};
