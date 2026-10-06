import { DeleteOutlined, EditOutlined, EyeInvisibleOutlined, EyeOutlined, MoreOutlined, PlusOutlined, UserOutlined } from '@ant-design/icons'
import type { TableProps } from 'antd'
import { App, AutoComplete, Avatar, Button, Card, Dropdown, Form, Input, InputNumber, Modal, Switch, Table, Tag, Typography } from 'antd'
import { Fragment, useCallback, useMemo, useState } from 'react'

import { assetUrl } from '../../api/client'
import { usePreferences } from '../../app/preferences'
import type { TranslationKey } from '../../app/preferences'
import { useAllStudies, useCreateStudy, useDeleteStudy, useUpdateStudy } from '../../features/studies/queries'
import { languagesFilled } from '../../features/studies/text'
import { BILINGUAL_FIELDS, type BilingualField, type StudyAbroad } from '../../features/studies/types'
import { ErrorAlert } from '../../shared/ErrorAlert'
import { getErrorMessage } from '../../shared/errors'
import { ImageUploadField } from '../../shared/ImageUploadField'
import { PageHeader } from '../../shared/PageHeader'
import { useConfirmDelete } from '../../shared/useConfirmDelete'
import { useTableLayout } from '../../shared/useTableLayout'

const { Text } = Typography

type StudyFormValues = Partial<Record<BilingualField | `${BilingualField}Ky`, string>> & {
  year: number
  photo: string | null
  isPublished: boolean
}

const NO_STUDENTS: StudyAbroad[] = []

/** Suggested rather than fixed: the institute knows its own programmes. */
const SUGGESTIONS: Record<'programme' | 'duration', { ko: string[]; ky: string[] }> = {
  programme: {
    ko: ['정부초청장학생(GKS)', '교환학생', '어학연수', '대학 장학생', '자비 유학'],
    ky: ['Корея өкмөтүнүн стипендиясы (GKS)', 'Алмашуу программасы', 'Тил курсу', 'Университеттин стипендиясы', 'Өз каражатына'],
  },
  duration: {
    ko: ['6개월', '1년', '2년', '4년 (학사)', '2년 (석사)'],
    ky: ['6 ай', '1 жыл', '2 жыл', '4 жыл (бакалавр)', '2 жыл (магистр)'],
  },
}

/** The rows of the translation table, in the order a record is read. */
// Hints are invented examples: never a real student's name or school.
const ROWS: Array<{ field: BilingualField; label: TranslationKey; placeholder: { ko: string; ky: string } }> = [
  { field: 'name', label: 'studies.form.name', placeholder: { ko: '마마토바 아이다', ky: 'Маматова Айда' } },
  { field: 'university', label: 'studies.form.university', placeholder: { ko: '부산대학교', ky: 'Пусан улуттук университети' } },
  { field: 'major', label: 'studies.form.major', placeholder: { ko: '국제통상학', ky: 'Эл аралык соода' } },
  { field: 'programme', label: 'studies.form.programme', placeholder: { ko: '대학 자체 장학생', ky: 'Университеттин стипендиясы' } },
  { field: 'duration', label: 'studies.form.duration', placeholder: { ko: '1년 (어학) + 2년 (석사)', ky: '1 жыл (тил) + 2 жыл (магистр)' } },
  { field: 'note', label: 'studies.form.note', placeholder: { ko: '', ky: '' } },
]

const matches = (input: string, option?: { value?: unknown }) => String(option?.value ?? '').toLowerCase().includes(input.toLowerCase())

/**
 * 한국 유학 현황 — the record of everyone the institute has sent to Korea.
 * The table is read in the order it is published: earliest year first, a new
 * student at the end. The number is the position, so there is nothing to
 * renumber when a student is added.
 *
 * Every text is entered in Korean and in Kyrgyz. The form lays them out as a
 * translation table — one row per item, the two languages side by side — so
 * filling in the second language is reading across, not hunting for fields.
 * Either side may stay empty; the site falls back to the other.
 */
export function StudiesAdminPage() {
  const { t } = usePreferences()
  const { message } = App.useApp()
  const confirmDelete = useConfirmDelete()
  const { pinActions } = useTableLayout()

  const studies = useAllStudies()
  const createStudy = useCreateStudy()
  const updateStudy = useUpdateStudy()
  const deleteStudy = useDeleteStudy()

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form] = Form.useForm<StudyFormValues>()
  const saving = createStudy.isPending || updateStudy.isPending

  const rows = studies.data ?? NO_STUDENTS

  // What the institute has already written, offered before the defaults — per language.
  const optionsFor = useCallback(
    (field: 'programme' | 'duration', language: 'ko' | 'ky') => {
      const key = language === 'ko' ? field : (`${field}Ky` as const)
      const used = rows.map((student) => student[key]).filter(Boolean)

      return [...new Set([...used, ...SUGGESTIONS[field][language]])].map((value) => ({ value }))
    },
    [rows],
  )

  const openCreateModal = useCallback(() => {
    setEditingId(null)
    form.resetFields()
    form.setFieldValue('year', new Date().getFullYear())
    setModalOpen(true)
  }, [form])

  const openEditModal = useCallback(
    (student: StudyAbroad) => {
      setEditingId(student.id)
      form.setFieldsValue({
        ...Object.fromEntries(BILINGUAL_FIELDS.flatMap((field) => [[field, student[field]], [`${field}Ky`, student[`${field}Ky`]]])),
        year: student.year,
        photo: student.photo,
        isPublished: student.isPublished,
      })
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
        await updateStudy.mutateAsync({ id: editingId, payload: values })
        message.success(t('studies.updated'))
      } else {
        await createStudy.mutateAsync(values)
        message.success(t('studies.created'))
      }

      setModalOpen(false)
      form.resetFields()
    } catch (err) {
      message.error(getErrorMessage(err, t('studies.saveFailed')))
    }
  }

  const handleTogglePublished = useCallback(
    (student: StudyAbroad) => {
      updateStudy.mutate(
        { id: student.id, payload: { isPublished: !student.isPublished } },
        { onError: (err) => message.error(getErrorMessage(err, t('studies.saveFailed'))) },
      )
    },
    [message, t, updateStudy],
  )

  const handleDelete = useCallback(
    (student: StudyAbroad) => {
      confirmDelete({
        target: student.name || student.nameKy,
        onConfirm: () =>
          deleteStudy.mutateAsync(student.id).then(
            () => message.success(t('studies.deleted')),
            (err) => message.error(getErrorMessage(err, t('studies.deleteFailed'))),
          ),
      })
    },
    [confirmDelete, deleteStudy, message, t],
  )

  const columns = useMemo<NonNullable<TableProps<StudyAbroad>['columns']>>(
    () => [
      {
        title: t('studies.columns.number'),
        key: 'number',
        width: 64,
        align: 'center',
        render: (_, __, index) => <Text type="secondary">{index + 1}</Text>,
      },
      {
        title: t('studies.form.photo'),
        dataIndex: 'photo',
        key: 'photo',
        width: 76,
        align: 'center',
        responsive: ['sm'],
        render: (photo: string | null) => <Avatar size={44} src={photo ? assetUrl(photo) : undefined} icon={<UserOutlined />} alt="" />,
      },
      { title: t('studies.form.year'), dataIndex: 'year', key: 'year', width: 90 },
      {
        // Both scripts, the way the two lists name them.
        title: t('studies.form.name'),
        key: 'name',
        render: (_, student) => (
          <div className="cell-stack">
            <Text strong>{student.name || student.nameKy}</Text>
            {student.name && student.nameKy ? <Text type="secondary">{student.nameKy}</Text> : null}
          </div>
        ),
      },
      {
        title: t('studies.form.university'),
        key: 'university',
        render: (_, student) => (
          <div className="cell-stack">
            <Text>{student.university || student.universityKy || '—'}</Text>
            {student.major || student.majorKy ? <Text type="secondary">{student.major || student.majorKy}</Text> : null}
          </div>
        ),
      },
      {
        title: t('studies.form.programme'),
        key: 'programme',
        width: 200,
        responsive: ['lg'],
        render: (_, student) => {
          const programme = student.programme || student.programmeKy
          const duration = student.duration || student.durationKy

          return (
            <div className="cell-stack">
              {programme ? <Tag color="blue">{programme}</Tag> : <Text type="secondary">—</Text>}
              {duration ? <Text type="secondary">{duration}</Text> : null}
            </div>
          )
        },
      },
      {
        // Which languages are filled in, so a missing translation shows.
        title: t('studies.columns.languages'),
        key: 'languages',
        width: 110,
        render: (_, student) => {
          const filled = languagesFilled(student)

          return (
            <span className="lang-marks">
              <span className={`lang-mark${filled.ko ? ' is-filled' : ''}`} title={t('studies.form.korean')}>
                한
              </span>
              <span className={`lang-mark${filled.ky ? ' is-filled' : ''}`} title={t('studies.form.kyrgyz')}>
                Кы
              </span>
            </span>
          )
        },
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
        render: (_, student) => (
          <Dropdown
            trigger={['click']}
            menu={{
              items: [
                { key: 'edit', icon: <EditOutlined />, label: t('common.edit'), onClick: () => openEditModal(student) },
                {
                  key: 'publish',
                  icon: student.isPublished ? <EyeInvisibleOutlined /> : <EyeOutlined />,
                  label: student.isPublished ? t('common.unpublish') : t('common.publish'),
                  onClick: () => handleTogglePublished(student),
                },
                { type: 'divider' },
                { key: 'delete', icon: <DeleteOutlined />, label: t('common.delete'), danger: true, onClick: () => handleDelete(student) },
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

  /** One input of the translation table; programme and duration suggest. */
  const cell = (field: BilingualField, language: 'ko' | 'ky', placeholder: string) => {
    const name = language === 'ko' ? field : (`${field}Ky` as const)
    const max = field === 'duration' ? 60 : field === 'name' ? 150 : 255

    const input =
      field === 'programme' || field === 'duration' ? (
        <AutoComplete options={optionsFor(field, language)} placeholder={placeholder} filterOption={matches} />
      ) : (
        <Input maxLength={max} placeholder={placeholder} />
      )

    // A student needs a name in at least one of the two languages.
    const rules =
      field === 'name' && language === 'ko'
        ? [
            ({ getFieldValue }: { getFieldValue: (key: string) => unknown }) => ({
              validator: (_: unknown, value?: string) =>
                value?.trim() || String(getFieldValue('nameKy') ?? '').trim()
                  ? Promise.resolve()
                  : Promise.reject(new Error(t('studies.form.nameRequired'))),
            }),
          ]
        : undefined

    // The wrapper carries the language for the phone layout, where the column
    // headers are gone; Form.Item would not pass data-* through to the page.
    return (
      <div className="bilingual-grid__cell" data-lang={language === 'ko' ? t('studies.form.korean') : t('studies.form.kyrgyz')}>
        <Form.Item name={name} dependencies={field === 'name' && language === 'ko' ? ['nameKy'] : undefined} rules={rules}>
          {input}
        </Form.Item>
      </div>
    )
  }

  return (
    <div className="page-layout">
      <PageHeader kicker={t('siteNav.history')} title={t('studies.adminTitle')} description={t('studies.adminSubtitle')} />

      <Card className="surface-card filter-card">
        <div className="filter-footer">
          <Text>{t('studies.count', { count: rows.length })}</Text>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            {t('studies.add')}
          </Button>
        </div>
      </Card>

      <ErrorAlert error={studies.error} fallback={t('studies.loadFailed')} />

      <Card className="surface-card">
        <Table
          className="admin-table"
          columns={columns}
          dataSource={rows}
          rowKey="id"
          loading={studies.isPending}
          pagination={false}
          scroll={{ x: 'max-content' }}
          locale={{ emptyText: t('studies.empty') }}
        />
      </Card>

      <Modal
        title={editingId ? t('studies.editTitle') : t('studies.addTitle')}
        open={modalOpen}
        onOk={submitForm}
        onCancel={() => setModalOpen(false)}
        okText={editingId ? t('common.save') : t('common.add')}
        cancelText={t('common.cancel')}
        confirmLoading={saving}
        forceRender
        width={820}
        className="study-modal"
      >
        <Form form={form} layout="vertical" disabled={saving} initialValues={{ isPublished: true, photo: null }}>
          {/* What does not depend on the language: the portrait and the year. */}
          <div className="study-form__head">
            <Form.Item name="photo" label={t('studies.form.photo')} extra={t('studies.form.photoHint')}>
              <ImageUploadField shape="square" />
            </Form.Item>
            <Form.Item
              name="year"
              label={t('studies.form.year')}
              extra={t('studies.form.yearHint')}
              rules={[{ required: true, message: t('studies.form.yearRequired') }]}
            >
              <InputNumber min={1990} max={2100} style={{ width: '100%' }} />
            </Form.Item>
          </div>

          {/* The translation table: one row per item, Korean | Kyrgyz. */}
          <div className="bilingual-grid" role="group" aria-label={t('studies.form.texts')}>
            <span className="bilingual-grid__corner" aria-hidden="true" />
            <span className="bilingual-grid__lang">
              <span className="lang-mark is-filled">한</span> {t('studies.form.korean')}
            </span>
            <span className="bilingual-grid__lang">
              <span className="lang-mark is-filled">Кы</span> {t('studies.form.kyrgyz')}
            </span>

            {ROWS.map((row) => (
              <Fragment key={row.field}>
                <span className="bilingual-grid__label">
                  {t(row.label)}
                  {row.field === 'name' ? <span className="bilingual-grid__required" aria-hidden="true"> *</span> : null}
                </span>
                {cell(row.field, 'ko', row.placeholder.ko)}
                {cell(row.field, 'ky', row.placeholder.ky)}
              </Fragment>
            ))}
          </div>
          <Text type="secondary" className="bilingual-grid__hint">
            {t('studies.form.languagesHint')}
          </Text>

          <Form.Item name="isPublished" label={t('courses.form.visibility')} valuePropName="checked" className="study-form__publish">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
