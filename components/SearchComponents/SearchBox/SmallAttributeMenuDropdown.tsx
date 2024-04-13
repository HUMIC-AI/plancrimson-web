import { Menu } from '@headlessui/react';
import { FaTimes, FaBars } from 'react-icons/fa';
import React, { Fragment } from 'react';
import { ATTRIBUTE_DESCRIPTIONS, meiliAttributes } from '@/src/lib';
import type { Class } from '@/src/lib';
import { classNames } from '@/src/utils/styles';
import Attribute from '../AttributeMenu/Attribute';

/**
 * Used on small screens. See AttributeMenu for large screens.
 */
export function SmallAttributeMenuDropdown() {
  return (
    <div className="relative h-full">
      <Menu as={Fragment}>
        {({ open }) => (
          <>
            <Menu.Button className="secondary interactive h-full rounded p-2">
              {open ? <FaTimes /> : <FaBars />}
            </Menu.Button>

            <Menu.Items
              unmount={false}
              className={classNames(
                'absolute z-20 mt-2 right-0 w-48 p-2 dark-gradient rounded-md',
                'space-y-2 text-white',
              )}
            >
              {meiliAttributes.filterableAttributes.map((attr) => (
                <Menu.Item key={attr}>
                  <Attribute
                    attribute={attr}
                    key={attr}
                    label={ATTRIBUTE_DESCRIPTIONS[attr as keyof Class] || attr}
                    showSubjectColor={false}
                  />
                </Menu.Item>
              ))}
              <p className="p-1 text-xs text-white">
                If filters are not showing up, clear your search and try
                again.
              </p>
            </Menu.Items>
          </>
        )}
      </Menu>
    </div>
  );
}
