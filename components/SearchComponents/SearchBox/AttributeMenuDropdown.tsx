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
    <div className="relative">
      <Menu as={Fragment}>
        {({ open }) => (
          <>
            <Menu.Button className="inset-y-0 right-0 flex items-center">
              {open ? (
                <FaTimes className="h-5 w-5 text-gray-dark" />
              ) : (
                <FaBars className="h-5 w-5 text-gray-dark" />
              )}
            </Menu.Button>
            <Menu.Items
              unmount={false}
              className={classNames(
                'absolute z-20 mt-2 right-0 w-48 p-2 dark-gradient rounded-md',
                'flex flex-col space-y-2 text-white',
              )}
            >
              {meiliAttributes.filterableAttributes.map((attr) => (
                <Menu.Item>
                  <Attribute
                    attribute={attr}
                    key={attr}
                    label={ATTRIBUTE_DESCRIPTIONS[attr as keyof Class] || attr}
                    showSubjectColor={false}
                  />
                </Menu.Item>
              ))}
              <span className="p-1 text-xs text-white">
                If filters are not showing up, clear your search and try
                again.
              </span>
            </Menu.Items>
          </>
        )}
      </Menu>
    </div>
  );
}
