import { DeleteOutlined, EditOutlined, EyeInvisibleOutlined, EyeOutlined, MoreOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons'
import type { TableProps } from 'antd'
import { App, Button, Card, Col, Dropdown, Form, Input, InputNumber, Modal, Row, Segmented, Switch, Table, Tag, Typography } from 'antd'
import { useCallback, useMemo, useState } from 'react'

import { usePreferences } from '../../app/preferences'
import { useAllGraduates, useCreateGraduate, useDeleteGraduate, useUpdateGraduate } from '../../features/graduates/queries'
import type { Graduate, GraduateInput } from '../../features/graduates/types'
import { ErrorAlert } from '../../shared/ErrorAlert'
import { getErrorMessage } from '../../shared/errors'
import { matchesQuery } from '../../shared/HeaderSearch'
import { PageHeader } from '../../shared/PageHeader'
import { useConfirmDelete } from '../../shared/useConfirmDelete'
import { useTableLayout } from '../../shared/useTableLayout'

const { Text } = Typography

const NO_GRADUATES: Graduate[] = []

/** The term most recently finished: the 1st term ends in early summer, the 2nd in December. */
const currentTerm = () => (new Date().getMonth() < 7 ? 1 : 2)

/**
 * 졸업생 현황 — the list of everyone who finished 세종한국어 8책. Read in the
 * order it is published (oldest term first); the 졸업생 번호 is the position,
 * so adding a graduate renumbers nothing by hand.
 */
export function GraduatesAdminPage() {
  const { t } = usePreferences()
  const { message } = App.useApp()
  const confirmDelete = useConfirmDelete()
  const { pinActions } = useTableLayout()

  const graduates = useAllGraduates()
  const createGraduate = useCreateGraduate()
  const updateGraduate = useUpdateGraduate()
  const deleteGraduate = useDeleteGraduate()

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [form] = Form.useForm<GraduateInput>()
  const saving = createGraduate.isPending || updateGraduate.isPending

  const all = graduates.data ?? NO_GRADUATES
  // The number stays the position in the whole list while searching.
  const rows = useMemo(
    () =>
      all
        .map((graduate, index) => ({ ...graduate, number: index + 1 }))
        .filter((graduate) => matchesQuery(search, [graduate.name, graduate.nameKy, graduate.note, graduate.noteKy, graduate.year])),
    [all, search],
  )

  const openCreateModal = useCallback(() => {
    setEditingId(null)
    form.resetFields()
    form.setFieldsValue({ year: new Date().getFullYear(), term: currentTerm(), isPublished: true })
    setModalOpen(true)
  }, [form])

  const openEditModal = useCallback(
    (graduate: Graduate) => {
      setEditingId(graduate.id)
      form.setFieldsValue({
        year: graduate.year,
        term: graduate.term,
        name: graduate.name,
        nameKy: graduate.nameKy,
        note: graduate.note,
        noteKy: graduate.noteKy,
        isPublished: graduate.isPublished,
      })
      setModalOpen(true)
    },
    [form],
  )

  const submitForm = async () => {
    const values = await form.validateFields().catch(() => null)
    if (!values) return

    try {
      if (editingId) {
        await updateGraduate.mutateAsync({ id: editingId, payload: values })
        message.success(t('graduates.updated'))
      } else {
        await createGraduate.mutateAsync(values)
        message.success(t('graduates.created'))
      }
      setModalOpen(false)
      form.resetFields()
    } catch (err) {
      message.error(getErrorMessage(err, t('graduates.saveFailed')))
    }
  }

  const handleTogglePublished = useCallback(
    (graduate: Graduate) =>
      updateGraduate.mutate(
        { id: graduate.id, payload: { isPublished: !graduate.isPublished } },
        { onError: (err) => message.error(getErrorMessage(err, t('graduates.saveFailed'))) },
      ),
    [message, t, updateGraduate],
  )

  const handleDelete = useCallback(
    (graduate: Graduate) =>
      confirmDelete({
        target: graduate.name || graduate.nameKy,
        onConfirm: () =>
          deleteGraduate.mutateAsync(graduate.id).then(
            () => message.success(t('graduates.deleted')),
            (err) => message.error(getErrorMessage(err, t('graduates.deleteFailed'))),
          ),
      }),
    [confirmDelete, deleteGraduate, message, t],
  )

  const columns = useMemo<NonNullable<TableProps<Graduate & { number: number }>['columns']>>(
    () => [
      {
        title: t('graduates.numberLabel'),
        dataIndex: 'number',
        key: 'number',
        width: 90,
        align: 'center',
        render: (number: number) => <Text type="secondary">{number}</Text>,
      },
      {
        title: t('graduates.form.term'),
        key: 'term',
        width: 150,
        render: (_, graduate) => t('graduates.termLabel', { year: graduate.year, term: graduate.term }),
      },
      {
        title: t('graduates.form.name'),
        key: 'name',
        render: (_, graduate) => (
          <div className="cell-stack">
            <Text strong>{graduate.name || graduate.nameKy}</Text>
            {graduate.name && graduate.nameKy ? <Text type="secondary">{graduate.nameKy}</Text> : null}
          </div>
        ),
      },
      {
        title: t('graduates.form.note'),
        key: 'note',
        render: (_, graduate) => (
          <Text type={graduate.note || graduate.noteKy ? undefined : 'secondary'}>{graduate.note || graduate.noteKy || '—'}</Text>
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
        render: (_, graduate) => (
          <Dropdown
            trigger={['click']}
            menu={{
              items: [
                { key: 'edit', icon: <EditOutlined />, label: t('common.edit'), onClick: () => openEditModal(graduate) },
                {
                  key: 'publish',
                  icon: graduate.isPublished ? <EyeInvisibleOutlined /> : <EyeOutlined />,
                  label: graduate.isPublished ? t('common.unpublish') : t('common.publish'),
                  onClick: () => handleTogglePublished(graduate),
                },
                { type: 'divider' },
                { key: 'delete', icon: <DeleteOutlined />, label: t('common.delete'), danger: true, onClick: () => handleDelete(graduate) },
              ],
            }}
          >
            <Button size="small" icon={<MoreOutlined />} aria-label={t('common.actions')} />
          </Dropdown>
        ),
      },
    ],
    [handleDelete, handleTogglePublished, openEditModal, pinActions, t],
  )

  // A graduate needs a name in at least one of the two languages.
  const nameRule = ({ getFieldValue }: { getFieldValue: (key: string) => unknown }) => ({
    validator: (_: unknown, value?: string) =>
      value?.trim() || String(getFieldValue('nameKy') ?? '').trim() ? Promise.resolve() : Promise.reject(new Error(t('graduates.form.nameRequired'))),
  })

  return (
    <div className="page-layout">
      <PageHeader kicker={t('siteNav.history')} title={t('graduates.adminTitle')} description={t('graduates.adminSubtitle')} />

      <Card className="surface-card filter-card">
        <Input
          allowClear
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t('graduates.searchPlaceholder')}
          prefix={<SearchOutlined />}
        />
        <div className="filter-footer">
          <Text>{search.trim() ? t('graduates.found', { count: rows.length, total: all.length }) : t('graduates.count', { count: all.length })}</Text>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            {t('graduates.add')}
          </Button>
        </div>
      </Card>

      <ErrorAlert error={graduates.error} fallback={t('graduates.loadFailed')} />

      <Card className="surface-card">
        <Table
          className="admin-table"
          columns={columns}
          dataSource={rows}
          rowKey="id"
          loading={graduates.isPending}
          pagination={rows.length > 50 ? { pageSize: 50, showSizeChanger: false } : false}
          scroll={{ x: 'max-content' }}
          locale={{ emptyText: t('graduates.empty') }}
        />
      </Card>

      <Modal
        title={editingId ? t('graduates.editTitle') : t('graduates.addTitle')}
        open={modalOpen}
        onOk={submitForm}
        onCancel={() => setModalOpen(false)}
        okText={editingId ? t('common.save') : t('common.add')}
        cancelText={t('common.cancel')}
        confirmLoading={saving}
        forceRender
        width={640}
      >
        <Form form={form} layout="vertical" disabled={saving} initialValues={{ isPublished: true, term: 1 }}>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="year" label={t('graduates.form.year')} rules={[{ required: true, message: t('graduates.form.yearRequired') }]}>
                <InputNumber min={1990} max={2100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="term" label={t('graduates.form.term')} rules={[{ required: true }]}>
                <Segmented
                  block
                  options={[
                    { value: 1, label: t('graduates.form.termOption', { term: 1 }) },
                    { value: 2, label: t('graduates.form.termOption', { term: 2 }) },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="name" label={`${t('graduates.form.name')} · ${t('studies.form.korean')}`} dependencies={['nameKy']} rules={[nameRule]}>
                <Input maxLength={150} placeholder="아이다 마마토바" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="nameKy" label={`${t('graduates.form.name')} · ${t('studies.form.kyrgyz')}`}>
                <Input maxLength={150} placeholder="Айда Маматова" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="note" label={`${t('graduates.form.note')} · ${t('studies.form.korean')}`} extra={t('graduates.form.noteHint')}>
                <Input maxLength={255} placeholder="한국 대학 진학 (부산대학교)" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="noteKy" label={`${t('graduates.form.note')} · ${t('studies.form.kyrgyz')}`}>
                <Input maxLength={255} placeholder="Кореядагы университет (Пусан)" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="isPublished" label={t('courses.form.visibility')} valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
