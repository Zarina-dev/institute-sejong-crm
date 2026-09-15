import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import { Alert, Button, Card, Col, Form, Input, Modal, Row, Select, Space, Table, Tag, Typography } from 'antd'
import type { TableProps } from 'antd'
import { useEffect, useMemo, useState, type Key } from 'react'
import { useCatalog } from '../../features/catalog/useCatalog'
import { useConfirmDelete } from '../../shared/useConfirmDelete'
import { createStudent, deleteStudent, getStudents, updateStudent } from '../../features/students/api/studentsApi'

const { Title, Text } = Typography

type TopikFileRecord = {
  id: string
  name: string
  size: number
  type: string
  dataUrl?: string
}

type StudentRecord = {
  id: string
  name: string
  studentId: string
  email: string
  phone: string
  course: string
  level: string
  admissionDate: string
  status: 'active' | 'inactive'
  password?: string
  topikFiles: TopikFileRecord[]
}

const topikLevelOptions = [
  { value: 'TOPIK 1', label: 'TOPIK 1' },
  { value: 'TOPIK 2', label: 'TOPIK 2' },
  { value: 'TOPIK 3', label: 'TOPIK 3' },
  { value: 'TOPIK 4', label: 'TOPIK 4' },
  { value: 'TOPIK 5', label: 'TOPIK 5' },
  { value: 'TOPIK 6', label: 'TOPIK 6' },
]

const statusOptions = [
  { value: 'active', label: '활동 중' },
  { value: 'inactive', label: '비활동' },
]

const MAX_TOPIK_FILES = 2
const MAX_TOPIK_FILE_SIZE = 5 * 1024 * 1024

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(new Error('파일을 읽는 중 오류가 발생했습니다.'))
    reader.readAsDataURL(file)
  })

export function StudentAdminPage() {
  // Shares the 과정 list with 자료실, so items added there show up here too.
  const catalog = useCatalog()
  const confirmDelete = useConfirmDelete()
  const [students, setStudents] = useState<StudentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [topikFiles, setTopikFiles] = useState<TopikFileRecord[]>([])
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [form] = Form.useForm()

  const loadStudents = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await getStudents()
      setStudents(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : '학생 정보를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadStudents()
  }, [])

  const filteredStudents = students

  const openCreateModal = () => {
    setEditingId(null)
    setTopikFiles([])
    setUploadError(null)
    form.resetFields()
    setModalOpen(true)
  }

  const openEditModal = (record: StudentRecord) => {
    setEditingId(record.id)
    setTopikFiles(record.topikFiles ?? [])
    setUploadError(null)
    form.setFieldsValue({
      ...record,
      password: record.password && !record.password.startsWith('$2') ? record.password : '',
    })
    setModalOpen(true)
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? [])

    if (selectedFiles.length === 0) {
      setTopikFiles([])
      setUploadError(null)
      return
    }

    if (selectedFiles.length > MAX_TOPIK_FILES) {
      setUploadError(`TOPIK 결과 파일은 최대 ${MAX_TOPIK_FILES}개까지만 첨부할 수 있습니다.`)
      event.target.value = ''
      return
    }

    const oversizedFile = selectedFiles.find((file) => file.size > MAX_TOPIK_FILE_SIZE)

    if (oversizedFile) {
      setUploadError(`파일 크기는 5MB 이내로 제한됩니다. (${oversizedFile.name})`)
      event.target.value = ''
      return
    }

    try {
      const fileRecords = await Promise.all(
        selectedFiles.map(async (file) => ({
          id: crypto.randomUUID(),
          name: file.name,
          size: file.size,
          type: file.type,
          dataUrl: file.type.startsWith('image/') && file.size <= 250 * 1024 ? await readFileAsDataUrl(file) : undefined,
        })),
      )

      setTopikFiles(fileRecords)
      setUploadError(null)
      event.target.value = ''
    } catch {
      setUploadError('파일을 읽는 도중 오류가 발생했습니다. 다른 파일을 다시 선택해 주세요.')
    }
  }

  const handleSubmit = async () => {
    const values = await form.validateFields()
    const trimmedPassword = String(values.password ?? '').trim()

    const payload = {
      ...values,
      studentId: String(values.studentId).trim(),
      ...(trimmedPassword ? { password: trimmedPassword } : {}),
      topikFiles: topikFiles.map(({ id, name, size, type }) => ({ id, name, size, type })),
    }

    try {
      const saved = editingId ? await updateStudent(editingId, payload) : await createStudent(payload)

      setStudents((current) => {
        if (editingId) {
          return current.map((student) => (student.id === editingId ? saved : student))
        }

        return [saved, ...current]
      })

      setModalOpen(false)
      setTopikFiles([])
      setUploadError(null)
      form.resetFields()
    } catch (err) {
      setError(err instanceof Error ? err.message : '학생 저장에 실패했습니다.')
    }
  }

  const handleDelete = (record: StudentRecord) => {
    confirmDelete({
      target: `${record.name} (${record.studentId})`,
      // Enrollments cascade; applications keep the row with student_id set null.
      note: '학생 정보, TOPIK 파일, 수강 등록 기록이 함께 삭제되며, 이 작업은 되돌릴 수 없습니다.',
      onConfirm: async () => {
        try {
          await deleteStudent(record.id)
          setStudents((current) => current.filter((student) => student.id !== record.id))
        } catch (err) {
          setError(err instanceof Error ? err.message : '학생 삭제에 실패했습니다.')
        }
      },
    })
  }

  const activeStudents = students.filter((student) => student.status === 'active').length
  const studentsWithTopikFiles = students.filter((student) => student.topikFiles?.length).length

  const columnFilters = useMemo(() => {
    const nameFilters = Array.from(new Set(students.map((student) => student.name))).sort().map((name) => ({ text: name, value: name }))
    const courseFilters = Array.from(new Set(students.map((student) => student.course))).sort().map((course) => ({ text: course, value: course }))
    const levelFilters = Array.from(new Set(students.map((student) => student.level))).sort().map((level) => ({ text: level, value: level }))
    const admissionDateFilters = Array.from(new Set(students.map((student) => student.admissionDate))).sort().map((date) => ({ text: date, value: date }))
    const statusFilters = [
      { text: '활동 중', value: 'active' },
      { text: '비활동', value: 'inactive' },
    ]
    const topikFilters = [
      { text: '첨부됨', value: 'attached' },
      { text: '없음', value: 'none' },
    ]
    const passwordFilters = [
      { text: '입력됨', value: 'has' },
      { text: '비어 있음', value: 'empty' },
    ]

    return {
      nameFilters,
      courseFilters,
      levelFilters,
      admissionDateFilters,
      statusFilters,
      topikFilters,
      passwordFilters,
    }
  }, [students])

  const columns: NonNullable<TableProps<StudentRecord>['columns']> = [
    {
      title: '이름',
      dataIndex: 'name',
      key: 'name',
      filters: columnFilters.nameFilters,
      onFilter: (value: boolean | Key, record: StudentRecord) => record.name === String(value),
      filterSearch: true,
    },
    { title: '학생 ID', dataIndex: 'studentId', key: 'studentId' },
    {
      title: '비밀번호',
      dataIndex: 'password',
      key: 'password',
      filters: columnFilters.passwordFilters,
      onFilter: (value: boolean | Key, record: StudentRecord) => {
        if (String(value) === 'has') {
          return Boolean(record.password && !record.password.startsWith('$2'))
        }

        return !record.password || record.password.startsWith('$2')
      },
      render: (value: string) => {
        if (!value) {
          return '-'
        }

        if (value.startsWith('$2')) {
          return '기존 암호화 값(복구 불가)'
        }

        return value
      },
    },
    { title: '이메일', dataIndex: 'email', key: 'email' },
    { title: '전화번호', dataIndex: 'phone', key: 'phone' },
    {
      title: '입학 날짜',
      dataIndex: 'admissionDate',
      key: 'admissionDate',
      filters: columnFilters.admissionDateFilters,
      onFilter: (value: boolean | Key, record: StudentRecord) => record.admissionDate === String(value),
    },
    {
      title: '과정',
      dataIndex: 'course',
      key: 'course',
      filters: columnFilters.courseFilters,
      onFilter: (value: boolean | Key, record: StudentRecord) => record.course === String(value),
      filterSearch: true,
    },
    {
      title: 'TOPIK 레벨',
      dataIndex: 'level',
      key: 'level',
      filters: columnFilters.levelFilters,
      onFilter: (value: boolean | Key, record: StudentRecord) => record.level === String(value),
    },
    {
      title: 'TOPIK 파일',
      dataIndex: 'topikFiles',
      key: 'topikFiles',
      filters: columnFilters.topikFilters,
      onFilter: (value: boolean | Key, record: StudentRecord) => {
        const hasFiles = (record.topikFiles ?? []).length > 0
        return String(value) === 'attached' ? hasFiles : !hasFiles
      },
      render: (files: TopikFileRecord[] = []) => (files.length ? `${files.length}개 첨부` : '없음'),
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      filters: columnFilters.statusFilters,
      onFilter: (value: boolean | Key, record: StudentRecord) => record.status === String(value),
      render: (value: string) => (value === 'active' ? '활동 중' : '비활동'),
    },
    {
      title: '관리',
      key: 'actions',
      render: (_: unknown, record: StudentRecord) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEditModal(record)}>수정</Button>
          <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)}>삭제</Button>
        </Space>
      ),
    },
  ]

  return (
    <div className="page-layout">
      <header className="page-heading">
        <Text className="section-kicker">ADMIN</Text>
        <Title level={1}>학생 관리</Title>
        <Text>관리자가 각 학생의 ID와 비밀번호를 설정하고, TOPIK 결과 파일을 관리할 수 있는 화면입니다.</Text>
      </header>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card className="surface-card student-admin-stat">
            <Text className="student-admin-stat-label">총 학생</Text>
            <Title level={3} className="student-admin-stat-value">{students.length}</Title>
            <Text type="secondary">등록된 학생 수</Text>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="surface-card student-admin-stat">
            <Text className="student-admin-stat-label">활동 중</Text>
            <Title level={3} className="student-admin-stat-value">{activeStudents}</Title>
            <Text type="secondary">현재 활성 상태 학생</Text>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="surface-card student-admin-stat">
            <Text className="student-admin-stat-label">TOPIK 첨부</Text>
            <Title level={3} className="student-admin-stat-value">{studentsWithTopikFiles}</Title>
            <Text type="secondary">결과 파일이 있는 학생</Text>
          </Card>
        </Col>
      </Row>

      <Card className="surface-card filter-card">
        <div className="filter-footer">
          <Text>{students.length}명의 학생</Text>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>학생 추가</Button>
        </div>
      </Card>

      {error ? <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} /> : null}

      {loading ? (
        <Alert type="info" message="학생 정보를 불러오는 중입니다." showIcon />
      ) : (
        <Card className="surface-card">
          <Table className="admin-table" columns={columns} dataSource={filteredStudents} rowKey="id" pagination={{ pageSize: 10 }} scroll={{ x: 1400 }} />
        </Card>
      )}

      <Modal
        title={editingId ? '학생 정보 수정' : '학생 정보 추가'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText={editingId ? '저장' : '추가'}
        cancelText="취소"
        width={720}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="이름" rules={[{ required: true, message: '이름을 입력하세요.' }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="studentId" label="학생 ID" rules={[{ required: true, message: '학생 ID를 입력하세요.' }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="email" label="이메일" rules={[{ required: true, message: '이메일을 입력하세요.' }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="phone" label="전화번호" rules={[{ required: true, message: '전화번호를 입력하세요.' }]}>
                <Input />
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
                <Select options={catalog.courses} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="level" label="TOPIK 레벨" rules={[{ required: true, message: 'TOPIK 레벨을 선택하세요.' }]}>
            <Select options={topikLevelOptions} />
          </Form.Item>

          <Form.Item name="status" label="상태" rules={[{ required: true, message: '상태를 선택하세요.' }]}>
            <Select options={statusOptions} />
          </Form.Item>

          <Form.Item
            name="password"
            label="비밀번호"
            rules={[{ required: !editingId, message: '비밀번호를 입력하세요.' }]}
          >
            <Input.Password placeholder={editingId ? '비밀번호를 변경하려면 새 값 입력' : '비밀번호를 입력하세요.'} />
          </Form.Item>

          <Form.Item label="TOPIK 결과 파일 (최대 2개)">
            <Input type="file" multiple accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.txt" onChange={handleFileChange} />
            {uploadError ? (
              <Alert type="error" message={uploadError} showIcon style={{ marginTop: 12 }} />
            ) : null}

            <div className="student-admin-file-list">
              {topikFiles.length > 0 ? (
                topikFiles.map((file) => (
                  <div key={file.id} className="student-admin-file-item">
                    <Tag color="blue">{file.type || 'FILE'}</Tag>
                    <span>{file.name}</span>
                    <small>{Math.round(file.size / 1024)} KB</small>
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
