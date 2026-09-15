import { DeleteOutlined, EditOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons'
import type { TableProps } from 'antd'
import { Alert, App, Button, Card, Col, Form, Input, Modal, Row, Select, Space, Statistic, Table, Tag, Typography } from 'antd'
import { useCallback, useMemo, useState, type ChangeEvent, type Key } from 'react'

import { useCatalog } from '../../features/catalog/useCatalog'
import type { StudentApiRecord } from '../../features/students/api'
import { useCreateStudent, useDeleteStudent, useStudents, useUpdateStudent } from '../../features/students/queries'
import { ErrorAlert } from '../../shared/ErrorAlert'
import { getErrorMessage } from '../../shared/errors'
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
}

const topikLevelOptions = ['TOPIK 1', 'TOPIK 2', 'TOPIK 3', 'TOPIK 4', 'TOPIK 5', 'TOPIK 6'].map((value) => ({
  value,
  label: value,
}))

const statusOptions = [
  { value: 'active', label: '활동 중' },
  { value: 'inactive', label: '비활동' },
]

const MAX_TOPIK_FILES = 2
const MAX_TOPIK_FILE_SIZE = 5 * 1024 * 1024

/** Stable fallback so `useMemo` deps do not see a fresh `[]` every render. */
const NO_STUDENTS: StudentRecord[] = []

/** A bcrypt hash starts with "$2"; anything else is a plain password. */
const isHashed = (password?: string) => Boolean(password?.startsWith('$2'))

const toFilterOptions = (values: Iterable<string>) =>
  Array.from(new Set(values))
    .filter(Boolean)
    .sort()
    .map((value) => ({ text: value, value }))

export function StudentAdminPage() {
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
  const [form] = Form.useForm<StudentFormValues>()

  const saving = createStudent.isPending || updateStudent.isPending
  const list = students.data ?? NO_STUDENTS

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
      [student.name, student.studentId, student.email, student.phone].some((field) =>
        field?.toLowerCase().includes(needle),
      ),
    )
  }, [list, search])

  const columnFilters = useMemo(
    () => ({
      course: toFilterOptions(list.map((s) => s.course)),
      level: toFilterOptions(list.map((s) => s.level)),
      admissionDate: toFilterOptions(list.map((s) => s.admissionDate)),
    }),
    [list],
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
        // A stored hash cannot be shown back; the field stays empty and only
        // a newly typed value replaces it.
        password: isHashed(record.password) ? '' : record.password,
      })
      setModalOpen(true)
    },
    [form],
  )

  const handleFileChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? [])
    event.target.value = ''

    if (selected.length === 0) {
      return
    }

    if (selected.length > MAX_TOPIK_FILES) {
      setUploadError(`TOPIK 결과 파일은 최대 ${MAX_TOPIK_FILES}개까지만 첨부할 수 있습니다.`)
      return
    }

    const oversized = selected.find((file) => file.size > MAX_TOPIK_FILE_SIZE)

    if (oversized) {
      setUploadError(`파일 크기는 5MB 이내로 제한됩니다. (${oversized.name})`)
      return
    }

    setTopikFiles(
      selected.map((file) => ({ id: crypto.randomUUID(), name: file.name, size: file.size, type: file.type })),
    )
    setUploadError(null)
  }, [])

  const handleSubmit = async () => {
    const values = await form.validateFields()
    const password = values.password?.trim()

    const payload = {
      ...values,
      studentId: values.studentId.trim(),
      ...(password ? { password } : {}),
      topikFiles: topikFiles.map(({ id, name, size, type }) => ({ id, name, size, type })),
    }

    try {
      if (editingId) {
        await updateStudent.mutateAsync({ id: editingId, payload })
        message.success('학생 정보가 수정되었습니다.')
      } else {
        await createStudent.mutateAsync(payload)
        message.success('학생이 추가되었습니다.')
      }

      setModalOpen(false)
      setTopikFiles([])
      form.resetFields()
    } catch (err) {
      message.error(getErrorMessage(err, '학생 저장에 실패했습니다.'))
    }
  }

  const handleDelete = useCallback(
    (record: StudentRecord) => {
      confirmDelete({
        target: `${record.name} (${record.studentId})`,
        // Enrollments cascade; applications keep the row with student_id set null.
        note: '학생 정보, TOPIK 파일, 수강 등록 기록이 함께 삭제되며, 이 작업은 되돌릴 수 없습니다.',
        onConfirm: () =>
          deleteStudent.mutateAsync(record.id).then(
            () => message.success('삭제되었습니다.'),
            (err) => message.error(getErrorMessage(err, '학생 삭제에 실패했습니다.')),
          ),
      })
    },
    [confirmDelete, deleteStudent, message],
  )

  /* ------------------------------ columns ----------------------------- */

  const columns = useMemo<NonNullable<TableProps<StudentRecord>['columns']>>(
    () => [
      { title: '이름', dataIndex: 'name', key: 'name', sorter: (a, b) => a.name.localeCompare(b.name, 'ko') },
      { title: '학생 ID', dataIndex: 'studentId', key: 'studentId' },
      {
        title: '비밀번호',
        dataIndex: 'password',
        key: 'password',
        responsive: ['md'],
        filters: [
          { text: '입력됨', value: 'plain' },
          { text: '암호화됨', value: 'hashed' },
        ],
        onFilter: (value: boolean | Key, record) => (value === 'hashed') === isHashed(record.password),
        render: (value?: string) => (!value ? '-' : isHashed(value) ? <Text type="secondary">암호화됨</Text> : value),
      },
      { title: '이메일', dataIndex: 'email', key: 'email', responsive: ['lg'], ellipsis: true },
      { title: '전화번호', dataIndex: 'phone', key: 'phone', responsive: ['lg'] },
      {
        title: '입학 날짜',
        dataIndex: 'admissionDate',
        key: 'admissionDate',
        responsive: ['xl'],
        filters: columnFilters.admissionDate,
        onFilter: (value: boolean | Key, record) => record.admissionDate === String(value),
        sorter: (a, b) => (a.admissionDate ?? '').localeCompare(b.admissionDate ?? ''),
      },
      {
        title: '과정',
        dataIndex: 'course',
        key: 'course',
        filters: columnFilters.course,
        filterSearch: true,
        onFilter: (value: boolean | Key, record) => record.course === String(value),
      },
      {
        title: 'TOPIK 레벨',
        dataIndex: 'level',
        key: 'level',
        responsive: ['md'],
        filters: columnFilters.level,
        onFilter: (value: boolean | Key, record) => record.level === String(value),
      },
      {
        title: 'TOPIK 파일',
        dataIndex: 'topikFiles',
        key: 'topikFiles',
        responsive: ['xl'],
        filters: [
          { text: '첨부됨', value: 'attached' },
          { text: '없음', value: 'none' },
        ],
        onFilter: (value: boolean | Key, record) => (value === 'attached') === (record.topikFiles ?? []).length > 0,
        render: (files: TopikFileRecord[] = []) => (files.length ? `${files.length}개 첨부` : '없음'),
      },
      {
        title: '상태',
        dataIndex: 'status',
        key: 'status',
        width: 100,
        filters: statusOptions.map((option) => ({ text: option.label, value: option.value })),
        onFilter: (value: boolean | Key, record) => record.status === String(value),
        render: (value: StudentRecord['status']) =>
          value === 'active' ? <Tag color="green">활동 중</Tag> : <Tag>비활동</Tag>,
      },
      {
        title: '관리',
        key: 'actions',
        fixed: pinActions,
        width: compactActions ? 90 : 170,
        render: (_, record) => (
          <Space>
            <Button size="small" icon={<EditOutlined />} aria-label="수정" onClick={() => openEditModal(record)}>
              {compactActions ? null : '수정'}
            </Button>
            <Button size="small" danger icon={<DeleteOutlined />} aria-label="삭제" onClick={() => handleDelete(record)}>
              {compactActions ? null : '삭제'}
            </Button>
          </Space>
        ),
      },
    ],
    [columnFilters, compactActions, handleDelete, openEditModal, pinActions],
  )

  /* ------------------------------- render ----------------------------- */

  return (
    <div className="page-layout">
      <PageHeader
        kicker="ADMIN"
        title="학생 관리"
        description="관리자가 각 학생의 ID와 비밀번호를 설정하고, TOPIK 결과 파일을 관리할 수 있는 화면입니다."
      />

      <Row gutter={[16, 16]}>
        <Col xs={8}>
          <Card className="surface-card student-admin-stat">
            <Statistic title="총 학생" value={stats.total} loading={students.isPending} />
          </Card>
        </Col>
        <Col xs={8}>
          <Card className="surface-card student-admin-stat">
            <Statistic title="활동 중" value={stats.active} loading={students.isPending} />
          </Card>
        </Col>
        <Col xs={8}>
          <Card className="surface-card student-admin-stat">
            <Statistic title="TOPIK 첨부" value={stats.withTopik} loading={students.isPending} />
          </Card>
        </Col>
      </Row>

      <Card className="surface-card filter-card">
        <Row gutter={[16, 16]} align="bottom">
          <Col xs={24} md={12}>
            <Text>검색</Text>
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder="이름, 학생 ID, 이메일, 전화번호"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </Col>
          <Col xs={24} md={12}>
            <div className="filter-footer filter-footer--inline">
              <Text>
                {visible.length === list.length ? `${list.length}명의 학생` : `${visible.length} / ${list.length}명`}
              </Text>
              <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
                학생 추가
              </Button>
            </div>
          </Col>
        </Row>
      </Card>

      <ErrorAlert error={students.error} fallback="학생 정보를 불러오지 못했습니다." />

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
        title={editingId ? '학생 정보 수정' : '학생 정보 추가'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText={editingId ? '저장' : '추가'}
        cancelText="취소"
        confirmLoading={saving}
        destroyOnHidden
        width={720}
      >
        <Form form={form} layout="vertical" disabled={saving} initialValues={{ status: 'active' }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="이름" rules={[{ required: true, message: '이름을 입력하세요.' }]}>
                <Input autoComplete="off" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="studentId" label="학생 ID" rules={[{ required: true, message: '학생 ID를 입력하세요.' }]}>
                <Input placeholder="예: ST-1001" autoComplete="off" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="email"
                label="이메일"
                rules={[
                  { required: true, message: '이메일을 입력하세요.' },
                  { type: 'email', message: '올바른 이메일 형식이 아닙니다.' },
                ]}
              >
                <Input inputMode="email" autoComplete="off" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="phone" label="전화번호" rules={[{ required: true, message: '전화번호를 입력하세요.' }]}>
                <Input inputMode="tel" autoComplete="off" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="admissionDate" label="입학 날짜" rules={[{ required: true, message: '입학 날짜를 선택하세요.' }]}>
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="course" label="과정" rules={[{ required: true, message: '과정을 선택하세요.' }]}>
                <Select options={catalog.courses} placeholder="과정 선택" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="level" label="TOPIK 레벨" rules={[{ required: true, message: 'TOPIK 레벨을 선택하세요.' }]}>
                <Select options={topikLevelOptions} placeholder="레벨 선택" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="상태" rules={[{ required: true, message: '상태를 선택하세요.' }]}>
                <Select options={statusOptions} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="password"
            label="비밀번호"
            rules={[{ required: !editingId, message: '비밀번호를 입력하세요.' }]}
            extra={editingId ? '비워 두면 기존 비밀번호가 유지됩니다.' : undefined}
          >
            <Input.Password autoComplete="new-password" placeholder={editingId ? '변경할 때만 입력' : '비밀번호'} />
          </Form.Item>
          <Form.Item label={`TOPIK 결과 파일 (최대 ${MAX_TOPIK_FILES}개, 파일당 5MB)`}>
            <Input type="file" multiple accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.txt" onChange={handleFileChange} />
            {uploadError ? <Alert type="error" message={uploadError} showIcon style={{ marginTop: 12 }} /> : null}
            <div className="student-admin-file-list">
              {topikFiles.length > 0 ? (
                topikFiles.map((file) => (
                  <div key={file.id} className="student-admin-file-item">
                    <Tag color="blue">{file.type || 'FILE'}</Tag>
                    <span>{file.name}</span>
                    <small>{Math.round(file.size / 1024)} KB</small>
                    <Button type="text" size="small" icon={<DeleteOutlined />} aria-label={`${file.name} 제거`} onClick={() => setTopikFiles((current) => current.filter((item) => item.id !== file.id))} />
                  </div>
                ))
              ) : (
                <div className="student-admin-file-empty">첨부된 파일이 없습니다.</div>
              )}
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
