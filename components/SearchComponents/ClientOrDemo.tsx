import { useMeiliClient } from '@/src/context/meili';
import { useMemo } from 'react';

/**
 * Wraps a search component to use the default props if the MeiliSearch
 * client doesn't exist.
 */
export default function ClientOrDemo({
  connector,
  component,
  extraProps = {},
}: {
  connector: (component: any) => any;
  component: any;
  extraProps?: Record<string, any>;
}) {
  const { client } = useMeiliClient();

  const Component = useMemo(() => (client ? connector(component) : component), [client, component, connector]);

  return <Component {...extraProps} />;
}

