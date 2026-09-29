import { DeleteOutlined, LeftOutlined, PictureOutlined, RightOutlined } from '@ant-design/icons'
import { App, Button, Upload } from 'antd'
import type { UploadProps } from 'antd'
import { useState } from 'react'

import { assetUrl } from '../api/client'
import { usePreferences } from '../app/preferences'
import { IMAGE_ACCEPT, MAX_IMAGE_SIZE, uploadImage } from '../features/uploads/api'
import { getErrorMessage } from './errors'

type ImageListFieldProps = {
  /** Controlled by `Form.Item`: the stored paths, in display order. */
  value?: string[]
  onChange?: (value: string[]) => void
  disabled?: boolean
}

/**
 * Several photos for one record. Each is uploaded as soon as it is picked —
 * only the stored path travels with the form — and the arrows set the order
 * they are shown in, because that is the order visitors will page through.
 */
export function ImageListField({ value = [], onChange, disabled }: ImageListFieldProps) {
  const { t } = usePreferences()
  const { message } = App.useApp()
  const [uploading, setUploading] = useState(false)

  const move = (index: number, step: 1 | -1) => {
    const next = [...value]
    const target = index + step

    if (target < 0 || target >= next.length) {
      return
    }

    ;[next[index], next[target]] = [next[target], next[index]]
    onChange?.(next)
  }

  const beforeUpload: UploadProps['beforeUpload'] = async (file) => {
    if (file.size > MAX_IMAGE_SIZE) {
      message.error(t('upload.tooLarge'))
      return Upload.LIST_IGNORE
    }

    setUploading(true)

    try {
      const uploaded = await uploadImage(file)
      onChange?.([...value, uploaded.url])
    } catch (err) {
      message.error(getErrorMessage(err, t('upload.failed')))
    } finally {
      setUploading(false)
    }

    return Upload.LIST_IGNORE
  }

  return (
    <div className="image-list">
      {value.length > 0 ? (
        <ul className="image-list__items">
          {value.map((image, index) => (
            <li key={image}>
              <img src={assetUrl(image)} alt="" />

              <div className="image-list__actions">
                <Button
                  size="small"
                  icon={<LeftOutlined />}
                  aria-label={t('upload.moveLeft')}
                  disabled={disabled || index === 0}
                  onClick={() => move(index, -1)}
                />
                <Button
                  size="small"
                  icon={<RightOutlined />}
                  aria-label={t('upload.moveRight')}
                  disabled={disabled || index === value.length - 1}
                  onClick={() => move(index, 1)}
                />
                <Button
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  aria-label={t('common.remove')}
                  disabled={disabled}
                  onClick={() => onChange?.(value.filter((item) => item !== image))}
                />
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      <Upload accept={IMAGE_ACCEPT} beforeUpload={beforeUpload} showUploadList={false} multiple disabled={disabled}>
        <Button icon={<PictureOutlined />} loading={uploading} disabled={disabled}>
          {t('upload.addPhotos')}
        </Button>
      </Upload>
    </div>
  )
}
