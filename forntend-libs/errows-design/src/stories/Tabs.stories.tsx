import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Tabs } from '../components/tabs.js';
import { storyStyles } from './story-styles.js';

const meta: Meta<typeof Tabs> = {
  title: 'Components/Tabs',
  component: Tabs,
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof Tabs>;

// 基础标签页数据
const basicTabItems = [
  { key: 'chat', label: 'Chat' },
  { key: 'image', label: 'Image' },
  { key: 'video', label: 'Video' },
];

const manyTabItems = [
  { key: 'home', label: 'Home' },
  { key: 'profile', label: 'Profile' },
  { key: 'messages', label: 'Messages' },
  { key: 'notifications', label: 'Notifications' },
  { key: 'settings', label: 'Settings' },
];

const disabledTabItems = [
  { key: 'available', label: 'Available' },
  { key: 'disabled', label: 'Disabled', disabled: true },
  { key: 'active', label: 'Active' },
];

// 主展示页面 - 展示所有变体
export const Overview: Story = {
  render: () => {
    const [activeTab1, setActiveTab1] = useState('chat');
    const [activeTab2, setActiveTab2] = useState('home');
    const [activeTab3, setActiveTab3] = useState('available');

    return (
      <div style={storyStyles.container}>
        <h1 style={storyStyles.h1}>Tabs Component</h1>

        {/* Basic Tabs */}
        <section style={storyStyles.section}>
          <h2 style={storyStyles.h2}>Basic Tabs</h2>
          <div style={{ 
            background: '#0A0A0F', 
            padding: '20px', 
            borderRadius: '8px',
            border: '1px solid #2C2C38'
          }}>
            <Tabs
              items={basicTabItems}
              activeKey={activeTab1}
              onChange={setActiveTab1}
            />
            <div style={{ 
              marginTop: '20px', 
              padding: '16px', 
              background: '#15151E',
              borderRadius: '4px',
              color: '#6B6B7B'
            }}>
              Current Active Tab: <span style={{ color: '#fff', fontWeight: 'bold' }}>{activeTab1}</span>
            </div>
          </div>
        </section>

        {/* Many Tabs */}
        <section style={storyStyles.section}>
          <h2 style={storyStyles.h2}>Multiple Tabs</h2>
          <div style={{ 
            background: '#0A0A0F', 
            padding: '20px', 
            borderRadius: '8px',
            border: '1px solid #2C2C38'
          }}>
            <Tabs
              items={manyTabItems}
              activeKey={activeTab2}
              onChange={setActiveTab2}
            />
            <div style={{ 
              marginTop: '20px', 
              padding: '16px', 
              background: '#15151E',
              borderRadius: '4px',
              color: '#6B6B7B'
            }}>
              Current Active Tab: <span style={{ color: '#fff', fontWeight: 'bold' }}>{activeTab2}</span>
            </div>
          </div>
        </section>

        {/* Disabled Tabs */}
        <section style={storyStyles.section}>
          <h2 style={storyStyles.h2}>Disabled State</h2>
          <div style={{ 
            background: '#0A0A0F', 
            padding: '20px', 
            borderRadius: '8px',
            border: '1px solid #2C2C38'
          }}>
            <Tabs
              items={disabledTabItems}
              activeKey={activeTab3}
              onChange={setActiveTab3}
            />
            <div style={{ 
              marginTop: '20px', 
              padding: '16px', 
              background: '#15151E',
              borderRadius: '4px',
              color: '#6B6B7B'
            }}>
              Try clicking the "Disabled" tab - it won't work!
            </div>
          </div>
        </section>

        {/* Uncontrolled Tabs */}
        <section style={storyStyles.section}>
          <h2 style={storyStyles.h2}>Uncontrolled Mode</h2>
          <div style={{ 
            background: '#0A0A0F', 
            padding: '20px', 
            borderRadius: '8px',
            border: '1px solid #2C2C38'
          }}>
            <Tabs
              items={basicTabItems}
              defaultActiveKey="image"
              onChange={(key) => console.log('Tab changed to:', key)}
            />
            <div style={{ 
              marginTop: '20px', 
              padding: '16px', 
              background: '#15151E',
              borderRadius: '4px',
              color: '#6B6B7B'
            }}>
              This tab is uncontrolled - check console for onChange events
            </div>
          </div>
        </section>

        {/* Usage Example */}
        <section style={storyStyles.section}>
          <h2 style={storyStyles.h2}>Usage</h2>
          <pre style={storyStyles.codeBlock}>
{`import { Tabs } from '@errows/design';
import { useState } from 'react';

function MyComponent() {
  const [activeTab, setActiveTab] = useState('chat');

  const tabItems = [
    { key: 'chat', label: 'Chat' },
    { key: 'image', label: 'Image' },
    { key: 'video', label: 'Video' },
  ];

  return (
    <div>
      {/* Controlled Mode */}
      <Tabs
        items={tabItems}
        activeKey={activeTab}
        onChange={setActiveTab}
      />

      {/* Uncontrolled Mode */}
      <Tabs
        items={tabItems}
        defaultActiveKey="chat"
        onChange={(key) => console.log(key)}
      />

      {/* With Disabled Tabs */}
      <Tabs
        items={[
          { key: 'home', label: 'Home' },
          { key: 'settings', label: 'Settings', disabled: true },
        ]}
        activeKey={activeTab}
        onChange={setActiveTab}
      />
    </div>
  );
}`}
          </pre>
        </section>

        {/* API Documentation */}
        <section style={storyStyles.section}>
          <h2 style={storyStyles.h2}>API</h2>
          <div style={storyStyles.codeBlock}>
            <h3 style={{ marginTop: 0, color: '#fff' }}>TabsProps</h3>
            <ul style={{ color: '#A1A8A8', lineHeight: 1.8 }}>
              <li><code>items</code>: TabItem[] - 标签页配置数组（必填）</li>
              <li><code>activeKey?</code>: string - 当前激活的标签（受控模式）</li>
              <li><code>defaultActiveKey?</code>: string - 默认激活的标签（非受控模式）</li>
              <li><code>onChange?</code>: (key: string) =&gt; void - 切换回调</li>
              <li><code>className?</code>: string - 自定义类名</li>
              <li><code>style?</code>: React.CSSProperties - 自定义样式</li>
            </ul>

            <h3 style={{ marginTop: 20, color: '#fff' }}>TabItem</h3>
            <ul style={{ color: '#A1A8A8', lineHeight: 1.8 }}>
              <li><code>key</code>: string - 唯一标识（必填）</li>
              <li><code>label</code>: string - 显示文字（必填）</li>
              <li><code>disabled?</code>: boolean - 是否禁用</li>
            </ul>
          </div>
        </section>

        {/* Features */}
        <section style={storyStyles.section}>
          <h2 style={storyStyles.h2}>Features</h2>
          <div style={storyStyles.codeBlock}>
            <ul style={{ color: '#A1A8A8', lineHeight: 2 }}>
              <li>✅ 底部下划线指示器，平滑跟随动画</li>
              <li>✅ 支持受控和非受控两种模式</li>
              <li>✅ 支持禁用单个标签页</li>
              <li>✅ Hover 交互效果</li>
              <li>✅ 响应式自适应</li>
              <li>✅ 无障碍访问支持</li>
            </ul>
          </div>
        </section>
      </div>
    );
  },
};

// Playground - 用于交互式测试
export const Playground: Story = {
  render: (args) => {
    const [activeKey, setActiveKey] = useState(args.defaultActiveKey || 'chat');
    
    return (
      <div style={{ 
        background: '#0A0A0F', 
        padding: '40px', 
        minWidth: '500px',
        borderRadius: '8px',
        border: '1px solid #2C2C38'
      }}>
        <Tabs
          {...args}
          activeKey={activeKey}
          onChange={setActiveKey}
        />
        <div style={{ 
          marginTop: '30px', 
          padding: '20px', 
          background: '#15151E',
          borderRadius: '4px',
          color: '#fff',
          textAlign: 'center'
        }}>
          Active Tab: <strong>{activeKey}</strong>
        </div>
      </div>
    );
  },
  args: {
    items: basicTabItems,
    defaultActiveKey: 'chat',
  },
  argTypes: {
    items: {
      control: 'object',
      description: '标签页配置数组',
    },
    activeKey: {
      control: 'text',
      description: '当前激活的标签（受控模式）',
    },
    defaultActiveKey: {
      control: 'text',
      description: '默认激活的标签（非受控模式）',
    },
    onChange: {
      action: 'changed',
      description: '标签切换回调',
    },
  },
};

// Individual Examples
export const ChatExample: Story = {
  render: () => {
    const [activeTab, setActiveTab] = useState('chat');
    const tabItems = [
      { key: 'chat', label: 'Chat' },
      { key: 'image', label: 'Image' },
      { key: 'video', label: 'Video' },
    ];

    return (
      <div style={{ 
        background: '#0A0A0F', 
        padding: '0',
        width: '600px',
        borderRadius: '8px',
        border: '1px solid #2C2C38',
        overflow: 'hidden'
      }}>
        <div style={{ 
          borderBottom: '1px solid #2C2C38',
          padding: '0 24px'
        }}>
          <Tabs
            items={tabItems}
            activeKey={activeTab}
            onChange={setActiveTab}
          />
        </div>
        <div style={{ 
          padding: '40px', 
          minHeight: '200px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#6B6B7B'
        }}>
          {activeTab === 'chat' && <div style={{ fontSize: '18px' }}>💬 Chat Content</div>}
          {activeTab === 'image' && <div style={{ fontSize: '18px' }}>🖼️ Image Content</div>}
          {activeTab === 'video' && <div style={{ fontSize: '18px' }}>🎥 Video Content</div>}
        </div>
      </div>
    );
  },
};

