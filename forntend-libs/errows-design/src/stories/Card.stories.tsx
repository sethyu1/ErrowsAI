import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, CardAction } from '../components/card.js';
import { Button } from '../components/button.js';
import { storyStyles } from './story-styles.js';

const meta: Meta<typeof Card> = {
  title: 'Components/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof Card>;

// 主展示页面 - 展示所有变体
export const Overview: Story = {
  render: () => (
    <div style={storyStyles.container}>
      <h1 style={storyStyles.h1}>Card Component</h1>
      
      {/* Basic Card */}
      <section style={storyStyles.section}>
        <h2 style={storyStyles.h2}>Basic Card</h2>
        <Card style={{ maxWidth: '400px' }}>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>This is a card description that provides additional context.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>This is the main content area of the card. You can put any content here.</p>
          </CardContent>
          <CardFooter>
            <Button variant="outline">Cancel</Button>
            <Button>Confirm</Button>
          </CardFooter>
        </Card>
      </section>

      {/* Card with Action */}
      <section style={storyStyles.section}>
        <h2 style={storyStyles.h2}>Card with Action</h2>
        <Card style={{ maxWidth: '400px' }}>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>You have 3 unread messages.</CardDescription>
            <CardAction>
              <Button variant="ghost" size="sm">Mark all as read</Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '8px' }}>
                <strong>New message from John</strong>
                <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>Hey, how are you doing?</p>
              </div>
              <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '8px' }}>
                <strong>System Update</strong>
                <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>Your system has been updated.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Simple Card */}
      <section style={storyStyles.section}>
        <h2 style={storyStyles.h2}>Simple Card</h2>
        <Card style={{ maxWidth: '400px' }}>
          <CardContent>
            <p>A simple card with just content, no header or footer.</p>
          </CardContent>
        </Card>
      </section>

      {/* Usage Example */}
      <section style={storyStyles.section}>
        <h2 style={storyStyles.h2}>Usage</h2>
        <pre style={storyStyles.codeBlock}>
{`import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from '@errows/design';

function MyComponent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card description</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Card content goes here</p>
      </CardContent>
      <CardFooter>
        <Button>Action</Button>
      </CardFooter>
    </Card>
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
    <Card style={{ maxWidth: '400px' }}>
      <CardHeader>
        <CardTitle>Playground Card</CardTitle>
        <CardDescription>Customize this card in the controls panel</CardDescription>
      </CardHeader>
      <CardContent>
        <p>This is a playground card for testing.</p>
      </CardContent>
      <CardFooter>
        <Button>Action</Button>
      </CardFooter>
    </Card>
  ),
};
