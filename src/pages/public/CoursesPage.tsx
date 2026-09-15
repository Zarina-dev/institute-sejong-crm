import { SendOutlined } from '@ant-design/icons'
import { App, Button, Card, Col, Empty, Form, Input, Modal, Row, Skeleton } from 'antd'
import { useCallback, useState } from 'react'

import { usePreferences } from '../../app/preferences'
import { CourseCard } from '../../features/courses/CourseCard'
import { useCourses, useCreateApplication } from '../../features/courses/queries'
import type { CourseRecord } from '../../features/courses/types'
import { ErrorAlert } from '../../shared/ErrorAlert'
import { getErrorMessage } from '../../shared/errors'
import { PageHeader } from '../../shared/PageHeader'

type ApplyFormValues = {
  applicantName: string
  applicantEmail: string
  phone?: string
  goal?: string
}

export function CoursesPage() {
  const { t } = usePreferences()
  const { message } = App.useApp()
  const courses = useCourses(true)
  const createApplication = useCreateApplication()

  // The course being applied for; null = modal closed.
  const [applyingTo, setApplyingTo] = useState<CourseRecord | null>(null)
  const [form] = Form.useForm<ApplyFormValues>()

  const openApply = useCallback((course: CourseRecord) => setApplyingTo(course), [])

  const closeApply = useCallback(() => {
    setApplyingTo(null)
    form.resetFields()
  }, [form])

  const submitApplication = async () => {
    if (!applyingTo) {
      return
    }

    const values = await form.validateFields()

    try {
      await createApplication.mutateAsync({ courseId: applyingTo.id, ...values })
      message.success(t('courses.applied', { course: applyingTo.title }))
      closeApply()
    } catch (err) {
      message.error(getErrorMessage(err, t('courses.applyFailed')))
    }
  }

  return (
    <div className="page-layout">
      <PageHeader kicker={t('nav.courses')} title={t('courses.publicTitle')} description={t('courses.publicSubtitle')} />

      <ErrorAlert error={courses.error} fallback={t('courses.loadFailed')} />

      {courses.isPending ? (
        <Row gutter={[16, 16]}>
          {Array.from({ length: 3 }, (_, index) => (
            <Col xs={24} md={12} lg={8} key={index}>
              <Card className="surface-card">
                <Skeleton active paragraph={{ rows: 5 }} />
              </Card>
            </Col>
          ))}
        </Row>
      ) : courses.data && courses.data.length > 0 ? (
        <Row gutter={[16, 16]}>
          {courses.data.map((course) => (
            <Col xs={24} md={12} lg={8} key={course.id}>
              <CourseCard
                course={course}
                footer={
                  <Button type="primary" icon={<SendOutlined />} block onClick={() => openApply(course)}>
                    {t('courses.apply')}
                  </Button>
                }
              />
            </Col>
          ))}
        </Row>
      ) : (
        <Card className="surface-card empty-card">
          <Empty description={t('courses.empty')} />
        </Card>
      )}

      <Modal
        title={applyingTo ? t('courses.applyTitle', { course: applyingTo.title }) : t('courses.apply')}
        open={Boolean(applyingTo)}
        onOk={submitApplication}
        onCancel={closeApply}
        okText={t('courses.applySubmit')}
        cancelText={t('common.cancel')}
        confirmLoading={createApplication.isPending}
        forceRender
      >
        <Form form={form} layout="vertical" disabled={createApplication.isPending}>
          <Form.Item name="applicantName" label={t('courses.applyForm.name')} rules={[{ required: true, message: t('courses.applyForm.nameRequired') }]}>
            <Input autoComplete="name" maxLength={120} />
          </Form.Item>
          <Form.Item
            name="applicantEmail"
            label={t('courses.applyForm.email')}
            rules={[
              { required: true, message: t('courses.applyForm.emailRequired') },
              { type: 'email', message: t('courses.applyForm.emailInvalid') },
            ]}
          >
            <Input autoComplete="email" inputMode="email" maxLength={120} />
          </Form.Item>
          <Form.Item name="phone" label={t('courses.applyForm.phone')}>
            <Input autoComplete="tel" inputMode="tel" maxLength={120} />
          </Form.Item>
          <Form.Item name="goal" label={t('courses.applyForm.goal')}>
            <Input.TextArea rows={3} maxLength={120} showCount />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
