import { DeleteOutlined, EditOutlined, KeyOutlined, PlusOutlined, PoweroffOutlined, SearchOutlined } from '@ant-design/icons'
import type { FormRule, TableProps } from 'antd'
import { App, Button, Card, Col, Form, Input, Modal, Result, Row, Segmented, Space, Table, Tag, Tooltip, Typography } from 'antd'
import { useCallback, useMemo, useState } from 'react'

import { usePreferences } from '../../app/preferences'
import type { StaffRole } from '../../auth/session'
import { useSession } from '../../auth/useSession'
import {
  useAccounts,
  useCreateAccount,
  useDeleteAccount,
  useResetAccountPassword,
  useSetAccountStatus,
  useUpdateAccount,
} from '../../features/accounts/queries'
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH, USERNAME_PATTERN, type StaffAccount } from '../../features/accounts/types'
import { ErrorAlert } from '../../shared/ErrorAlert'
import { getErrorMessage } from '../../shared/errors'
import { formatDate } from '../../shared/format'
import { PageHeader } from '../../shared/PageHeader'
import { useConfirmDelete } from '../../shared/useConfirmDelete'
import { useDebouncedValue } from '../../shared/useDebouncedValue'
import { useStableCallback } from '../../shared/useStableCallback'

const { Text } = Typography

const PAGE_SIZE = 20

type AccountFormValues = { username: string; fullName?: string; role: StaffRole; password?: string; passwordRepeat?: string }
type PasswordFormValues = { password: string; passwordRepeat: string }

/**
 * 계정 관리 — who may sign in to the admin panel, and as what. The API
 * enforces every rule here (administrators only; nobody demotes,
 * deactivates or deletes themselves; the last administrator stays); the
 * page only keeps the buttons that would be refused out of the way.
 */
export function AccountsAdminPage() {
  const session = useSession()

  // The menu hides this page from STAFF; an address typed by hand lands here.
  if (session?.role !== 'ADMIN') {
    return <AccountsForbidden />
  }

  return <AccountsManager selfId={session.id} />
}

function AccountsForbidden() {
  const { t } = usePreferences()
  return <Result status="403" title={t('accounts.forbiddenTitle')} subTitle={t('accounts.forbidden')} />
}

/** A new password and its repeat — the create dialog and the reset dialog ask the same way. */
function NewPasswordFields() {
  const { t } = usePreferences()
  const passwordRules: FormRule[] = [
    { required: true, message: t('accounts.form.passwordInvalid') },
    { min: PASSWORD_MIN_LENGTH, max: PASSWORD_MAX_LENGTH, message: t('accounts.form.passwordInvalid') },
  ]
  const repeatRules: FormRule[] = [
    { required: true, message: t('accounts.form.passwordMismatch') },
    ({ getFieldValue }) => ({
      validator: (_, value?: string) =>
        !value || value === getFieldValue('password') ? Promise.resolve() : Promise.reject(new Error(t('accounts.form.passwordMismatch'))),
    }),
  ]

  return (
    <>
      <Form.Item name="password" label={t('accounts.form.password')} extra={t('accounts.form.passwordHint')} rules={passwordRules}>
        <Input.Password autoComplete="new-password" maxLength={PASSWORD_MAX_LENGTH} />
      </Form.Item>
      <Form.Item name="passwordRepeat" label={t('accounts.form.passwordRepeat')} dependencies={['password']} rules={repeatRules}>
        <Input.Password autoComplete="new-password" maxLength={PASSWORD_MAX_LENGTH} />
      </Form.Item>
    </>
  )
}

function AccountsManager({ selfId }: { selfId: string }) {
  const { t, language } = usePreferences()
  const { message, modal } = App.useApp()
  const confirmDelete = useConfirmDelete()

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const q = useDebouncedValue(search.trim())
  const accounts = useAccounts({ q: q || undefined, page, pageSize: PAGE_SIZE })

  const createAccount = useCreateAccount()
  const updateAccount = useUpdateAccount()
  const resetPassword = useResetAccountPassword()
  const setStatus = useSetAccountStatus()
  const deleteAccount = useDeleteAccount()

  const [form] = Form.useForm<AccountFormValues>()
  const [passwordForm] = Form.useForm<PasswordFormValues>()
  const [editing, setEditing] = useState<StaffAccount | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [passwordFor, setPasswordFor] = useState<StaffAccount | null>(null)
  const saving = createAccount.isPending || updateAccount.isPending
  const editingSelf = editing?.id === selfId

  const openCreate = useCallback(() => {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({ role: 'STAFF' })
    setFormOpen(true)
  }, [form])

  const openEdit = useStableCallback((account: StaffAccount) => {
    setEditing(account)
    form.resetFields()
    form.setFieldsValue({ username: account.username, fullName: account.fullName, role: account.role })
    setFormOpen(true)
  })

  const openPassword = useStableCallback((account: StaffAccount) => {
    passwordForm.resetFields()
    setPasswordFor(account)
  })

  const submitForm = async () => {
    const values = await form.validateFields().catch(() => null)
    if (!values) return

    try {
      if (editing) {
        const payload: { fullName: string; role?: StaffRole } = { fullName: values.fullName?.trim() ?? '' }
        if (!editingSelf && values.role !== editing.role) payload.role = values.role
        await updateAccount.mutateAsync({ id: editing.id, payload })
        message.success(t('accounts.updated'))
      } else {
        await createAccount.mutateAsync({
          username: values.username.trim(),
          fullName: values.fullName?.trim() || undefined,
          role: values.role,
          password: values.password ?? '',
        })
        message.success(t('accounts.created'))
        setPage(1)
      }
      setFormOpen(false)
    } catch (err) {
      message.error(getErrorMessage(err, t('accounts.saveFailed')))
    }
  }

  const submitPassword = async () => {
    const values = await passwordForm.validateFields().catch(() => null)
    if (!values || !passwordFor) return

    try {
      await resetPassword.mutateAsync({ id: passwordFor.id, password: values.password })
      message.success(t('accounts.resetDone'))
      setPasswordFor(null)
    } catch (err) {
      message.error(getErrorMessage(err, t('accounts.saveFailed')))
    }
  }

  const toggleStatus = useStableCallback((account: StaffAccount) => {
    const run = () =>
      setStatus.mutateAsync({ id: account.id, isActive: !account.isActive }).then(
        () => message.success(t(account.isActive ? 'accounts.deactivated' : 'accounts.activated')),
        (err) => message.error(getErrorMessage(err, t('accounts.statusFailed'))),
      )

    if (!account.isActive) {
      void run()
      return
    }

    // Deactivating signs them out at once: worth a second look.
    modal.confirm({
      title: t('accounts.deactivateTitle', { name: account.fullName || account.username }),
      content: t('accounts.deactivateText'),
      okText: t('accounts.deactivate'),
      okButtonProps: { danger: true },
      cancelText: t('common.cancel'),
      onOk: run,
    })
  })

  const handleDelete = useStableCallback((account: StaffAccount) => {
    confirmDelete({
      target: account.fullName ? `${account.fullName} (${account.username})` : account.username,
      note: t('accounts.deleteNote'),
      permanent: true,
      onConfirm: () =>
        deleteAccount.mutateAsync(account.id).then(
          () => message.success(t('accounts.deleted')),
          (err) => message.error(getErrorMessage(err, t('accounts.deleteFailed'))),
        ),
    })
  })

  const columns = useMemo<NonNullable<TableProps<StaffAccount>['columns']>>(
    () => [
      {
        title: t('accounts.table.username'),
        key: 'username',
        render: (_, account) => (
          <Space size={8}>
            <Text strong>{account.username}</Text>
            {account.id === selfId ? <Tag color="blue">{t('accounts.you')}</Tag> : null}
          </Space>
        ),
      },
      {
        title: t('accounts.table.fullName'),
        dataIndex: 'fullName',
        key: 'fullName',
        render: (value: string) => value || <Text type="secondary">—</Text>,
      },
      {
        title: t('accounts.table.role'),
        key: 'role',
        width: 140,
        render: (_, account) =>
          account.role === 'ADMIN' ? <Tag color="gold">{t('session.roleAdmin')}</Tag> : <Tag>{t('session.roleStaff')}</Tag>,
      },
      {
        title: t('accounts.table.status'),
        key: 'status',
        width: 140,
        render: (_, account) =>
          account.isActive ? <Tag color="green">{t('accounts.active')}</Tag> : <Tag color="red">{t('accounts.inactive')}</Tag>,
      },
      {
        title: t('accounts.table.lastLogin'),
        key: 'lastLogin',
        width: 160,
        responsive: ['md'],
        render: (_, account) => <Text type="secondary">{account.lastLoginAt ? formatDate(account.lastLoginAt, language) : t('accounts.never')}</Text>,
      },
      {
        title: t('common.actions'),
        key: 'actions',
        align: 'right',
        render: (_, account) => {
          const self = account.id === selfId
          return (
            <Space wrap>
              <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(account)}>
                {t('common.edit')}
              </Button>
              {/* One's own password is changed from the menu, with the current one. */}
              {self ? null : (
                <Button size="small" icon={<KeyOutlined />} onClick={() => openPassword(account)}>
                  {t('accounts.resetPassword')}
                </Button>
              )}
              <Tooltip title={self ? t('accounts.selfHint') : undefined} placement="topRight">
                <Button size="small" icon={<PoweroffOutlined />} disabled={self} onClick={() => toggleStatus(account)}>
                  {t(account.isActive ? 'accounts.deactivate' : 'accounts.activate')}
                </Button>
              </Tooltip>
              <Tooltip title={self ? t('accounts.selfHint') : undefined} placement="topRight">
                <Button
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  aria-label={t('common.delete')}
                  disabled={self}
                  onClick={() => handleDelete(account)}
                />
              </Tooltip>
            </Space>
          )
        },
      },
    ],
    [handleDelete, language, openEdit, openPassword, selfId, t, toggleStatus],
  )

  return (
    <div className="page-layout">
      <PageHeader kicker={t('session.adminPanel')} title={t('accounts.title')} description={t('accounts.subtitle')} />

      <Card className="surface-card filter-card">
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Text>{t('common.search')}</Text>
            <Input
              allowClear
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
              }}
              placeholder={t('accounts.searchPlaceholder')}
              prefix={<SearchOutlined />}
              maxLength={120}
            />
          </Col>
        </Row>
        <div className="filter-footer">
          <Text>{accounts.data ? t('accounts.total', { count: accounts.data.total }) : ' '}</Text>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            {t('accounts.add')}
          </Button>
        </div>
      </Card>

      <ErrorAlert error={accounts.error} fallback={t('accounts.loadFailed')} />

      <Card className="surface-card">
        <Table<StaffAccount>
          className="admin-table"
          columns={columns}
          dataSource={accounts.data?.items}
          rowKey="id"
          loading={accounts.isFetching}
          pagination={{
            current: page,
            pageSize: PAGE_SIZE,
            total: accounts.data?.total ?? 0,
            showSizeChanger: false,
            hideOnSinglePage: true,
            onChange: setPage,
          }}
          scroll={{ x: 'max-content' }}
          locale={{ emptyText: q ? t('accounts.noMatches') : t('accounts.empty') }}
        />
      </Card>

      <Modal
        title={editing ? t('accounts.editTitle') : t('accounts.addTitle')}
        open={formOpen}
        onOk={submitForm}
        onCancel={() => setFormOpen(false)}
        okText={editing ? t('common.save') : t('common.add')}
        cancelText={t('common.cancel')}
        confirmLoading={saving}
        forceRender
        width={560}
      >
        <Form form={form} layout="vertical" disabled={saving} autoComplete="off">
          <Form.Item
            name="username"
            label={t('accounts.form.username')}
            extra={editing ? undefined : t('accounts.form.usernameHint')}
            rules={editing ? [] : [{ required: true, pattern: USERNAME_PATTERN, message: t('accounts.form.usernameInvalid') }]}
          >
            <Input disabled={Boolean(editing)} maxLength={64} autoComplete="off" />
          </Form.Item>
          <Form.Item name="fullName" label={t('accounts.form.fullName')}>
            <Input maxLength={120} />
          </Form.Item>
          <Form.Item name="role" label={t('accounts.form.role')} extra={editingSelf ? t('accounts.selfHint') : undefined} rules={[{ required: true }]}>
            <Segmented
              disabled={editingSelf}
              options={[
                { value: 'STAFF', label: t('session.roleStaff') },
                { value: 'ADMIN', label: t('session.roleAdmin') },
              ]}
            />
          </Form.Item>
          {editing ? null : <NewPasswordFields />}
        </Form>
      </Modal>

      <Modal
        title={passwordFor ? t('accounts.resetTitle', { name: passwordFor.fullName || passwordFor.username }) : ''}
        open={Boolean(passwordFor)}
        onOk={submitPassword}
        onCancel={() => setPasswordFor(null)}
        okText={t('common.save')}
        cancelText={t('common.cancel')}
        confirmLoading={resetPassword.isPending}
        forceRender
        width={480}
      >
        <Form form={passwordForm} layout="vertical" disabled={resetPassword.isPending} autoComplete="off">
          <p>
            <Text type="secondary">{t('accounts.resetHint')}</Text>
          </p>
          <NewPasswordFields />
        </Form>
      </Modal>
    </div>
  )
}
