import { App, Form, Input, Modal } from 'antd'

import { usePreferences } from '../../app/preferences'
import { getErrorMessage } from '../../shared/errors'
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '../accounts/types'
import { useChangeOwnPassword } from './queries'

type Values = { currentPassword: string; password: string; passwordRepeat: string }

/**
 * Changing one's own password, from the admin panel's account menu. Every
 * other session of the account ends; this tab carries on with the fresh
 * token the API answers with.
 */
export function ChangePasswordModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = usePreferences()
  const { message } = App.useApp()
  const [form] = Form.useForm<Values>()
  const change = useChangeOwnPassword()

  const submit = async () => {
    const values = await form.validateFields().catch(() => null)
    if (!values) return

    try {
      await change.mutateAsync({ currentPassword: values.currentPassword, password: values.password })
      message.success(t('accounts.changeOwnDone'))
      form.resetFields()
      onClose()
    } catch (err) {
      message.error(getErrorMessage(err, t('accounts.saveFailed')))
    }
  }

  return (
    <Modal
      title={t('accounts.changeOwnTitle')}
      open={open}
      onOk={submit}
      onCancel={() => {
        form.resetFields()
        onClose()
      }}
      okText={t('common.save')}
      cancelText={t('common.cancel')}
      confirmLoading={change.isPending}
      forceRender
      width={480}
    >
      <Form form={form} layout="vertical" disabled={change.isPending}>
        <Form.Item
          name="currentPassword"
          label={t('accounts.form.currentPassword')}
          rules={[{ required: true, message: t('accounts.form.currentPasswordRequired') }]}
        >
          <Input.Password autoComplete="current-password" maxLength={255} />
        </Form.Item>
        <Form.Item
          name="password"
          label={t('accounts.form.password')}
          extra={t('accounts.form.passwordHint')}
          rules={[
            { required: true, message: t('accounts.form.passwordInvalid') },
            { min: PASSWORD_MIN_LENGTH, max: PASSWORD_MAX_LENGTH, message: t('accounts.form.passwordInvalid') },
          ]}
        >
          <Input.Password autoComplete="new-password" maxLength={PASSWORD_MAX_LENGTH} />
        </Form.Item>
        <Form.Item
          name="passwordRepeat"
          label={t('accounts.form.passwordRepeat')}
          dependencies={['password']}
          rules={[
            { required: true, message: t('accounts.form.passwordMismatch') },
            ({ getFieldValue }) => ({
              validator: (_, value?: string) =>
                !value || value === getFieldValue('password') ? Promise.resolve() : Promise.reject(new Error(t('accounts.form.passwordMismatch'))),
            }),
          ]}
        >
          <Input.Password autoComplete="new-password" maxLength={PASSWORD_MAX_LENGTH} />
        </Form.Item>
      </Form>
    </Modal>
  )
}
