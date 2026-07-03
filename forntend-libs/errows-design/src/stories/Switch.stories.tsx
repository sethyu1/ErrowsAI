import type { Meta, StoryObj } from '@storybook/react';
import { Switch } from '../components/switch.js';
import { Label } from '../components/label.js';
import { useState } from 'react';
import { storyStyles } from './story-styles.js';

const meta: Meta<typeof Switch> = {
  title: 'Components/Switch',
  component: Switch,
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof Switch>;

// 主展示页面 - 展示所有变体
export const Overview: Story = {
  render: () => {
    const [checked1, setChecked1] = useState(false);
    const [checked2, setChecked2] = useState(true);
    const [checked3, setChecked3] = useState(false);

    return (
      <div style={storyStyles.container}>
        <h1 style={storyStyles.h1}>Switch Component</h1>
        
        {/* Basic Switch */}
        <section style={storyStyles.section}>
          <h2 style={storyStyles.h2}>Basic Switch</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Switch id="switch-1" checked={checked1} onCheckedChange={setChecked1} />
              <Label htmlFor="switch-1" style={{ color: '#e5e7eb', cursor: 'pointer' }}>
                {checked1 ? 'Enabled' : 'Disabled'}
              </Label>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Switch id="switch-2" checked={checked2} onCheckedChange={setChecked2} />
              <Label htmlFor="switch-2" style={{ color: '#e5e7eb', cursor: 'pointer' }}>
                Default Checked
              </Label>
            </div>
          </div>
        </section>

        {/* Gradient Display */}
        <section style={storyStyles.section}>
          <h2 style={storyStyles.h2}>Gradient Background</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ color: '#9ca3af', fontSize: '14px' }}>
              When checked, the switch displays a beautiful gradient from pink (#DD429D) → purple (#B14BF4) → blue (#485CFB)
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Switch id="gradient-demo" checked={checked3} onCheckedChange={setChecked3} />
              <Label htmlFor="gradient-demo" style={{ color: '#e5e7eb', cursor: 'pointer' }}>
                Click to see gradient animation
              </Label>
            </div>
          </div>
        </section>

        {/* With Labels */}
        <section style={storyStyles.section}>
          <h2 style={storyStyles.h2}>With Descriptions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '400px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <Label htmlFor="notifications" style={{ color: '#fff', fontWeight: '500', cursor: 'pointer' }}>
                  Notifications
                </Label>
                <p style={{ fontSize: '14px', color: '#9ca3af', marginTop: '4px' }}>
                  Receive email notifications
                </p>
              </div>
              <Switch id="notifications" />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <Label htmlFor="marketing" style={{ color: '#fff', fontWeight: '500', cursor: 'pointer' }}>
                  Marketing emails
                </Label>
                <p style={{ fontSize: '14px', color: '#9ca3af', marginTop: '4px' }}>
                  Receive emails about new products
                </p>
              </div>
              <Switch id="marketing" defaultChecked />
            </div>
          </div>
        </section>

        {/* States */}
        <section style={storyStyles.section}>
          <h2 style={storyStyles.h2}>States</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Switch id="switch-disabled" disabled />
              <Label htmlFor="switch-disabled" style={{ color: '#6b7280' }}>
                Disabled (Unchecked)
              </Label>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Switch id="switch-disabled-checked" disabled checked />
              <Label htmlFor="switch-disabled-checked" style={{ color: '#6b7280' }}>
                Disabled (Checked)
              </Label>
            </div>
          </div>
        </section>

        {/* Usage Example */}
        <section style={storyStyles.section}>
          <h2 style={storyStyles.h2}>Usage</h2>
          <pre style={storyStyles.codeBlock}>
{`import { Switch } from '@errows/design';
import { Label } from '@errows/design';
import { useState } from 'react';

function MyComponent() {
  const [checked, setChecked] = useState(false);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <Switch 
        id="my-switch" 
        checked={checked} 
        onCheckedChange={setChecked} 
      />
      <Label htmlFor="my-switch">
        Enable notifications
      </Label>
    </div>
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
  render: () => {
    const [checked, setChecked] = useState(false);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Switch id="playground-switch" checked={checked} onCheckedChange={setChecked} />
          <Label htmlFor="playground-switch" style={{ color: '#e5e7eb', cursor: 'pointer' }}>
            {checked ? 'On' : 'Off'}
          </Label>
        </div>
        <p style={{ color: '#9ca3af', fontSize: '14px' }}>
          Current state: <strong style={{ color: checked ? '#a855f7' : '#6b7280' }}>{checked ? 'Checked' : 'Unchecked'}</strong>
        </p>
      </div>
    );
  },
};
