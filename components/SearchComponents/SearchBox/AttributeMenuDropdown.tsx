import { Disclosure } from '@headlessui/react';
import { FaTimes, FaBars } from 'react-icons/fa';
import React, { Fragment } from 'react';
import { ATTRIBUTE_DESCRIPTIONS, meiliAttributes } from 'plancrimson-utils';
import type { Class } from 'plancrimson-utils';
import { classNames } from '@/src/utils';
import Attribute from '../AttributeMenu/Attribute';

export function AttributeMenuDropdown() {
  return (
    <div className="relative">
      <Disclosure as={Fragment}>
        {({ open }) => (
          <>
            <Disclosure.Button className="inset-y-0 right-0 flex items-center">
              {open ? (
                <FaTimes className="h-5 w-5 text-gray-dark" />
              ) : (
                <FaBars className="h-5 w-5 text-gray-dark" />
              )}
            </Disclosure.Button>
            <Disclosure.Panel
              unmount={false}
              className={classNames(
                'absolute z-20 mt-2 right-0 w-48 p-2 dark-gradient rounded-md',
                'flex flex-col space-y-2',
              )}
            >
              {meiliAttributes.filterableAttributes.map((attr) => (
                <Attribute
                  attribute={attr}
                  key={attr}
                  label={ATTRIBUTE_DESCRIPTIONS[attr as keyof Class] || attr}
                  showSubjectColor={false}
                />
              ))}
              <span className="p-1 text-xs text-white">
                If filters are not showing up, clear your search and try
                again.
              </span>
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>
    </div>
  );
}