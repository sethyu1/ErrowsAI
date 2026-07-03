import React, { useState, useEffect, useCallback, useRef, useImperativeHandle } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { CloseIcon, ArrowRightIcon } from '@errows/icons';
import { Loader2 } from 'lucide-react';
import { useMobile } from '@/hooks/use-mobile-detector';
import { Loading } from '@/components/loading';

export interface MediaItem {
    url: string;
    type: 'image' | 'video';
}

export interface MediaViewerProps {
    list: MediaItem[];
    open?: (index: number) => void;
    /** Zoom steps, default is 5. Indicates how many clicks to reach maximum */
    zoomSteps?: number;
    /** Maximum zoom level, default is 3 */
    maxZoom?: number;
    /** Auto-play videos when opened, default is true */
    autoplay?: boolean;
}

/**
 * Generate zoom levels array
 * @param steps Number of zoom steps, e.g. 5 means 5 clicks to reach maximum
 * @param maxZoom Maximum zoom level
 */
function generateZoomLevels(steps: number = 5, maxZoom: number = 3): number[] {
    if (steps <= 1) return [1, maxZoom];
    const levels = [1];
    const step = (maxZoom - 1) / steps;
    for (let i = 1; i <= steps; i++) {
        levels.push(Math.round((1 + step * i) * 100) / 100);
    }
    return levels;
}

export interface MediaViewerRef {
    show: (index?: number) => void;
    close: () => void;
}

const MediaViewerComponent = React.forwardRef<MediaViewerRef, MediaViewerProps>(
    ({ list, zoomSteps = 5, maxZoom = 3, autoplay = true }, ref) => {
        const { t } = useTranslation();
        const [isVisible, setIsVisible] = useState(false);
        const [currentIndex, setCurrentIndex] = useState(0);
        const [zoomLevel, setZoomLevel] = useState(1);
        const [isLoading, setIsLoading] = useState(true);
        const [imageAspectRatio, setImageAspectRatio] = useState<number | null>(null);
        const [isDragging, setIsDragging] = useState(false);
        const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
        const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
        const imgRef = useRef<HTMLImageElement>(null);
        const videoRef = useRef<HTMLVideoElement>(null);
        const isMobile = useMobile();

        // Dynamically generate zoom levels based on parameters
        const zoomLevels = generateZoomLevels(zoomSteps, maxZoom);
        const isZoomed = zoomLevel > 1;

        // Expose ref methods
        useImperativeHandle(
            ref,
            () => ({
                show: (index = 0) => {
                    const newIndex = Math.min(index, list.length - 1);
                    setCurrentIndex(newIndex);
                    setIsVisible(true);
                    // Always reset zoom to 1, especially for videos
                    setZoomLevel(1);
                    setDragOffset({ x: 0, y: 0 });
                },
                close: () => {
                    setIsVisible(false);
                    // Reset zoom when closing
                    setZoomLevel(1);
                    setDragOffset({ x: 0, y: 0 });
                },
            }),
            [list.length]
        );

        const currentItem = list[currentIndex];
        const hasMultipleItems = list.length > 1;
        const isFirstItem = currentIndex === 0;
        const isLastItem = currentIndex === list.length - 1;

        const handlePrevious = useCallback(() => {
            if (!isFirstItem) {
                setCurrentIndex(currentIndex - 1);
                setZoomLevel(1);
                setIsLoading(true);
                setDragOffset({ x: 0, y: 0 });
            }
        }, [currentIndex, isFirstItem]);

        const handleNext = useCallback(() => {
            if (!isLastItem) {
                setCurrentIndex(currentIndex + 1);
                setZoomLevel(1);
                setIsLoading(true);
                setDragOffset({ x: 0, y: 0 });
            }
        }, [currentIndex, isLastItem]);

        // Reset loading state when video changes
        useEffect(() => {
            if (currentItem?.type === 'video') {
                setIsLoading(true);
            }
        }, [currentIndex, currentItem?.type]);

        // Step-by-step zoom handling - Only for images, not for videos
        const handleZoom = useCallback(() => {
            // Only allow zoom for images, not for videos
            if (currentItem?.type === 'video') {
                return;
            }
            const currentZoomIndex = zoomLevels.indexOf(zoomLevel);
            const nextIndex = (currentZoomIndex + 1) % zoomLevels.length;
            setZoomLevel(zoomLevels[nextIndex]);
            // Reset drag offset to new zoom level
            if (zoomLevels[nextIndex] === 1) {
                setDragOffset({ x: 0, y: 0 });
            }
        }, [zoomLevel, zoomLevels, currentItem?.type]);

        // Get touch or mouse event coordinates
        const getEventCoords = (e: React.MouseEvent<HTMLImageElement> | React.TouchEvent<HTMLImageElement>) => {
            if ('touches' in e) {
                return { x: e.touches[0].clientX, y: e.touches[0].clientY };
            }
            return { x: e.clientX, y: e.clientY };
        };

        // Image drag handling - Mouse and touch (only for images, not videos)
        const handleDragStart = useCallback(
            (e: React.MouseEvent<HTMLImageElement> | React.TouchEvent<HTMLImageElement>) => {
                // Only allow dragging for zoomed images, not for videos
                if (isZoomed && imgRef.current && currentItem?.type === 'image') {
                    setIsDragging(true);
                    const coords = getEventCoords(e);
                    setDragStart(coords);
                }
            },
            [isZoomed, currentItem?.type]
        );

        const handleDragMove = useCallback(
            (e: React.MouseEvent<HTMLImageElement> | React.TouchEvent<HTMLImageElement>) => {
                if (isDragging && imgRef.current) {
                    const coords = getEventCoords(e);
                    const deltaX = coords.x - dragStart.x;
                    const deltaY = coords.y - dragStart.y;
                    setDragOffset({
                        x: dragOffset.x + deltaX,
                        y: dragOffset.y + deltaY,
                    });
                    setDragStart(coords);
                }
            },
            [isDragging, dragStart, dragOffset]
        );

        const handleDragEnd = useCallback(() => {
            setIsDragging(false);
        }, []);

        // Preload image and calculate aspect ratio
        useEffect(() => {
            if (!isVisible || !currentItem || currentItem.type !== 'image') {
                setImageAspectRatio(null);
                return;
            }

            setIsLoading(true);
            const img = new Image();
            img.onload = () => {
                const ratio = img.width / img.height;
                setImageAspectRatio(ratio);
                setIsLoading(false);
            };
            img.onerror = () => {
                setIsLoading(false);
            };
            img.src = currentItem.url;
        }, [isVisible, currentIndex, currentItem]);

        // Global mouseup and touchend events
        useEffect(() => {
            const handleDragEnd = () => {
                setIsDragging(false);
            };

            window.addEventListener('mouseup', handleDragEnd);
            window.addEventListener('touchend', handleDragEnd);
            return () => {
                window.removeEventListener('mouseup', handleDragEnd);
                window.removeEventListener('touchend', handleDragEnd);
            };
        }, []);

        // Keyboard shortcuts handling
        useEffect(() => {
            if (!isVisible) return;

            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === 'ArrowLeft') handlePrevious();
                if (e.key === 'ArrowRight') handleNext();
                if (e.key === 'Escape') setIsVisible(false);
            };

            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }, [isVisible, handlePrevious, handleNext]);

        // Prevent body scroll
        useEffect(() => {
            if (!isVisible) return;

            const originalOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = originalOverflow;
            };
        }, [isVisible]);

        // Auto-play video when visible and autoplay is enabled
        useEffect(() => {
            if (!isVisible || !autoplay || !videoRef.current || currentItem?.type !== 'video') {
                return;
            }

            // Use a small delay to ensure the video element is ready
            const timer = setTimeout(() => {
                videoRef.current?.play().catch((error) => {
                    // Autoplay may be blocked by browser policy, silently fail
                    console.debug('Video autoplay failed:', error);
                });
            }, 100);

            return () => clearTimeout(timer);
        }, [isVisible, autoplay, currentItem?.type, currentIndex]);

        if (!isVisible || !currentItem) return null;

        const containerWidth = isMobile ? '100vw' : 'auto';

        // Calculate image/video container aspect ratio
        let mediaContainerAspectRatio: number | undefined;

        if (currentItem.type === 'image' && imageAspectRatio) {
            // Display image with actual aspect ratio
            mediaContainerAspectRatio = imageAspectRatio;
        } else if (currentItem.type === 'image' && !imageAspectRatio) {
            // Image loading, use default 4:3 ratio
            mediaContainerAspectRatio = 4 / 3;
        } else if (currentItem.type === 'video') {
            // Video uses uniform 3:4 ratio
            mediaContainerAspectRatio = 3 / 4;
        }

        return createPortal(
            <div
                className="fixed inset-0 flex items-center justify-center"
                style={{
                    background: 'rgba(0, 0, 0, 0.8)',
                    zIndex: 99999,
                    pointerEvents: 'auto',
                }}
            >
                {/* Main container */}
                <div
                    className="relative flex flex-col items-center"
                    style={{
                        width: containerWidth,
                        maxWidth: isMobile ? undefined : '90vw',
                        maxHeight: '90vh',
                        borderRadius: '24px',
                        overflow: 'hidden',
                        background: 'rgba(0, 0, 0, 0.4)',
                        backdropFilter: 'blur(10px)',
                        pointerEvents: 'auto',
                        zIndex: 100000,
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Close button */}
                    <button
                        onClick={() => setIsVisible(false)}
                        className="absolute top-4 right-4 z-20 p-0 rounded-full transition-all hover:scale-110 active:scale-95"
                        style={{
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: 'none',
                            cursor: 'pointer',
                            background: 'rgba(0, 0, 0, 0.15)',
                        }}
                        title={t('common.close')}
                    >
                        <CloseIcon width={16} height={16} />
                    </button>

                    {/* Media container */}
                    <div
                        className="flex-1 flex items-center justify-center overflow-hidden relative"
                        style={{
                            width: isMobile ? '100%' : '85vw',
                            maxWidth: isMobile ? '100%' : '90vw',
                            height: hasMultipleItems ? 'calc(90vh - 100px)' : 'calc(90vh - 50px)',
                            maxHeight: 'calc(90vh - 50px)',
                            padding: isMobile ? '12px' : '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            aspectRatio: mediaContainerAspectRatio ? `${mediaContainerAspectRatio} / 1` : undefined,
                        }}
                    >
                        {/* Loading display */}
                        {isLoading && (
                            <div
                                style={{
                                    position: 'absolute',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '100%',
                                    height: '100%',
                                    zIndex: 10,
                                    background: currentItem.type === 'video' ? 'rgba(0, 0, 0, 0.3)' : 'transparent',
                                }}
                            >
                                {currentItem.type === 'video' ? (
                                    <Loader2 className="w-12 h-12 text-white animate-spin" />
                                ) : (
                                    <Loading
                                        style={{
                                            fontSize: '48px',
                                            color: 'white',
                                        }}
                                    />
                                )}
                            </div>
                        )}

                        {currentItem.type === 'image' ? (
                            <div
                                className="relative flex items-center justify-center group cursor-zoom-in"
                                onClick={handleZoom}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    overflow: 'hidden',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <img
                                    ref={imgRef}
                                    src={currentItem.url}
                                    alt={`Image ${currentIndex + 1}`}
                                    className={!isDragging ? 'transition-all duration-300' : ''}
                                    style={{
                                        maxWidth: '100%',
                                        maxHeight: '100%',
                                        width: 'auto',
                                        height: 'auto',
                                        objectFit: 'contain',
                                        opacity: isLoading ? 0.5 : 1,
                                        transform: isZoomed
                                            ? `scale(${zoomLevel}) translate(${dragOffset.x}px, ${dragOffset.y}px)`
                                            : 'scale(1)',
                                        transformOrigin: 'center',
                                        cursor: isZoomed ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
                                        userSelect: 'none',
                                        touchAction: 'none',
                                    }}
                                    onMouseDown={handleDragStart}
                                    onMouseMove={handleDragMove}
                                    onMouseUp={handleDragEnd}
                                    onTouchStart={handleDragStart}
                                    onTouchMove={handleDragMove}
                                    onTouchEnd={handleDragEnd}
                                    draggable={false}
                                />

                                {/* Zoom/Unzoom button - Bottom-right of image */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleZoom();
                                    }}
                                    className="absolute bottom-4 right-4 transition-all hover:scale-110 active:scale-95 z-10"
                                    style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        backdropFilter: 'blur(5px)',
                                        border: '1px solid rgba(255, 255, 255, 0.4)',
                                        background: 'rgba(255, 255, 255, 0.15)',
                                    }}
                                    title={isZoomed ? `${t('common.zoomOut')} (${(zoomLevel * 100).toFixed(0)}%)` : t('common.zoomIn')}
                                >
                                    <span
                                        style={{
                                            fontSize: '12px',
                                            color: 'white',
                                            fontWeight: 'bold',
                                        }}
                                    >
                                        {(zoomLevel * 100).toFixed(0)}%
                                    </span>
                                </button>
                            </div>
                        ) : (
                            <div
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: '24px',
                                    overflow: 'hidden',
                                }}
                            >
                                <video
                                    ref={videoRef}
                                    src={currentItem.url}
                                    controls
                                    autoPlay={autoplay}
                                    playsInline
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'contain',
                                        objectPosition: 'center',
                                    }}
                                    onLoadStart={() => setIsLoading(true)}
                                    onLoadedData={() => setIsLoading(false)}
                                    onCanPlay={() => setIsLoading(false)}
                                    onError={() => setIsLoading(false)}
                                />
                            </div>
                        )}
                    </div>

                    {/* Control bar - Only show if multiple items */}
                    {hasMultipleItems && (
                        <div
                            className="flex items-center justify-center gap-14"
                            style={{
                                height: '56px',
                                padding: isMobile ? '12px 16px' : '12px 32px'
                            }}
                        >
                            {/* Previous button */}
                            <button
                                onClick={handlePrevious}
                                disabled={isFirstItem}
                                className="transition-all hover:bg-opacity-80 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '50%',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    background: 'rgba(34, 35, 42, 0.8)',
                                    backdropFilter: 'blur(5px)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: isFirstItem ? 'not-allowed' : 'pointer',
                                    flexShrink: 0,
                                }}
                                title={t('common.previous')}
                            >
                                <ArrowRightIcon
                                    width={14}
                                    height={14}
                                    style={{
                                        transform: 'rotate(180deg)',
                                    }}
                                />
                            </button>

                            {/* Counter text */}
                            <span className="font-urbanist font-[700] text-white text-sm flex-1 text-center">
                                {currentIndex + 1}/{list.length}
                            </span>

                            {/* Next button */}
                            <button
                                onClick={handleNext}
                                disabled={isLastItem}
                                className="transition-all  hover:bg-opacity-80 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '50%',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    background: 'rgba(34, 35, 42, 0.8)',
                                    backdropFilter: 'blur(5px)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: isLastItem ? 'not-allowed' : 'pointer',
                                    flexShrink: 0,
                                }}
                                title={t('common.next')}
                            >
                                <ArrowRightIcon width={14} height={14} />
                            </button>
                        </div>
                    )}
                </div>
            </div>,
            document.body
        );
    }
);

MediaViewerComponent.displayName = 'MediaViewer';

export const MediaViewer = MediaViewerComponent;