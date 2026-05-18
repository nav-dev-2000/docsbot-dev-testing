import { useRef, useState, useEffect } from 'react';
import { PlayIcon, XMarkIcon } from '@heroicons/react/24/solid';
import clsx from 'clsx';
import { usePostHog } from 'posthog-js/react';
import { createPortal } from 'react-dom';

export default function VideoPlayer({ 
  videoSrc = "https://cdn.docsbot.com/docsbot-intro.mp4", 
  posterSrc = "/video/docsbot-intro.webp",
  className = "",
  isVideoFullScreen = false,
  isVideoPlaying = false,
  onClose,
  trackingLabel = 'Homepage Video',
}) {
  const getResponsiveVideoSrc = (quality) => {
    if (videoSrc.endsWith('-1080p.mp4')) {
      return videoSrc.replace('-1080p.mp4', `-${quality}.mp4`);
    }

    return videoSrc.replace('.mp4', `-${quality}.mp4`);
  };

  const smallVideoSrc = getResponsiveVideoSrc('720p');
  const videoSources = [
    // Order matters - browsers will use the first source they can play
    // Higher quality sources should be listed first for devices that can handle them
    { src: videoSrc, type: "video/mp4", media: "(min-width: 1200px)" }, // Original 1080p for large screens
    { src: getResponsiveVideoSrc('720p'), type: "video/mp4", media: "(min-width: 768px)" }, // 720p for medium screens
    { src: getResponsiveVideoSrc('480p'), type: "video/mp4" } // 480p as default/fallback
  ];
  
  const [isFullscreen, setIsFullscreen] = useState(isVideoFullScreen);
  const [isPlaying, setIsPlaying] = useState(isVideoPlaying);
  const videoRef = useRef(null);
  const fullscreenVideoRef = useRef(null);
  const overlayRef = useRef(null);
  const posthog = usePostHog();
  const [isMounted, setIsMounted] = useState(false);
  const watchTimeRef = useRef({
    startTime: null,
    totalWatchTime: 0,
    checkpoints: {
      '25%': false,
      '50%': false,
      '75%': false,
      '100%': false
    }
  });
  
  // Set isMounted to true after component mounts
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);
  
  const handlePlayClick = () => {
    if (videoRef.current) {
      // Stop the small video completely
      videoRef.current.pause();
      
      setIsFullscreen(true);
      setIsPlaying(true);
      
      // Track video play event
      posthog?.capture(`${trackingLabel} Play`, {
        video_src: videoSrc,
        fullscreen: true
      });
      
      // Start tracking watch time
      watchTimeRef.current.startTime = new Date();
    }
  };
  
  const handleCloseFullscreen = () => {
    if (fullscreenVideoRef.current) {
      // Stop the fullscreen video
      fullscreenVideoRef.current.pause();
      
      // Track watch time when closing
      trackWatchTime();
    }
    
    setIsFullscreen(false);
    setIsPlaying(false);

    if (onClose) {
      onClose()
    }
    
    // Restart the small video with mute
    if (videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(err => console.log('Auto-play prevented:', err));
    }
  };
  
  // Track video watch time
  const trackWatchTime = () => {
    if (watchTimeRef.current.startTime && isPlaying) {
      const endTime = new Date();
      const watchDuration = (endTime - watchTimeRef.current.startTime) / 1000; // in seconds
      watchTimeRef.current.totalWatchTime += watchDuration;
      
      // Track watch time event
      posthog?.capture(`${trackingLabel} Watch Time`, {
        video_src: videoSrc,
        duration_seconds: Math.round(watchTimeRef.current.totalWatchTime),
        session_duration_seconds: Math.round(watchDuration)
      });
      
      // Reset start time
      watchTimeRef.current.startTime = null;
    }
  };
  
  // Track video progress checkpoints
  const handleTimeUpdate = (e) => {
    if (!fullscreenVideoRef.current || !isPlaying) return;
    
    const video = fullscreenVideoRef.current;
    const progress = (video.currentTime / video.duration) * 100;
    const checkpoints = watchTimeRef.current.checkpoints;
    
    // Track progress at 25%, 50%, 75%, and 100%
    if (progress >= 25 && !checkpoints['25%']) {
      checkpoints['25%'] = true;
      posthog?.capture(`${trackingLabel} Progress`, {
        video_src: videoSrc,
        percentage: 25 
      });
    }
    if (progress >= 50 && !checkpoints['50%']) {
      checkpoints['50%'] = true;
      posthog?.capture(`${trackingLabel} Progress`, {
        video_src: videoSrc,
        percentage: 50 
      });
    }
    if (progress >= 75 && !checkpoints['75%']) {
      checkpoints['75%'] = true;
      posthog?.capture(`${trackingLabel} Progress`, {
        video_src: videoSrc,
        percentage: 75 
      });
    }
    if (progress >= 95 && !checkpoints['100%']) {
      checkpoints['100%'] = true;
      posthog?.capture(`${trackingLabel} Progress`, {
        video_src: videoSrc,
        percentage: 100,
        completed: true
      });
    }
  };
  
  useEffect(() => {
    // Handle ESC key to exit fullscreen
    const handleEscKey = (e) => {
      if (e.key === 'Escape' && isFullscreen) {
        handleCloseFullscreen();
      }
    };
    
    // Handle click outside video to close
    const handleClickOutside = (e) => {
      if (overlayRef.current && overlayRef.current.contains(e.target) && 
          fullscreenVideoRef.current && !fullscreenVideoRef.current.contains(e.target)) {
        handleCloseFullscreen();
      }
    };
    
    document.addEventListener('keydown', handleEscKey);
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.removeEventListener('mousedown', handleClickOutside);
      
      // Track final watch time when component unmounts
      trackWatchTime();
    };
  }, [isFullscreen, isPlaying]);
  
  // Start playing silently on load
  useEffect(() => {
    if (videoRef.current && !isFullscreen) {
      videoRef.current.muted = true;
      videoRef.current.play().catch(err => console.log('Auto-play prevented:', err));
    }
    
    // Handle browser fullscreen exit
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isFullscreen) {
        handleCloseFullscreen();
      }
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [isFullscreen]);
  
  // Add a new useEffect to handle mobile fullscreen after the fullscreen video is mounted
  useEffect(() => {
    // When fullscreen state changes to true and the fullscreen video ref is available
    if (isFullscreen && fullscreenVideoRef.current) {
      // Small delay to ensure the video element is fully rendered
      const timeoutId = setTimeout(() => {
        if (window.innerWidth < 768 && fullscreenVideoRef.current && fullscreenVideoRef.current.requestFullscreen) {
          fullscreenVideoRef.current.requestFullscreen().catch(err => {
            console.log('Error attempting to enable fullscreen:', err);
          });
        }
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [isFullscreen]);
  
  return (
    <>
      <div 
        className={clsx(
          'mt-16 flow-root sm:mt-24',
          className
        )}
      >
        <div className="-m-2 rounded-xl bg-white/5 p-2 ring-1 ring-inset ring-white/10 lg:-m-4 lg:rounded-2xl lg:p-4">
          <div className="relative w-full overflow-hidden rounded-md shadow-2xl ring-1 ring-white/10 group">
            <video
              ref={videoRef}
              className={clsx(
                'w-full rounded-md animate-fade-slide-x'
              )}
              src={smallVideoSrc}
              muted
              loop
              playsInline
              poster={posterSrc}
              preload="none"
            />
            
            {!isFullscreen && (
              <button
                onClick={handlePlayClick}
                className={clsx(
                  'absolute inset-0 flex items-center justify-center transition-opacity duration-300',
                  'bg-black/20 hover:bg-cyan-500/10'
                )}
                aria-label="Play video"
              >
                <span className={clsx(
                  'flex h-16 w-16 sm:h-24 sm:w-24 items-center justify-center rounded-full bg-animation text-white shadow-lg opacity-70 group-hover:opacity-100',
                  'transition-all duration-300 group-hover:scale-110'
                )}>
                  <PlayIcon className="ml-1 h-8 w-8 sm:h-12 sm:w-12 shadow-inner" />
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
      
      {isFullscreen && isMounted && createPortal(
        <div 
          ref={overlayRef}
          className="fixed inset-0 z-[99999998] flex items-center justify-center bg-black/90 backdrop-blur-sm"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
        >
          <button
            onClick={handleCloseFullscreen}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            aria-label="Close video"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
          
          <div className="w-full px-8 xl:px-12">
            <video
              ref={fullscreenVideoRef}
              className="w-full rounded-lg shadow-2xl"
              controls
              autoPlay
              playsInline
              onTimeUpdate={handleTimeUpdate}
              onPlay={() => {
                setIsPlaying(true);
                watchTimeRef.current.startTime = new Date();
              }}
              onPause={() => {
                setIsPlaying(false);
                trackWatchTime();
              }}
              onEnded={() => {
                setIsPlaying(false);
                trackWatchTime();
              }}
            >
              {videoSources.map((source, index) => (
                <source 
                  key={index}
                  src={source.src}
                  type={source.type}
                  media={source.media}
                />
              ))}
              Your browser does not support the video tag.
            </video>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
