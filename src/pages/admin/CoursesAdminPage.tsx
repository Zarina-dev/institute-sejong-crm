import { CopyOutlined, DeleteOutlined, EditOutlined, EyeInvisibleOutlined, EyeOutlined, FileExcelOutlined, MoreOutlined, PlusOutlined, PrinterOutlined, SwapOutlined } from '@ant-design/icons'
import type { TableProps } from 'antd'
import { Alert, App, AutoComplete, Button, Card, Col, Dropdown, Empty, Form, Input, InputNumber, Modal, Row, Segmented, Select, Skeleton, Space, Table, Tag, Typography } from 'antd'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { usePreferences } from '../../app/preferences'
import type { TranslationKey } from '../../app/preferences'
import { SessionsEditor } from '../../features/courses/SessionsEditor'
import { courseTitles, groupCourses } from '../../features/courses/grouping'
import { sessionParts, weeklyHoursFromSessions } from '../../features/courses/sessions'
import { courseTerm } from '../../features/courses/terms'
import { useCourses, useCreateCourse, useDeleteCourse, useSetCoursePublished, useUpdateCourse } from '../../features/courses/queries'
import { TermSelect } from '../../features/terms/TermSelect'
import { termInProgress } from '../../features/terms/current'
import { TermPicker } from '../../features/terms/TermPicker'
import { useTermChoice } from '../../features/terms/useTermChoice'
import { useTerms } from '../../features/terms/queries'
import type { AcademicTerm } from '../../features/terms/types'
import { useAllStaff } from '../../features/staff/queries'
import { staffStatus } from '../../features/staff/status'
import type { CourseRecord, CourseSession } from '../../features/courses/types'
import { ErrorAlert } from '../../shared/ErrorAlert'
import { getErrorMessage } from '../../shared/errors'
import { formatDate } from '../../shared/format'
import { PageHeader } from '../../shared/PageHeader'
import { useConfirmDelete } from '../../shared/useConfirmDelete'
import { useTableLayout } from '../../shared/useTableLayout'

const { Title, Text } = Typography

const dash = <Text type="secondary">—</Text>

const sumOf = (courses: CourseRecord[], field: 'expectedStudents' | 'actualStudents') =>
  courses.reduce((sum, course) => sum + (course[field] ?? 0), 0)

/**
 * One table, three readings of it — the three public pages it feeds.
 * 학사 일정 is every course, because the calendar is built from all of them.
 */
type CourseView = 'language' | 'schedule' | 'culture'

const COURSE_VIEWS: Record<CourseView, TranslationKey> = {
  language: 'siteNav.programmesCourses',
  schedule: 'siteNav.programmesCalendar',
  culture: 'siteNav.programmesCulture',
}

/**
 * 학사 일정 reads the same table a third way, so it manages nothing that
 * 강좌 안내 and 문화 강좌 do not already manage. The name stays on the
 * switch and in the menu — the view is simply closed.
 */
const DISABLED_VIEWS: CourseView[] = ['schedule']

const NO_TERMS: AcademicTerm[] = []

const inView = (record: CourseRecord, view: CourseView) =>
  view === 'schedule' ? true : view === 'culture' ? record.category === 'culture' : record.category !== 'culture'

type CourseFormValues = {
  category: 'language' | 'culture'
  title: string
  description?: string
  subject: string
  teacherName?: string
  sessions: CourseSession[]
  classroom?: string
  /** 학기 code from 학기 관리; the class takes its period from it. */
  term: string
  /** 학기 전체 (true) or dates of its own inside the semester. */
  followsTerm: boolean
  startDate?: string
  endDate?: string
  expectedStudents?: number | null
  actualStudents?: number | null
  totalHours?: number | null
  weeklyHours?: number | null
  isPublished: boolean
}

export function CoursesAdminPage() {
  const { t, language } = usePreferences()
  const { message } = App.useApp()
  const confirmDelete = useConfirmDelete()
  const { pinActions } = useTableLayout()

  const staff = useAllStaff()
  const terms = useTerms()
  const createCourse = useCreateCourse()
  const updateCourse = useUpdateCourse()
  const deleteCourse = useDeleteCourse()
  const setPublished = useSetCoursePublished()

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  /** The class a duplicate was taken from, so the form can say so. */
  const [copiedFrom, setCopiedFrom] = useState<string | null>(null)
  const [form] = Form.useForm<CourseFormValues>()
  const [exporting, setExporting] = useState(false)

  // The view is in the URL, so 강좌 안내 · 학사 일정 · 문화 강좌 in the admin
  // menu land on the reading of this table they manage.
  const [params, setParams] = useSearchParams()
  const requested = params.get('view') as CourseView | null
  const view: CourseView =
    requested && requested in COURSE_VIEWS && !DISABLED_VIEWS.includes(requested) ? requested : 'language'

  /**
   * One semester of one list, as on the site: the table, its counts and the
   * Excel export are all per semester, which is how the office reports.
   * Opens on the semester in progress.
   */
  const { active: activeTerm, select: selectTerm } = useTermChoice(terms.data ?? NO_TERMS, { scope: 'admin' })
  const courses = useCourses(
    false,
    { term: activeTerm?.code, category: view === 'culture' ? 'culture' : 'language' },
    !terms.isPending,
  )

  useEffect(() => {
    if (requested !== view) {
      setParams({ view }, { replace: true })
    }
  }, [requested, setParams, view])

  // Once the admin types a figure we stop overwriting it; institutes count
  // teaching periods their own way and the computed hours are only a default.
  const weeklyHoursEdited = useRef(false)
  const sessions = Form.useWatch('sessions', form)

  useEffect(() => {
    if (!modalOpen || weeklyHoursEdited.current) {
      return
    }

    form.setFieldValue('weeklyHours', weeklyHoursFromSessions(sessions))
  }, [form, modalOpen, sessions])

  const saving = createCourse.isPending || updateCourse.isPending

  /* ------------------------------ period ------------------------------ */

  const chosenTerm = Form.useWatch('term', form)
  const followsTerm = Form.useWatch('followsTerm', form)
  const selectedTerm = useMemo(() => (terms.data ?? NO_TERMS).find((term) => term.code === chosenTerm), [chosenTerm, terms.data])

  // Whichever way the period is set, the semester's own dates are the frame.
  const periodHint = selectedTerm
    ? t('courses.form.periodHint', { from: formatDate(selectedTerm.startDate, language), to: formatDate(selectedTerm.endDate, language) })
    : undefined

  /* ------------------------------- modal ------------------------------ */

  const openCreateModal = useCallback(() => {
    setEditingId(null)
    setCopiedFrom(null)
    weeklyHoursEdited.current = false
    form.resetFields()
    // A class added from 문화 강좌 is a culture class.
    // 구분 is not asked for: the page the admin is on decides it.
    form.setFieldValue('category', view === 'culture' ? 'culture' : 'language')
    // The semester the institute is in right now — the one being enrolled
    // for — so the usual case needs no choosing.
    form.setFieldValue('term', termInProgress(terms.data ?? NO_TERMS)?.code)
    setModalOpen(true)
  }, [form, terms.data, view])

  /** Every field of a class, for editing it or for taking a copy of it. */
  const fillForm = useCallback(
    (record: CourseRecord) => {
      // An existing figure is the admin's; keep it until they clear the field.
      weeklyHoursEdited.current = record.weeklyHours != null
      form.setFieldsValue({
        category: record.category ?? 'language',
        title: record.title,
        description: record.description ?? undefined,
        subject: record.subject,
        teacherName: record.teacherName ?? undefined,
        sessions: record.sessions ?? [],
        classroom: record.classroom ?? undefined,
        // A class saved before the field existed falls back to the semester
        // its start date lands in.
        term: courseTerm(record) ?? undefined,
        // A class saved before the field existed kept its own dates.
        followsTerm: record.followsTerm ?? false,
        startDate: record.startDate ?? undefined,
        endDate: record.endDate ?? undefined,
        expectedStudents: record.expectedStudents ?? null,
        actualStudents: record.actualStudents ?? null,
        totalHours: record.totalHours ?? null,
        weeklyHours: record.weeklyHours ?? null,
        isPublished: record.isPublished,
      })
      setModalOpen(true)
    },
    [form],
  )

  const openEditModal = useCallback(
    (record: CourseRecord) => {
      setEditingId(record.id)
      setCopiedFrom(null)
      fillForm(record)
    },
    [fillForm],
  )

  /**
   * 복제 — a weekly class is rarely one of a kind: the same programme runs
   * in two rooms, or the next level starts on the same days. Duplicating
   * opens the form filled from the class, saving as a new one; the original
   * is never touched.
   */
  const openDuplicateModal = useCallback(
    (record: CourseRecord) => {
      setEditingId(null)
      // The 세부 과정 is what names a class in the table.
      setCopiedFrom(record.subject || record.title)
      fillForm(record)
    },
    [fillForm],
  )

  const submitForm = async () => {
    const values = await form.validateFields().catch(() => null)

    if (!values) {
      return
    }

    // A class that runs the whole semester has no dates of its own: the
    // API takes them from the term, and keeps them in step with it.
    const payload = {
      ...values,
      // Belt and braces: a class added from 문화 강좌 is a culture class,
      // whatever the form happens to be carrying.
      category: editingId ? values.category : view === 'culture' ? 'culture' : 'language',
      ...(values.followsTerm ? { startDate: undefined, endDate: undefined } : {}),
    }

    try {
      const saved = editingId ? await updateCourse.mutateAsync({ id: editingId, payload }) : await createCourse.mutateAsync(payload)
      message.success(t(editingId ? 'courses.updated' : 'courses.created'))

      // The table shows one semester; a class saved into another one would
      // seem to vanish, so follow it there.
      if (saved.term && saved.term !== activeTerm?.code) {
        selectTerm(saved.term)
      }

      setModalOpen(false)
      form.resetFields()
    } catch (err) {
      message.error(getErrorMessage(err, t('courses.saveFailed')))
    }
  }

  /* ------------------------------ actions ----------------------------- */

  /**
   * 강좌 안내 ↔ 문화 강좌. The form does not ask for 구분 — the page an
   * admin adds from decides it — so a class entered on the wrong page is
   * moved from the row rather than by retyping it.
   */
  const handleMove = useCallback(
    (record: CourseRecord) => {
      const category = (record.category ?? 'language') === 'culture' ? 'language' : 'culture'

      updateCourse.mutate(
        { id: record.id, payload: { category } },
        {
          onSuccess: () => message.success(t(category === 'culture' ? 'courses.movedToCulture' : 'courses.movedToLanguage')),
          onError: (err) => message.error(getErrorMessage(err, t('courses.saveFailed'))),
        },
      )
    },
    [message, t, updateCourse],
  )

  const handleTogglePublished = useCallback(
    (record: CourseRecord) => {
      setPublished.mutate(
        { id: record.id, published: !record.isPublished },
        { onError: (err) => message.error(getErrorMessage(err, t('courses.publishFailed'))) },
      )
    },
    [message, setPublished, t],
  )

  const handleDelete = useCallback(
    (record: CourseRecord) => {
      confirmDelete({
        target: record.title,
        onConfirm: () =>
          deleteCourse.mutateAsync(record.id).then(
            () => message.success(t('courses.deleted')),
            (err) => message.error(getErrorMessage(err, t('courses.deleteFailed'))),
          ),
      })
    },
    [confirmDelete, deleteCourse, message, t],
  )

  /* ------------------------------ columns ----------------------------- */

  // One table per programme, so the head counts add up per programme the
  // way the office reports them (한국어 / 영어 / 기타 …).
  const programmes = useMemo(
    () => groupCourses((courses.data ?? []).filter((record) => inView(record, view))),
    [courses.data, view],
  )
  const rows = useMemo(() => programmes.flatMap((programme) => programme.courses), [programmes])

  const titleOptions = useMemo(() => courseTitles(courses.data).map((value) => ({ value })), [courses.data])

  const handleExcel = useCallback(async () => {
    setExporting(true)

    try {
      const { exportCoursesToExcel } = await import('../../features/courses/exportCourses')
      await exportCoursesToExcel(rows, t, language, `${t(COURSE_VIEWS[view])}-${activeTerm?.code ?? new Date().toISOString().slice(0, 10)}.xlsx`)
    } catch (err) {
      message.error(getErrorMessage(err, t('courses.export.failed')))
    } finally {
      setExporting(false)
    }
  }, [activeTerm?.code, language, message, rows, t, view])

  /**
   * Teachers come from 교직원: those working here and those about to join (a
   * class for next semester may go to someone starting next month) — never
   * those who have left. The one exception is the teacher already on the
   * class being edited, kept and marked 퇴직, so opening an old class never
   * silently drops its teacher.
   */
  const assignedTeacher = Form.useWatch('teacherName', form)
  const staffOptions = useMemo(() => {
    const options = (staff.data ?? [])
      .filter((member) => staffStatus(member) !== 'former')
      .map((member) => ({
        value: member.name,
        label: staffStatus(member) === 'upcoming' ? `${member.name} · ${t('staff.upcoming')}` : member.name,
      }))

    if (assignedTeacher && !options.some((option) => option.value === assignedTeacher)) {
      options.push({ value: assignedTeacher, label: `${assignedTeacher} · ${t('staff.former')}` })
    }

    return options.sort((a, b) => a.value.localeCompare(b.value))
  }, [assignedTeacher, staff.data, t])

  const columns = useMemo<NonNullable<TableProps<CourseRecord>['columns']>>(
    () => [
      {
        title: t('courses.form.subject'),
        key: 'subject',
        render: (_, record) => <Text strong>{record.subject}</Text>,
      },
      {
        title: t('courses.form.teacher'),
        dataIndex: 'teacherName',
        key: 'teacherName',
        width: 120,
        render: (value: string | null) => value || dash,
      },
      {
        title: t('courses.table.days'),
        key: 'days',
        width: 100,
        render: (_, record) => {
          const parts = sessionParts(record.sessions, language)
          return parts.length ? parts.map((part) => <div key={part.days + part.time}>{part.days}</div>) : dash
        },
      },
      {
        title: t('courses.table.time'),
        key: 'time',
        width: 130,
        render: (_, record) => {
          const parts = sessionParts(record.sessions, language)
          return parts.length ? parts.map((part) => <div key={part.days + part.time}>{part.time}</div>) : dash
        },
      },
      {
        title: t('courses.table.period'),
        key: 'period',
        width: 170,
        responsive: ['xl'],
        render: (_, record) => (
          <div className="cell-stack">
            <Text type="secondary">
              {record.startDate || '-'} ~ {record.endDate || '-'}
            </Text>
            {/* Whether those dates are the semester's or the class's own. */}
            {record.followsTerm ? <Tag className="period-tag">{t('courses.form.wholeTermTag')}</Tag> : null}
          </div>
        ),
      },
      /* ---- Semester figures (the office's own numbers) ---- */
      {
        title: t('courses.form.expectedStudents'),
        dataIndex: 'expectedStudents',
        key: 'expectedStudents',
        width: 80,
        align: 'center',
        responsive: ['lg'],
        render: (value: number | null) => value ?? dash,
      },
      {
        title: t('courses.form.actualStudents'),
        dataIndex: 'actualStudents',
        key: 'actualStudents',
        width: 80,
        align: 'center',
        responsive: ['lg'],
        render: (value: number | null) => value ?? dash,
      },
      {
        title: t('courses.form.totalHours'),
        dataIndex: 'totalHours',
        key: 'totalHours',
        width: 90,
        align: 'center',
        responsive: ['xl'],
        render: (value: number | null) => value ?? dash,
      },
      {
        title: t('courses.form.weeklyHours'),
        key: 'weeklyHours',
        width: 80,
        align: 'center',
        responsive: ['xl'],
        render: (_, record) => record.weeklyHours ?? weeklyHoursFromSessions(record.sessions) ?? dash,
      },
      {
        title: t('courses.columns.visibility'),
        dataIndex: 'isPublished',
        key: 'isPublished',
        width: 110,
        render: (value: boolean) => (
          <Tag color={value ? 'green' : 'gold'}>{value ? t('common.published') : t('common.unpublished')}</Tag>
        ),
      },
      {
        // With the semester figures on screen the row is wide, so the three
        // buttons collapse into one menu.
        title: t('common.actions'),
        key: 'actions',
        fixed: pinActions,
        width: 90,
        align: 'center',
        render: (_, record) => (
          <Dropdown
            trigger={['click']}
            menu={{
              items: [
                { key: 'edit', icon: <EditOutlined />, label: t('common.edit'), onClick: () => openEditModal(record) },
                { key: 'duplicate', icon: <CopyOutlined />, label: t('courses.duplicate'), onClick: () => openDuplicateModal(record) },
                {
                  key: 'move',
                  icon: <SwapOutlined />,
                  label: t((record.category ?? 'language') === 'culture' ? 'courses.moveToLanguage' : 'courses.moveToCulture'),
                  onClick: () => handleMove(record),
                },
                {
                  key: 'publish',
                  icon: record.isPublished ? <EyeInvisibleOutlined /> : <EyeOutlined />,
                  label: record.isPublished ? t('common.unpublish') : t('common.publish'),
                  onClick: () => handleTogglePublished(record),
                },
                { type: 'divider' },
                { key: 'delete', icon: <DeleteOutlined />, label: t('common.delete'), danger: true, onClick: () => handleDelete(record) },
              ],
            }}
          >
            <Button
              size="small"
              icon={<MoreOutlined />}
              aria-label={t('common.actions')}
              loading={setPublished.isPending && setPublished.variables?.id === record.id}
            />
          </Dropdown>
        ),
      },
    ],
    [handleDelete, handleMove, handleTogglePublished, language, openDuplicateModal, openEditModal, pinActions, setPublished.isPending, setPublished.variables?.id, t],
  )

  /* ------------------------------- render ----------------------------- */

  return (
    <div className="page-layout courses-admin">
      <div className="print-only print-heading">
        <strong>{t('brand.name')}</strong>
        <span>
          {t(COURSE_VIEWS[view])} · {new Date().toLocaleDateString(language)}
        </span>
      </div>

      <PageHeader
        kicker={t('courses.adminTitle')}
        title={t(COURSE_VIEWS[view])}
        description={t('courses.adminSubtitle')}
      />

      <Card className="surface-card filter-card no-print">
        <div className="filter-footer">
          {/* Which list this is comes from the admin menu (강좌 안내 / 문화 강좌);
              the page only chooses the semester. */}
          <TermPicker terms={terms.data ?? NO_TERMS} active={activeTerm} onSelect={selectTerm} />
          <Space wrap>
            <Text>{t('courses.count', { count: rows.length })}</Text>
            {/* The table doubles as the office's semester report. */}
            <Button icon={<FileExcelOutlined />} loading={exporting} onClick={handleExcel}>
              {t('courses.export.excel')}
            </Button>
            <Button icon={<PrinterOutlined />} onClick={() => window.print()}>
              {t('courses.export.pdf')}
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
              {t('courses.add')}
            </Button>
          </Space>
        </div>
      </Card>

      <ErrorAlert error={courses.error} fallback={t('courses.loadFailed')} />

      {courses.isPending || terms.isPending ? (
        <Card className="surface-card">
          <Skeleton active paragraph={{ rows: 6 }} />
        </Card>
      ) : programmes.length === 0 ? (
        <Card className="surface-card empty-card">
          <Empty description={t('courses.empty')} />
        </Card>
      ) : (
        <div className="semester-tables">
          {programmes.map((programme) => (
            <section key={programme.title} aria-labelledby={`courses-${programme.title}`}>
              <div className="semester-heading">
                <Title level={3} id={`courses-${programme.title}`}>
                  {programme.title}
                </Title>
                <Text type="secondary">{t('courses.classCount', { count: programme.courses.length })}</Text>
              </div>

              <Card className="surface-card">
                <Table
                  className="admin-table semester-table"
                  columns={columns}
                  dataSource={programme.courses}
                  rowKey="id"
                  // No paging: the office reads a programme as one block.
                  pagination={false}
                  scroll={{ x: 'max-content' }}
                  /* Each programme closes with its own 계, as on the paper form. */
                  summary={() => (
                    <Table.Summary fixed>
                      <Table.Summary.Row className="semester-table__total">
                        <Table.Summary.Cell index={0} colSpan={5} align="right">
                          <Text strong>{t('courses.table.total')}</Text>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={5} align="center">
                          <Text strong>{sumOf(programme.courses, 'expectedStudents')}</Text>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={6} align="center">
                          <Text strong>{sumOf(programme.courses, 'actualStudents')}</Text>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={7} colSpan={4} />
                      </Table.Summary.Row>
                    </Table.Summary>
                  )}
                />
              </Card>
            </section>
          ))}
        </div>
      )}

      <Modal
        title={editingId ? t('courses.editTitle') : copiedFrom ? t('courses.duplicateTitle') : t('courses.addTitle')}
        open={modalOpen}
        onOk={submitForm}
        onCancel={() => setModalOpen(false)}
        okText={editingId ? t('common.save') : t('common.add')}
        cancelText={t('common.cancel')}
        confirmLoading={saving}
        forceRender
        width={760}
      >
        <Form form={form} layout="vertical" disabled={saving} initialValues={{ isPublished: false, sessions: [], category: 'language', followsTerm: true }}>
          {copiedFrom ? <Alert type="info" showIcon className="form-notice" message={t('courses.duplicateHint', { title: copiedFrom })} /> : null}

          {/* 구분 is not asked for — the page the admin is on decides it —
              but the field still has to be part of the form: an unregistered
              value is not returned by validateFields, and the class would be
              saved under the API's default. */}
          <Form.Item name="category" hidden>
            <Input />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              {/* Programme: pick an existing one to add a class under it, or type a new one. */}
              <Form.Item name="title" label={t('courses.form.title')} extra={t('courses.form.titleHint')} rules={[{ required: true, whitespace: true, message: t('courses.form.titleRequired') }]}>
                <AutoComplete options={titleOptions} placeholder={t('courses.form.titlePlaceholder')} maxLength={255} filterOption={(input, option) => String(option?.value ?? '').toLowerCase().includes(input.toLowerCase())} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="subject" label={t('courses.form.subject')} extra={t('courses.form.subjectHint')} rules={[{ required: true, whitespace: true, message: t('courses.form.subjectRequired') }]}>
                <Input placeholder={t('courses.form.subjectPlaceholder')} maxLength={120} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label={t('courses.form.description')}>
            <Input.TextArea rows={4} maxLength={4000} showCount />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="teacherName" label={t('courses.form.teacher')} extra={staffOptions.length === 0 ? t('courses.form.teacherEmpty') : undefined}>
                <Select
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  placeholder={t('courses.form.teacherPlaceholder')}
                  options={staffOptions}
                  notFoundContent={t('courses.form.teacherEmpty')}
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="classroom" label={t('courses.form.classroom')}>
            <Input maxLength={120} />
          </Form.Item>
          <Form.Item label={t('courses.sessions.label')} extra={t('courses.sessions.hint')}>
            <SessionsEditor disabled={saving} />
          </Form.Item>
          {/* The semester is the period: a class runs for the term it is
              filed under, so the dates come from 학기 관리 rather than being
              typed again on every class. */}
          <Form.Item
            name="term"
            label={t('terms.label')}
            extra={terms.data?.length ? t('courses.form.termHint') : t('courses.form.termEmpty')}
            rules={[{ required: true, message: t('courses.form.termRequired') }]}
          >
            <TermSelect terms={terms.data ?? NO_TERMS} disabled={saving} />
          </Form.Item>

          {/* Most classes run the whole semester. A 문화 강좌 is often a
              short course inside it — four weeks of 부채춤 — so it says so
              and sets its own dates, which must stay within the semester. */}
          <Form.Item name="followsTerm" label={t('courses.form.period')} extra={periodHint}>
            <Segmented
              options={[
                { value: true, label: t('courses.form.wholeTerm') },
                { value: false, label: t('courses.form.ownDates') },
              ]}
            />
          </Form.Item>

          {followsTerm === false ? (
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="startDate"
                  label={t('courses.form.startDate')}
                  rules={[{ required: true, message: t('courses.form.startDateRequired') }]}
                >
                  <Input type="date" min={selectedTerm?.startDate} max={selectedTerm?.endDate} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="endDate"
                  label={t('courses.form.endDate')}
                  dependencies={['startDate']}
                  rules={[
                    { required: true, message: t('courses.form.endDateRequired') },
                    ({ getFieldValue }) => ({
                      validator: (_, value?: string) =>
                        !value || !getFieldValue('startDate') || value >= getFieldValue('startDate')
                          ? Promise.resolve()
                          : Promise.reject(new Error(t('courses.form.endBeforeStart'))),
                    }),
                  ]}
                >
                  <Input type="date" min={selectedTerm?.startDate} max={selectedTerm?.endDate} />
                </Form.Item>
              </Col>
            </Row>
          ) : null}
          {/* Semester table (학사 일정): 예상수 · 실제수 · 총 시간수 · 주 시간 */}
          <Row gutter={16}>
            <Col xs={12} md={6}>
              <Form.Item name="expectedStudents" label={t('courses.form.expectedStudents')}>
                <InputNumber min={0} max={999} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={12} md={6}>
              <Form.Item name="actualStudents" label={t('courses.form.actualStudents')}>
                <InputNumber min={0} max={999} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={12} md={6}>
              <Form.Item name="totalHours" label={t('courses.form.totalHours')}>
                <InputNumber min={0} max={9999} step={0.5} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={12} md={6}>
              <Form.Item name="weeklyHours" label={t('courses.form.weeklyHours')} extra={t('courses.form.weeklyHoursHint')}>
                <InputNumber
                  min={0}
                  max={168}
                  step={0.5}
                  style={{ width: '100%' }}
                  onChange={() => {
                    weeklyHoursEdited.current = true
                  }}
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="isPublished" label={t('courses.form.visibility')}>
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
