import { CalendarOutlined, DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import type { TableProps } from 'antd'
import { Alert, App, Button, Card, Form, Input, InputNumber, Modal, Segmented, Space, Table, Tag, Typography } from 'antd'
import { useCallback, useMemo, useState } from 'react'

import { usePreferences } from '../../app/preferences'
import type { TranslationKey } from '../../app/preferences'
import { breakSeason, termDisplayName, termMemo } from '../../features/terms/labels'
import { useCreateTerm, useDeleteTerm, useTerms, useUpdateTerm } from '../../features/terms/queries'
import { type AcademicTerm, type BreakSeason, type TermKind } from '../../features/terms/types'
import { ErrorAlert } from '../../shared/ErrorAlert'
import { getErrorMessage } from '../../shared/errors'
import { formatDate } from '../../shared/format'
import { PageHeader } from '../../shared/PageHeader'
import { useConfirmDelete } from '../../shared/useConfirmDelete'

const { Text } = Typography

type TermFormValues = {
  year: number
  slot: TermSlot
  name?: string
  startDate: string
  endDate: string
}

const NO_TERMS: AcademicTerm[] = []

/**
 * What the admin picks: the semester, or which break. One choice of six
 * rather than 「방학」 plus a guess — the institute's year is 가을방학 ·
 * 1학기 · 여름방학 · 2학기, and the site names each exactly as set here.
 */
type TermSlot = 'first' | 'second' | `break:${BreakSeason}`

const SLOTS: Array<{ value: TermSlot; label: TranslationKey }> = [
  { value: 'first', label: 'terms.first' },
  { value: 'second', label: 'terms.second' },
  { value: 'break:spring', label: 'terms.seasons.spring' },
  { value: 'break:summer', label: 'terms.seasons.summer' },
  { value: 'break:autumn', label: 'terms.seasons.autumn' },
  { value: 'break:winter', label: 'terms.seasons.winter' },
]

const toSlot = (term: AcademicTerm): TermSlot => (term.kind === 'break' ? `break:${breakSeason(term)}` : term.kind)

function fromSlot(slot: TermSlot): { kind: TermKind; season: BreakSeason | null } {
  return slot.startsWith('break:') ? { kind: 'break', season: slot.slice(6) as BreakSeason } : { kind: slot as TermKind, season: null }
}

const today = () => new Date().toISOString().slice(0, 10)

/**
 * 학기 관리 — when a semester runs is the institute's decision, so the dates
 * are typed here and everything else follows: which semester a class belongs
 * to, and what the 학사 일정 picker offers visitors.
 */
export function TermsAdminPage() {
  const { t, language } = usePreferences()
  const { message } = App.useApp()
  const confirmDelete = useConfirmDelete()

  const terms = useTerms()
  const createTerm = useCreateTerm()
  const updateTerm = useUpdateTerm()
  const deleteTerm = useDeleteTerm()

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form] = Form.useForm<TermFormValues>()
  const saving = createTerm.isPending || updateTerm.isPending

  const rows = terms.data ?? NO_TERMS

  /**
   * The term the dates being typed run into, with the days the two share —
   * the admin should not have to press 저장 to find out who holds them.
   */
  const startDate = Form.useWatch('startDate', form)
  const endDate = Form.useWatch('endDate', form)

  const clashes = useMemo(() => {
    if (!modalOpen || !startDate || !endDate || endDate < startDate) {
      return []
    }

    // Every term the range runs into, so a span across two of them does not
    // have to be corrected twice.
    return rows
      .filter((row) => row.id !== editingId && row.startDate <= endDate && startDate <= row.endDate)
      .map((term) => ({
        term,
        from: startDate > term.startDate ? startDate : term.startDate,
        to: endDate < term.endDate ? endDate : term.endDate,
      }))
  }, [editingId, endDate, modalOpen, rows, startDate])
  const current = useMemo(() => rows.find((term) => term.startDate <= today() && today() <= term.endDate), [rows])

  const openCreateModal = useCallback(() => {
    setEditingId(null)
    form.resetFields()
    form.setFieldsValue({ year: new Date().getFullYear(), slot: 'first' })
    setModalOpen(true)
  }, [form])

  const openEditModal = useCallback(
    (term: AcademicTerm) => {
      setEditingId(term.id)
      form.setFieldsValue({ year: term.year, slot: toSlot(term), name: term.name, startDate: term.startDate, endDate: term.endDate })
      setModalOpen(true)
    },
    [form],
  )

  const submitForm = async () => {
    const values = await form.validateFields().catch(() => null)

    if (!values) {
      return
    }

    const { slot, ...rest } = values
    const payload = { ...rest, ...fromSlot(slot) }

    try {
      if (editingId) {
        await updateTerm.mutateAsync({ id: editingId, payload })
        message.success(t('terms.updated'))
      } else {
        await createTerm.mutateAsync(payload)
        message.success(t('terms.created'))
      }

      setModalOpen(false)
      form.resetFields()
    } catch (err) {
      message.error(getErrorMessage(err, t('terms.saveFailed')))
    }
  }

  const handleDelete = useCallback(
    (term: AcademicTerm) => {
      confirmDelete({
        target: termDisplayName(term, t),
        note: t('terms.deleteNote'),
        onConfirm: () =>
          deleteTerm.mutateAsync(term.id).then(
            () => message.success(t('terms.deleted')),
            (err) => message.error(getErrorMessage(err, t('terms.deleteFailed'))),
          ),
      })
    },
    [confirmDelete, deleteTerm, message, t],
  )

  const columns = useMemo<NonNullable<TableProps<AcademicTerm>['columns']>>(
    () => [
      {
        title: t('terms.label'),
        key: 'term',
        render: (_, term) => (
          <Space size={8}>
            <Text strong>{termDisplayName(term, t)}</Text>
            {termMemo(term) ? <Text type="secondary">{termMemo(term)}</Text> : null}
            {term.id === current?.id ? <Tag color="green">{t('terms.inProgress')}</Tag> : null}
          </Space>
        ),
      },
      { title: t('terms.code'), dataIndex: 'code', key: 'code', width: 110, responsive: ['md'] },
      {
        title: t('courses.table.period'),
        key: 'period',
        width: 280,
        render: (_, term) => (
          <Text type="secondary">
            {formatDate(term.startDate, language)} ~ {formatDate(term.endDate, language)}
          </Text>
        ),
      },
      {
        title: t('common.actions'),
        key: 'actions',
        width: 160,
        align: 'right',
        render: (_, term) => (
          <Space>
            <Button size="small" icon={<EditOutlined />} onClick={() => openEditModal(term)}>
              {t('common.edit')}
            </Button>
            <Button size="small" danger icon={<DeleteOutlined />} aria-label={t('common.delete')} onClick={() => handleDelete(term)} />
          </Space>
        ),
      },
    ],
    [current?.id, handleDelete, language, openEditModal, t],
  )

  return (
    <div className="page-layout">
      <PageHeader kicker={t('siteNav.programmes')} title={t('terms.adminTitle')} description={t('terms.adminSubtitle')} />

      <Card className="surface-card filter-card">
        <div className="filter-footer">
          <Text>
            {current ? (
              <>
                <CalendarOutlined /> {t('terms.currentIs', { term: termDisplayName(current, t) })}
              </>
            ) : (
              t('terms.noneInProgress')
            )}
          </Text>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            {t('terms.add')}
          </Button>
        </div>
      </Card>

      <ErrorAlert error={terms.error} fallback={t('terms.loadFailed')} />

      <Card className="surface-card">
        <Table
          className="admin-table"
          columns={columns}
          dataSource={rows}
          rowKey="id"
          loading={terms.isPending}
          pagination={false}
          scroll={{ x: 'max-content' }}
          locale={{ emptyText: t('terms.empty') }}
        />
      </Card>

      <Modal
        title={editingId ? t('terms.editTitle') : t('terms.addTitle')}
        open={modalOpen}
        onOk={submitForm}
        onCancel={() => setModalOpen(false)}
        okText={editingId ? t('common.save') : t('common.add')}
        cancelText={t('common.cancel')}
        confirmLoading={saving}
        forceRender
        width={620}
      >
        <Form form={form} layout="vertical" disabled={saving}>
          {/* Two terms may not cover the same day, so the clash is named
              while the dates are being typed rather than on saving. */}
          {clashes.length > 0 ? (
            <Alert
              type="warning"
              showIcon
              className="form-notice"
              message={
                <ul className="clash-list">
                  {clashes.map((clash) => (
                    <li key={clash.term.id}>
                      {t('terms.overlapsWith', {
                        term: termDisplayName(clash.term, t),
                        period: `${formatDate(clash.term.startDate, language)} ~ ${formatDate(clash.term.endDate, language)}`,
                        overlap: `${formatDate(clash.from, language)} ~ ${formatDate(clash.to, language)}`,
                      })}
                    </li>
                  ))}
                </ul>
              }
            />
          ) : null}

          {/* The semester, or which break — the site names it exactly so. */}
          <Form.Item name="slot" label={t('terms.label')} extra={t('terms.slotHint')} rules={[{ required: true }]}>
            <Segmented options={SLOTS.map((slot) => ({ value: slot.value, label: t(slot.label) }))} />
          </Form.Item>

          <div className="form-row">
            <Form.Item name="year" label={t('terms.year')} rules={[{ required: true, message: t('terms.yearRequired') }]}>
              <InputNumber min={1990} max={2100} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="name" label={t('terms.name')} extra={t('terms.nameHint')}>
              <Input maxLength={120} />
            </Form.Item>
          </div>

          <div className="form-row">
            <Form.Item name="startDate" label={t('courses.form.startDate')} rules={[{ required: true, message: t('courses.form.startDateRequired') }]}>
              <Input type="date" />
            </Form.Item>
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
              <Input type="date" />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  )
}
