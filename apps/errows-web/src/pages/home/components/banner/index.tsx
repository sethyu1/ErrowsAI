import React, { useState, useEffect, useCallback } from "react";

interface BannerItem {
  url: string;
  title?: string;
  link?: string;
}

interface BannerProps {
  className?: string;
  style?: React.CSSProperties;
  images: BannerItem[];
  autoPlay?: boolean;
  interval?: number;
}

export const Banner = (props: BannerProps) => {
  const { className, style, images, autoPlay = true, interval = 3000 } = props;
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  const goToNext = useCallback(() => {
    setCurrentIndex((prevIndex) =>
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  }, [images.length]);

  useEffect(() => {
    if (!autoPlay || images.length <= 1) return;

    const timer = setInterval(goToNext, interval);

    return () => clearInterval(timer);
  }, [autoPlay, interval, goToNext, images.length]);

  if (!images || images.length === 0) {
    return null;
  }

  return (
    <div className={`w-full ${className}`} style={style}>
      <div className="relative w-full h-[180px] md:aspect-[6/1] md:h-auto overflow-hidden rounded-[12px]">
        <div
          className="flex h-full transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {images.map((item, index) => (
            <div key={index} className="flex-shrink-0 w-full h-full relative flex items-center justify-center">
              <img
                src={item.url}
                alt={item.title || `Banner ${index + 1}`}
                className="w-full h-full max-sm:object-cover md:object-contain"
              />

              {item.title && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <h2
                    className="text-white text-4xl md:text-5xl font-bold tracking-wider"
                    style={{
                      textShadow: "0 2px 10px rgba(0,0,0,0.5)",
                      fontFamily: "Urbanist, sans-serif",
                    }}
                  >
                    {item.title}
                  </h2>
                </div>
              )}
            </div>
          ))}
        </div>
        {images.length > 1 && (
          <div className="flex justify-center gap-2 mt-4 absolute bottom-3 left-0 right-0">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className="rounded-sm transition-all duration-300"
                style={{
                  width: "14px",
                  height: "2px",
                  backgroundColor:
                    index === currentIndex ? "#FFFFFF" : "#FFFFFF66",
                }}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
