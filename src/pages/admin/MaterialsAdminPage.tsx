import { DeleteOutlined, EyeInvisibleOutlined, EyeOutlined, PlusOutlined, ReloadOutlined, SearchOutlined, UploadOutlined } from '@ant-design/icons'
import { Alert, Button, Card, Col, Empty, Form, Input, Modal, Pagination, Row, Select, Space, Table, Tag, Typography, Upload } from 'antd'
import { useCallback, useEffect, useState } from 'react'
import { createMaterial, deleteMaterial, getMaterials, publishMaterial, unpublishMaterial, updateMaterial } from '../../features/materials/api/materialsApi'
import type { MaterialsFilters } from '../../features/materials/types'
import { EditableSelect } from '../../features/catalog/EditableSelect'
import { useCatalog } from '../../features/catalog/useCatalog'
import { useConfirmDelete } from '../../shared/useConfirmDelete'
import type { MaterialListResponse } from '../../types'

const { Title, Text } = Typography

const defaultFilters: MaterialsFilters = {
  page: 1,
  limit: 10,
  published: 'all',
  sortBy: 'updatedAt',
  sortOrder: 'DESC',
}


export function MaterialsAdminPage() {
  const catalog = useCatalog()
  const confirmDelete = useConfirmDelete()
  const [filters, setFilters] = useState<MaterialsFilters>(defaultFilters)
  const [data, setData] = useState<MaterialListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [form] = Form.useForm()

  const loadMaterials = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await getMaterials(filters)
      setData(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : '자료를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    void loadMaterials()
  }, [loadMaterials])

  const resetFilters = () => setFilters(defaultFilters)
  const filtersActive =
    Boolean(filters.search) || Boolean(filters.subject) || Boolean(filters.course)

  const openCreateModal = () => {
    setEditingId(null)
    form.resetFields()
    setFile(null)
    setModalOpen(true)
  }

  const openEditModal = (record: MaterialListResponse['items'][number]) => {
    setEditingId(record.id)
    form.setFieldsValue({
      title: record.title,
      description: record.description,
      subject: record.subject,
      course: record.course,
      isPublished: record.isPublished,
    })
    setModalOpen(true)
  }

  const submitForm = async () => {
    const values = await form.validateFields()

    try {
      if (editingId) {
        await updateMaterial(editingId, values)
      } else {
        const formData = new FormData()
        Object.entries(values).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            formData.append(key, String(value))
          }
        })

        if (file) {
          formData.append('file', file)
        }

        await createMaterial(formData)
      }

      setModalOpen(false)
      form.resetFields()
      setFile(null)
      await loadMaterials()
    } catch (err) {
      setError(err instanceof Error ? err.message : '자료 저장에 실패했습니다.')
    }
  }

  const handlePublish = async (id: string) => {
    await publishMaterial(id)
    await loadMaterials()
  }

  const handleUnpublish = async (id: string) => {
    await unpublishMaterial(id)
    await loadMaterials()
  }

  const handleDelete = (record: MaterialListResponse['items'][number]) => {
    confirmDelete({
      target: record.title,
      onConfirm: async () => {
        try {
          await deleteMaterial(record.id)
          await loadMaterials()
        } catch (err) {
          setError(err instanceof Error ? err.message : '자료 삭제에 실패했습니다.')
        }
      },
    })
  }

  const columns = [
    { title: '제목', dataIndex: 'title', key: 'title', render: (value: string) => <strong>{value}</strong> },
    { title: '과목', dataIndex: 'subject', key: 'subject' },
    { title: '과정', dataIndex: 'course', key: 'course' },
    {
      title: '공개 상태',
      dataIndex: 'isPublished',
      key: 'isPublished',
      render: (value: boolean) => <Tag color={value ? 'green' : 'gold'}>{value ? '공개' : '비공개'}</Tag>,
    },
    {
      title: '관리',
      key: 'actions',
      render: (_: unknown, record: MaterialListResponse['items'][number]) => (
        <Space>
          <Button size="small" onClick={() => openEditModal(record)}>수정</Button>
          {record.isPublished ? (
            <Button size="small" onClick={() => handleUnpublish(record.id)} icon={<EyeInvisibleOutlined />}>숨김</Button>
          ) : (
            <Button size="small" onClick={() => handlePublish(record.id)} icon={<EyeOutlined />}>공개</Button>
          )}
          <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)}>삭제</Button>
        </Space>
      ),
    },
  ]

  return (
    <div className="page-layout">
      <header className="page-heading">
        <Text className="section-kicker">ADMIN</Text>
        <Title level={1}>자료실 관리</Title>
        <Text>관리자가 자료를 업로드하고 공개 상태를 제어할 수 있는 간단한 관리 화면입니다.</Text>
      </header>

      <Card className="surface-card filter-card">
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Text>검색</Text>
            <Input value={filters.search ?? ''} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value, page: 1 }))} placeholder="자료 제목/설명 검색" prefix={<SearchOutlined />} />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Text>과목</Text>
            <EditableSelect kind="subjects" options={catalog.subjects} allowClear placeholder="과목" addPlaceholder="새 과목 이름" value={filters.subject} onChange={(value) => setFilters((current) => ({ ...current, subject: value, page: 1 }))} />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Text>과정</Text>
            <EditableSelect kind="courses" options={catalog.courses} allowClear placeholder="과정" addPlaceholder="새 과정 이름" value={filters.course} onChange={(value) => setFilters((current) => ({ ...current, course: value, page: 1 }))} />
          </Col>
        </Row>

        <div className="filter-footer">
          <Text>{data ? `${data.total}개의 자료` : '자료를 불러오는 중입니다.'}</Text>
          <Space>
            {filtersActive ? (
              <Button type="link" icon={<ReloadOutlined />} onClick={resetFilters}>필터 초기화</Button>
            ) : null}
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>자료 추가</Button>
          </Space>
        </div>
      </Card>

      {error ? <Alert type="error" message={error} showIcon /> : null}

      {loading ? (
        <Card className="surface-card"><Empty description="자료를 불러오는 중입니다..." /></Card>
      ) : data && data.items.length > 0 ? (
        <>
          <Table className="admin-table" columns={columns} dataSource={data.items} rowKey="id" pagination={false} scroll={{ x: 1100 }} />
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
            <Pagination current={data.page} pageSize={data.limit} total={data.total} onChange={(page) => setFilters((current) => ({ ...current, page }))} />
          </div>
        </>
      ) : (
        <Card className="surface-card empty-card"><Empty description="등록된 자료가 없습니다." /></Card>
      )}

      <Modal
        title={editingId ? '자료 수정' : '자료 추가'}
        open={modalOpen}
        onOk={submitForm}
        onCancel={() => setModalOpen(false)}
        okText={editingId ? '저장' : '업로드'}
        cancelText="취소"
        width={720}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="자료 제목" rules={[{ required: true, message: '자료 제목을 입력하세요.' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="설명">
            <Input.TextArea rows={4} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="subject" label="과목" rules={[{ required: true, message: '과목을 선택하세요.' }]}>
                <EditableSelect kind="subjects" options={catalog.subjects} placeholder="과목 선택" addPlaceholder="새 과목 이름" selectOnAdd />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="course" label="과정" rules={[{ required: true, message: '과정을 선택하세요.' }]}>
                <EditableSelect kind="courses" options={catalog.courses} placeholder="과정 선택" addPlaceholder="새 과정 이름" selectOnAdd />
              </Form.Item>
            </Col>
          </Row>
          {!editingId ? (
            <Form.Item label="파일 업로드">
              <Upload
                beforeUpload={(fileItem) => {
                  setFile(fileItem)
                  return false
                }}
                maxCount={1}
                showUploadList={false}
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.mp4,.webm,.txt"
              >
                <Button icon={<UploadOutlined />} type="default">
                  {file ? `선택된 파일: ${file.name}` : '파일 업로드'}
                </Button>
              </Upload>
            </Form.Item>
          ) : null}
          <Form.Item name="isPublished" label="공개 여부">
            <Select options={[{ value: true, label: '공개' }, { value: false, label: '비공개' }]} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
