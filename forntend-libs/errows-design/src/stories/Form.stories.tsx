import type { Meta, StoryObj } from '@storybook/react';
import { Form, FormItem, FormLabel, FormControl, FormDescription, FormMessage, FormField } from '../components/form.js';
import { Input } from '../components/input.js';
import { Button } from '../components/button.js';
import { useForm } from 'react-hook-form';
import { storyStyles } from './story-styles.js';

const meta: Meta<typeof Form> = {
  title: 'Components/Form',
  component: Form,
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof Form>;

// 主展示页面 - 展示所有变体
export const Overview: Story = {
  render: () => {
    const form = useForm({
      defaultValues: {
        username: '',
        email: '',
        password: '',
      },
    });

    const onSubmit = (data: any) => {
      console.log('Form submitted:', data);
      alert('Form submitted! Check console for data.');
    };

    return (
      <div style={storyStyles.container}>
        <h1 style={storyStyles.h1}>Form Component</h1>
        
        {/* Basic Form */}
        <section style={storyStyles.section}>
          <h2 style={storyStyles.h2}>Basic Form</h2>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} style={{ maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <FormField
                control={form.control}
                name="username"
                rules={{ required: 'Username is required' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your username" {...field} />
                    </FormControl>
                    <FormDescription>
                      This is your public display name.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                rules={{ 
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Enter your email" {...field} />
                    </FormControl>
                    <FormDescription>
                      We'll never share your email with anyone else.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                rules={{ 
                  required: 'Password is required',
                  minLength: {
                    value: 8,
                    message: 'Password must be at least 8 characters'
                  }
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Enter your password" {...field} />
                    </FormControl>
                    <FormDescription>
                      Must be at least 8 characters long.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit">Submit</Button>
            </form>
          </Form>
        </section>

        {/* Usage Example */}
        <section style={storyStyles.section}>
          <h2 style={storyStyles.h2}>Usage</h2>
          <pre style={storyStyles.codeBlock}>
{`import { 
  Form, 
  FormItem, 
  FormLabel, 
  FormControl, 
  FormDescription, 
  FormMessage, 
  FormField 
} from '@errows/design';
import { Input } from '@errows/design';
import { useForm } from 'react-hook-form';

function MyComponent() {
  const form = useForm({
    defaultValues: {
      username: '',
    },
  });

  const onSubmit = (data) => {
    console.log(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="username"
          rules={{ required: 'Username is required' }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="Enter username" {...field} />
              </FormControl>
              <FormDescription>
                Your public display name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
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
    const form = useForm({
      defaultValues: {
        field: '',
      },
    });

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit((data) => console.log(data))} style={{ maxWidth: '400px' }}>
          <FormField
            control={form.control}
            name="field"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Field Label</FormLabel>
                <FormControl>
                  <Input placeholder="Enter value" {...field} />
                </FormControl>
                <FormDescription>
                  This is a playground form field.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" style={{ marginTop: '16px' }}>Submit</Button>
        </form>
      </Form>
    );
  },
};
