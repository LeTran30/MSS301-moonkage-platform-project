import { lazy, Suspense, type ComponentType } from 'react';
import { LoadingState } from '../shared/ui';

/** Element of a lazily loaded page: each page is its own chunk; `name` is the page's named export. */
export function page<K extends string>(load: () => Promise<Record<K, ComponentType>>, name: K) {
  const Page = lazy(async () => ({ default: (await load())[name] as ComponentType }));
  return (
    <Suspense fallback={<LoadingState />}>
      <Page />
    </Suspense>
  );
}
