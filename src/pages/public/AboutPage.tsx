import { ArrowRightOutlined, BookOutlined, CompassOutlined, TeamOutlined } from '@ant-design/icons'
import { Button, Card, Col, Row, Tag, Typography } from 'antd'
import { Link } from 'react-router-dom'

const { Title, Paragraph, Text } = Typography
const values = [
  { icon: <CompassOutlined />, title: 'Purposeful learning', text: 'Clear programmes that connect classroom knowledge with practical outcomes.' },
  { icon: <TeamOutlined />, title: 'Student support', text: 'A welcoming environment where every student can ask, grow, and succeed.' },
  { icon: <BookOutlined />, title: 'Academic clarity', text: 'Schedules, resources, and progress information that are easy to find.' },
]

export function AboutPage() {
  return <div className="page-layout about-page">
    <header className="about-hero">
      <Tag>ABOUT INSTITUT</Tag>
      <Title level={1}>Education built around progress.</Title>
      <Paragraph>We create a focused, supportive learning experience that helps students build knowledge, confidence, and a meaningful future.</Paragraph>
      <Link to="/schedule"><Button type="primary" size="large" icon={<ArrowRightOutlined />} iconPosition="end">Explore the student experience</Button></Link>
    </header>
    <section><div className="section-heading"><div><Text className="section-kicker">WHAT GUIDES US</Text><Title level={2}>Designed for every step forward</Title></div></div>
      <Row gutter={[18, 18]}>{values.map((value) => <Col xs={24} md={8} key={value.title}><Card className="surface-card value-card"><span>{value.icon}</span><Title level={3}>{value.title}</Title><Paragraph type="secondary">{value.text}</Paragraph></Card></Col>)}</Row>
    </section>
    <Card className="surface-card contact-card"><div><Text className="section-kicker">CONTACT</Text><Title level={2}>We are here to help</Title><Paragraph type="secondary">Questions about programmes, enrolment, or student access? Get in touch with our team.</Paragraph></div><div className="contact-details"><a href="mailto:info@institut.example">info@institut.example</a><a href="tel:+15551234567">+1 (555) 123-4567</a><Text type="secondary">123 Education Avenue, City Center</Text></div></Card>
  </div>
}
