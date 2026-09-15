import { LockOutlined, SafetyCertificateOutlined, UserOutlined } from '@ant-design/icons'
import { Button, Card, Checkbox, Form, Input, Space, Typography } from 'antd'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { usePreferences } from '../../app/preferences'
import { clearSession, demoUsers, setSession, type DemoRole } from '../../auth/demoAuth'
import { useSession } from '../../auth/useSession'
import { useStudentLogin } from '../../features/students/queries'
import { BrandMark } from '../../shared/BrandMark'
import { ErrorAlert } from '../../shared/ErrorAlert'

const { Title, Paragraph, Text } = Typography

type LoginValues = { username: string; password?: string }

/** Where a signed-in user belongs — used by both the redirect and the CTA. */
const homeFor = (role: DemoRole) => (role === 'admin' ? '/admin' : '/student')

export function StudentPortalPage() {
  const { t } = usePreferences()
  const navigate = useNavigate()
  const session = useSession()
  const login = useStudentLogin()
  // Local-only failures (empty id, wrong admin password) that never reach
  // the API and therefore never appear in `login.error`.
  const [localError, setLocalError] = useState<string | null>(null)

  const onFinish = async (values: LoginValues) => {
    const username = values.username.trim()
    const password = values.password ?? ''
    setLocalError(null)

    if (!username) {
      setLocalError(t('login.idRequired'))
      return
    }

    // The admin account is local to the demo build; students are verified
    // against the API.
    if (username === demoUsers.admin.username) {
      if (password !== demoUsers.admin.password) {
        setLocalError(t('login.invalidCredentials'))
        return
      }

      setSession({ username: demoUsers.admin.username, role: 'admin', displayName: demoUsers.admin.displayName })
      navigate(homeFor('admin'), { replace: true })
      return
    }

    try {
      // A wrong password is a 401 from the API — surfaced through login.error.
      const { student } = await login.mutateAsync({ studentId: username, password })

      setSession({
        username: student.studentId,
        role: 'student',
        displayName: student.name,
        studentId: student.studentId,
        student,
      })
      navigate(homeFor('student'), { replace: true })
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
    <div className="portal-page">
      <section className="portal-intro">
        <BrandMark size={48} />
        <Text className="section-kicker">{t('session.studentPortal')}</Text>
        <Title level={1}>{t('login.portalTitle')}</Title>
        <Paragraph>{t('login.portalSubtitle')}</Paragraph>
        <div>
          <SafetyCertificateOutlined /> {t('login.dataProtected')}
        </div>
      </section>

      <Card className="surface-card login-card">
        {session ? (
          <>
            <Title level={2}>{session.displayName}</Title>
            <Paragraph type="secondary">
              {t('session.signedInAs')} · {t(session.role === 'admin' ? 'session.roleAdmin' : 'session.roleStudent')}
            </Paragraph>
            <Space wrap>
              {/* Opens in its own tab, matching the portal button in the
                  header; the sign-in page stays where it was. */}
              <Link to={homeFor(session.role)} target="_blank" rel="noreferrer">
                <Button type="primary" icon={<UserOutlined />}>
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
              <div className="login-options">
                <Checkbox>{t('login.remember')}</Checkbox>
                <a href="#help">{t('login.needHelp')}</a>
              </div>
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
