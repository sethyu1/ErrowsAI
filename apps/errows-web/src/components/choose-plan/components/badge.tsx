import badge from '@/assets/images/background/badge.svg';

export function Badge() {
  return (
    <div
      className="relative w-10 h-5 text-white text-xs font-bold"
    >
      <img src={badge} className="absolute left-0 top-0 w-full h-full z-0" />
      <div className="absolute flex justify-center left-0 top-0 w-full h-full">
        -20%
      </div>
    </div>
  )
}
