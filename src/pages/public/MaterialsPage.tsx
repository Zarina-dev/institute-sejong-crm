import { SearchOutlined, SyncOutlined } from '@ant-design/icons'
import { Button, Card, Col, Empty, Input, Pagination, Row, Select, Skeleton, Typography } from 'antd'
import { useCallback, useState } from 'react'

import { usePreferences } from '../../app/preferences'
import { useCatalog } from '../../features/catalog/useCatalog'
import { MaterialCard } from '../../features/materials/MaterialCard'
import { useMaterials } from '../../features/materials/queries'
import type { MaterialsFilters } from '../../features/materials/types'
import { ErrorAlert } from '../../shared/ErrorAlert'
import { PageHeader } from '../../shared/PageHeader'

const { Text } = Typography

const PAGE_SIZE = 12

const defaultFilters: MaterialsFilters = {
  page: 1,
  limit: PAGE_SIZE,
  published: 'true',
  sortBy: 'updatedAt',
  sortOrder: 'DESC',
}

export function MaterialsPage() {
  const { t } = usePreferences()
  // Read-only here: visitors pick from the catalog, only the admin edits it.
  const catalog = useCatalog()
  const [filters, setFilters] = useState<MaterialsFilters>(defaultFilters)

  const materials = useMaterials(filters)
  const data = materials.data

  const patchFilters = useCallback((patch: Partial<MaterialsFilters>) => {
    setFilters((current) => ({ ...current, ...patch, page: patch.page ?? 1 }))
  }, [])

  const filtersActive = Boolean(filters.search || filters.subject || filters.course)

  return (
    <div className="page-layout">
      <PageHeader kicker={t('nav.materials')} title={t('materials.title')} description={t('materials.subtitle')} />

      <Card className="surface-card filter-card">
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Text>{t('common.search')}</Text>
            <Input
              size="large"
              allowClear
              value={filters.search ?? ''}
              onChange={(event) => patchFilters({ search: event.target.value })}
              placeholder={t('materials.searchPlaceholder')}
              prefix={<SearchOutlined />}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Text>{t('materials.subject')}</Text>
            <Select
              size="large"
              allowClear
              placeholder={t('materials.subject')}
              value={filters.subject}
              onChange={(value) => patchFilters({ subject: value })}
              options={catalog.subjects}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Text>{t('materials.course')}</Text>
            <Select
              size="large"
              allowClear
              placeholder={t('materials.course')}
              value={filters.course}
              onChange={(value) => patchFilters({ course: value })}
              options={catalog.courses}
            />
          </Col>
        </Row>

        <div className="filter-footer">
          <Text>{data ? t('materials.count', { count: data.total }) : t('materials.loadingCount')}</Text>
          {filtersActive ? (
            <Button type="link" icon={<SyncOutlined />} onClick={() => setFilters(defaultFilters)}>
              {t('common.resetFilters')}
            </Button>
          ) : null}
        </div>
      </Card>

      <ErrorAlert error={materials.error} title={t('materials.loadFailed')} fallback={t('materials.loadFailedHint')} />

      {materials.isPending ? (
        <Row gutter={[16, 16]}>
          {Array.from({ length: 8 }, (_, index) => (
            <Col xs={24} md={12} xl={6} key={index}>
              <Card className="surface-card material-card">
                <Skeleton active paragraph={{ rows: 4 }} />
              </Card>
            </Col>
          ))}
        </Row>
      ) : data && data.items.length > 0 ? (
        <>
          {/* Dimmed, not replaced, while the next page is on its way. */}
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
          <Empty description={filtersActive ? t('materials.emptyFiltered') : t('materials.empty')} />
        </Card>
      )}
    </div>
  )
}
