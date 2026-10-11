'use client';

import { usePathname } from 'next/navigation';
import Page from '../page';

export default function RoutedPage() {
  const pathname = usePathname();
  return <Page key={pathname} />;
}