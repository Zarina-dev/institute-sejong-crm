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
  Tooltip,
  Typography,
  Upload,
} from 'antd'
import { useCallback, useMemo, useState } from 'react'

import { usePreferences } from '../../app/preferences'
import { filterCourseOption, useCourseOptions } from '../../features/courses/useCourseOptions'
import {
  useCreateMaterial,
  useDeleteMaterial,
  useMaterials,
  useSetMaterialPublished,
  useUpdateMaterial,
} from '../../features/materials/queries'
import type { MaterialItem, MaterialsFilters } from '../../features/materials/types'
import {
  ALLOWED_MATERIAL_EXTENSIONS,
  MATERIAL_ACCEPT,
  MAX_MATERIAL_FILE_SIZE,
  validateMaterialFile,
} from '../../features/materials/upload'
import { ErrorAlert } from '../../shared/ErrorAlert'
import { getErrorMessage } from '../../shared/errors'
import { formatFileSize } from '../../shared/format'
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
  courseId: string
  isPublished?: boolean
}

export function MaterialsAdminPage() {
  const { message } = App.useApp()
  const { t } = usePreferences()
  const { courseOptions, subjectOptions } = useCourseOptions()
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

  const patchFilters = useCallback((patch: Partial<MaterialsFilters>) => {
    setFilters((current) => ({ ...current, ...patch, page: patch.page ?? 1 }))
  }, [])

  const setSubject = useCallback((value?: string) => patchFilters({ subject: value }), [patchFilters])
  const setCourse = useCallback((value?: string) => patchFilters({ courseId: value }), [patchFilters])
  const filtersActive = Boolean(filters.search || filters.subject || filters.courseId)

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
        courseId: record.courseId ?? undefined,
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

  /**
   * Refuse a wrong file before it is even attached — with the same rules
   * the server enforces — so the user gets a message instead of a failed
   * upload after the fact.
   */
  const handleBeforeUpload = useCallback(
    (candidate: File) => {
      const rejection = validateMaterialFile(candidate)

      if (rejection) {
        message.error(
          rejection.reason === 'type'
            ? t('materials.fileRejectedType', {
                ext: rejection.ext || '?',
                allowed: ALLOWED_MATERIAL_EXTENSIONS.map((e) => `.${e}`).join(', '),
              })
            : t('materials.fileRejectedSize', {
                size: formatFileSize(rejection.size),
                max: formatFileSize(MAX_MATERIAL_FILE_SIZE),
              }),
        )
        return Upload.LIST_IGNORE
      }

      setFile(candidate)
      return false // keep it local; the form submit sends it
    },
    [message, t],
  )

  const submitForm = async () => {
    const values = await form.validateFields().catch(() => null)

    if (!values) {
      return
    }

    try {
      if (editingId) {
        await updateMaterial.mutateAsync({ id: editingId, payload: values })
        message.success(t('materials.updated'))
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
        message.success(t('materials.created'))
      }

      closeModal()
      form.resetFields()
    } catch (err) {
      message.error(getErrorMessage(err, t('materials.saveFailed')))
    }
  }

  /* ------------------------------ actions ------------------------------ */

  const handleTogglePublished = useCallback(
    (record: MaterialItem) => {
      setPublished.mutate(
        { id: record.id, published: !record.isPublished },
        { onError: (err) => message.error(getErrorMessage(err, t('materials.publishFailed'))) },
      )
    },
    [message, setPublished, t],
  )

  const handleDelete = useCallback(
    (record: MaterialItem) => {
      confirmDelete({
        target: record.title,
        onConfirm: () =>
          deleteMaterial.mutateAsync(record.id).then(
            () => message.success(t('materials.deleted')),
            (err) => message.error(getErrorMessage(err, t('materials.deleteFailed'))),
          ),
      })
    },
    [confirmDelete, deleteMaterial, message, t],
  )

  /* ------------------------------ columns ------------------------------ */

  const columns = useMemo<NonNullable<TableProps<MaterialItem>['columns']>>(
    () => [
      { title: t('materials.form.title'), dataIndex: 'title', key: 'title', render: (value: string) => <strong>{value}</strong> },
      { title: t('materials.subject'), dataIndex: 'subject', key: 'subject', width: 140 },
      {
        title: t('materials.course'),
        dataIndex: 'course',
        key: 'course',
        width: 180,
        // Rows from before the course link whose label matched no course: edit to attach one.
        render: (value: string, record) =>
          record.courseId ? value : (
            <Tooltip title={t('materials.unlinkedHint')}>
              <Tag color="warning">{value || t('materials.unlinked')}</Tag>
            </Tooltip>
          ),
      },
      {
        title: t('common.status'),
        dataIndex: 'isPublished',
        key: 'isPublished',
        width: 120,
        render: (value: boolean) => (
          <Tag color={value ? 'green' : 'gold'}>{value ? t('common.published') : t('common.unpublished')}</Tag>
        ),
      },
      {
        title: t('common.actions'),
        key: 'actions',
        fixed: pinActions,
        width: compactActions ? 120 : 260,
        render: (_, record) => (
          <Space>
            <Button size="small" icon={<EditOutlined />} aria-label={t('common.edit')} onClick={() => openEditModal(record)}>
              {compactActions ? null : t('common.edit')}
            </Button>
            <Button
              size="small"
              icon={record.isPublished ? <EyeInvisibleOutlined /> : <EyeOutlined />}
              onClick={() => handleTogglePublished(record)}
              loading={setPublished.isPending && setPublished.variables?.id === record.id}
              aria-label={record.isPublished ? t('common.unpublish') : t('common.publish')}
            >
              {compactActions ? null : record.isPublished ? t('common.unpublish') : t('common.publish')}
            </Button>
            <Button size="small" danger icon={<DeleteOutlined />} aria-label={t('common.delete')} onClick={() => handleDelete(record)}>
              {compactActions ? null : t('common.delete')}
            </Button>
          </Space>
        ),
      },
    ],
    [compactActions, handleDelete, handleTogglePublished, openEditModal, pinActions, setPublished.isPending, setPublished.variables?.id, t],
  )

  /* ------------------------------- render ------------------------------ */

  return (
    <div className="page-layout">
      <PageHeader kicker={t('common.admin')} title={t('materials.adminTitle')} description={t('materials.adminSubtitle')} />

      <Card className="surface-card filter-card">
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Text>{t('common.search')}</Text>
            <Input
              allowClear
              value={filters.search ?? ''}
              onChange={(event) => patchFilters({ search: event.target.value })}
              placeholder={t('materials.searchPlaceholder')}
              prefix={<SearchOutlined />}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Text>{t('materials.subject')}</Text>
            <Select allowClear placeholder={t('materials.subject')} value={filters.subject} onChange={setSubject} options={subjectOptions} style={{ width: '100%' }} />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Text>{t('materials.course')}</Text>
            <Select allowClear showSearch filterOption={filterCourseOption} placeholder={t('materials.course')} value={filters.courseId} onChange={setCourse} options={courseOptions} style={{ width: '100%' }} />
          </Col>
        </Row>

        <div className="filter-footer">
          <Text>{data ? t('materials.count', { count: data.total }) : t('materials.loadingCount')}</Text>
          <Space>
            {filtersActive ? (
              <Button type="link" icon={<ReloadOutlined />} onClick={() => setFilters(defaultFilters)}>
                {t('common.resetFilters')}
              </Button>
            ) : null}
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
              {t('materials.add')}
            </Button>
          </Space>
        </div>
      </Card>

      <ErrorAlert error={materials.error} fallback={t('materials.loadFailed')} />

      <Card className="surface-card">
        <Table
          className="admin-table"
          columns={columns}
          dataSource={data?.items ?? []}
          rowKey="id"
          pagination={false}
          scroll={{ x: 'max-content' }}
          loading={materials.isFetching}
          locale={{ emptyText: <Empty description={filtersActive ? t('materials.emptyFiltered') : t('materials.empty')} /> }}
        />
        {data && data.total > data.limit ? (
          <div className="table-pagination">
            <Pagination current={data.page} pageSize={data.limit} total={data.total} showSizeChanger={false} onChange={(page) => patchFilters({ page })} />
          </div>
        ) : null}
      </Card>

      <Modal
        title={editingId ? t('materials.editTitle') : t('materials.addTitle')}
        open={modalOpen}
        onOk={submitForm}
        onCancel={closeModal}
        okText={editingId ? t('common.save') : t('materials.upload')}
        cancelText={t('common.cancel')}
        confirmLoading={saving}
        forceRender
        width={720}
      >
        <Form form={form} layout="vertical" disabled={saving} initialValues={{ isPublished: false }}>
          <Form.Item name="title" label={t('materials.form.title')} rules={[{ required: true, message: t('materials.form.titleRequired') }]}>
            <Input maxLength={255} />
          </Form.Item>
          <Form.Item name="description" label={t('materials.form.description')}>
            <Input.TextArea rows={4} maxLength={4000} showCount />
          </Form.Item>
          {/* Subject comes from the course record; both labels are derived server-side. */}
          <Form.Item name="courseId" label={t('materials.course')} rules={[{ required: true, message: t('materials.form.courseRequired') }]}>
            <Select showSearch filterOption={filterCourseOption} placeholder={t('materials.course')} options={courseOptions} />
          </Form.Item>
          {!editingId ? (
            <Form.Item label={t('materials.form.file')} extra={t('materials.form.fileHint', { max: formatFileSize(MAX_MATERIAL_FILE_SIZE) })}>
              <Upload
                beforeUpload={handleBeforeUpload}
                onRemove={() => setFile(null)}
                maxCount={1}
                fileList={file ? [{ uid: '1', name: file.name, status: 'done', size: file.size }] : []}
                accept={MATERIAL_ACCEPT}
              >
                <Button icon={<UploadOutlined />}>{t('materials.form.chooseFile')}</Button>
              </Upload>
            </Form.Item>
          ) : null}
          <Form.Item name="isPublished" label={t('materials.form.visibility')}>
            <Select
              options={[
                { value: true, label: t('common.published') },
                { value: false, label: t('common.unpublished') },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
