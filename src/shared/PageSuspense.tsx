import { Spin } from 'antd'
import { Suspense, type ReactNode } from 'react'

/**
 * Where a lazily loaded page appears. Placed around a layout's <Outlet />,
 * so opening a page the first time keeps the header, menu and rail on
 * screen and shows a spinner only where the page will be.
 */
export function PageSuspense({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="page-fallback">
          <Spin size="large" />
        </div>
      }
    >
      {children}
    </Suspense>
  )
}
