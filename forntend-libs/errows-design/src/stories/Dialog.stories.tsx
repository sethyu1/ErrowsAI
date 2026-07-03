import type { Meta, StoryObj } from '@storybook/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/dialog.js';
import { Button } from '../components/button.js';
import { useState } from 'react';
import { storyStyles } from './story-styles.js';

const meta: Meta<typeof Dialog> = {
  title: 'Components/Dialog',
  component: Dialog,
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof Dialog>;

// 主展示页面 - 展示所有变体
export const Overview: Story = {
  render: () => {
    const [open1, setOpen1] = useState(false);
    const [open2, setOpen2] = useState(false);
    const [open3, setOpen3] = useState(false);

    return (
      <div style={storyStyles.container}>
        <h1 style={storyStyles.h1}>Dialog Component</h1>
        
        {/* Basic Dialog */}
        <section style={storyStyles.section}>
          <h2 style={storyStyles.h2}>Basic Dialog</h2>
          <Button onClick={() => setOpen1(true)}>Open Basic Dialog</Button>
          
          <Dialog open={open1} onOpenChange={setOpen1}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Basic Dialog</DialogTitle>
                <DialogDescription>
                  This is a basic dialog with a title and description.
                </DialogDescription>
              </DialogHeader>
              <div style={{ padding: '20px 0', color: '#e5e7eb' }}>
                <p>Dialog content goes here. You can add any content you want.</p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <Button variant="outline" onClick={() => setOpen1(false)}>Cancel</Button>
                <Button onClick={() => setOpen1(false)}>Confirm</Button>
              </div>
            </DialogContent>
          </Dialog>
        </section>

        {/* Confirmation Dialog */}
        <section style={storyStyles.section}>
          <h2 style={storyStyles.h2}>Confirmation Dialog</h2>
          <Button variant="destructive" onClick={() => setOpen2(true)}>Delete Item</Button>
          
          <Dialog open={open2} onOpenChange={setOpen2}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Are you sure?</DialogTitle>
                <DialogDescription>
                  This action cannot be undone. This will permanently delete your item.
                </DialogDescription>
              </DialogHeader>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                <Button variant="outline" onClick={() => setOpen2(false)}>Cancel</Button>
                <Button variant="destructive" onClick={() => setOpen2(false)}>Delete</Button>
              </div>
            </DialogContent>
          </Dialog>
        </section>

        {/* Form Dialog */}
        <section style={storyStyles.section}>
          <h2 style={storyStyles.h2}>Form Dialog</h2>
          <Button onClick={() => setOpen3(true)}>Open Form Dialog</Button>
          
          <Dialog open={open3} onOpenChange={setOpen3}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Profile</DialogTitle>
                <DialogDescription>
                  Make changes to your profile here. Click save when you're done.
                </DialogDescription>
              </DialogHeader>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px 0' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#e5e7eb' }}>
                    Name
                  </label>
                  <input 
                    type="text" 
                    placeholder="Enter your name"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #4b5563',
                      borderRadius: '6px',
                      fontSize: '14px',
                      background: '#374151',
                      color: '#fff'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#e5e7eb' }}>
                    Email
                  </label>
                  <input 
                    type="email" 
                    placeholder="Enter your email"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #4b5563',
                      borderRadius: '6px',
                      fontSize: '14px',
                      background: '#374151',
                      color: '#fff'
                    }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <Button variant="outline" onClick={() => setOpen3(false)}>Cancel</Button>
                <Button onClick={() => setOpen3(false)}>Save Changes</Button>
              </div>
            </DialogContent>
          </Dialog>
        </section>

        {/* Usage Example */}
        <section style={storyStyles.section}>
          <h2 style={storyStyles.h2}>Usage</h2>
          <pre style={storyStyles.codeBlock}>
{`import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@errows/design';
import { useState } from 'react';

function MyComponent() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Open Dialog</Button>
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dialog Title</DialogTitle>
            <DialogDescription>
              Dialog description goes here
            </DialogDescription>
          </DialogHeader>
          <div>Dialog content</div>
        </DialogContent>
      </Dialog>
    </>
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
    const [open, setOpen] = useState(false);

    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Dialog</Button>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Playground Dialog</DialogTitle>
              <DialogDescription>
                This is a playground dialog for testing.
              </DialogDescription>
            </DialogHeader>
            <div style={{ padding: '20px 0', color: '#e5e7eb' }}>
              <p>Customize this dialog in the controls panel.</p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={() => setOpen(false)}>Confirm</Button>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  },
};
