import { CloseOutlined, SearchOutlined } from '@ant-design/icons'
import { Button, Card, Col, Empty, Input, Pagination, Row, Skeleton, Tooltip } from 'antd'
import { useCallback, useState } from 'react'

import { usePreferences } from '../../../app/preferences'
import { MaterialCard } from '../../../features/materials/MaterialCard'
import { useMaterials } from '../../../features/materials/queries'
import type { MaterialsFilters } from '../../../features/materials/types'
import { ErrorAlert } from '../../../shared/ErrorAlert'
import { PageHeader } from '../../../shared/PageHeader'

const PAGE_SIZE = 12

const defaultFilters: MaterialsFilters = {
  page: 1,
  limit: PAGE_SIZE,
  published: 'true',
  sortBy: 'updatedAt',
  sortOrder: 'DESC',
}

/**
 * 학습 보조 자료 — listening files, vocabulary lists and worksheets, open to
 * everyone. The library is small, so instead of a filter bar there is one
 * magnifier that opens a search box.
 */
export function MaterialsPage() {
  const { t } = usePreferences()
  const [filters, setFilters] = useState<MaterialsFilters>(defaultFilters)
  const [searchOpen, setSearchOpen] = useState(false)

  const materials = useMaterials(filters)
  const data = materials.data
  const search = filters.search ?? ''

  const patchFilters = useCallback((patch: Partial<MaterialsFilters>) => {
    setFilters((current) => ({ ...current, ...patch, page: patch.page ?? 1 }))
  }, [])

  const closeSearch = () => {
    setSearchOpen(false)
    patchFilters({ search: '' })
  }

  return (
    <div className="page-layout">
      <PageHeader
        kicker={t('siteNav.resources')}
        title={t('pageCopy.materialsTitle')}
        description={t('pageCopy.materialsSubtitle')}
        extra={
          searchOpen ? (
            <div className="material-search">
              <Input
                autoFocus
                allowClear
                value={search}
                onChange={(event) => patchFilters({ search: event.target.value })}
                placeholder={t('materials.searchPlaceholder')}
                prefix={<SearchOutlined />}
              />
              <Button type="text" icon={<CloseOutlined />} aria-label={t('common.cancel')} onClick={closeSearch} />
            </div>
          ) : (
            <Tooltip title={t('common.search')}>
              <Button
                className="icon-button"
                icon={<SearchOutlined />}
                aria-label={t('common.search')}
                onClick={() => setSearchOpen(true)}
              />
            </Tooltip>
          )
        }
      />

      <ErrorAlert error={materials.error} fallback={t('materials.loadFailed')} />

      {materials.isPending ? (
        <Row gutter={[16, 16]}>
          {Array.from({ length: 4 }, (_, index) => (
            <Col xs={24} md={12} xl={6} key={index}>
              <Card className="surface-card material-card">
                <Skeleton active paragraph={{ rows: 4 }} />
              </Card>
            </Col>
          ))}
        </Row>
      ) : data && data.items.length > 0 ? (
        <>
          <Row gutter={[16, 16]} className={materials.isFetching ? 'is-refreshing' : undefined}>
            {data.items.map((item) => (
              <Col xs={24} md={12} xl={6} key={item.id}>
                <MaterialCard item={item} />
              </Col>
            ))}
          </Row>

          {data.total > data.limit ? (
            <div className="table-pagination">
              <Pagination
                current={data.page}
                pageSize={data.limit}
                total={data.total}
                showSizeChanger={false}
                onChange={(page) => patchFilters({ page })}
              />
            </div>
          ) : null}
        </>
      ) : (
        <Card className="surface-card empty-card">
          <Empty description={search ? t('materials.emptyFiltered') : t('materials.empty')} />
        </Card>
      )}
    </div>
  )
}
