import { Listbox } from '@headlessui/react';
import React from 'react';

export function StyledOption({ children, ...props }: any) {
  return (
    <Listbox.Option {...props} className="px-3 py-1.5 odd:bg-gray-light even:bg-white">
      <span className="cursor-pointer transition-opacity hover:opacity-50">
        {children}
      </span>
    </Listbox.Option>
  );
}
