import { GalaxyIcon } from '@errows/icons';

interface LevelProps extends React.HTMLAttributes<HTMLDivElement> {
  text?: string;
}

export function Level(props: LevelProps) {
  const { className, text, ...rest } = props;

  return (
    <div className={className} {...rest}>
      <GalaxyIcon className="size-11.5" />
      <div>{text}</div>
    </div>
  )
}
