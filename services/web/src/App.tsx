import { Link } from '@/components/Link';
import { useRoute } from '@/hooks/useRoute';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { StateBox } from '@/components/StateBox';
import { buttonClasses } from '@/components/Button';
import { CataloguePage } from '@/pages/CataloguePage';
import { ToastProvider } from '@/components/ToastProvider';

import type { ReactNode } from 'react';

function renderRoute(route: string): ReactNode {
  if (route === '/') {
    return <CataloguePage />;
  }

  return (
    <StateBox
      kind="not-found"
      title="Page not found"
      description="This page does not exist."
      action={
        <Link href="/" className={buttonClasses({ variant: 'secondary' })}>
          Back to the catalogue
        </Link>
      }
    />
  );
}

export function App() {
  const route = useRoute();

  return (
    <ToastProvider>
      <div className="flex min-h-screen flex-col">
        <Header route={route} />
        <main className="mx-auto w-full max-w-[1160px] flex-1 px-5 pt-8 pb-16">
          {renderRoute(route)}
        </main>
        <Footer />
      </div>
    </ToastProvider>
  );
}
