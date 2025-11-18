import VideoPlayer from '@/components/VideoPlayer'

export const VideoOverlay = ({ isOpen, onClose }) => {
    if (!isOpen) return null

    return (
        <VideoPlayer
            isVideoFullScreen={true}
            isVideoPlaying={true}
            onClose={onClose}
        />
    )
}
