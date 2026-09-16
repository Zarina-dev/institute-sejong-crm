import { DeleteOutlined, UploadOutlined } from '@ant-design/icons'
import { App, Button, Space, Typography, Upload } from 'antd'
import type { RcFile } from 'antd/es/upload'
import { useState } from 'react'

import { assetUrl } from '../api/client'
import { usePreferences } from '../app/preferences'
import { IMAGE_ACCEPT, MAX_IMAGE_SIZE, uploadImage } from '../features/uploads/api'
import { getErrorMessage } from './errors'

const { Text } = Typography

type ImageUploadFieldProps = {
  /** Site-relative `/uploads/images/…` path, or null when there is no image. */
  value?: string | null
  onChange?: (value: string | null) => void
  disabled?: boolean
  /** `square` for avatars/staff photos, `wide` for news covers. */
  shape?: 'square' | 'wide'
  hint?: string
}

/**
 * Single-image picker backed by `POST /uploads/images`. Uploads immediately
 * on selection and hands the stored path to the form; the file itself never
 * travels with the form payload. Drop-in `Form.Item` control.
 */
export function ImageUploadField({ value, onChange, disabled, shape = 'wide', hint }: ImageUploadFieldProps) {
  const { t } = usePreferences()
  const { message } = App.useApp()
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (file: RcFile) => {
    if (file.size > MAX_IMAGE_SIZE) {
      message.error(t('upload.tooLarge'))
      return Upload.LIST_IGNORE
    }

    setUploading(true)

    try {
      const uploaded = await uploadImage(file)
      onChange?.(uploaded.url)
    } catch (err) {
      message.error(getErrorMessage(err, t('upload.failed')))
    } finally {
      setUploading(false)
    }

    // We handle the request ourselves; antd's own list/XHR must stay out of it.
    return Upload.LIST_IGNORE
  }

  return (
    <div className={`image-upload image-upload--${shape}`}>
      {value ? (
        <img className="image-upload__preview" src={assetUrl(value)} alt="" />
      ) : (
        <div className="image-upload__placeholder" aria-hidden>
          <UploadOutlined />
        </div>
      )}

      <Space direction="vertical" size={6} className="image-upload__controls">
        <Space wrap>
          <Upload accept={IMAGE_ACCEPT} showUploadList={false} beforeUpload={handleUpload} disabled={disabled || uploading}>
            <Button icon={<UploadOutlined />} loading={uploading} disabled={disabled}>
              {t('upload.image')}
            </Button>
          </Upload>
          {value ? (
            <Button icon={<DeleteOutlined />} danger disabled={disabled || uploading} onClick={() => onChange?.(null)}>
              {t('common.remove')}
            </Button>
          ) : null}
        </Space>
        <Text type="secondary" className="image-upload__hint">
          {hint ?? t('upload.hint')}
        </Text>
      </Space>
    </div>
  )
}
