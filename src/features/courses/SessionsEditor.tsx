import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Col, Form, Input, Row, Select, Typography } from 'antd'
import { memo, useMemo } from 'react'

import { usePreferences } from '../../app/preferences'
import { weekdayOptions } from './sessions'

const { Text } = Typography

/**
 * `Form.List` editor for a course's weekly sessions. Lives inside the course
 * form under the field name `sessions`; the parent Form owns the values.
 */
export const SessionsEditor = memo(function SessionsEditor({ disabled }: { disabled?: boolean }) {
  const { t, language } = usePreferences()
  const days = useMemo(() => weekdayOptions(language), [language])

  return (
    <Form.List name="sessions">
      {(fields, { add, remove }) => (
        <div className="sessions-editor">
          {fields.length === 0 ? <Text type="secondary">{t('courses.sessions.empty')}</Text> : null}

          {fields.map((field) => (
            <Row gutter={8} align="top" key={field.key} className="sessions-row">
              <Col xs={12} sm={6}>
                <Form.Item name={[field.name, 'weekday']} rules={[{ required: true, message: t('courses.sessions.weekdayRequired') }]}>
                  <Select options={days} placeholder={t('courses.sessions.weekday')} />
                </Form.Item>
              </Col>
              <Col xs={6} sm={4}>
                <Form.Item name={[field.name, 'startTime']} rules={[{ required: true, message: t('courses.sessions.timeRequired') }]}>
                  <Input type="time" step={300} aria-label={t('courses.sessions.start')} />
                </Form.Item>
              </Col>
              <Col xs={6} sm={4}>
                <Form.Item
                  name={[field.name, 'endTime']}
                  dependencies={[['sessions', field.name, 'startTime']]}
                  rules={[
                    { required: true, message: t('courses.sessions.timeRequired') },
                    ({ getFieldValue }) => ({
                      validator: (_, value?: string) => {
                        const start = getFieldValue(['sessions', field.name, 'startTime'])
                        return !value || !start || value > start
                          ? Promise.resolve()
                          : Promise.reject(new Error(t('courses.sessions.endAfterStart')))
                      },
                    }),
                  ]}
                >
                  <Input type="time" step={300} aria-label={t('courses.sessions.end')} />
                </Form.Item>
              </Col>
              <Col xs={20} sm={8}>
                <Form.Item name={[field.name, 'classroom']}>
                  <Input placeholder={t('courses.sessions.roomPlaceholder')} maxLength={120} />
                </Form.Item>
              </Col>
              <Col xs={4} sm={2}>
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  aria-label={t('common.remove')}
                  disabled={disabled}
                  onClick={() => remove(field.name)}
                />
              </Col>
            </Row>
          ))}

          <Button
            type="dashed"
            icon={<PlusOutlined />}
            disabled={disabled || fields.length >= 14}
            onClick={() => add({ weekday: 1, startTime: '09:00', endTime: '10:30' })}
          >
            {t('courses.sessions.add')}
          </Button>
        </div>
      )}
    </Form.List>
  )
})
