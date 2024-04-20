import { useMeiliClient } from '@/src/context/meili';
import { Auth } from '@/src/features';
import { ComponentType, useMemo } from 'react';

/**
 * Wraps a search UI component to use the default props if the MeiliSearch
 * client doesn't exist.
 * extraProps are passed to the component.
 * Most of the time these are left empty and the component uses its default props.
 */
export default function useClientOrDemo<Provided, Exposed>(
  connector: (component: ComponentType<Provided & Exposed>) => ComponentType<Exposed>,
  Component: ComponentType<Provided & Exposed>,
) {
  const userId = Auth.useAuthProperty('uid');
  const { client } = useMeiliClient();

  // needs to be its own memoed component to preserve component state
  const ShowComponent: ComponentType<Exposed> = useMemo(
    () => (client && userId ? connector(Component) : Component as ComponentType<Exposed>),
    [Component, connector, client, userId],
  );

  return ShowComponent;
}
