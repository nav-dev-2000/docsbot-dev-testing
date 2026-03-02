import FieldToggle from '@/components/FieldToggle'
import FieldRadioIcon from '@/components/FieldRadioIcon'
import Button from '@new-dashboard/Button.jsx'
import LoadingSpinner from '@/components/LoadingSpinner'
import {
    AppearanceBlock,
    AppearanceToggle,
    AppearanceInput,
} from './Appearance.Options'
import { SketchPicker } from 'react-color'

import {
    XMarkIcon,
    PhotoIcon,
    CloudArrowUpIcon,
} from '@heroicons/react/24/outline'
import clsx from 'clsx'
import Tooltip from '@/components/Tooltip'
import IconButton from '../IconButton'

const PRESET_COLORS = [
    '#F44336',
    '#E91E63',
    '#9C27B0',
    '#673AB7',
    '#3F51B5',
    '#2196F3',
    '#03A9F4',
    '#00BCD4',
    '#009688',
    '#4CAF50',
    '#FFEB3B',
    '#FF9800',
    '#FF5722',
    '#607D8B',
    '#FFFFFF',
    '#000000',
]

const transparentCheckerboardStyle = {
    backgroundImage:
        'linear-gradient(45deg, #f3f4f6 25%, transparent 25%), linear-gradient(-45deg, #f3f4f6 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f3f4f6 75%), linear-gradient(-45deg, transparent 75%, #f3f4f6 75%)',
    backgroundSize: '8px 8px',
    backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
}

const AppearanceDesign = ({
    color,
    colorInput,
    showColorPicker,
    setShowColorPicker,
    colorPickerRef,
    updateColor,
    handleColorInputChange,
    handleColorInputBlur,
    brandColors,
    botIcon,
    setBotIcon,
    isUpdating,
    uploading,
    brandIconOptions,
    avatarRef,
    handleFileChange,
    brandLogos,
    logo,
    setLogo,
    logoRef,
    headerAlignment,
    setHeaderAlignment,
    icon,
    setIcon,
    iconRef,
    alignment,
    setAlignment,
    showButtonLabel,
    setShowButtonLabel,
    labels,
    setLabels,
}) => {
    const isPresetLogo = brandLogos.some((brandLogo) => brandLogo.url === logo)
    const isCustomLogo = logo && !isPresetLogo

    return (
        <>
            {/* Section: Theme Color */}
            <AppearanceBlock
                title="Theme Color"
                titleTag="h4"
                description={
                    brandColors.length > 0
                        ? 'Select from presets or customize your widget color.'
                        : 'Personalize your widget main color.'
                }
            >
                <div className="relative flex flex-col gap-4">
                    {/* Color Presets */}
                    {brandColors.length > 0 && (
                        <div className="flex flex-wrap gap-0.5">
                            {brandColors.map((brandColor, index) => {
                                const activeColor = color.toLowerCase()
                                const currentColor =
                                    brandColor.hex.toLowerCase()
                                const isActive = activeColor === currentColor

                                return (
                                    <Tooltip
                                        key={`${brandColor.hex}-${index}`}
                                        content={
                                            <span className="text-xs/none">
                                                {brandColor.name}
                                            </span>
                                        }
                                    >
                                        <button
                                            type="button"
                                            className={clsx(
                                                'rounded-full border-2 p-0.5 transition',
                                                {
                                                    ['pointer-events-none border-cyan-600']:
                                                        isActive,
                                                    ['border-white hover:border-gray-300']:
                                                        !isActive,
                                                },
                                            )}
                                            onClick={() =>
                                                updateColor(brandColor.hex)
                                            }
                                        >
                                            <span
                                                className="block size-7 rounded-full"
                                                style={{
                                                    backgroundColor:
                                                        brandColor.hex,
                                                }}
                                                aria-hidden={true}
                                            />
                                            <span className="sr-only">
                                                {brandColor.hex}
                                            </span>
                                        </button>
                                    </Tooltip>
                                )
                            })}
                        </div>
                    )}

                    {/* Color Picker */}
                    <div
                        className={clsx('relative gap-2', {
                            ['block']: brandColors.length > 0,
                            ['flex items-center']: brandColors.length <= 0,
                        })}
                    >
                        {brandColors.length > 0 && (
                            <span className="mb-1 block text-xs/6 text-gray-500">
                                Custom Color:
                            </span>
                        )}

                        <button
                            type="button"
                            className={clsx(
                                'flex items-center gap-2 rounded-lg border border-gray-300 py-1 pl-1 pr-3',
                                'transition hover:border-cyan-600 focus:border-cyan-600',
                            )}
                            onClick={() => setShowColorPicker(!showColorPicker)}
                            onMouseDown={(e) => e.stopPropagation()}
                        >
                            <span
                                className="block size-7 rounded-md"
                                style={{
                                    backgroundColor: color,
                                }}
                            />

                            <span className="block text-xs/6 text-gray-800">
                                {color}
                            </span>
                        </button>

                        {showColorPicker && (
                            <div
                                ref={colorPickerRef}
                                className={clsx(
                                    'max-w-64',
                                    'absolute left-0 top-full z-10',
                                    'mt-2',
                                )}
                            >
                                <SketchPicker
                                    color={color}
                                    onChange={(newColor) =>
                                        updateColor(newColor.hex)
                                    }
                                    disableAlpha={true}
                                    presetColors={PRESET_COLORS}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </AppearanceBlock>

            {/* Section: Header Styles */}
            <AppearanceBlock
                title="Header Styles"
                titleTag="h4"
                description="Personalize the look of your widget header."
            >
                <div className="flex flex-col gap-4">
                    {/* Image Presets */}
                    {brandLogos.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {brandLogos.map((brandLogo, index) => (
                                <button
                                    key={`${brandLogo.url}-${index}`}
                                    type="button"
                                    className={clsx(
                                        'flex h-16 w-20 items-center justify-center rounded-lg border-2 p-2',
                                        'transition',
                                        {
                                            ['border-gray-200 hover:border-cyan-500']:
                                                logo !== brandLogo.url,
                                            ['pointer-events-none border-cyan-600']:
                                                logo === brandLogo.url,
                                        },
                                    )}
                                    onClick={() => setLogo(brandLogo.url)}
                                    style={transparentCheckerboardStyle}
                                >
                                    <img
                                        src={brandLogo.url}
                                        alt={`${brandLogo.type || 'brand'} logo`}
                                        className="max-h-full max-w-full object-contain"
                                    />
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Choose Image */}
                    <AppearanceBlock
                        title={brandLogos.length > 0 ? '' : 'Choose Image'}
                        titleTag="p"
                        isLast={true}
                    >
                        <div
                            className={clsx('relative flex flex-col gap-4', {
                                ['-mt-2']: brandLogos.length <= 0,
                            })}
                        >
                            <div className="relative block gap-2">
                                {brandLogos.length > 0 && (
                                    <span className="mb-1 block text-xs/6 text-gray-500">
                                        {logo
                                            ? 'Selected Logo:'
                                            : 'Choose a Logo:'}
                                    </span>
                                )}

                                <div className="flex items-center gap-2">
                                    <div
                                        className={clsx(
                                            'h-12 w-full max-w-32',
                                            'relative flex items-center justify-center rounded border-2 border-gray-200 px-3 py-1',
                                        )}
                                        style={transparentCheckerboardStyle}
                                    >
                                        {logo && (
                                            <>
                                                <img
                                                    src={logo}
                                                    alt="logo"
                                                    className="max-h-10 w-auto max-w-full"
                                                />

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setLogo(null)
                                                    }
                                                    className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                                                >
                                                    <XMarkIcon
                                                        className="h-3.5 w-3.5"
                                                        aria-hidden="true"
                                                    />
                                                    <span className="sr-only">
                                                        Remove logo
                                                    </span>
                                                </button>
                                            </>
                                        )}
                                    </div>

                                    <input
                                        ref={logoRef}
                                        type="file"
                                        id="logo"
                                        accept="image/png, image/jpeg, image/gif, image/webp"
                                        onChange={(e) =>
                                            handleFileChange(e, 'logo')
                                        }
                                        className="sr-only"
                                    />

                                    <Tooltip
                                        content={
                                            <span className="text-xs/none">
                                                {logo
                                                    ? 'Change Image'
                                                    : 'Upload Image'}
                                            </span>
                                        }
                                    >
                                        <IconButton
                                            type="button"
                                            icon={
                                                uploading === 'logo'
                                                    ? LoadingSpinner
                                                    : CloudArrowUpIcon
                                            }
                                            label={
                                                logo
                                                    ? 'Click to change'
                                                    : 'Click to upload'
                                            }
                                            onClick={() =>
                                                logoRef.current.click()
                                            }
                                            disabled={uploading === 'logo'}
                                        />
                                    </Tooltip>
                                </div>
                            </div>
                        </div>
                    </AppearanceBlock>

                    {/* Alignment */}
                    <AppearanceBlock
                        title="Alignment"
                        titleTag="p"
                        isLast={true}
                    >
                        <fieldset className="-mt-2">
                            <legend className="sr-only">Alignment</legend>
                            <div className="space-y-4 sm:flex sm:items-center sm:space-x-10 sm:space-y-0">
                                <div className="flex items-center">
                                    <input
                                        id="logo-left"
                                        name="headerAlignment"
                                        type="radio"
                                        checked={headerAlignment === 'left'}
                                        onChange={() =>
                                            setHeaderAlignment('left')
                                        }
                                        className="h-4 w-4 border-gray-300 text-cyan-600 focus:ring-cyan-600"
                                    />
                                    <label
                                        htmlFor="logo-left"
                                        className="ml-3 block text-sm font-medium leading-6 text-gray-900"
                                    >
                                        Left
                                    </label>
                                </div>
                                <div className="flex items-center">
                                    <input
                                        id="logo-center"
                                        name="headerAlignment"
                                        type="radio"
                                        checked={headerAlignment === 'center'}
                                        onChange={() =>
                                            setHeaderAlignment('center')
                                        }
                                        className="h-4 w-4 border-gray-300 text-cyan-600 focus:ring-cyan-600"
                                    />
                                    <label
                                        htmlFor="logo-center"
                                        className="ml-3 block text-sm font-medium leading-6 text-gray-900"
                                    >
                                        Center
                                    </label>
                                </div>
                            </div>
                        </fieldset>
                    </AppearanceBlock>
                </div>
            </AppearanceBlock>

            {/* Section: Bot Identity */}
            <AppearanceBlock title="Bot Identity" titleTag="h4">
                <AppearanceBlock isLast={true}>
                    <FieldRadioIcon
                        type="bot"
                        label="Bot Avatar"
                        icon={botIcon}
                        setIcon={setBotIcon}
                        disabled={isUpdating || uploading === 'avatar'}
                        loading={uploading === 'avatar'}
                        imageOptions={brandIconOptions}
                    />
                    <input
                        ref={avatarRef}
                        type="file"
                        accept="image/png, image/jpeg, image/gif, image/webp"
                        onChange={(e) => handleFileChange(e, 'avatar')}
                        className="sr-only"
                    />
                </AppearanceBlock>
            </AppearanceBlock>

            <AppearanceBlock title="Entry Button" titleTag="h4" isLast={true}>
                <div className="flex flex-col gap-4">
                    <AppearanceBlock
                        title="Button Icon"
                        titleTag="p"
                        isLast={true}
                    >
                        <FieldRadioIcon
                            type="icon"
                            icon={icon}
                            setIcon={setIcon}
                            disabled={isUpdating || uploading === 'icon'}
                            loading={uploading === 'icon'}
                            imageOptions={brandIconOptions}
                        />
                        <input
                            ref={iconRef}
                            type="file"
                            accept="image/png, image/jpeg, image/gif, image/webp"
                            onChange={(e) => handleFileChange(e, 'icon')}
                            className="sr-only"
                        />
                    </AppearanceBlock>

                    <AppearanceBlock
                        title="Button Alignment"
                        titleTag="label"
                        isLast={true}
                    >
                        <fieldset>
                            <legend className="sr-only">Alignment</legend>
                            <div className="space-y-4 sm:flex sm:items-center sm:space-x-10 sm:space-y-0">
                                <div className="flex items-center">
                                    <input
                                        id="left"
                                        name="alignment"
                                        type="radio"
                                        checked={alignment === 'left'}
                                        onChange={() => setAlignment('left')}
                                        className="h-4 w-4 border-gray-300 text-cyan-600 focus:ring-cyan-600"
                                    />
                                    <label
                                        htmlFor="left"
                                        className="ml-3 block text-sm font-medium leading-6 text-gray-900"
                                    >
                                        Left
                                    </label>
                                </div>
                                <div className="flex items-center">
                                    <input
                                        id="right"
                                        name="alignment"
                                        type="radio"
                                        checked={alignment === 'right'}
                                        onChange={() => setAlignment('right')}
                                        className="h-4 w-4 border-gray-300 text-cyan-600 focus:ring-cyan-600"
                                    />
                                    <label
                                        htmlFor="right"
                                        className="ml-3 block text-sm font-medium leading-6 text-gray-900"
                                    >
                                        Right
                                    </label>
                                </div>
                            </div>
                        </fieldset>
                    </AppearanceBlock>

                    <AppearanceToggle
                        label="Show Button Text"
                        description="Show text next to the floating button icon?"
                        enabled={showButtonLabel}
                        setEnabled={setShowButtonLabel}
                        disabled={isUpdating}
                    />

                    {showButtonLabel && (
                        <AppearanceBlock
                            title="Button Text"
                            titleTag="label"
                            titleProps={{ htmlFor: 'button-label' }}
                            isLast={true}
                        >
                            <AppearanceInput
                                type="text"
                                name="button-label"
                                id="button-label"
                                value={labels.floatingButton}
                                onChange={(e) =>
                                    setLabels({
                                        ...labels,
                                        floatingButton: e.target.value,
                                    })
                                }
                                disabled={isUpdating}
                                placeholder="Button text"
                                className="block rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 disabled:opacity-50 sm:text-sm"
                            />
                        </AppearanceBlock>
                    )}
                </div>
            </AppearanceBlock>
        </>
    )
}

export default AppearanceDesign
