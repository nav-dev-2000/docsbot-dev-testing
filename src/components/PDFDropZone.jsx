import { useState, useRef } from 'react'
import clsx from 'clsx'
import { PhotoIcon, DocumentIcon } from '@heroicons/react/24/outline'
import { XCircleIcon } from '@heroicons/react/24/solid'

const PDFDropZone = ({ file, setFile, isComputing }) => {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef(null)

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
      setFile(files[0])
    }
  }

  const handleChange = async (e) => {
    const files = e.target.files
    if (files && files.length > 0) {
      setFile(files[0])
    }
  }

  if (file) {
    return (
      <div className="group relative rounded-lg border-2 border-dashed border-gray-900/25 px-6 py-4">
        <p className="text-sm text-gray-600">{file.name}</p>
        <button
          onClick={() => {
            setFile(null)
            if (fileInputRef.current) {
              fileInputRef.current.value = ''
            }
          }}
          className="absolute right-2 top-2"
        >
          <XCircleIcon className="h-6 w-6 text-gray-400 hover:text-gray-600" aria-hidden="true" />
        </button>
      </div>
    )
  }

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
        <DocumentIcon
          aria-hidden="true"
          className="mx-auto h-12 w-12 text-gray-300"
        />
        <div className="mt-4 flex text-sm leading-6 text-gray-600">
          <label
            htmlFor="file-upload"
            className="relative cursor-pointer rounded-md bg-white font-semibold text-cyan-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-cyan-600 focus-within:ring-offset-2 hover:text-cyan-500"
          >
            <span>Upload a PDF</span>
            <input
              id="file-upload"
              name="file-upload"
              type="file"
              accept="application/pdf"
              onChange={handleChange}
              disabled={isComputing}
              className="sr-only"
              ref={fileInputRef}
            />
          </label>
          <p className="pl-1">or drag and drop</p>
        </div>
        <p className="text-xs leading-5 text-gray-600">PDF files only</p>
      </div>
    </div>
  )
}

export default PDFDropZone
