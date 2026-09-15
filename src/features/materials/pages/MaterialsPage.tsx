import { DownloadOutlined, SearchOutlined, SyncOutlined } from '@ant-design/icons'
import { Alert, Button, Card, Col, Empty, Input, Pagination, Row, Select, Skeleton, Tag, Typography } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { useCatalog } from '../../catalog/useCatalog'
import type { MaterialListResponse } from '../../../types'
import { getMaterials } from '../api/materialsApi'
import type { MaterialsFilters } from '../types'

const { Title, Text, Paragraph } = Typography

const defaultFilters: MaterialsFilters = {
  page: 1,
  limit: 12,
  published: 'true',
  sortBy: 'updatedAt',
  sortOrder: 'DESC',
}


function formatFileSize(size?: number | null) {
  if (!size) return '—'
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

export function MaterialsPage() {
  // Read-only here: visitors pick from the catalog, only the admin edits it.
  const catalog = useCatalog()
  const [filters, setFilters] = useState<MaterialsFilters>(defaultFilters)
  const [data, setData] = useState<MaterialListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    const loadMaterials = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await getMaterials({
          ...filters,
          published: 'true',
        })
        if (active) {
          setData(response)
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load materials.')
          setData(null)
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadMaterials()

    return () => {
      active = false
    }
  }, [filters])

  const stats = useMemo(() => {
    if (!data) return null

    return {
      total: data.total,
      page: data.page,
      totalPages: data.totalPages,
    }
  }, [data])

  const updateFilter = (key: keyof MaterialsFilters, value: MaterialsFilters[keyof MaterialsFilters]) => {
    setFilters((current) => ({
      ...current,
      [key]: value,
      page: key === 'page' ? Number(value ?? 1) : 1,
    }))
  }

  const clearFilters = () => {
    setFilters(defaultFilters)
  }

  return (
    <div className="page-layout">
      <header className="page-heading">
        <Text className="section-kicker">자료실</Text>
        <Title level={1}>자료실</Title>
        <Text>학생이 필요한 교육 자료를 빠르게 찾고 안전하게 다운로드할 수 있도록 정리된 자료 보관 공간입니다.</Text>
      </header>

      <Card className="surface-card filter-card">
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Text>검색</Text>
            <Input
              size="large"
              value={filters.search ?? ''}
              onChange={(event) => updateFilter('search', event.target.value)}
              placeholder="자료를 검색하세요..."
              prefix={<SearchOutlined />}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Text>과목</Text>
            <Select size="large" allowClear placeholder="과목" value={filters.subject} onChange={(value) => updateFilter('subject', value)} options={catalog.subjects} />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Text>과정</Text>
            <Select size="large" allowClear placeholder="과정" value={filters.course} onChange={(value) => updateFilter('course', value)} options={catalog.courses} />
          </Col>
        </Row>

        <div className="filter-footer">
          <Text>{stats ? `${stats.total}개의 자료` : '자료를 불러오는 중입니다.'}</Text>
          <Button type="link" icon={<SyncOutlined />} onClick={clearFilters}>필터 초기화</Button>
        </div>
      </Card>

      {error ? (
        <Alert type="error" message="자료를 불러오지 못했습니다." description={error} showIcon />
      ) : null}

      {loading ? (
        <Row gutter={[16, 16]}>
          {Array.from({ length: 6 }).map((_, index) => (
            <Col xs={24} md={12} xl={4} key={index}>
              <Card className="surface-card material-card">
                <Skeleton active paragraph={{ rows: 4 }} />
              </Card>
            </Col>
          ))}
        </Row>
      ) : data && data.items.length > 0 ? (
        <>
          <Row gutter={[16, 16]}>
            {data.items.map((item) => (
              <Col xs={24} md={12} xl={6} key={item.id}>
                <Card className="surface-card material-card">
                  <div className="file-icon blue">
                    <DownloadOutlined />
                  </div>
                  <Tag>{item.subject}</Tag>
                  <Title level={4}>{item.title}</Title>
                  <Paragraph type="secondary">{item.description || '자료 설명이 없습니다.'}</Paragraph>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                    <Tag>{item.course}</Tag>
                  </div>
                  <Text type="secondary">등록일: {new Date(item.createdAt).toLocaleDateString('ko-KR')}</Text>
                  <Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
                    파일 크기: {formatFileSize(item.fileSize)}
                  </Text>
                  <div className="material-footer">
                    <Text type="secondary">{item.originalFileName ?? '파일 첨부'}</Text>
                    <Button type="primary" icon={<DownloadOutlined />} href={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}/materials/${item.id}/download`} target="_blank" rel="noopener noreferrer">
                      다운로드
                    </Button>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
            <Pagination
              current={data.page}
              pageSize={data.limit}
              total={data.total}
              onChange={(page) => updateFilter('page', page)}
            />
          </div>
        </>
      ) : (
        <Card className="surface-card empty-card">
          <Empty description="검색 조건에 맞는 자료가 없습니다." />
        </Card>
      )}
    </div>
  )
}
