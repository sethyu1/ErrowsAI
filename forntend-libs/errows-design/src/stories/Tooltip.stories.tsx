import type { Meta, StoryObj } from '@storybook/react';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '../components/tooltip.js';
import { Button } from '../components/button.js';
import { storyStyles } from './story-styles.js';

const meta: Meta<typeof Tooltip> = {
  title: 'Components/Tooltip',
  component: Tooltip,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <TooltipProvider>
        <Story />
      </TooltipProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Tooltip>;

// 主展示页面 - 展示所有变体
export const Overview: Story = {
  render: () => (
    <TooltipProvider>
      <div style={storyStyles.container}>
        <h1 style={storyStyles.h1}>Tooltip Component</h1>
        
        {/* Basic Tooltip */}
        <section style={storyStyles.section}>
          <h2 style={storyStyles.h2}>Basic Tooltip</h2>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline">Hover me</Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>This is a tooltip with glassmorphism effect</p>
            </TooltipContent>
          </Tooltip>
        </section>

        {/* Different Positions */}
        <section style={storyStyles.section}>
          <h2 style={storyStyles.h2}>Positions</h2>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline">Top</Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Tooltip on top</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline">Bottom</Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Tooltip on bottom</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline">Left</Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>Tooltip on left</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline">Right</Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Tooltip on right</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </section>

        {/* Delay */}
        <section style={storyStyles.section}>
          <h2 style={storyStyles.h2}>Delay</h2>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button variant="outline">No delay</Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Shows immediately</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip delayDuration={500}>
              <TooltipTrigger asChild>
                <Button variant="outline">500ms delay</Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Shows after 500ms</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip delayDuration={1000}>
              <TooltipTrigger asChild>
                <Button variant="outline">1000ms delay</Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Shows after 1000ms</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </section>

        {/* Rich Content */}
        <section style={storyStyles.section}>
          <h2 style={storyStyles.h2}>Rich Content</h2>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button>Hover for info</Button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ 
                  fontWeight: 'bold',
                  fontSize: '14px',
                  color: '#fff'
                }}>
                  Keyboard Shortcut
                </div>
                <div style={{ 
                  fontSize: '13px',
                  color: '#d1d5db',
                  display: 'flex',
                  gap: '4px',
                  alignItems: 'center'
                }}>
                  <kbd style={{ 
                    padding: '2px 6px',
                    background: '#FFFFFF1A',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontFamily: 'monospace'
                  }}>
                    Ctrl
                  </kbd>
                  <span>+</span>
                  <kbd style={{ 
                    padding: '2px 6px',
                    background: '#FFFFFF1A',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontFamily: 'monospace'
                  }}>
                    K
                  </kbd>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </section>

        {/* Icon with Tooltip */}
        <section style={storyStyles.section}>
          <h2 style={storyStyles.h2}>Icon with Tooltip</h2>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button style={{ 
                  padding: '8px',
                  border: '1px solid #FFFFFF1A',
                  borderRadius: '8px',
                  background: 'transparent',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                  </svg>
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>More information</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button style={{ 
                  padding: '8px',
                  border: '1px solid #FFFFFF1A',
                  borderRadius: '8px',
                  background: 'transparent',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Logout</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button style={{ 
                  padding: '8px',
                  border: '1px solid #FFFFFF1A',
                  borderRadius: '8px',
                  background: 'transparent',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Settings</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </section>

        {/* Usage Example */}
        <section style={storyStyles.section}>
          <h2 style={storyStyles.h2}>Usage</h2>
          <pre style={storyStyles.codeBlock}>
{`import { 
  Tooltip, 
  TooltipTrigger, 
  TooltipContent, 
  TooltipProvider 
} from '@errows/design';
import { Button } from '@errows/design';

function MyComponent() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button>Hover me</Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Tooltip content</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}`}
          </pre>
        </section>

        {/* API */}
        <section style={storyStyles.section}>
          <h2 style={storyStyles.h2}>API</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <h3 style={storyStyles.h3}>TooltipProvider</h3>
              <p style={storyStyles.text}>
                Wraps your app to provide global tooltip configuration.
              </p>
              <ul style={{ ...storyStyles.text, listStyle: 'disc', paddingLeft: '20px', marginTop: '8px' }}>
                <li><code>delayDuration</code>: number - Default delay before showing tooltip (ms)</li>
                <li><code>skipDelayDuration</code>: number - Duration to skip delay when quickly hovering between tooltips</li>
              </ul>
            </div>
            <div>
              <h3 style={storyStyles.h3}>Tooltip</h3>
              <p style={storyStyles.text}>
                Root component for a tooltip.
              </p>
              <ul style={{ ...storyStyles.text, listStyle: 'disc', paddingLeft: '20px', marginTop: '8px' }}>
                <li><code>defaultOpen</code>: boolean - Default open state</li>
                <li><code>open</code>: boolean - Controlled open state</li>
                <li><code>onOpenChange</code>: (open: boolean) =&gt; void - Callback when open state changes</li>
                <li><code>delayDuration</code>: number - Override provider delay duration</li>
              </ul>
            </div>
            <div>
              <h3 style={storyStyles.h3}>TooltipContent</h3>
              <p style={storyStyles.text}>
                The content of the tooltip.
              </p>
              <ul style={{ ...storyStyles.text, listStyle: 'disc', paddingLeft: '20px', marginTop: '8px' }}>
                <li><code>side</code>: "top" | "right" | "bottom" | "left" - Side to show the tooltip</li>
                <li><code>sideOffset</code>: number - Distance from trigger (default: 4)</li>
                <li><code>align</code>: "start" | "center" | "end" - Alignment relative to trigger</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </TooltipProvider>
  ),
};

// Playground - 用于交互式测试
export const Playground: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button>Hover me</Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Beautiful glassmorphism tooltip</p>
      </TooltipContent>
    </Tooltip>
  ),
};

// Simple Example
export const Simple: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline">Simple tooltip</Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Add to library</p>
      </TooltipContent>
    </Tooltip>
  ),
};

// With Icon
export const WithIcon: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger asChild>
        <button style={{ 
          padding: '8px',
          border: '1px solid #FFFFFF1A',
          borderRadius: '8px',
          background: 'transparent',
          color: '#fff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
        </button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Help & Information</p>
      </TooltipContent>
    </Tooltip>
  ),
};
