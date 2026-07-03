import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@errows/design/lib/utils';
import { Button } from '@errows/design';
import { NStarPencilIcon, NCharacterIcon } from '@errows/icons';

const RatioList = [
  {
    label: '16:9',
    value: [16, 9],
  },
  {
    label: '3:4',
    value: [3, 4],
  },
  {
    label: '1:1',
    value: [1, 1],
  },
]

export interface RoleImageCardProps {
  /** 角色id */
  roleId?: string;
  roleInfo?: API.Character.CHARACTER;
  /** 自定义类名 */
  className?: string;
  isMobile?: boolean;
  /** 比例 */
  ratio?: typeof RatioList[number]['label'];
  title?: string
  advancedMode?: boolean;
  onEdit: () => void;
}

const borderRadius = 16;

export function LeftCharacter({
  roleId = '',
  roleInfo,
  className,
  isMobile = false,
  ratio = RatioList[0].label,
  title,
  advancedMode = false,
  onEdit,
}: RoleImageCardProps) {
  const { t } = useTranslation();
  const defaultTitle = title || t('common.role');

  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [activeRatio, setActiveRatio] = useState(ratio);

  return (
    <div className='font-urbanist text-white' style={{ width: isMobile ? '100%' : 272 }}>
      <div className='font-[700] mb-4.5'>{defaultTitle}</div>
      <div className='flex flex-col items-center'>
        <div
          className={cn(
            'relative cursor-pointer transition-all duration-200', 'border border-[#2C2C38]', 'hover:scale-[1.01] active:scale-[0.99] hover:border-[#3A3A48]',
            className
          )}
          style={{
            width: 269,
            height: 401,
            borderRadius: borderRadius,
          }}
          role="button"
          tabIndex={0}
        >
          <div className="absolute top-0 left-0 w-full h-full z-1  bg-black/20" />
          {
            !roleId && (
              <div className='absolute top-0 left-0 w-full h-full flex flex-col items-center text-wrap z-1'
                 style={{
                  paddingTop: 128
                 }}
              >
                <NCharacterIcon className='text-[#A4ACB9] w-7 height-7' />
                <div
                className='font-urbanist font-[700] text-base text-white text-center' 
                style={{
                  marginTop: 46,
                  marginBottom: 46,
                  width: 136,
                }}>
                  {t('generate.pleaseChooseCharacterImage')}
                </div>
                <Button
                  appearance="gradientFill"
                  className="flex items-center justify-center  mx-auto bottom-2 px-6 py-2 text-sm font-[700] text-[#090A0A] font-urbanist"
                  style={{
                    background: 'linear-gradient(215.79deg, #D9D9D9 25.96%, #D6B8D4 91.04%)',
                    color: '#090A0A',
                    width: 130,
                  }}
                  onClick={onEdit}
                >
                  {t('generate.choose')}
                </Button>
              </div>
            )
          }
          {/* 图片容器 */}
          <div
            className={cn(
              'relative w-full h-full overflow-hidden bg-gray-800',
            )}
          >
            {/* 加载占位符 */}
            {!imageLoaded && !imageError && (
              <div className="absolute inset-0 bg-gray-700 animate-pulse" />
            )}

            {/* 错误占位符 */}
            {imageError && (
              <div className="absolute inset-0 bg-gray-700 flex items-center justify-center">
                <span className="text-gray-500 text-sm">{t('generate.imageFailed')}</span>
              </div>
            )}

            {/* 图片 */}
            { roleId &&<img
              src={roleInfo?.avatar_url}
              alt={roleInfo?.nickname}
              className={cn(
                'w-full h-full object-cover transition-opacity duration-300',
                imageLoaded ? 'opacity-100' : 'opacity-0'
              )}
              style={{
                borderRadius: borderRadius,
              }}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              loading="lazy"
            />}
            {/* 底部标签覆盖层 */}
            {roleId && <div
              className={cn(
                'absolute bottom-0 left-0 right-0 flex items-center justify-center backdrop-blur-[15px]',
                'rounded-lg pt-2 pb-2 px-2 min-h-9',
              )}
              style={{
                border: '0.22px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              {/* 标签文字 - 绝对居中 */}
              <span
                className={cn(
                  'text-white line-clamp-1 text-center',
                  'font-urbanist font-normal',
                  'text-xs leading-4'
                )}
                style={{
                  maxWidth: 86
                }}
              >
                {roleInfo?.nickname}
              </span>
            </div>
}
          </div>
        </div>

        {roleId && <Button appearance='gradientOutline' className='font-[700] mt-10.5 cursor-pointer' style={{ borderRadius: 100 }} onClick={onEdit}>
          <span>{t('common.edit')}</span>
          <NStarPencilIcon className='ml-1.5 w-5 h--5' />
        </Button>
        }

        {/** todo  hide  advancedMode count is 0 */}
        {advancedMode && (
          <div className='flex flex-col items-center justify-between mt-4.5'>
            <div className='font-normal font-regular mb-7  text-xs text-[#A4ACB9]'>{t('generate.setProportion')}</div>
            <div className='flex items-center justify-between gap-3'>
              {RatioList.map((item) => {
                const isActive = activeRatio === item.label;
                return (
                  <div
                    className={'cursor-pointer flex items-center justify-center font-[700] rounded-[100px] hover:scale-[1.01] active:scale-[0.99] transition-all duration-200'}
                    key={item.label}
                    style={{
                      width: 80,
                      height: 40,
                      fontSize: 14,
                      lineHeight: 22,
                      border: '1px solid rgba(44, 44, 56, 1)',
                      ...isActive ? {
                        color: 'rgba(9, 10, 10, 1)',
                        backgroundColor: '#fff',
                      } : {
                        color: '#fff',
                        borderColor: 'rgba(44, 44, 56, 1)',
                      },
                    }}
                    onClick={() => setActiveRatio(item.label)}
                  >
                    {item.label}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

