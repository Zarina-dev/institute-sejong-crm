import { CopyOutlined, InstagramOutlined, PhoneOutlined } from '@ant-design/icons'
import { App, Button, Popover, Typography } from 'antd'
import { useState, type ReactNode } from 'react'

import { contact, phoneHref } from '../app/contact'
import { usePreferences } from '../app/preferences'

const { Text } = Typography

type CallButtonProps = {
  className?: string
  icon?: ReactNode
  children: ReactNode
}

/**
 * "전화 문의". A tel: link alone does nothing on a computer without a phone
 * app, so the button opens the number instead: large enough to read off the
 * screen, with "call" (dials on a phone) and "copy" beside it, and Instagram
 * for those who would rather write.
 */
export function CallButton({ className, icon, children }: CallButtonProps) {
  const { t } = usePreferences()
  const { message } = App.useApp()
  const [open, setOpen] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(contact.phone)
      message.success(t('home.numberCopied'))
    } catch {
      message.info(contact.phone)
    }
  }

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      trigger="click"
      placement="bottomLeft"
      rootClassName="call-popover"
      content={
        <div className="call-card">
          <Text type="secondary" className="call-card__label">
            {t('home.enquireTitle')}
          </Text>
          <a className="call-card__number" href={phoneHref}>
            {contact.phone}
          </a>
          <div className="call-card__actions">
            <Button type="primary" icon={<PhoneOutlined />} href={phoneHref}>
              {t('home.callNow')}
            </Button>
            <Button icon={<CopyOutlined />} onClick={copy}>
              {t('home.copyNumber')}
            </Button>
          </div>
          <a className="call-card__alt" href={contact.instagram} target="_blank" rel="noopener noreferrer">
            <InstagramOutlined /> {t('home.writeInstagram')}
          </a>
        </div>
      }
    >
      <Button className={className} size="large" icon={icon} aria-haspopup="dialog" aria-expanded={open}>
        {children}
      </Button>
    </Popover>
  )
}
