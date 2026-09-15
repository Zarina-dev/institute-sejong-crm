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

  // The course being applied for; null = modal closed. Replaces a chain of
  // window.prompt() calls that could not be styled, validated or cancelled
  // half-way without losing what was typed.
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
      message.success(`"${applyingTo.title}" 수강 신청이 접수되었습니다.`)
      closeApply()
    } catch (err) {
      message.error(getErrorMessage(err, '신청 처리에 실패했습니다.'))
    }
  }

  return (
    <div className="page-layout">
      <PageHeader kicker={t('courses')} title="수강" description="공개 중인 수강 과정을 확인하고 신청할 수 있습니다." />

      <ErrorAlert error={courses.error} fallback="과정을 불러오지 못했습니다." />

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
                    수강 신청
                  </Button>
                }
              />
            </Col>
          ))}
        </Row>
      ) : (
        <Card className="surface-card empty-card">
          <Empty description="공개된 과정이 없습니다." />
        </Card>
      )}

      <Modal
        title={applyingTo ? `수강 신청 — ${applyingTo.title}` : '수강 신청'}
        open={Boolean(applyingTo)}
        onOk={submitApplication}
        onCancel={closeApply}
        okText="신청하기"
        cancelText="취소"
        confirmLoading={createApplication.isPending}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" disabled={createApplication.isPending}>
          <Form.Item name="applicantName" label="이름" rules={[{ required: true, message: '이름을 입력하세요.' }]}>
            <Input autoComplete="name" />
          </Form.Item>
          <Form.Item
            name="applicantEmail"
            label="이메일"
            rules={[
              { required: true, message: '이메일을 입력하세요.' },
              { type: 'email', message: '올바른 이메일 형식이 아닙니다.' },
            ]}
          >
            <Input autoComplete="email" inputMode="email" />
          </Form.Item>
          <Form.Item name="phone" label="연락처">
            <Input autoComplete="tel" inputMode="tel" />
          </Form.Item>
          <Form.Item name="goal" label="수강 목적">
            <Input.TextArea rows={3} maxLength={120} showCount />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
