import React from 'react';
import { useNavigate } from 'react-router';
import { LoginFormPage, ProFormText } from '@ant-design/pro-components';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { message } from 'antd';
import { TOKEN_KEY } from '@/constants';
import { useAuthStore } from '@/stores/auth';
import { loginApi } from '@/apis';

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);

  async function handleFinish(values: { email: string; password: string; remember?: boolean }) {
    try {
      setLoading(true);
      const res = await loginApi(values);
      useAuthStore.setState({ token: res.token });
      localStorage.setItem(TOKEN_KEY, res.token);
      message.success('登录成功');
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 200);
    } catch (error: any) {
      if(error.code === 400) {
        message.error('用户名或密码错误');
      } else {
        message.error('登录失败');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <LoginFormPage
      logo="/logo.png"
      style={{ height: '100vh' }}
      title="Errows Console"
      subTitle="AI 管理平台"
      onFinish={handleFinish}
      submitter={{ searchConfig: { submitText: loading ? '登录中...' : '登录' } }}
      loading={loading}
      backgroundVideoUrl="https://gw.alipayobjects.com/v/huamei_gcee1x/afts/video/jXRBRK_VAwoAAAAAAAAAAAAAK4eUAQBr"
      // backgroundImageUrl="https://gw.alipayobjects.com/mdn/rms_oa5vxa/afts/img/A*B8bkR7GSRvIAAAAAAAAAAABkARQnAQ"
    >
      <ProFormText
        name="email"
        fieldProps={{ size: 'large', prefix: <UserOutlined /> }}
        placeholder="请输入邮箱"
        rules={[
          { required: true, message: '请输入邮箱' },
          { type: 'email', message: '邮箱格式不正确' },
        ]}
      />
      <ProFormText.Password
        name="password"
        fieldProps={{ size: 'large', prefix: <LockOutlined /> }}
        placeholder="请输入密码"
        rules={[
          { required: true, message: '请输入密码' },
          { min: 6, message: '密码至少6位' },
        ]}
      />
    </LoginFormPage>
  );
}
