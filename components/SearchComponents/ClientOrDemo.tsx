import { useMeiliClient } from '@/src/context/meili';
import { Auth } from '@/src/features';
import { FC, useMemo } from 'react';

/**
 * Wraps a search UI component to use the default props if the MeiliSearch
 * client doesn't exist.
 * extraProps are passed to the component.
 */
export default function ClientOrDemo({
  connector,
  Component,
  componentProps = {},
}: {
  connector: (component: any) => any;
  Component: FC<any>;
  componentProps?: Record<string, any>;
}) {
  const userId = Auth.useAuthProperty('uid');
  const { client } = useMeiliClient();

  // needs to be its own memoed component to preserve component state
  const ShowComponent = useMemo(
    () => (client && userId ? connector(Component) : Component),
    [client, userId, Component, connector],
  );

  return <ShowComponent {...componentProps} />;
}

