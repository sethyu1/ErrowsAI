import { Icon } from '@/components/icon';

interface FeatureProps {
  icon: string;
  color: string;
  text: string;
}

export function Feature(props: FeatureProps) {
  const { icon, color, text } = props;

  return (
    <div
      className="h-14 backdrop-blur-sm rounded-full p-4 flex items-center space-x-2"
      style={{
        border: '1px solid rgba(255,255,255,10%)',
        background: 'rgba(44,44,56,0.7)'
      }}
    >
      <Icon size={24} icon={icon} color={color} />
      <span className="text-white text-sm font-medium">{text}</span>
    </div>
  );
}

