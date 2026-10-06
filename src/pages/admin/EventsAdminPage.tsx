import { DeleteOutlined, EditOutlined, EyeInvisibleOutlined, EyeOutlined, MoreOutlined, PlusOutlined } from '@ant-design/icons'
import type { TableProps } from 'antd'
import { Alert, App, Button, Card, Dropdown, Form, Input, Modal, Select, Switch, Table, Tag, Typography } from 'antd'
import { useCallback, useMemo, useState } from 'react'

import { usePreferences } from '../../app/preferences'
import { useAllEvents, useCreateEvent, useDeleteEvent, useUpdateEvent } from '../../features/events/queries'
import type { ScheduleEvent } from '../../features/events/types'
import { termDisplayName } from '../../features/terms/labels'
import { useTerms } from '../../features/terms/queries'
import { TermPicker } from '../../features/terms/TermPicker'
import type { AcademicTerm } from '../../features/terms/types'
import { useTermChoice } from '../../features/terms/useTermChoice'
import { ErrorAlert } from '../../shared/ErrorAlert'
import { getErrorMessage } from '../../shared/errors'
import { formatDate } from '../../shared/format'
import { PageHeader } from '../../shared/PageHeader'
import { useConfirmDelete } from '../../shared/useConfirmDelete'
import { useTableLayout } from '../../shared/useTableLayout'

const { Text } = Typography

type EventFormValues = {
  termCode: string
  startDate: string
  endDate?: string
  title: string
  titleKy?: string
  titleRu?: string
  titleEn?: string
  note?: string
  isPublished: boolean
}

const NO_EVENTS: ScheduleEvent[] = []
const NO_TERMS: AcademicTerm[] = []

const today = () => new Date().toISOString().slice(0, 10)
const covers = (term: AcademicTerm, date: string) => term.startDate <= date && date <= term.endDate

/**
 * 행사 일정 — the semester table the institute publishes, managed one
 * semester at a time as the site shows it. An event belongs to the semester
 * its dates fall in: the form only takes dates inside the semester chosen
 * (the server checks the same), so a row can never sit in one semester's
 * table with another semester's dates. The name is typed twice on purpose,
 * in Korean and in Kyrgyz, because the printed table shows both columns.
 */
export function EventsAdminPage() {
  const { t, language } = usePreferences()
  const { message } = App.useApp()
  const confirmDelete = useConfirmDelete()
  const { pinActions } = useTableLayout()

  const events = useAllEvents()
  const terms = useTerms()
  const termList = terms.data ?? NO_TERMS
  const { active: activeTerm, select: selectTerm } = useTermChoice(termList, { scope: 'admin' })
  const createEvent = useCreateEvent()
  const updateEvent = useUpdateEvent()
  const deleteEvent = useDeleteEvent()

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form] = Form.useForm<EventFormValues>()
  const formTermCode = Form.useWatch('termCode', form)
  const formTerm = termList.find((term) => term.code === formTermCode) ?? null
  const saving = createEvent.isPending || updateEvent.isPending

  const all = events.data ?? NO_EVENTS
  const rows = useMemo(() => all.filter((event) => event.termCode === activeTerm?.code), [activeTerm?.code, all])

  // How many each semester holds, for the picker.
  const counts = useMemo(() => {
    const map = new Map<string, number>()
    for (const event of all) {
      if (event.termCode) {
        map.set(event.termCode, (map.get(event.termCode) ?? 0) + 1)
      }
    }
    return map
  }, [all])

  // Rows from before every event had to sit in a semester: listed apart so
  // they are not lost from view, and fixed by opening them.
  const unfiled = useMemo(() => {
    const codes = new Set(termList.map((term) => term.code))
    return all.filter((event) => !event.termCode || !codes.has(event.termCode))
  }, [all, termList])

  const nameOf = useCallback((term: AcademicTerm) => termDisplayName(term, t), [t])
  const periodOf = useCallback(
    (term: AcademicTerm) => `${formatDate(term.startDate, language)} ~ ${formatDate(term.endDate, language)}`,
    [language],
  )

  const openCreateModal = useCallback(() => {
    setEditingId(null)
    form.resetFields()

    if (activeTerm) {
      // A new event starts in the semester on screen: today if that is where
      // today falls, otherwise the semester's first day.
      form.setFieldsValue({ termCode: activeTerm.code, startDate: covers(activeTerm, today()) ? today() : activeTerm.startDate })
    }

    setModalOpen(true)
  }, [activeTerm, form])

  const openEditModal = useCallback(
    (event: ScheduleEvent) => {
      setEditingId(event.id)
      form.resetFields()
      form.setFieldsValue({
        // A row with no valid semester gets the one its date falls in, if any.
        termCode: termList.some((term) => term.code === event.termCode)
          ? (event.termCode ?? undefined)
          : termList.find((term) => covers(term, event.startDate))?.code,
        startDate: event.startDate,
        endDate: event.endDate ?? undefined,
        title: event.title,
        titleKy: event.titleKy,
        titleRu: event.titleRu,
        titleEn: event.titleEn,
        note: event.note,
        isPublished: event.isPublished,
      })
      setModalOpen(true)
    },
    [form, termList],
  )

  const submitForm = async () => {
    const values = await form.validateFields().catch(() => null)

    if (!values) {
      return
    }

    const payload = { ...values, endDate: values.endDate || null }

    try {
      if (editingId) {
        await updateEvent.mutateAsync({ id: editingId, payload })
        message.success(t('events.updated'))
      } else {
        await createEvent.mutateAsync(payload)
        message.success(t('events.created'))
      }

      // Saved into another semester than the one on screen: follow it there.
      if (values.termCode !== activeTerm?.code) {
        selectTerm(values.termCode)
      }

      setModalOpen(false)
      form.resetFields()
    } catch (err) {
      message.error(getErrorMessage(err, t('events.saveFailed')))
    }
  }

  const handleTogglePublished = useCallback(
    (event: ScheduleEvent) => {
      updateEvent.mutate(
        { id: event.id, payload: { isPublished: !event.isPublished } },
        { onError: (err) => message.error(getErrorMessage(err, t('events.saveFailed'))) },
      )
    },
    [message, t, updateEvent],
  )

  const handleDelete = useCallback(
    (event: ScheduleEvent) => {
      confirmDelete({
        target: event.title,
        onConfirm: () =>
          deleteEvent.mutateAsync(event.id).then(
            () => message.success(t('events.deleted')),
            (err) => message.error(getErrorMessage(err, t('events.deleteFailed'))),
          ),
      })
    },
    [confirmDelete, deleteEvent, message, t],
  )

  const columns = useMemo<NonNullable<TableProps<ScheduleEvent>['columns']>>(
    () => [
      {
        title: t('events.form.date'),
        key: 'date',
        width: 230,
        render: (_, event) => (
          <Text className="chronology-date">
            {formatDate(event.startDate, language)}
            {event.endDate ? ` ~ ${formatDate(event.endDate, language)}` : ''}
          </Text>
        ),
      },
      {
        title: t('events.form.title'),
        key: 'title',
        render: (_, event) => (
          <div className="cell-stack">
            <Text strong>{event.title}</Text>
            {event.titleKy ? <Text type="secondary">{event.titleKy}</Text> : null}
          </div>
        ),
      },
      {
        title: t('courses.columns.visibility'),
        dataIndex: 'isPublished',
        key: 'isPublished',
        width: 110,
        render: (value: boolean) => <Tag color={value ? 'green' : 'default'}>{value ? t('common.published') : t('staff.hidden')}</Tag>,
      },
      {
        title: t('common.actions'),
        key: 'actions',
        fixed: pinActions,
        width: 90,
        align: 'center',
        render: (_, event) => (
          <Dropdown
            trigger={['click']}
            menu={{
              items: [
                { key: 'edit', icon: <EditOutlined />, label: t('common.edit'), onClick: () => openEditModal(event) },
                {
                  key: 'publish',
                  icon: event.isPublished ? <EyeInvisibleOutlined /> : <EyeOutlined />,
                  label: event.isPublished ? t('common.unpublish') : t('common.publish'),
                  onClick: () => handleTogglePublished(event),
                },
                { type: 'divider' },
                { key: 'delete', icon: <DeleteOutlined />, label: t('common.delete'), danger: true, onClick: () => handleDelete(event) },
              ],
            }}
          >
            <Button size="small" icon={<MoreOutlined />} aria-label={t('common.actions')} />
          </Dropdown>
        ),
      },
    ],
    [handleDelete, handleTogglePublished, language, openEditModal, pinActions, t],
  )

  return (
    <div className="page-layout">
      <PageHeader kicker={t('siteNav.notices')} title={t('events.adminTitle')} description={t('events.adminSubtitle')} />

      <Card className="surface-card filter-card">
        <div className="filter-footer">
          <TermPicker terms={termList} active={activeTerm} onSelect={selectTerm} counts={counts} />
          <Text type="secondary">{activeTerm ? `${periodOf(activeTerm)} · ${t('events.count', { count: rows.length })}` : null}</Text>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal} disabled={!activeTerm}>
            {t('events.add')}
          </Button>
        </div>
      </Card>

      {unfiled.length > 0 ? (
        <Alert
          type="warning"
          showIcon
          message={t('events.unfiled', { count: unfiled.length })}
          description={
            <div className="unfiled-events">
              <Text type="secondary">{t('events.unfiledHint')}</Text>
              {unfiled.map((event) => (
                <Button key={event.id} type="link" size="small" onClick={() => openEditModal(event)}>
                  {formatDate(event.startDate, language)} · {event.title}
                </Button>
              ))}
            </div>
          }
        />
      ) : null}

      {!terms.isPending && termList.length === 0 ? <Alert type="info" showIcon message={t('events.noTerms')} /> : null}

      <ErrorAlert error={events.error} fallback={t('events.loadFailed')} />

      <Card className="surface-card">
        <Table
          className="admin-table"
          columns={columns}
          dataSource={rows}
          rowKey="id"
          loading={events.isPending || terms.isPending}
          pagination={false}
          scroll={{ x: 'max-content' }}
          locale={{ emptyText: t('events.empty') }}
        />
      </Card>

      <Modal
        title={editingId ? t('events.editTitle') : t('events.addTitle')}
        open={modalOpen}
        onOk={submitForm}
        onCancel={() => setModalOpen(false)}
        okText={editingId ? t('common.save') : t('common.add')}
        cancelText={t('common.cancel')}
        confirmLoading={saving}
        forceRender
        width={680}
      >
        <Form form={form} layout="vertical" disabled={saving} initialValues={{ isPublished: true }}>
          {/* The semester first: it bounds the dates below. */}
          <Form.Item
            name="termCode"
            label={t('terms.label')}
            extra={formTerm ? t('events.form.termHint', { period: periodOf(formTerm) }) : null}
            rules={[{ required: true, message: t('events.form.termRequired') }]}
          >
            <Select options={termList.map((term) => ({ value: term.code, label: nameOf(term) }))} />
          </Form.Item>

          {/* One day, or a span — 9–13 on the printed table — inside that semester. */}
          <div className="form-row">
            <Form.Item
              name="startDate"
              label={t('events.form.startDate')}
              dependencies={['termCode']}
              rules={[
                { required: true, message: t('events.form.startRequired') },
                ({ getFieldValue }) => ({
                  validator: (_, value?: string) => {
                    const term = termList.find((candidate) => candidate.code === getFieldValue('termCode'))

                    if (!value || !term || covers(term, value)) {
                      return Promise.resolve()
                    }

                    // Say where the date does belong, so the fix is obvious.
                    const actual = termList.find((candidate) => covers(candidate, value))
                    return Promise.reject(
                      new Error(
                        actual
                          ? t('events.form.inOtherTerm', { term: nameOf(term), actual: nameOf(actual) })
                          : t('events.form.inNoTerm', { term: nameOf(term) }),
                      ),
                    )
                  },
                }),
              ]}
            >
              <Input type="date" min={formTerm?.startDate} max={formTerm?.endDate} />
            </Form.Item>
            <Form.Item
              name="endDate"
              label={t('events.form.endDate')}
              extra={t('events.form.endHint')}
              dependencies={['startDate', 'termCode']}
              rules={[
                ({ getFieldValue }) => ({
                  validator: (_, value?: string) => {
                    if (!value) {
                      return Promise.resolve()
                    }

                    if (getFieldValue('startDate') && value < getFieldValue('startDate')) {
                      return Promise.reject(new Error(t('courses.form.endBeforeStart')))
                    }

                    const term = termList.find((candidate) => candidate.code === getFieldValue('termCode'))
                    return !term || value <= term.endDate
                      ? Promise.resolve()
                      : Promise.reject(new Error(t('events.form.pastTerm', { term: nameOf(term), end: formatDate(term.endDate, language) })))
                  },
                }),
              ]}
            >
              <Input type="date" min={formTerm?.startDate} max={formTerm?.endDate} />
            </Form.Item>
          </div>

          <Form.Item name="title" label={t('events.form.title')} rules={[{ required: true, whitespace: true, message: t('events.form.titleRequired') }]}>
            <Input maxLength={255} placeholder="2학기 개강식" />
          </Form.Item>

          <Form.Item name="titleKy" label={t('events.form.titleKy')} extra={t('events.form.titleKyHint')}>
            <Input maxLength={255} placeholder="2-семестрдин ачылыш аземи" />
          </Form.Item>

          <div className="form-row">
            <Form.Item name="titleRu" label={t('events.form.titleRu')}>
              <Input maxLength={255} />
            </Form.Item>
            <Form.Item name="titleEn" label={t('events.form.titleEn')}>
              <Input maxLength={255} />
            </Form.Item>
          </div>

          <Form.Item name="note" label={t('events.form.note')}>
            <Input maxLength={255} />
          </Form.Item>

          <Form.Item name="isPublished" label={t('courses.form.visibility')} valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
