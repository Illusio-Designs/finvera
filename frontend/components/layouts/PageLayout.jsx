import Head from 'next/head';
import Breadcrumbs from '../ui/Breadcrumbs';

export default function PageLayout({
  children,
  title,
  breadcrumbs = [],
  actions,
  className = '',
}) {
  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>
      <div className={`space-y-6 ${className}`}>
        {/* Header with breadcrumbs and actions */}
        {(breadcrumbs.length > 0 || actions || title) && (
          <div className="flex items-center justify-between">
            <div className="flex-1">
              {breadcrumbs.length > 0 && <Breadcrumbs items={breadcrumbs} />}
              {title && (
                <h1 className="mt-2 text-2xl font-bold text-gray-900">{title}</h1>
              )}
            </div>
            {actions && <div className="flex items-center space-x-2">{actions}</div>}
          </div>
        )}

        {/* Content */}
        {children}
      </div>
    </>
  );
}

