import {
  DeleteOutlined,
  EditOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  UploadOutlined,
} from '@ant-design/icons'
import type { TableProps } from 'antd'
import {
  App,
  Button,
  Card,
  Col,
  Empty,
  Form,
  Input,
  Modal,
  Pagination,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  Upload,
} from 'antd'
import { useCallback, useMemo, useState } from 'react'

import { EditableSelect } from '../../features/catalog/EditableSelect'
import { useCatalog } from '../../features/catalog/useCatalog'
import {
  useCreateMaterial,
  useDeleteMaterial,
  useMaterials,
  useSetMaterialPublished,
  useUpdateMaterial,
} from '../../features/materials/queries'
import type { MaterialItem, MaterialsFilters } from '../../features/materials/types'
import { ErrorAlert } from '../../shared/ErrorAlert'
import { getErrorMessage } from '../../shared/errors'
import { PageHeader } from '../../shared/PageHeader'
import { useConfirmDelete } from '../../shared/useConfirmDelete'
import { useTableLayout } from '../../shared/useTableLayout'

const { Text } = Typography

const defaultFilters: MaterialsFilters = {
  page: 1,
  limit: 10,
  published: 'all',
  sortBy: 'updatedAt',
  sortOrder: 'DESC',
}

type MaterialFormValues = {
  title: string
  description?: string
  subject: string
  course: string
  isPublished?: boolean
}

export function MaterialsAdminPage() {
  const { message } = App.useApp()
  const catalog = useCatalog()
  const confirmDelete = useConfirmDelete()
  const { pinActions, compactActions } = useTableLayout()

  const [filters, setFilters] = useState<MaterialsFilters>(defaultFilters)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [form] = Form.useForm<MaterialFormValues>()

  const materials = useMaterials(filters)
  const createMaterial = useCreateMaterial()
  const updateMaterial = useUpdateMaterial()
  const deleteMaterial = useDeleteMaterial()
  const setPublished = useSetMaterialPublished()

  const saving = createMaterial.isPending || updateMaterial.isPending
  const data = materials.data

  /* ------------------------------ filters ------------------------------ */

  // Every filter change resets to page 1; only paging keeps the page.
  const patchFilters = useCallback((patch: Partial<MaterialsFilters>) => {
    setFilters((current) => ({ ...current, ...patch, page: patch.page ?? 1 }))
  }, [])

  const setSubject = useCallback((value?: string) => patchFilters({ subject: value }), [patchFilters])
  const setCourse = useCallback((value?: string) => patchFilters({ course: value }), [patchFilters])

  const filtersActive = Boolean(filters.search || filters.subject || filters.course)

  /* ------------------------------- modal ------------------------------- */

  const openCreateModal = useCallback(() => {
    setEditingId(null)
    setFile(null)
    form.resetFields()
    setModalOpen(true)
  }, [form])

  const openEditModal = useCallback(
    (record: MaterialItem) => {
      setEditingId(record.id)
      form.setFieldsValue({
        title: record.title,
        description: record.description ?? undefined,
        subject: record.subject,
        course: record.course,
        isPublished: record.isPublished,
      })
      setModalOpen(true)
    },
    [form],
  )

  const closeModal = useCallback(() => {
    setModalOpen(false)
    setFile(null)
  }, [])

  const submitForm = async () => {
    const values = await form.validateFields()

    try {
      if (editingId) {
        await updateMaterial.mutateAsync({ id: editingId, payload: values })
        message.success('자료가 수정되었습니다.')
      } else {
        const formData = new FormData()

        for (const [key, value] of Object.entries(values)) {
          if (value !== undefined && value !== null && value !== '') {
            formData.append(key, String(value))
          }
        }

        if (file) {
          formData.append('file', file)
        }

        await createMaterial.mutateAsync(formData)
        message.success('자료가 추가되었습니다.')
      }

      closeModal()
      form.resetFields()
    } catch (err) {
      message.error(getErrorMessage(err, '자료 저장에 실패했습니다.'))
    }
  }

  /* ------------------------------ actions ------------------------------ */

  const handleTogglePublished = useCallback(
    (record: MaterialItem) => {
      setPublished.mutate(
        { id: record.id, published: !record.isPublished },
        { onError: (err) => message.error(getErrorMessage(err, '공개 상태 변경에 실패했습니다.')) },
      )
    },
    [message, setPublished],
  )

  const handleDelete = useCallback(
    (record: MaterialItem) => {
      confirmDelete({
        target: record.title,
        onConfirm: () =>
          deleteMaterial.mutateAsync(record.id).then(
            () => message.success('삭제되었습니다.'),
            (err) => message.error(getErrorMessage(err, '자료 삭제에 실패했습니다.')),
          ),
      })
    },
    [confirmDelete, deleteMaterial, message],
  )

  /* ------------------------------ columns ------------------------------ */

  // AntD Table re-derives its internal column model whenever this array's
  // identity changes, so it is built once per handler set, not per render.
  const columns = useMemo<NonNullable<TableProps<MaterialItem>['columns']>>(
    () => [
      { title: '제목', dataIndex: 'title', key: 'title', render: (value: string) => <strong>{value}</strong> },
      { title: '과목', dataIndex: 'subject', key: 'subject', width: 140 },
      { title: '과정', dataIndex: 'course', key: 'course', width: 160 },
      {
        title: '공개 상태',
        dataIndex: 'isPublished',
        key: 'isPublished',
        width: 110,
        render: (value: boolean) => <Tag color={value ? 'green' : 'gold'}>{value ? '공개' : '비공개'}</Tag>,
      },
      {
        title: '관리',
        key: 'actions',
        fixed: pinActions,
        width: compactActions ? 120 : 260,
        render: (_, record) => (
          <Space>
            <Button size="small" icon={<EditOutlined />} aria-label="수정" onClick={() => openEditModal(record)}>
              {compactActions ? null : '수정'}
            </Button>
            <Button
              size="small"
              icon={record.isPublished ? <EyeInvisibleOutlined /> : <EyeOutlined />}
              onClick={() => handleTogglePublished(record)}
              loading={setPublished.isPending && setPublished.variables?.id === record.id}
              aria-label={record.isPublished ? '숨김' : '공개'}
            >
              {compactActions ? null : record.isPublished ? '숨김' : '공개'}
            </Button>
            <Button size="small" danger icon={<DeleteOutlined />} aria-label="삭제" onClick={() => handleDelete(record)}>
              {compactActions ? null : '삭제'}
            </Button>
          </Space>
        ),
      },
    ],
    [compactActions, handleDelete, handleTogglePublished, openEditModal, pinActions, setPublished.isPending, setPublished.variables?.id],
  )

  /* ------------------------------- render ------------------------------ */

  return (
    <div className="page-layout">
      <PageHeader
        kicker="ADMIN"
        title="자료실 관리"
        description="관리자가 자료를 업로드하고 공개 상태를 제어할 수 있는 관리 화면입니다."
      />

      <Card className="surface-card filter-card">
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Text>검색</Text>
            <Input
              allowClear
              value={filters.search ?? ''}
              onChange={(event) => patchFilters({ search: event.target.value })}
              placeholder="자료 제목/설명 검색"
              prefix={<SearchOutlined />}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Text>과목</Text>
            <EditableSelect
              kind="subjects"
              options={catalog.subjects}
              allowClear
              placeholder="과목"
              addPlaceholder="새 과목 이름"
              value={filters.subject}
              onChange={setSubject}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Text>과정</Text>
            <EditableSelect
              kind="courses"
              options={catalog.courses}
              allowClear
              placeholder="과정"
              addPlaceholder="새 과정 이름"
              value={filters.course}
              onChange={setCourse}
            />
          </Col>
        </Row>

        <div className="filter-footer">
          <Text>{data ? `${data.total}개의 자료` : '자료를 불러오는 중입니다.'}</Text>
          <Space>
            {filtersActive ? (
              <Button type="link" icon={<ReloadOutlined />} onClick={() => setFilters(defaultFilters)}>
                필터 초기화
              </Button>
            ) : null}
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
              자료 추가
            </Button>
          </Space>
        </div>
      </Card>

      <ErrorAlert error={materials.error} fallback="자료를 불러오지 못했습니다." />

      <Card className="surface-card">
        <Table
          className="admin-table"
          columns={columns}
          dataSource={data?.items ?? []}
          rowKey="id"
          pagination={false}
          scroll={{ x: 'max-content' }}
          // isFetching (not isPending) also dims the table during background
          // refetches after a mutation, so the stale row is visibly "in flight".
          loading={materials.isFetching}
          locale={{ emptyText: <Empty description="등록된 자료가 없습니다." /> }}
        />
        {data && data.total > data.limit ? (
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
      </Card>

      <Modal
        title={editingId ? '자료 수정' : '자료 추가'}
        open={modalOpen}
        onOk={submitForm}
        onCancel={closeModal}
        okText={editingId ? '저장' : '업로드'}
        cancelText="취소"
        confirmLoading={saving}
        destroyOnHidden
        width={720}
      >
        <Form form={form} layout="vertical" disabled={saving}>
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
            <Form.Item label="파일 업로드" extra="PDF, Office 문서, 이미지, 동영상, 텍스트 · 최대 10MB">
              <Upload
                beforeUpload={(fileItem) => {
                  setFile(fileItem)
                  return false
                }}
                onRemove={() => setFile(null)}
                maxCount={1}
                fileList={file ? [{ uid: '1', name: file.name, status: 'done' }] : []}
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.mp4,.webm,.txt"
              >
                <Button icon={<UploadOutlined />}>파일 선택</Button>
              </Upload>
            </Form.Item>
          ) : null}
          <Form.Item name="isPublished" label="공개 여부" initialValue={false}>
            <Select
              options={[
                { value: true, label: '공개' },
                { value: false, label: '비공개' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
