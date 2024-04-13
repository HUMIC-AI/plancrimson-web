import { Switch } from '@headlessui/react';
import { classNames } from '../../src/utils/styles';

export function CuteSwitch({ enabled, onChange }: {
  enabled: boolean;
  onChange: (checked: boolean) => void;
}): JSX.Element {
  // Code from https://headlessui.dev/react/switch
  return (
    <Switch
      checked={enabled}
      onChange={onChange}
      className={classNames(
        enabled ? 'bg-blue-primary/80' : 'bg-blue-secondary/80',
        'relative inline-flex items-center h-[28px] w-[64px]',
        'border-2 border-transparent rounded-full cursor-pointer',
        'transition-colors ease-in-out duration-500',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary/80',
      )}
    >
      {/* the actual circle part */}
      <span
        aria-hidden="true"
        className={classNames(
          enabled ? 'translate-x-9 bg-gray-secondary' : 'translate-x-0 bg-gray-primary',
          'pointer-events-none h-[24px] w-[24px] rounded-full',
          'shadow-lg transform ring-0',
          'transition ease-in-out duration-200',
        )}
      />
    </Switch>
  );
}
