import { CalendarOutlined, DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import type { TableProps } from 'antd'
import { App, Button, Card, Form, Input, InputNumber, Modal, Segmented, Space, Table, Tag, Typography } from 'antd'
import { useCallback, useMemo, useState } from 'react'

import { usePreferences } from '../../app/preferences'
import { useCreateTerm, useDeleteTerm, useTerms, useUpdateTerm } from '../../features/terms/queries'
import type { AcademicTerm } from '../../features/terms/types'
import { ErrorAlert } from '../../shared/ErrorAlert'
import { getErrorMessage } from '../../shared/errors'
import { formatDate } from '../../shared/format'
import { PageHeader } from '../../shared/PageHeader'
import { useConfirmDelete } from '../../shared/useConfirmDelete'

const { Text } = Typography

type TermFormValues = {
  year: number
  half: number
  name?: string
  startDate: string
  endDate: string
}

const NO_TERMS: AcademicTerm[] = []

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
  const current = useMemo(() => rows.find((term) => term.startDate <= today() && today() <= term.endDate), [rows])

  const openCreateModal = useCallback(() => {
    setEditingId(null)
    form.resetFields()
    form.setFieldsValue({ year: new Date().getFullYear(), half: 1 })
    setModalOpen(true)
  }, [form])

  const openEditModal = useCallback(
    (term: AcademicTerm) => {
      setEditingId(term.id)
      form.setFieldsValue({ year: term.year, half: term.half, name: term.name, startDate: term.startDate, endDate: term.endDate })
      setModalOpen(true)
    },
    [form],
  )

  const submitForm = async () => {
    const values = await form.validateFields().catch(() => null)

    if (!values) {
      return
    }

    try {
      if (editingId) {
        await updateTerm.mutateAsync({ id: editingId, payload: values })
        message.success(t('terms.updated'))
      } else {
        await createTerm.mutateAsync(values)
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
        target: term.name || term.code,
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
            <Text strong>{term.name || t(term.half === 1 ? 'terms.spring' : 'terms.autumn', { year: term.year })}</Text>
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
                <CalendarOutlined /> {t('terms.currentIs', { term: current.name || current.code })}
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
          <div className="form-row">
            <Form.Item name="year" label={t('terms.year')} rules={[{ required: true, message: t('terms.yearRequired') }]}>
              <InputNumber min={1990} max={2100} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="half" label={t('terms.label')} rules={[{ required: true }]}>
              <Segmented
                options={[
                  { value: 1, label: t('terms.first') },
                  { value: 2, label: t('terms.second') },
                ]}
              />
            </Form.Item>
          </div>

          <Form.Item name="name" label={t('terms.name')} extra={t('terms.nameHint')}>
            <Input maxLength={120} placeholder={t('terms.spring', { year: new Date().getFullYear() })} />
          </Form.Item>

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
