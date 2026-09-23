import { LockOutlined, SafetyCertificateOutlined, TeamOutlined } from '@ant-design/icons'
import { Button, Card, Form, Input, Space, Typography } from 'antd'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { usePreferences } from '../../app/preferences'
import { clearSession, setSession } from '../../auth/session'
import { useSession } from '../../auth/useSession'
import { useLogin } from '../../features/auth/queries'
import { ErrorAlert } from '../../shared/ErrorAlert'
import { BrandMark } from '../../shared/BrandMark'
import { PageHeader } from '../../shared/PageHeader'

const { Title, Paragraph, Text } = Typography

type LoginValues = { username: string; password?: string }

/**
 * Staff sign-in. The site has one account — the administrator — so this is
 * the only door into the admin panel; visitors never need it.
 */
export function LoginPage() {
  const { t } = usePreferences()
  const navigate = useNavigate()
  const session = useSession()
  const login = useLogin()
  // An empty id never reaches the API, so it never appears in `login.error`.
  const [localError, setLocalError] = useState<string | null>(null)

  const onFinish = async (values: LoginValues) => {
    const username = values.username.trim()
    setLocalError(null)

    if (!username) {
      setLocalError(t('login.idRequired'))
      return
    }

    try {
      const result = await login.mutateAsync({ username, password: values.password ?? '' })
      setSession({ username, token: result.token })
      navigate('/admin', { replace: true })
    } catch {
      // Rendered through <ErrorAlert error={login.error}> below.
    }
  }

  const handleLogout = () => {
    clearSession()
    setLocalError(null)
    login.reset()
  }

  return (
    <div className="page-layout portal-page">
      <section className="portal-intro">
        <BrandMark size={48} />
        <PageHeader kicker={t('session.adminPanel')} title={t('login.portalTitle')} description={t('login.portalSubtitle')} />
        <div>
          <SafetyCertificateOutlined /> {t('login.dataProtected')}
        </div>
      </section>

      <Card className="surface-card login-card">
        {session ? (
          <>
            <Title level={2}>{session.username}</Title>
            <Paragraph type="secondary">
              {t('session.signedInAs')} · {t('session.roleAdmin')}
            </Paragraph>
            <Space wrap>
              {/* Opens in its own tab, matching the header button; this page stays put. */}
              <Link to="/admin" target="_blank">
                <Button type="primary" icon={<TeamOutlined />}>
                  {t('login.continue')}
                </Button>
              </Link>
              <Button onClick={handleLogout}>{t('session.logout')}</Button>
            </Space>
          </>
        ) : (
          <>
            <Title level={2}>{t('login.welcome')}</Title>
            <Paragraph type="secondary">{t('login.subtitle')}</Paragraph>

            <div className="login-feedback">
              <ErrorAlert error={localError ?? login.error} fallback={t('login.error')} />
            </div>

            <Form<LoginValues> layout="vertical" requiredMark={false} onFinish={onFinish} disabled={login.isPending}>
              <Form.Item label={t('login.idLabel')} name="username" rules={[{ required: true, message: t('login.idRequired') }]}>
                <Input size="large" autoComplete="username" autoFocus placeholder={t('login.idPlaceholder')} />
              </Form.Item>
              <Form.Item label={t('login.passwordLabel')} name="password">
                <Input.Password size="large" autoComplete="current-password" placeholder={t('login.passwordPlaceholder')} />
              </Form.Item>
              <Button type="primary" size="large" block icon={<LockOutlined />} htmlType="submit" loading={login.isPending}>
                {t('login.submit')}
              </Button>
            </Form>
          </>
        )}

        <Text className="login-help">{t('login.hint')}</Text>
      </Card>
    </div>
  )
}
