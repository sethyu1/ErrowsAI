import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
} from '../components/select.js';
import { storyStyles } from './story-styles.js';

const meta: Meta<typeof Select> = {
  title: 'Components/Select',
  component: Select,
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof Select>;

// 主展示页面 - 展示所有变体
export const Overview: Story = {
  render: () => (
    <div style={storyStyles.container}>
      <h1 style={storyStyles.h1}>Select Component</h1>
      <p style={storyStyles.description}>
        A rounded select component with dark theme styling for choosing from a list of options.
      </p>

      {/* Basic Usage Section */}
      <section style={storyStyles.section}>
        <h2 style={storyStyles.h2}>Basic Usage</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
          <div>
            <label style={{ ...storyStyles.text, display: 'block', marginBottom: '8px' }}>
              Sort by:
            </label>
            <Select defaultValue="latest">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latest">Latest</SelectItem>
                <SelectItem value="popular">Popular</SelectItem>
                <SelectItem value="trending">Trending</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label style={{ ...storyStyles.text, display: 'block', marginBottom: '8px' }}>
              Category:
            </label>
            <Select defaultValue="all">
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="technology">Technology</SelectItem>
                <SelectItem value="design">Design</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Different Widths Section */}
      <section style={storyStyles.section}>
        <h2 style={storyStyles.h2}>Different Widths</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Select defaultValue="option1">
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="option1">Small (140px)</SelectItem>
              <SelectItem value="option2">Option 2</SelectItem>
            </SelectContent>
          </Select>

          <Select defaultValue="option1">
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="option1">Default (180px)</SelectItem>
              <SelectItem value="option2">Option 2</SelectItem>
            </SelectContent>
          </Select>

          <Select defaultValue="option1">
            <SelectTrigger className="w-[240px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="option1">Large (240px)</SelectItem>
              <SelectItem value="option2">Option 2</SelectItem>
            </SelectContent>
          </Select>

          <Select defaultValue="option1">
            <SelectTrigger className="w-full max-w-[320px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="option1">Full Width (320px max)</SelectItem>
              <SelectItem value="option2">Option 2</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      {/* With Groups Section */}
      <section style={storyStyles.section}>
        <h2 style={storyStyles.h2}>With Groups and Separators</h2>
        <Select defaultValue="apple">
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select item" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Fruits</SelectLabel>
              <SelectItem value="apple">Apple</SelectItem>
              <SelectItem value="banana">Banana</SelectItem>
              <SelectItem value="orange">Orange</SelectItem>
            </SelectGroup>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel>Vegetables</SelectLabel>
              <SelectItem value="carrot">Carrot</SelectItem>
              <SelectItem value="potato">Potato</SelectItem>
              <SelectItem value="tomato">Tomato</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </section>

      {/* States Section */}
      <section style={storyStyles.section}>
        <h2 style={storyStyles.h2}>States</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ ...storyStyles.text, display: 'block', marginBottom: '8px' }}>
              Normal:
            </label>
            <Select defaultValue="normal">
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal State</SelectItem>
                <SelectItem value="option2">Option 2</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label style={{ ...storyStyles.text, display: 'block', marginBottom: '8px' }}>
              Disabled:
            </label>
            <Select defaultValue="disabled" disabled>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="disabled">Disabled State</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label style={{ ...storyStyles.text, display: 'block', marginBottom: '8px' }}>
              With disabled options:
            </label>
            <Select defaultValue="option1">
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="option1">Option 1</SelectItem>
                <SelectItem value="option2" disabled>
                  Option 2 (Disabled)
                </SelectItem>
                <SelectItem value="option3">Option 3</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Usage Example */}
      <section style={storyStyles.section}>
        <h2 style={storyStyles.h2}>Usage</h2>
        <pre style={storyStyles.codeBlock}>
{`import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@errows/design';

// Basic Usage
function BasicExample() {
  return (
    <Select defaultValue="latest">
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select option" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="latest">Latest</SelectItem>
        <SelectItem value="popular">Popular</SelectItem>
        <SelectItem value="trending">Trending</SelectItem>
      </SelectContent>
    </Select>
  );
}

// Controlled Component
function ControlledExample() {
  const [value, setValue] = React.useState('latest');

  return (
    <Select value={value} onValueChange={setValue}>
      <SelectTrigger className="w-[180px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="latest">Latest</SelectItem>
        <SelectItem value="popular">Popular</SelectItem>
      </SelectContent>
    </Select>
  );
}

// With Groups
function GroupedExample() {
  return (
    <Select>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Select fruit" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Fruits</SelectLabel>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="banana">Banana</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>Vegetables</SelectLabel>
          <SelectItem value="carrot">Carrot</SelectItem>
          <SelectItem value="potato">Potato</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}`}
        </pre>
      </section>
    </div>
  ),
};

// Controlled Example - 展示受控组件
export const ControlledExample: Story = {
  render: () => {
    const [value, setValue] = useState('latest');
    
    return (
      <div style={storyStyles.container}>
        <h1 style={storyStyles.h1}>Controlled Select</h1>
        
        <section style={storyStyles.section}>
          <h2 style={storyStyles.h2}>Controlled Component</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Select value={value} onValueChange={setValue}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latest">Latest</SelectItem>
                <SelectItem value="popular">Popular</SelectItem>
                <SelectItem value="trending">Trending</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
              </SelectContent>
            </Select>
            
            <div style={storyStyles.text}>
              Selected value: <strong style={{ color: '#B14BF4' }}>{value}</strong>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setValue('latest')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  background: 'rgba(177, 75, 244, 0.1)',
                  border: '1px solid rgba(177, 75, 244, 0.3)',
                  color: '#B14BF4',
                  cursor: 'pointer',
                }}
              >
                Set to Latest
              </button>
              <button
                onClick={() => setValue('popular')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  background: 'rgba(177, 75, 244, 0.1)',
                  border: '1px solid rgba(177, 75, 244, 0.3)',
                  color: '#B14BF4',
                  cursor: 'pointer',
                }}
              >
                Set to Popular
              </button>
            </div>
          </div>
        </section>
      </div>
    );
  },
};

// Playground - 用于交互式测试
export const Playground: Story = {
  args: {
    defaultValue: 'option1',
    disabled: false,
  },
  argTypes: {
    disabled: {
      control: 'boolean',
    },
  },
  render: (args) => (
    <Select {...args}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Select an option" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="option1">Option 1</SelectItem>
        <SelectItem value="option2">Option 2</SelectItem>
        <SelectItem value="option3">Option 3</SelectItem>
        <SelectItem value="option4">Option 4</SelectItem>
        <SelectItem value="option5">Option 5</SelectItem>
      </SelectContent>
    </Select>
  ),
};
