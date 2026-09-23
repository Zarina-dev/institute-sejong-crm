import { SearchOutlined, SyncOutlined } from '@ant-design/icons'
import { Button, Card, Col, Empty, Input, Pagination, Row, Select, Skeleton, Typography } from 'antd'
import { useCallback, useState } from 'react'

import { usePreferences } from '../../../app/preferences'
import { filterCourseOption, useCourseOptions } from '../../../features/courses/useCourseOptions'
import { MaterialCard } from '../../../features/materials/MaterialCard'
import { useMaterials } from '../../../features/materials/queries'
import type { MaterialsFilters } from '../../../features/materials/types'
import { ErrorAlert } from '../../../shared/ErrorAlert'
import { PageHeader } from '../../../shared/PageHeader'

const { Text } = Typography

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
 * everyone (the site has no student accounts). Only published rows are
 * served to visitors; the API enforces that, the filter here is a hint.
 */
export function MaterialsPage() {
  const { t } = usePreferences()
  const { courseOptions, subjectOptions } = useCourseOptions(true)

  const [filters, setFilters] = useState<MaterialsFilters>(defaultFilters)
  const materials = useMaterials(filters)
  const data = materials.data

  const patchFilters = useCallback((patch: Partial<MaterialsFilters>) => {
    setFilters((current) => ({ ...current, ...patch, page: patch.page ?? 1 }))
  }, [])

  const filtersActive = Boolean(filters.search || filters.subject || filters.courseId)

  return (
    <div className="page-layout">
      <PageHeader kicker={t('siteNav.resources')} title={t('pageCopy.materialsTitle')} description={t('pageCopy.materialsSubtitle')} />

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
              options={subjectOptions}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Text>{t('materials.course')}</Text>
            <Select
              size="large"
              allowClear
              showSearch
              filterOption={filterCourseOption}
              placeholder={t('materials.course')}
              value={filters.courseId}
              onChange={(value) => patchFilters({ courseId: value })}
              options={courseOptions}
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
              <Pagination current={data.page} pageSize={data.limit} total={data.total} showSizeChanger={false} onChange={(page) => patchFilters({ page })} />
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