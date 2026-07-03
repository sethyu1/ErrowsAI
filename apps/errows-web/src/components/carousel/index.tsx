import { useState, useEffect } from 'react'
import girl from "../../assets/girl.png";
import gir2 from "../../assets/girl2.png";
import gir3 from "../../assets/girl3.png";
import gir4 from "../../assets/girl4.png";

interface CarouselProps {
    images?: string[]
    onChange?: (index: number, image: string) => void
}

export const Carousel = ({ images = [], onChange }: CarouselProps) => {
    const [rotation, setRotation] = useState(0)
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
    const [radius, setRadius] = useState(700)

    // 默认图片数据（如果没有传入图片）
    const defaultImages = [
        girl,
        gir2,
        gir3,
        gir4,
        'https://picsum.photos/400/600?random=5',
        'https://picsum.photos/400/600?random=6',
        'https://picsum.photos/400/600?random=7',
        'https://picsum.photos/400/600?random=8',
        'https://picsum.photos/400/600?random=9',
        'https://picsum.photos/400/600?random=10',
        'https://picsum.photos/400/600?random=1',
        'https://picsum.photos/400/600?random=2',
        'https://picsum.photos/400/600?random=3',
        'https://picsum.photos/400/600?random=4',
        'https://picsum.photos/400/600?random=5',
        'https://picsum.photos/400/600?random=6',
        'https://picsum.photos/400/600?random=7',
        'https://picsum.photos/400/600?random=8',
        'https://picsum.photos/400/600?random=9',
        'https://picsum.photos/400/600?random=10',
        'https://picsum.photos/400/600?random=1',
        'https://picsum.photos/400/600?random=2',
        'https://picsum.photos/400/600?random=3',
        'https://picsum.photos/400/600?random=4',
        'https://picsum.photos/400/600?random=5',
        'https://picsum.photos/400/600?random=6',
        'https://picsum.photos/400/600?random=7',
        'https://picsum.photos/400/600?random=8',
        'https://picsum.photos/400/600?random=9',
        'https://picsum.photos/400/600?random=10',

    ]

    const displayImages = images.length > 0 ? images : defaultImages
    const imageCount = 30
    const angleStep = 360 / imageCount // 每张图片之间的角度

    // 响应式调整半径 (sm 断点为 640px)
    useEffect(() => {
        const updateRadius = () => {
            if (window.innerWidth >= 640) {
                setRadius(1700) // 桌面端 (≥640px)
            } else {
                setRadius(700) // 移动端 (<640px)
            }
        }

        updateRadius()
        window.addEventListener('resize', updateRadius)
        return () => window.removeEventListener('resize', updateRadius)
    }, [])

    // 计算当前中心位置的图片索引
    const getCurrentIndex = () => {
        // rotation 是负数表示向右旋转（下一张），正数表示向左旋转（上一张）
        // 所以需要用 -rotation 来计算索引
        const normalizedRotation = ((-rotation % 360) + 360) % 360
        const index = Math.round(normalizedRotation / angleStep) % imageCount
        return index
    }

    // 初始化时调用一次 onChange
    useEffect(() => {
        if (onChange) {
            const currentIndex = getCurrentIndex()
            onChange(currentIndex, displayImages[currentIndex])
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // rotation 变化时调用 onChange
    useEffect(() => {
        if (onChange) {
            const currentIndex = getCurrentIndex()
            onChange(currentIndex, displayImages[currentIndex])
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rotation])

    const handlePrev = () => {
        setRotation((prev) => prev + angleStep)
    }

    const handleNext = () => {
        setRotation((prev) => prev - angleStep)
    }

    // 计算每张图片在圆周上的位置和样式（2D布局）
    const getCardStyle = (index: number) => {
        const angleDeg = index * angleStep + rotation // 角度（度）
        const angle = angleDeg * (Math.PI / 180) // 转换为弧度


        // 计算图片在2D圆周上的 x, y 坐标
        const x = Math.sin(angle) * radius
        const y = -Math.cos(angle) * radius // 负号让第一张图在顶部

        // 计算图片应该旋转的角度（指向圆心）
        // 图片默认是竖直向上的，所以需要旋转 angleDeg 度让它指向圆心
        const rotate = angleDeg

        // 判断图片是否在前方（底部中心位置，y值最大）
        const normalizedY = y / radius
        const isCentered = angle === 0
        const isHovered = hoveredIndex === index

        // 图片大小保持一致，hover时放大
        const scale = isHovered ? 1.15 : 1.0

        // 前方的图片更亮，后方的图片更暗
        const brightness = isCentered ? 1.1 : 0.75

        return {
            transform: `translate(${x}px, ${y}px) rotate(${rotate}deg) scale(${scale})`,
            filter: `brightness(${brightness})`,
            transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
            zIndex: isCentered ? 100 : 50,
        }
    }
    return (
        <div className="relative w-full max-sm:h-[240px] h-[440px] flex items-center justify-center overflow-hidden from-gray-900 via-gray-800 to-gray-900">
            {/* 圆形轮播容器（2D） */}
            <div className={`relative w-full h-full flex items-center justify-center transform translate-y-[${radius / 2}px]`} style={{ transform: `translateY(${radius}px)` }}>
                {displayImages.map((image, index) => (
                    <div
                        key={index}
                        className="absolute max-sm:w-[133px] w-[295px] max-sm:h-[177px] h-[390px] rounded-2xl overflow-hidden shadow-2xl cursor-pointer"
                        style={getCardStyle(index)}
                        onMouseEnter={() => setHoveredIndex(index)}
                        onMouseLeave={() => setHoveredIndex(null)}
                    >
                        <img
                            src={image}
                            alt={`Slide ${index + 1}`}
                            className="w-full h-full object-cover"
                            draggable={false}
                        />
                        {/* 渐变遮罩 */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none"></div>
                    </div>
                ))}

            </div>
            <div className="absolute bottom-0 left-0 right-0 z-[201] max-sm:h-[60px] h-[92px] flex justify-center" >
                <div className="w-[300vw] h-[150vw] bg-[#0E0F17] rounded-full" style={{
                    boxShadow: 'rgb(65 46 65) 0px -3px 20px 7px'
                }}>
                </div>
                <div className='absolute flex items-center justify-center max-sm:gap-3 gap-[23px] max-sm:pt-3 pt-[18px]'>
                    <div className='max-sm:w-10 max-sm:h-10 w-[52px] h-[52px] bg-[#22232A] flex items-center justify-center rounded-full transition-colors cursor-pointer hover:bg-[#2C2C38]'
                        style={{
                            border: '1px solid #2C2C38'
                        }}
                        onClick={handlePrev}
                    >
                        <i className="iconfont icon-zhixiangzuo text-white max-sm:text-sm text-base"></i>
                    </div>
                    <div className='max-sm:w-10 max-sm:h-10 w-[52px] h-[52px] bg-[#22232A] flex items-center justify-center rounded-full transition-colors cursor-pointer hover:bg-[#2C2C38]'
                        style={{
                            border: '1px solid #2C2C38'
                        }}
                        onClick={handleNext}
                    >
                        <i className="iconfont icon-zhixiangyou text-white max-sm:text-sm text-base"></i>
                    </div>
                </div>

            </div>
            <div className="w-full max-sm:h-8 h-[48px] absolute bottom-0 left-0 right-0 z-[200]" style={{ background: 'linear-gradient(180deg, rgba(14, 15, 23, 0) 0%, #0E0F17 100%)' }}></div>
        </div>
    )
}
