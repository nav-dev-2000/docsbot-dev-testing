import Widget from '@new-dashboard/Widget'
import { ArrowPathIcon } from '@heroicons/react/24/outline'

const PageChatWidget = ({
    bot,
    className,
    children,
    placeholder,
    inputValue,
    onInputChange,
    onSendMessage,
    onStop,
    isSending = false,
    isInputDisabled = false,
    onReset,
    isResetDisabled = false,
    onImageSelect,
    imageUploadDisabled = false,
    selectedImages = [],
    onRemoveImage,
    showContextBoost = false,
    isContextBoost = false,
    onToggleContextBoost,
    contextBoostDisabled = false,
    modelSelector,
    ...props
}) => {
    const inputPlaceholder =
        placeholder ?? bot?.labels?.inputPlaceholder ?? 'Ask a question'
    const isFooterDisabled = isInputDisabled

    return (
        <Widget className={className} {...props}>
            <Widget.Header
                title={bot?.name || 'DocsBot'}
                subtitle={bot?.description}
                logo={bot?.logo}
                alignment="center"
                onClick={onReset}
            />

            <Widget.Body>{children}</Widget.Body>

            <Widget.Footer
                placeholder={inputPlaceholder}
                value={inputValue}
                onChange={onInputChange}
                onSend={onSendMessage}
                onStop={onStop}
                isSending={isSending}
                disabled={isFooterDisabled}
                onImageSelect={onImageSelect}
                imageUploadDisabled={imageUploadDisabled}
                selectedImages={selectedImages}
                onRemoveImage={onRemoveImage}
                showContextBoost={showContextBoost}
                isContextBoost={isContextBoost}
                onToggleContextBoost={onToggleContextBoost}
                contextBoostDisabled={contextBoostDisabled}
                modelSelector={modelSelector}
            />
        </Widget>
    )
}


export default PageChatWidget
