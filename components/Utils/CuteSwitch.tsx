import { Switch } from '@headlessui/react';
import { classNames } from '../../src/utils/styles';

export function CuteSwitch({ enabled, onChange, size = 'md' }: {
  enabled: boolean;
  onChange: (checked: boolean) => void;
  size?: 'sm' | 'md';
}): JSX.Element {
  // Code from https://headlessui.dev/react/switch
  return (
    <Switch
      checked={enabled}
      onChange={onChange}
      className={classNames(
        enabled ? 'bg-blue-primary/80' : 'bg-blue-secondary/80',
        'relative inline-flex items-center',
        size === 'md' ? 'h-[28px] w-[64px]' : 'h-[24px] w-[48px]',
        'border-2 border-transparent rounded-full cursor-pointer',
        'transition-colors ease-in-out duration-500',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary/80',
      )}
    >
      {/* the actual circle part */}
      <span
        aria-hidden="true"
        className={classNames(
          enabled && (size === 'md' ? 'translate-x-9' : 'translate-x-6'),
          enabled ? 'bg-gray-secondary' : 'translate-x-0 bg-gray-primary',
          'pointer-events-none rounded-full',
          size === 'md' ? 'h-[24px] w-[24px]' : 'h-[20px] w-[20px]',
          'shadow-lg transform ring-0',
          'transition ease-in-out duration-200',
        )}
      />
    </Switch>
  );
}
