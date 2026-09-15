import { LockOutlined, SafetyCertificateOutlined, UserOutlined } from '@ant-design/icons'
import { Alert, Button, Card, Checkbox, Form, Input, Space, Typography } from 'antd'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { usePreferences } from '../../app/preferences'
import { clearSession, demoUsers, setSession } from '../../auth/demoAuth'
import { useSession } from '../../auth/useSession'
import { loginStudent } from '../../features/students/api/studentsApi'

const { Title, Paragraph, Text } = Typography

type LoginValues = { username: string; password?: string }

export function StudentPortalPage() {
  const { t } = usePreferences()
  const navigate = useNavigate()
  const session = useSession()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  /** Where a signed-in user belongs — used by both the redirect and the CTA. */
  const homeFor = (role: 'admin' | 'student') => (role === 'admin' ? '/admin' : '/student')

  const onFinish = async (values: LoginValues) => {
    const username = values.username.trim()

    if (!username) {
      setError(t('loginIdRequired'))
      return
    }

    setLoading(true)
    setError(null)

    try {
      // The admin account is local to the demo build; students are verified
      // against the API.
      if (username === demoUsers.admin.username) {
        if ((values.password ?? '') !== demoUsers.admin.password) {
          setError(t('loginInvalidCredentials'))
          return
        }

        setSession({
          username: demoUsers.admin.username,
          role: 'admin',
          displayName: demoUsers.admin.displayName,
        })
        navigate(homeFor('admin'), { replace: true })
        return
      }

      const result = await loginStudent(username, values.password ?? '')

      if (!result.valid || !result.student) {
        setError(result.reason ?? t('loginInvalidCredentials'))
        return
      }

      setSession({
        username: result.student.studentId,
        role: 'student',
        displayName: result.student.name,
        studentId: result.student.studentId,
        student: result.student,
      })
      navigate(homeFor('student'), { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : t('loginError'))
    } finally {
      // Runs on every exit path, so the button can no longer stay stuck in
      // its loading state after a failed attempt.
      setLoading(false)
    }
  }

  const handleLogout = () => {
    clearSession()
    setError(null)
  }

  return (
    <div className="portal-page">
      <section className="portal-intro">
        <span className="brand-mark" aria-hidden="true">
          I
        </span>
        <Text className="section-kicker">{t('studentPortal')}</Text>
        <Title level={1}>{t('portalTitle')}</Title>
        <Paragraph>{t('portalSubtitle')}</Paragraph>
        <div>
          <SafetyCertificateOutlined /> {t('loginDataProtected')}
        </div>
      </section>

      <Card className="surface-card login-card">
        {session ? (
          <>
            <Title level={2}>{session.displayName}</Title>
            <Paragraph type="secondary">
              {t('signedInAs')} · {t(session.role === 'admin' ? 'roleAdmin' : 'roleStudent')}
            </Paragraph>
            <Space wrap>
              {/* Opens in its own tab, matching the portal button in the
                  header; the sign-in page stays where it was. */}
              <Link to={homeFor(session.role)} target="_blank" rel="noreferrer">
                <Button type="primary" icon={<UserOutlined />}>
                  {t('loginContinue')}
                </Button>
              </Link>
              <Button onClick={handleLogout}>{t('logout')}</Button>
            </Space>
          </>
        ) : (
          <>
            <Title level={2}>{t('loginWelcome')}</Title>
            <Paragraph type="secondary">{t('loginSubtitle')}</Paragraph>

            {error ? (
              <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} />
            ) : null}

            <Form<LoginValues> layout="vertical" requiredMark={false} onFinish={onFinish}>
              <Form.Item
                label={t('loginIdLabel')}
                name="username"
                rules={[{ required: true, message: t('loginIdRequired') }]}
              >
                <Input size="large" autoComplete="username" placeholder={t('loginIdPlaceholder')} />
              </Form.Item>

              <Form.Item label={t('loginPasswordLabel')} name="password">
                <Input.Password
                  size="large"
                  autoComplete="current-password"
                  placeholder={t('loginPasswordPlaceholder')}
                />
              </Form.Item>

              <div className="login-options">
                <Checkbox>{t('loginRemember')}</Checkbox>
                <a href="#help">{t('loginNeedHelp')}</a>
              </div>

              <Button
                type="primary"
                size="large"
                block
                icon={<LockOutlined />}
                htmlType="submit"
                loading={loading}
              >
                {t('loginSubmit')}
              </Button>
            </Form>
          </>
        )}

        <Text className="login-help">{t('loginHint')}</Text>
      </Card>
    </div>
  )
}
