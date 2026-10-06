import {
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  EyeOutlined,
  FileTextOutlined,
  LockOutlined,
  PaperClipOutlined,
  PlusOutlined,
  PrinterOutlined,
  TeamOutlined,
  UploadOutlined,
} from '@ant-design/icons'
import {
  Alert,
  App,
  AutoComplete,
  Button,
  Card,
  Drawer,
  Dropdown,
  Empty,
  Form,
  Input,
  Modal,
  Segmented,
  Select,
  Skeleton,
  Space,
  Tag,
  Typography,
  Upload,
} from 'antd'
import type { UploadProps } from 'antd'
import { useCallback, useMemo, useRef, useState } from 'react'

import { usePreferences } from '../../app/preferences'
import { useQueryClient } from '@tanstack/react-query'

import { getMeeting } from '../../features/meetings/api'
import { downloadMeetingPdf, printMeeting } from '../../features/meetings/exportMeeting'
import { MeetingDocument } from '../../features/meetings/MeetingDocument'
import { meetingKeys, useCreateMeeting, useDeleteMeeting, useMeeting, useMeetings, useUpdateMeeting } from '../../features/meetings/queries'
import { attendeeFromStaff, employedOn, ROLE_LABEL } from '../../features/meetings/roles'
import { ATTENDEE_ROLES, type AttendeeRole, type MeetingAttachment, type MeetingAttendee, type MeetingSummary } from '../../features/meetings/types'
import { useAllStaff } from '../../features/staff/queries'
import type { StaffMember } from '../../features/staff/types'
import { DOCUMENT_ACCEPT, MAX_DOCUMENT_SIZE, uploadDocument } from '../../features/uploads/api'
import { ErrorAlert } from '../../shared/ErrorAlert'
import { getErrorMessage } from '../../shared/errors'
import { FilePreview, FileView, type PreviewFile } from '../../shared/FilePreview'
import { formatDate, formatFileSize } from '../../shared/format'
import { PageHeader } from '../../shared/PageHeader'
import { RichTextEditor } from '../../shared/RichTextEditor'
import { useConfirmDelete } from '../../shared/useConfirmDelete'
import { YearSelect } from '../../shared/YearSelect'

const { Text } = Typography

type MeetingFormValues = {
  title: string
  heldOn: string
  method?: string
  place?: string
  drafter?: string
  approver?: string
  attendeeList: MeetingAttendee[]
  body?: string
  decisions?: string
  attachments?: MeetingAttachment[]
  original?: MeetingAttachment | null
}

const NO_MEETINGS: MeetingSummary[] = []
const NO_STAFF: StaffMember[] = []

/** The institute's name as its form prints it. */
const INSTITUTE = '오시1 세종학당'
/** What the form is filled with when there is nothing earlier to go by. */
const DEFAULT_TITLE = '주간업무회의'
const METHOD_SUGGESTIONS = ['현장 회의', '화상 회의', '화상 회의 및 현장 토의']
const PLACE_SUGGESTIONS = ['오시1 세종학당 행정실']

const today = () => new Date().toISOString().slice(0, 10)

/** ISO week number — the minutes are written weekly, so each carries its week. */
function weekOfYear(date: string): number {
  const day = new Date(`${date}T00:00:00Z`)
  const thursday = new Date(day)
  thursday.setUTCDate(day.getUTCDate() + 3 - ((day.getUTCDay() + 6) % 7))
  const firstThursday = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 4))
  const diff = thursday.getTime() - firstThursday.getTime()

  return 1 + Math.round(diff / (7 * 24 * 60 * 60 * 1000) - ((firstThursday.getUTCDay() + 6) % 7) / 7)
}

/** Distinct earlier answers first, then the usual ones — for the AutoCompletes. */
const suggestions = (used: string[], fallback: string[]) =>
  [...new Set([...used.map((value) => value.trim()).filter(Boolean), ...fallback])].map((value) => ({ value }))

/**
 * Minutes written before 참석 현황 had rows carry only a line of names: on
 * editing, staff are matched by name and placed by position, anyone else
 * comes in as a guest.
 */
function attendeesOf(meeting: Pick<MeetingSummary, 'attendeeList' | 'attendees'>, staff: StaffMember[]): MeetingAttendee[] {
  if (meeting.attendeeList?.length) {
    return meeting.attendeeList
  }

  return meeting.attendees
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name) => {
      const member = staff.find((candidate) => candidate.name === name)
      return member ? attendeeFromStaff(member) : { staffId: null, name, role: 'other' as const, position: '' }
    })
}

/**
 * 회의록 — weekly minutes, read one year at a time. Written here on the
 * institute's own form (MeetingDocument), or kept as the file the office
 * already wrote (원본 자료), or both. Opening an entry shows the minutes
 * themselves at once — the written form, the original in place — with
 * print and PDF at hand.
 */
export function MeetingsAdminPage() {
  const { t, language } = usePreferences()
  const { message } = App.useApp()
  const confirmDelete = useConfirmDelete()

  const meetings = useMeetings()
  const staff = useAllStaff()
  const staffList = staff.data ?? NO_STAFF
  const createMeeting = useCreateMeeting()
  const updateMeeting = useUpdateMeeting()
  const deleteMeeting = useDeleteMeeting()

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)
  const [view, setView] = useState<'written' | 'original'>('written')
  const [preview, setPreview] = useState<PreviewFile | null>(null)
  const [uploading, setUploading] = useState<'attachment' | 'original' | null>(null)
  const [exporting, setExporting] = useState(false)
  const [form] = Form.useForm<MeetingFormValues>()
  const queryClient = useQueryClient()
  const [loadingMeeting, setLoadingMeeting] = useState(false)
  const documentRef = useRef<HTMLDivElement>(null)
  const saving = createMeeting.isPending || updateMeeting.isPending

  const all = meetings.data ?? NO_MEETINGS
  const titleOf = useCallback((meeting: MeetingSummary) => t('meetings.titleOf', { date: formatDate(meeting.heldOn, language) }), [language, t])

  const years = useMemo(() => [...new Set(all.map((meeting) => meeting.heldOn.slice(0, 4)))].sort().reverse(), [all])
  const [year, setYear] = useState<string | null>(null)
  const activeYear = year && years.includes(year) ? year : (years[0] ?? null)
  const rows = useMemo(() => all.filter((meeting) => meeting.heldOn.startsWith(activeYear ?? '')), [activeYear, all])

  const open = all.find((meeting) => meeting.id === openId) ?? null
  // The list has no notes or decisions; the open meeting brings its own.
  const openDetail = useMeeting(openId)
  const full = openDetail.data
  const hasWritten = Boolean(full && (full.body || full.decisions || full.attendeeList?.length || full.method || full.place || full.attendees))
  const shown: 'written' | 'original' = open?.original ? (hasWritten ? view : 'original') : 'written'

  const options = useMemo(
    () => ({
      title: suggestions(
        all.map((meeting) => meeting.title),
        [DEFAULT_TITLE],
      ),
      method: suggestions(
        all.map((meeting) => meeting.method),
        METHOD_SUGGESTIONS,
      ),
      place: suggestions(
        all.map((meeting) => meeting.place),
        PLACE_SUGGESTIONS,
      ),
    }),
    [all],
  )

  const openMeeting = useCallback((meeting: MeetingSummary) => {
    setOpenId(meeting.id)
    setView('written')
  }, [])

  /**
   * A new entry starts from the last one written on the form: the same
   * meeting, place and people week after week, so only what changed is typed.
   */
  const openCreateModal = useCallback(() => {
    setEditingId(null)
    form.resetFields()
    const last = all.find((meeting) => meeting.attendeeList?.length) ?? all[0]
    const day = today()

    form.setFieldsValue({
      heldOn: day,
      title: last?.title || DEFAULT_TITLE,
      method: last?.method ?? '',
      place: last?.place ?? '',
      drafter: last?.drafter ?? '',
      approver: last?.approver ?? '',
      // Only people still working here are carried over.
      attendeeList: (last?.attendeeList ?? []).filter((attendee) => {
        const member = staffList.find((candidate) => candidate.id === attendee.staffId)
        return !attendee.staffId || (member ? employedOn(member, day) : false)
      }),
      body: '',
      decisions: '',
      attachments: [],
      original: null,
    })
    setModalOpen(true)
  }, [all, form, staffList])

  /**
   * The form opens at once with what the row has, disabled until the notes
   * and decisions are fetched — nothing typed can be overwritten by them.
   */
  const openEditModal = useCallback(
    (meeting: MeetingSummary) => {
      setEditingId(meeting.id)
      form.resetFields()
      form.setFieldsValue({
        title: meeting.title,
        heldOn: meeting.heldOn,
        method: meeting.method,
        place: meeting.place,
        drafter: meeting.drafter,
        approver: meeting.approver,
        attendeeList: attendeesOf(meeting, staffList),
        body: '',
        decisions: '',
        attachments: meeting.attachments ?? [],
        original: meeting.original,
      })
      setModalOpen(true)
      setLoadingMeeting(true)

      queryClient
        .fetchQuery({ queryKey: meetingKeys.detail(meeting.id), queryFn: () => getMeeting(meeting.id) })
        .then((detail) => form.setFieldsValue({ body: detail.body, decisions: detail.decisions }))
        .catch((err) => {
          message.error(getErrorMessage(err, t('meetings.loadFailed')))
          setModalOpen(false)
        })
        .finally(() => setLoadingMeeting(false))
    },
    [form, message, queryClient, staffList, t],
  )

  const submitForm = async () => {
    const values = await form.validateFields().catch(() => null)

    if (!values) {
      return
    }

    const payload = { ...values, attendeeList: values.attendeeList ?? [], original: values.original ?? null }

    try {
      if (editingId) {
        await updateMeeting.mutateAsync({ id: editingId, payload })
        message.success(t('meetings.updated'))
      } else {
        await createMeeting.mutateAsync(payload)
        message.success(t('meetings.created'))
      }

      setModalOpen(false)
      form.resetFields()
    } catch (err) {
      message.error(getErrorMessage(err, t('meetings.saveFailed')))
    }
  }

  const handleDelete = useCallback(
    (meeting: MeetingSummary) => {
      confirmDelete({
        target: t('meetings.titleOf', { date: formatDate(meeting.heldOn, language) }),
        onConfirm: () =>
          deleteMeeting.mutateAsync(meeting.id).then(
            () => {
              setOpenId(null)
              message.success(t('meetings.deleted'))
            },
            (err) => message.error(getErrorMessage(err, t('meetings.deleteFailed'))),
          ),
      })
    },
    [confirmDelete, deleteMeeting, language, message, t],
  )

  const fileName = (meeting: MeetingSummary) => `${meeting.heldOn} ${meeting.title || '회의록'}`.trim()

  const handlePrint = async () => {
    if (documentRef.current && open) {
      await printMeeting(documentRef.current, fileName(open))
    }
  }

  const handlePdf = async () => {
    if (!documentRef.current || !open) {
      return
    }

    setExporting(true)

    try {
      await downloadMeetingPdf(documentRef.current, `${fileName(open)}.pdf`)
    } catch (err) {
      message.error(getErrorMessage(err, t('meetings.pdfFailed')))
    } finally {
      setExporting(false)
    }
  }

  /** Uploaded on pick; only the stored path travels with the form. */
  const uploadInto =
    (target: 'attachment' | 'original'): UploadProps['beforeUpload'] =>
    async (file) => {
      if (file.size > MAX_DOCUMENT_SIZE) {
        message.error(t('meetings.form.fileTooLarge', { max: formatFileSize(MAX_DOCUMENT_SIZE) }))
        return Upload.LIST_IGNORE
      }

      setUploading(target)

      try {
        const uploaded = await uploadDocument(file)

        if (target === 'original') {
          form.setFieldValue('original', uploaded)
        } else {
          form.setFieldValue('attachments', [...(form.getFieldValue('attachments') ?? []), uploaded])
        }
      } catch (err) {
        message.error(getErrorMessage(err, t('meetings.form.uploadFailed')))
      } finally {
        setUploading(null)
      }

      return Upload.LIST_IGNORE
    }

  /** An attachment that is in fact the minutes: make it the original (the old original, if any, becomes an attachment). */
  const makeOriginal = (file: MeetingAttachment) => {
    const previous: MeetingAttachment | null = form.getFieldValue('original') ?? null
    const attachments: MeetingAttachment[] = (form.getFieldValue('attachments') ?? []).filter((item: MeetingAttachment) => item.url !== file.url)
    form.setFieldsValue({ original: file, attachments: previous ? [...attachments, previous] : attachments })
  }

  return (
    <div className="page-layout">
      <PageHeader kicker={t('adminNav.meetingsSection')} title={t('meetings.adminTitle')} description={t('meetings.adminSubtitle')} />

      <Alert type="info" showIcon icon={<LockOutlined />} message={t('meetings.internalOnly')} />

      <Card className="surface-card filter-card">
        <div className="filter-footer">
          <Space size={12}>
            {years.length > 1 ? <YearSelect years={years} value={activeYear} onChange={setYear} /> : null}
            <Text type="secondary">{t('meetings.count', { count: rows.length })}</Text>
          </Space>

          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            {t('meetings.add')}
          </Button>
        </div>
      </Card>

      <ErrorAlert error={meetings.error} fallback={t('meetings.loadFailed')} />

      {meetings.isPending ? (
        <Card className="surface-card">
          <Skeleton active paragraph={{ rows: 4 }} />
        </Card>
      ) : rows.length > 0 ? (
        <div className="meeting-list">
          {rows.map((meeting) => (
            <Card className="surface-card meeting-row" key={meeting.id} onClick={() => openMeeting(meeting)}>
              <Tag className="meeting-row__week">{t('meetings.week', { week: weekOfYear(meeting.heldOn) })}</Tag>

              <div className="meeting-row__main">
                <strong>
                  {titleOf(meeting)}
                  {meeting.title ? <Text type="secondary"> · {meeting.title}</Text> : null}
                </strong>
                <span className="meeting-row__facts">
                  {meeting.attendees ? (
                    <span>
                      <TeamOutlined /> {meeting.attendees}
                    </span>
                  ) : null}
                  {meeting.original ? (
                    <span>
                      <FileTextOutlined /> {t('meetings.hasOriginal')}
                    </span>
                  ) : null}
                  {meeting.attachments?.length ? (
                    <span>
                      <PaperClipOutlined /> {t('meetings.fileCount', { count: meeting.attachments.length })}
                    </span>
                  ) : null}
                </span>
              </div>

              {/* Files are one click from the list — no need to open the entry.
                  They open for reading; the download is in the preview. */}
              <div className="meeting-row__files" onClick={(event) => event.stopPropagation()} role="presentation">
                {(meeting.attachments ?? []).map((file) => (
                  <button type="button" className="attachment-chip" key={file.url} title={file.name} onClick={() => setPreview(file)}>
                    <EyeOutlined />
                    <span>{file.name}</span>
                  </button>
                ))}
              </div>

              <div className="meeting-row__actions" onClick={(event) => event.stopPropagation()} role="presentation">
                <Button size="small" icon={<EditOutlined />} aria-label={t('common.edit')} onClick={() => openEditModal(meeting)} />
                <Button size="small" danger icon={<DeleteOutlined />} aria-label={t('common.delete')} onClick={() => handleDelete(meeting)} />
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="surface-card empty-card">
          <Empty description={t('meetings.empty')} />
        </Card>
      )}

      {/* The minutes themselves, at once: the written form, or the original in place. */}
      <Drawer
        open={Boolean(open)}
        onClose={() => setOpenId(null)}
        width="min(980px, 100vw)"
        title={open ? titleOf(open) : ''}
        className="meeting-drawer"
        extra={
          open ? (
            <Space wrap>
              {shown === 'written' && full ? (
                <>
                  <Button icon={<PrinterOutlined />} onClick={handlePrint}>
                    {t('meetings.print')}
                  </Button>
                  <Button icon={<DownloadOutlined />} loading={exporting} onClick={handlePdf}>
                    {t('meetings.downloadPdf')}
                  </Button>
                </>
              ) : null}
              <Button type="primary" icon={<EditOutlined />} onClick={() => openEditModal(open)}>
                {t('common.edit')}
              </Button>
            </Space>
          ) : null
        }
      >
        {open ? (
          <div className="meeting-detail">
            {open.original && hasWritten ? (
              <Segmented
                value={shown}
                onChange={(value) => setView(value as 'written' | 'original')}
                options={[
                  { value: 'written', label: t('meetings.viewWritten') },
                  { value: 'original', label: t('meetings.viewOriginal') },
                ]}
              />
            ) : null}

            {shown === 'original' && open.original ? (
              <FileView file={open.original} />
            ) : openDetail.isPending || !full ? (
              <Skeleton active paragraph={{ rows: 8 }} />
            ) : (
              <div className="meeting-detail__paper">
                <MeetingDocument ref={documentRef} meeting={full} institute={INSTITUTE} />
              </div>
            )}

            {open.attachments?.length ? (
              <section>
                <Text className="section-kicker">{t('meetings.attachments')}</Text>
                <div className="attachment-row">
                  {open.attachments.map((file) => (
                    <button type="button" className="attachment-chip" key={file.url} title={t('preview.open')} onClick={() => setPreview(file)}>
                      <EyeOutlined />
                      <span>{file.name}</span>
                      <Text type="secondary">{formatFileSize(file.size)}</Text>
                    </button>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        ) : null}
      </Drawer>

      <Modal
        title={editingId ? t('meetings.editTitle') : t('meetings.addTitle')}
        open={modalOpen}
        onOk={submitForm}
        onCancel={() => setModalOpen(false)}
        okText={editingId ? t('common.save') : t('common.add')}
        cancelText={t('common.cancel')}
        confirmLoading={saving}
        okButtonProps={{ disabled: loadingMeeting || uploading !== null }}
        forceRender
        width={920}
        className="editor-modal"
      >
        {/* Laid out in the order of the form it prints as. */}
        <Form form={form} layout="vertical" disabled={saving || loadingMeeting} className="meeting-form">
          <div className="form-row">
            <Form.Item
              name="title"
              label={t('meetings.form.title')}
              rules={[{ required: true, whitespace: true, message: t('meetings.form.titleRequired') }]}
            >
              <AutoComplete options={options.title} filterOption={matches} maxLength={255} />
            </Form.Item>
            <Form.Item name="method" label={t('meetings.form.method')}>
              <AutoComplete options={options.method} filterOption={matches} maxLength={100} />
            </Form.Item>
          </div>

          <div className="form-row">
            <Form.Item name="heldOn" label={t('meetings.form.heldOn')} rules={[{ required: true, message: t('meetings.form.heldOnRequired') }]}>
              <Input type="date" />
            </Form.Item>
            <Form.Item name="place" label={t('meetings.form.place')}>
              <AutoComplete options={options.place} filterOption={matches} maxLength={200} />
            </Form.Item>
          </div>

          <Form.Item noStyle shouldUpdate={(previous, next) => previous.heldOn !== next.heldOn}>
            {({ getFieldValue }) => {
              const day: string = getFieldValue('heldOn') || today()
              const names = staffList
                .filter((member) => employedOn(member, day))
                .map((member) => ({ value: member.name, label: `${member.name} · ${member.position}` }))

              return (
                <>
                  <div className="form-row">
                    <Form.Item name="drafter" label={t('meetings.form.drafter')}>
                      <AutoComplete options={names} filterOption={matches} maxLength={120} />
                    </Form.Item>
                    <Form.Item name="approver" label={t('meetings.form.approver')}>
                      <AutoComplete options={names} filterOption={matches} maxLength={120} />
                    </Form.Item>
                  </div>

                  <Form.Item name="attendeeList" label={t('meetings.form.attendance')} extra={t('meetings.form.attendanceHint')}>
                    <AttendancePicker staff={staffList} day={day} />
                  </Form.Item>
                </>
              )
            }}
          </Form.Item>

          <Form.Item name="body" label={t('meetings.form.body')}>
            <RichTextEditor minHeight={260} />
          </Form.Item>

          <Form.Item name="decisions" label={t('meetings.form.decisions')} extra={t('meetings.form.decisionsHint')}>
            <RichTextEditor minHeight={120} />
          </Form.Item>

          <Form.Item label={t('meetings.form.original')} extra={t('meetings.form.originalHint')}>
            <Form.Item name="original" noStyle>
              <OriginalField onPreview={setPreview} />
            </Form.Item>
            <Upload accept={DOCUMENT_ACCEPT} beforeUpload={uploadInto('original')} showUploadList={false}>
              <Button icon={<UploadOutlined />} loading={uploading === 'original'}>
                {t('meetings.form.uploadOriginal')}
              </Button>
            </Upload>
          </Form.Item>

          <Form.Item label={t('meetings.attachments')} extra={t('meetings.form.filesHint', { max: formatFileSize(MAX_DOCUMENT_SIZE) })}>
            <Form.Item name="attachments" noStyle>
              <AttachmentList onPreview={setPreview} onMakeOriginal={makeOriginal} />
            </Form.Item>
            <Upload accept={DOCUMENT_ACCEPT} beforeUpload={uploadInto('attachment')} showUploadList={false} multiple>
              <Button icon={<PaperClipOutlined />} loading={uploading === 'attachment'}>
                {t('meetings.form.addFile')}
              </Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>

      {/* Last, so it opens over the form when a file is checked while editing. */}
      <FilePreview file={preview} onClose={() => setPreview(null)} />
    </div>
  )
}

/** "(현인) 학당장 | 현지교원" as it reads: the bar is how 교직원 stores several roles. */
const readablePosition = (position: string) =>
  position
    .split('|')
    .map((part) => part.trim())
    .filter(Boolean)
    .join(', ')

const matches = (input: string, option?: { value?: unknown; label?: unknown }) =>
  String(option?.label ?? option?.value ?? '')
    .toLowerCase()
    .includes(input.trim().toLowerCase())

/**
 * 참석 현황: staff are picked from 교직원 — those working on the meeting's
 * day — and each lands in the row their position names, shown beside them.
 * A tag's menu moves someone to another row; guests are typed by name.
 */
function AttendancePicker({
  value = [],
  onChange,
  staff,
  day,
}: {
  value?: MeetingAttendee[]
  onChange?: (value: MeetingAttendee[]) => void
  staff: StaffMember[]
  day: string
}) {
  const { t } = usePreferences()
  const picked = value.filter((attendee) => attendee.staffId)
  const guests = value.filter((attendee) => !attendee.staffId)

  // Someone already on the list stays choosable even if their dates say otherwise.
  const staffOptions = staff
    .filter((member) => employedOn(member, day) || picked.some((attendee) => attendee.staffId === member.id))
    .map((member) => ({ value: member.id, label: member.name, position: member.position }))

  const setStaff = (ids: string[]) => {
    const kept = picked.filter((attendee) => ids.includes(attendee.staffId!))
    const added = ids
      .filter((id) => !kept.some((attendee) => attendee.staffId === id))
      .map((id) => staff.find((member) => member.id === id))
      .filter((member): member is StaffMember => Boolean(member))
      .map(attendeeFromStaff)
    onChange?.([...kept, ...added, ...guests])
  }

  const setGuests = (names: string[]) => {
    const cleaned = [...new Set(names.map((name) => name.trim()).filter(Boolean))]
    onChange?.([
      ...picked,
      ...cleaned.map((name) => guests.find((guest) => guest.name === name) ?? { staffId: null, name, role: 'other' as const, position: '' }),
    ])
  }

  const move = (target: MeetingAttendee, role: AttendeeRole) =>
    onChange?.(value.map((attendee) => (attendee === target ? { ...attendee, role } : attendee)))

  return (
    <div className="attendance-picker">
      <div className="form-row">
        <Select
          mode="multiple"
          placeholder={t('meetings.form.pickStaff')}
          value={picked.map((attendee) => attendee.staffId!)}
          onChange={setStaff}
          options={staffOptions}
          optionFilterProp="label"
          optionRender={(option) => (
            <span className="attendance-option">
              <span>{option.data.label}</span>
              <Text type="secondary">{readablePosition(String(option.data.position))}</Text>
            </span>
          )}
          maxTagCount={0}
          maxTagPlaceholder={() => t('meetings.form.pickedStaff', { count: picked.length })}
        />
        <Select
          mode="tags"
          placeholder={t('meetings.form.guests')}
          value={guests.map((guest) => guest.name)}
          onChange={setGuests}
          open={false}
          suffixIcon={null}
          tokenSeparators={[',']}
        />
      </div>

      {/* The rows as they will print, each person with the position they bring. */}
      {value.length > 0 ? (
        <div className="attendance-rows">
          {ATTENDEE_ROLES.map((role) => {
            const members = value.filter((attendee) => attendee.role === role)

            return members.length ? (
              <div className="attendance-rows__row" key={role}>
                <Text className="attendance-rows__label">{ROLE_LABEL[role]}</Text>
                <div className="attendance-rows__people">
                  {members.map((attendee) => (
                    <Dropdown
                      key={`${attendee.staffId ?? 'guest'}:${attendee.name}`}
                      trigger={['click']}
                      menu={{
                        selectable: true,
                        selectedKeys: [attendee.role],
                        items: ATTENDEE_ROLES.map((option) => ({ key: option, label: ROLE_LABEL[option] })),
                        onClick: ({ key }) => move(attendee, key as AttendeeRole),
                      }}
                    >
                      <Tag className="attendance-person" title={t('meetings.form.moveRow')}>
                        <strong>{attendee.name}</strong>
                        {attendee.position ? <span> · {readablePosition(attendee.position)}</span> : null}
                      </Tag>
                    </Dropdown>
                  ))}
                </div>
              </div>
            ) : null
          })}
          <Text strong className="attendance-rows__total">
            {t('meetings.form.total', { count: value.length })}
          </Text>
        </div>
      ) : null}
    </div>
  )
}

/** 원본 자료 — one file, looked at before saving, or removed. */
function OriginalField({
  value,
  onChange,
  onPreview,
}: {
  value?: MeetingAttachment | null
  onChange?: (value: MeetingAttachment | null) => void
  onPreview: (file: MeetingAttachment) => void
}) {
  const { t } = usePreferences()

  if (!value) {
    return null
  }

  return (
    <div className="attachment-row attachment-row--editable">
      <span className="attachment-chip">
        <button type="button" className="attachment-chip__open" title={t('preview.open')} onClick={() => onPreview(value)}>
          <FileTextOutlined />
          <span>{value.name}</span>
        </button>
        <Text type="secondary">{formatFileSize(value.size)}</Text>
        <Button type="text" size="small" icon={<DeleteOutlined />} aria-label={t('common.remove')} onClick={() => onChange?.(null)} />
      </span>
    </div>
  )
}

/**
 * Controlled by `Form.Item`: what is attached, a look at each file — so the
 * right one is checked before saving — a way to drop one, and to mark the
 * one that is the minutes themselves as the original.
 */
function AttachmentList({
  value = [],
  onChange,
  onPreview,
  onMakeOriginal,
}: {
  value?: MeetingAttachment[]
  onChange?: (value: MeetingAttachment[]) => void
  onPreview: (file: MeetingAttachment) => void
  onMakeOriginal: (file: MeetingAttachment) => void
}) {
  const { t } = usePreferences()

  if (value.length === 0) {
    return null
  }

  return (
    <div className="attachment-row attachment-row--editable">
      {value.map((file) => (
        <span className="attachment-chip" key={file.url}>
          <button type="button" className="attachment-chip__open" title={t('preview.open')} onClick={() => onPreview(file)}>
            <EyeOutlined />
            <span>{file.name}</span>
          </button>
          <Text type="secondary">{formatFileSize(file.size)}</Text>
          <Button type="link" size="small" onClick={() => onMakeOriginal(file)}>
            {t('meetings.form.makeOriginal')}
          </Button>
          <Button
            type="text"
            size="small"
            icon={<DeleteOutlined />}
            aria-label={t('common.remove')}
            onClick={() => onChange?.(value.filter((item) => item.url !== file.url))}
          />
        </span>
      ))}
    </div>
  )
}
