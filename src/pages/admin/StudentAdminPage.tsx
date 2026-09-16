import { DeleteOutlined, EditOutlined, PaperClipOutlined, PlusOutlined, SearchOutlined, UploadOutlined } from '@ant-design/icons'
import type { TableProps } from 'antd'
import { Alert, App, Button, Card, Col, Form, Input, Modal, Row, Select, Space, Statistic, Table, Tag, Tooltip, Typography } from 'antd'
import { useCallback, useMemo, useRef, useState, type ChangeEvent, type Key } from 'react'

import { assetUrl } from '../../api/client'
import { usePreferences } from '../../app/preferences'
import { useCatalog } from '../../features/catalog/useCatalog'
import { LEVEL_NONE, type StudentApiRecord } from '../../features/students/api'
import { formatLevel } from '../../features/students/level'
import { DOCUMENT_ACCEPT, MAX_DOCUMENT_SIZE, uploadDocument } from '../../features/uploads/api'
import { useCreateStudent, useDeleteStudent, useStudents, useUpdateStudent } from '../../features/students/queries'
import { ErrorAlert } from '../../shared/ErrorAlert'
import { getErrorMessage } from '../../shared/errors'
import { formatFileSize } from '../../shared/format'
import { PageHeader } from '../../shared/PageHeader'
import { useConfirmDelete } from '../../shared/useConfirmDelete'
import { useTableLayout } from '../../shared/useTableLayout'

const { Text } = Typography

type StudentRecord = StudentApiRecord
type TopikFileRecord = StudentRecord['topikFiles'][number]

type StudentFormValues = {
  name: string
  studentId: string
  email: string
  phone: string
  admissionDate: string
  course: string
  level: string
  status: StudentRecord['status']
  password?: string
  notes?: string
}

const TOPIK_LEVELS = ['TOPIK 1', 'TOPIK 2', 'TOPIK 3', 'TOPIK 4', 'TOPIK 5', 'TOPIK 6']

const MAX_TOPIK_FILES = 2
const MAX_TOPIK_FILE_SIZE = MAX_DOCUMENT_SIZE

/** A bcrypt hash starts with "$2"; anything else is a plain password. */
const isHashed = (password?: string) => Boolean(password?.startsWith('$2'))

const toFilterOptions = (values: Iterable<string>) =>
  Array.from(new Set(values)).filter(Boolean).sort().map((value) => ({ text: value, value }))

/** Stable fallback so `useMemo` deps do not see a fresh `[]` every render. */
const NO_STUDENTS: StudentRecord[] = []

export function StudentAdminPage() {
  const { t } = usePreferences()
  const { message } = App.useApp()
  const catalog = useCatalog()
  const confirmDelete = useConfirmDelete()
  const { pinActions, compactActions } = useTableLayout()

  const students = useStudents()
  const createStudent = useCreateStudent()
  const updateStudent = useUpdateStudent()
  const deleteStudent = useDeleteStudent()

  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [topikFiles, setTopikFiles] = useState<TopikFileRecord[]>([])
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [form] = Form.useForm<StudentFormValues>()

  const topikLevelOptions = useMemo(
    () => [{ value: LEVEL_NONE, label: t('students.levelNone') }, ...TOPIK_LEVELS.map((value) => ({ value, label: value }))],
    [t],
  )

  const saving = createStudent.isPending || updateStudent.isPending
  const list = students.data ?? NO_STUDENTS

  const statusOptions = useMemo(
    () => [
      { value: 'active', label: t('students.statusActive') },
      { value: 'inactive', label: t('students.statusInactive') },
    ],
    [t],
  )

  /* --------------------------- derived data --------------------------- */

  const stats = useMemo(
    () => ({
      total: list.length,
      active: list.filter((student) => student.status === 'active').length,
      withTopik: list.filter((student) => student.topikFiles?.length).length,
    }),
    [list],
  )

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase()

    if (!needle) {
      return list
    }

    return list.filter((student) =>
      [student.name, student.studentId, student.email, student.phone, student.notes ?? ''].some((field) =>
        field?.toLowerCase().includes(needle),
      ),
    )
  }, [list, search])

  const columnFilters = useMemo(
    () => ({
      course: toFilterOptions(list.map((s) => s.course)),
      level: toFilterOptions(list.map((s) => s.level)).map((option) => ({ ...option, text: formatLevel(option.value, t) })),
      admissionDate: toFilterOptions(list.map((s) => s.admissionDate)),
    }),
    [list, t],
  )

  /* ------------------------------- modal ------------------------------ */

  const openCreateModal = useCallback(() => {
    setEditingId(null)
    setTopikFiles([])
    setUploadError(null)
    form.resetFields()
    setModalOpen(true)
  }, [form])

  const openEditModal = useCallback(
    (record: StudentRecord) => {
      setEditingId(record.id)
      setTopikFiles(record.topikFiles ?? [])
      setUploadError(null)
      form.setFieldsValue({
        ...record,
        notes: record.notes ?? undefined,
        password: isHashed(record.password) ? '' : record.password,
      })
      setModalOpen(true)
    },
    [form],
  )

  /**
   * Files are uploaded as soon as they are picked and only their stored path
   * travels with the form. (They used to be listed by name only and never
   * left the browser — the "attached" files did not exist on the server.)
   */
  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const selected = Array.from(event.target.files ?? [])
      event.target.value = ''

      if (selected.length === 0) {
        return
      }

      if (topikFiles.length + selected.length > MAX_TOPIK_FILES) {
        setUploadError(t('students.tooManyFiles', { max: MAX_TOPIK_FILES }))
        return
      }

      const oversized = selected.find((file) => file.size > MAX_TOPIK_FILE_SIZE)

      if (oversized) {
        setUploadError(t('students.fileTooBig', { size: formatFileSize(MAX_TOPIK_FILE_SIZE), name: oversized.name }))
        return
      }

      setUploadError(null)
      setUploading(true)

      try {
        const uploaded = await Promise.all(selected.map((file) => uploadDocument(file)))
        setTopikFiles((current) => [
          ...current,
          ...uploaded.map((file) => ({ id: crypto.randomUUID(), name: file.name, size: file.size, type: file.type, url: file.url })),
        ])
      } catch (err) {
        setUploadError(getErrorMessage(err, t('upload.failed')))
      } finally {
        setUploading(false)
      }
    },
    [t, topikFiles.length],
  )
  const handleSubmit = async () => {
    const values = await form.validateFields().catch(() => null)

    if (!values) {
      return
    }
    const password = values.password?.trim()

    const payload = {
      ...values,
      studentId: values.studentId.trim(),
      notes: values.notes?.trim() || null,
      ...(password ? { password } : {}),
      topikFiles: topikFiles.map(({ id, name, size, type, url }) => ({ id, name, size, type, ...(url ? { url } : {}) })),
    }

    if (!password) {
      delete (payload as { password?: string }).password
    }

    try {
      if (editingId) {
        await updateStudent.mutateAsync({ id: editingId, payload })
        message.success(t('students.updated'))
      } else {
        await createStudent.mutateAsync(payload)
        message.success(t('students.created'))
      }

      setModalOpen(false)
      setTopikFiles([])
      form.resetFields()
    } catch (err) {
      message.error(getErrorMessage(err, t('students.saveFailed')))
    }
  }

  const handleDelete = useCallback(
    (record: StudentRecord) => {
      confirmDelete({
        target: `${record.name} (${record.studentId})`,
        note: t('students.deleteNote'),
        onConfirm: () =>
          deleteStudent.mutateAsync(record.id).then(
            () => message.success(t('students.deleted')),
            (err) => message.error(getErrorMessage(err, t('students.deleteFailed'))),
          ),
      })
    },
    [confirmDelete, deleteStudent, message, t],
  )

  /* ------------------------------ columns ----------------------------- */

  const columns = useMemo<NonNullable<TableProps<StudentRecord>['columns']>>(
    () => [
      { title: t('students.columns.name'), dataIndex: 'name', key: 'name', sorter: (a, b) => a.name.localeCompare(b.name) },
      { title: t('students.columns.studentId'), dataIndex: 'studentId', key: 'studentId' },
      {
        title: t('students.columns.password'),
        dataIndex: 'password',
        key: 'password',
        responsive: ['md'],
        filters: [
          { text: t('students.passwordPlain'), value: 'plain' },
          { text: t('students.passwordHashed'), value: 'hashed' },
        ],
        onFilter: (value: boolean | Key, record) => (value === 'hashed') === isHashed(record.password),
        render: (value?: string) => (!value ? '-' : isHashed(value) ? <Text type="secondary">{t('students.passwordHashed')}</Text> : value),
      },
      { title: t('students.columns.email'), dataIndex: 'email', key: 'email', responsive: ['lg'], ellipsis: true },
      { title: t('students.columns.phone'), dataIndex: 'phone', key: 'phone', responsive: ['lg'] },
      {
        title: t('students.columns.admissionDate'),
        dataIndex: 'admissionDate',
        key: 'admissionDate',
        responsive: ['xl'],
        filters: columnFilters.admissionDate,
        onFilter: (value: boolean | Key, record) => record.admissionDate === String(value),
        sorter: (a, b) => (a.admissionDate ?? '').localeCompare(b.admissionDate ?? ''),
      },
      {
        title: t('students.columns.course'),
        dataIndex: 'course',
        key: 'course',
        filters: columnFilters.course,
        filterSearch: true,
        onFilter: (value: boolean | Key, record) => record.course === String(value),
      },
      {
        title: t('students.columns.level'),
        dataIndex: 'level',
        key: 'level',
        responsive: ['md'],
        filters: columnFilters.level,
        onFilter: (value: boolean | Key, record) => record.level === String(value),
        render: (value: string) => formatLevel(value, t),
      },
      {
        title: t('students.columns.topikFiles'),
        dataIndex: 'topikFiles',
        key: 'topikFiles',
        responsive: ['xl'],
        filters: [
          { text: t('students.filesAttachedFilter'), value: 'attached' },
          { text: t('students.filesNone'), value: 'none' },
        ],
        onFilter: (value: boolean | Key, record) => (value === 'attached') === (record.topikFiles ?? []).length > 0,
        render: (files: TopikFileRecord[] = []) => (files.length ? t('students.filesAttached', { count: files.length }) : t('students.filesNone')),
      },
      {
        title: t('students.columns.notes'),
        dataIndex: 'notes',
        key: 'notes',
        responsive: ['xl'],
        width: 200,
        render: (value?: string | null) =>
          value ? (
            <Tooltip title={value}>
              <Text ellipsis style={{ maxWidth: 180, display: 'inline-block' }}>{value}</Text>
            </Tooltip>
          ) : (
            <Text type="secondary">-</Text>
          ),
      },
      {
        title: t('students.columns.status'),
        dataIndex: 'status',
        key: 'status',
        width: 110,
        filters: statusOptions.map((option) => ({ text: option.label, value: option.value })),
        onFilter: (value: boolean | Key, record) => record.status === String(value),
        render: (value: StudentRecord['status']) =>
          value === 'active' ? <Tag color="green">{t('students.statusActive')}</Tag> : <Tag>{t('students.statusInactive')}</Tag>,
      },
      {
        title: t('common.actions'),
        key: 'actions',
        fixed: pinActions,
        width: compactActions ? 90 : 170,
        render: (_, record) => (
          <Space>
            <Button size="small" icon={<EditOutlined />} aria-label={t('common.edit')} onClick={() => openEditModal(record)}>
              {compactActions ? null : t('common.edit')}
            </Button>
            <Button size="small" danger icon={<DeleteOutlined />} aria-label={t('common.delete')} onClick={() => handleDelete(record)}>
              {compactActions ? null : t('common.delete')}
            </Button>
          </Space>
        ),
      },
    ],
    [columnFilters, compactActions, handleDelete, openEditModal, pinActions, statusOptions, t],
  )

  /* ------------------------------- render ----------------------------- */

  return (
    <div className="page-layout">
      <PageHeader kicker={t('common.admin')} title={t('students.adminTitle')} description={t('students.adminSubtitle')} />

      <Row gutter={[16, 16]}>
        <Col xs={8}>
          <Card className="surface-card student-admin-stat">
            <Statistic title={t('students.total')} value={stats.total} loading={students.isPending} />
          </Card>
        </Col>
        <Col xs={8}>
          <Card className="surface-card student-admin-stat">
            <Statistic title={t('students.active')} value={stats.active} loading={students.isPending} />
          </Card>
        </Col>
        <Col xs={8}>
          <Card className="surface-card student-admin-stat">
            <Statistic title={t('students.withTopik')} value={stats.withTopik} loading={students.isPending} />
          </Card>
        </Col>
      </Row>

      <Card className="surface-card filter-card">
        <Row gutter={[16, 16]} align="bottom">
          <Col xs={24} md={12}>
            <Text>{t('common.search')}</Text>
            <Input allowClear prefix={<SearchOutlined />} placeholder={t('students.searchPlaceholder')} value={search} onChange={(event) => setSearch(event.target.value)} />
          </Col>
          <Col xs={24} md={12}>
            <div className="filter-footer filter-footer--inline">
              <Text>
                {visible.length === list.length
                  ? t('students.count', { count: list.length })
                  : t('students.countFiltered', { visible: visible.length, total: list.length })}
              </Text>
              <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
                {t('students.add')}
              </Button>
            </div>
          </Col>
        </Row>
      </Card>

      <ErrorAlert error={students.error} fallback={t('students.loadFailed')} />

      <Card className="surface-card">
        <Table
          className="admin-table"
          columns={columns}
          dataSource={visible}
          rowKey="id"
          loading={students.isPending}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          scroll={{ x: 'max-content' }}
        />
      </Card>

      <Modal
        title={editingId ? t('students.editTitle') : t('students.addTitle')}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText={editingId ? t('common.save') : t('common.add')}
        cancelText={t('common.cancel')}
        confirmLoading={saving}
        forceRender
        width={720}
      >
        <Form form={form} layout="vertical" disabled={saving} initialValues={{ status: 'active' }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label={t('students.form.name')} rules={[{ required: true, message: t('students.form.nameRequired') }]}>
                <Input autoComplete="off" maxLength={120} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="studentId" label={t('students.form.studentId')} rules={[{ required: true, message: t('students.form.studentIdRequired') }]}>
                <Input placeholder={t('students.form.studentIdPlaceholder')} autoComplete="off" maxLength={120} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="email"
                label={t('students.form.email')}
                rules={[
                  { required: true, message: t('students.form.emailRequired') },
                  { type: 'email', message: t('students.form.emailInvalid') },
                ]}
              >
                <Input inputMode="email" autoComplete="off" maxLength={255} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="phone" label={t('students.form.phone')} rules={[{ required: true, message: t('students.form.phoneRequired') }]}>
                <Input inputMode="tel" autoComplete="off" maxLength={80} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="admissionDate" label={t('students.form.admissionDate')} rules={[{ required: true, message: t('students.form.admissionDateRequired') }]}>
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="course" label={t('students.form.course')} rules={[{ required: true, message: t('students.form.courseRequired') }]}>
                <Select options={catalog.courses} placeholder={t('catalog.selectCourse')} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="level" label={t('students.form.level')} rules={[{ required: true, message: t('students.form.levelRequired') }]}>
                <Select options={topikLevelOptions} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label={t('students.form.status')} rules={[{ required: true, message: t('students.form.statusRequired') }]}>
                <Select options={statusOptions} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="password"
            label={t('students.form.password')}
            rules={[{ required: !editingId, message: t('students.form.passwordRequired') }]}
            extra={editingId ? t('students.form.passwordKeep') : undefined}
          >
            <Input.Password autoComplete="new-password" placeholder={editingId ? t('students.form.passwordPlaceholderEdit') : undefined} maxLength={255} />
          </Form.Item>
          <Form.Item name="notes" label={t('students.form.notes')}>
            <Input.TextArea rows={3} maxLength={2000} showCount placeholder={t('students.form.notesPlaceholder')} />
          </Form.Item>
          <Form.Item label={t('students.form.topikFiles', { max: MAX_TOPIK_FILES, size: formatFileSize(MAX_TOPIK_FILE_SIZE) })}>
            <input ref={fileInputRef} type="file" multiple accept={DOCUMENT_ACCEPT} hidden onChange={handleFileChange} />
            <Button icon={<UploadOutlined />} loading={uploading} disabled={topikFiles.length >= MAX_TOPIK_FILES} onClick={() => fileInputRef.current?.click()}>
              {t('students.uploadFiles')}
            </Button>
            {uploadError ? <Alert type="error" message={uploadError} showIcon style={{ marginTop: 12 }} /> : null}
            <div className="student-admin-file-list">
              {topikFiles.length > 0 ? (
                topikFiles.map((file) => (
                  <div key={file.id} className="student-admin-file-item">
                    <Tag color="blue">{file.type || 'FILE'}</Tag>
                    {file.url ? (
                      <a href={assetUrl(file.url)} target="_blank" rel="noreferrer">
                        <PaperClipOutlined /> {file.name}
                      </a>
                    ) : (
                      <span>{file.name}</span>
                    )}
                    <small>{formatFileSize(file.size)}</small>
                    <Button
                      type="text"
                      size="small"
                      icon={<DeleteOutlined />}
                      aria-label={t('students.removeFile', { name: file.name })}
                      onClick={() => setTopikFiles((current) => current.filter((item) => item.id !== file.id))}
                    />
                  </div>
                ))
              ) : (
                <div className="student-admin-file-empty">{t('students.noFiles')}</div>
              )}
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
