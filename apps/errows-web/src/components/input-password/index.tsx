import React from 'react';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@errows/design/components/input-group';
import { cn } from '@errows/design/lib/utils';
import { EyeIcon, EyeInvisibleIcon } from '@errows/icons';

interface InputPasswordProps extends React.ComponentProps<'input'> {
  defaultShowPassword?: boolean;
}

export function InputPassword(props: InputPasswordProps) {
  const { defaultShowPassword = false, className, ...rest } = props;
  const [showPassword, setShowPassword] = React.useState(defaultShowPassword);

  const changeShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <InputGroup className="rounded-full dark:bg-[rgba(9,10,10,1)]">
      <InputGroupInput
        placeholder="Password"
        className={cn('dark:bg-transparent', className)}
        {...rest}
        type={showPassword ? 'text' : 'password'}
      />
      <InputGroupAddon className="inline-end">
        <div className="cursor-pointer" onClick={changeShowPassword}>
          {showPassword ? (
            <EyeIcon className="text-white size-5" aria-hidden="true" />
          ) : (
            <EyeInvisibleIcon className="text-white size-5" aria-hidden="true" />
          )}
        </div>
      </InputGroupAddon>
    </InputGroup>
  )
}
