import {
  ToggleGroup,
  ToggleGroupItem,
} from '@errows/design/components/toggle-group';
import { cn } from '@errows/design/lib/utils';

export function Select(
  props: React.ComponentProps<typeof ToggleGroup> & {
    options: { label: string; value: string }[];
    itemClassName?: string;
  }
) {
  const {
    options = [],
    spacing = 2,
    itemClassName,
    ...rest
  } = props;

  return (
    <ToggleGroup spacing={spacing} {...rest}>
      {options.map(item => {
        return (
          <ToggleGroupItem
            key={item.value}
            value={item.value}
            className={cn(
              'bg-[#1D1E27] rounded-full border border-[#2C2C38]',
              'hover:bg-[#1D1E27] hover:text-white',
              'data-[state=on]:bg-white data-[state=on]:text-black',
              itemClassName,
            )}
          >
            {item.label}
          </ToggleGroupItem>
        )
      })}
    </ToggleGroup>
  )
}
