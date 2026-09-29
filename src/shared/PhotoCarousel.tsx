import { LeftOutlined, RightOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import { useEffect, useState } from 'react'

import { assetUrl } from '../api/client'
import { usePreferences } from '../app/preferences'

type PhotoCarouselProps = {
  /** Site-relative `/uploads/images/…` paths, in display order. */
  images: string[]
  /** Describes the set for assistive tech ("제10회 말하기 대회"). */
  label: string
}

/**
 * Several photos in one fixed frame: the frame never changes size — a tall
 * portrait and a wide group shot leave the page alone — and the photos slide
 * in from the left or the right. Arrows, dots and the arrow keys all move it.
 */
export function PhotoCarousel({ images, label }: PhotoCarouselProps) {
  const { t } = usePreferences()
  const [index, setIndex] = useState(0)
  /** Which way the incoming photo should enter from. */
  const [direction, setDirection] = useState<'next' | 'prev'>('next')

  // A shorter list (an edit, another record) must not leave us out of bounds.
  useEffect(() => {
    setIndex((current) => (current < images.length ? current : 0))
  }, [images.length])

  if (images.length === 0) {
    return null
  }

  const move = (step: 1 | -1) => {
    setDirection(step === 1 ? 'next' : 'prev')
    setIndex((current) => (current + step + images.length) % images.length)
  }

  const single = images.length === 1

  return (
    <div
      className="photo-carousel"
      role="group"
      aria-roledescription="carousel"
      aria-label={label}
      tabIndex={single ? -1 : 0}
      onKeyDown={(event) => {
        if (event.key === 'ArrowRight') {
          move(1)
        }

        if (event.key === 'ArrowLeft') {
          move(-1)
        }
      }}
    >
      <div className="photo-carousel__frame">
        {images.map((image, position) => (
          <img
            className={`photo-carousel__photo${position === index ? ` is-current is-${direction}` : ''}`}
            key={image}
            src={assetUrl(image)}
            alt=""
            loading={position === 0 ? 'eager' : 'lazy'}
            aria-hidden={position !== index}
          />
        ))}

        {!single ? (
          <>
            <Button
              className="photo-carousel__arrow photo-carousel__arrow--prev"
              shape="circle"
              icon={<LeftOutlined />}
              aria-label={t('gallery.previousPhoto')}
              onClick={() => move(-1)}
            />
            <Button
              className="photo-carousel__arrow photo-carousel__arrow--next"
              shape="circle"
              icon={<RightOutlined />}
              aria-label={t('gallery.nextPhoto')}
              onClick={() => move(1)}
            />

            <span className="photo-carousel__count">
              {index + 1} / {images.length}
            </span>
          </>
        ) : null}
      </div>

      {!single ? (
        <div className="photo-carousel__dots">
          {images.map((image, position) => (
            <button
              type="button"
              key={image}
              className={position === index ? 'is-current' : undefined}
              aria-label={t('gallery.photoNumber', { number: position + 1 })}
              aria-current={position === index}
              onClick={() => {
                setDirection(position > index ? 'next' : 'prev')
                setIndex(position)
              }}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}
