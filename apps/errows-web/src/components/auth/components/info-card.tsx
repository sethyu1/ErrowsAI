import { useTranslation } from 'react-i18next';
import background from '@/assets/images/background/login.webp';
import { Feature } from './feature';

export function InfoCard() {
  const { t } = useTranslation();

  const features = [
    {
      icon: 'local:speak-filled',
      color: '#ec4899',
      text: t('auth.createAiFriends')
    },
    {
      icon: 'local:image-filled',
      color: '#22c55e',
      text: t('auth.generateAiImages')
    },
    {
      icon: 'local:film-filled',
      color: '#ef4444',
      text: t('auth.generateAiVideos')
    },
    {
      icon: 'local:chat-voice-filled',
      color: '#3b82f6',
      text: t('auth.chatWithoutBoundaries')
    }
  ];

  return (
    <div
      className="relative overflow-hidden h-full"
    >
      <div
        className="w-full h-full bg-cover bg-center"
        style={{ backgroundImage: `url(${background})` }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, rgba(27, 18, 39, 0) -9.18%, rgba(27, 18, 39, 0.9) 98.5%)',
          borderRadius: '0px 16px 16px 0px'
        }}
      />

      {/* 信息组件列表 */}
      <div className="absolute bottom-12 left-0 right-0 px-4">
        <div className="grid grid-cols-2 gap-3">
          {features.map((item, index) => (
            <Feature
              key={index}
              icon={item.icon}
              color={item.color}
              text={item.text}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

