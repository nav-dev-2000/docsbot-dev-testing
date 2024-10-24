import { useState, useRef } from 'react'
import clsx from 'clsx'
import { PhotoIcon } from '@heroicons/react/24/outline'
import { XCircleIcon } from '@heroicons/react/24/solid'

const ImageDropZone = ({ image, setImage, maxSize = 512, isComputing }) => {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef(null)

  const resizeImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          const scaleFactor = Math.min(maxSize / img.width, maxSize / img.height)
          canvas.width = img.width * scaleFactor
          canvas.height = img.height * scaleFactor
          
          // Fill canvas with white background in case of transparent image
          ctx.fillStyle = 'white'
          ctx.fillRect(0, 0, canvas.width, canvas.height)
          
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          resolve(canvas.toDataURL('image/jpeg'))
        }
        img.src = e.target.result
      }
      reader.readAsDataURL(file)
    })
  }

  const handleDragEnter = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      const resizedImage = await resizeImage(files[0])
      setImage(resizedImage)
    }
  }

  const handleChange = async (e) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const resizedImage = await resizeImage(files[0])
      setImage(resizedImage)
    }
  }

  if (image) {
    return (
      <div className="group relative">
        <img
          src={image}
          alt="Preview"
          className="mx-auto h-auto max-w-full rounded-lg shadow-lg group-hover:opacity-50"
        />
        <button
          onClick={() => setImage(null)}
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100"
        >
          <XCircleIcon className="h-16 w-16 text-gray-800" aria-hidden="true" />
        </button>
      </div>
    )
  } else {
    return (
      <div
        className={clsx(
          'flex cursor-pointer justify-center rounded-lg border-2 border-dashed border-gray-900/25 px-6 py-10 hover:border-gray-900/50',
          isDragging && 'border-gray-900/50 bg-gray-100',
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current && fileInputRef.current.click()}
      >
        <div className="text-center">
          <PhotoIcon
            aria-hidden="true"
            className="mx-auto h-12 w-12 text-gray-300"
          />
          <div className="mt-4 flex text-sm leading-6 text-gray-600">
            <label
              htmlFor="file-upload"
              className="relative cursor-pointer rounded-md bg-white font-semibold text-cyan-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-cyan-600 focus-within:ring-offset-2 hover:text-cyan-500"
            >
              <span>Upload a file</span>
              <input
                id="file-upload"
                name="file-upload"
                type="file"
                accept="image/png, image/jpeg, image/gif, image/webp"
                onChange={handleChange}
                disabled={isComputing}
                className="sr-only"
                ref={fileInputRef}
              />
            </label>
            <p className="pl-1">or drag and drop</p>
          </div>
          <p className="text-xs leading-5 text-gray-600">PNG, JPG, GIF, WEBP</p>
        </div>
      </div>
    )
  }
}

export default ImageDropZone
