import { Button } from '@errows/design/components/button';
import { Spinner } from '@errows/design/components/spinner';
import { useGoogleLogin } from '@react-oauth/google';
import { Icon } from '@/components/icon';
import { useOAuth } from '@/services/auth';

const authList = [
  {
    key: 'google',
    icon: <Icon size={24} icon="local:google" />,
    label: 'Google',
  },
  // {
  //   key: 'discord',
  //   icon: <Icon size={24} icon="local:discord" color="#7289DA" />,
  //   label: 'Discord',
  // },
  // {
  //   key: 'apple',
  //   icon: <Icon size={24} icon="local:apple" className="text-white" />,
  //   label: 'Apple',
  // },
  // {
  //   key: 'twitter',
  //   icon: <Icon size={24} icon="local:twitter" className="text-white" />,
  //   label: 'X',
  // },
]

export function OAuthProviders() {
  const { googleLogin: googleOAuthLogin, loading: googleOAuthLoading } = useOAuth();
  const googleLogin = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      const { access_token } = tokenResponse;
      googleOAuthLogin({ access_token });
    },
    onError: () => {
      console.log('Login Failed');
    },
  });

  const onOAuthLogin = (key: string) => {
    if (key === 'google') {
      googleLogin();
    }
  }

  return (
    <div className="mb-6">
      {authList.map(item => {
        return (
          <Button
            key={item.key}
            variant="outline"
            className="h-11 cursor-pointer gap-4 rounded-full border-0 opacity-70 text-white w-full justify-center text-left"
            style={{
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(2px)',
              background: '#2C2C38'
            }}
            onClick={() => onOAuthLogin(item.key)}
            disabled={googleOAuthLoading}
          >
            {googleOAuthLoading && <Spinner className="mr-2" />}
            {item.icon}
            <span className="font-medium">{item.label}</span>
          </Button>
        )
      })}
    </div>
  );
}
