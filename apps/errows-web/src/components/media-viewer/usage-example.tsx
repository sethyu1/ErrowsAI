import React, { useRef } from 'react';
import { MediaViewer } from './index';

/**
 * MediaViewer 使用示例
 * 
 * 组件支持以下功能：
 * 1. 传入图片/视频列表进行浏览
 * 2. 点击图片进行放大查看细节
 * 3. 使用左右按钮或键盘方向键切换
 * 4. 显示当前图片位置 n/m
 * 5. 移动端自适应（宽度 100vw）
 * 6. 支持 ESC 快捷键关闭
 */

export const MediaViewerExample = () => {
  const mediaViewerRef = useRef<{ show: (index?: number) => void; close: () => void } | null>(null);

  const mediaList = [
    {
      url: 'https://images.unsplash.com/photo-1494783367193-149034c05e41?w=800',
      type: 'image' as const,
    },
    {
      url: 'https://images.unsplash.com/photo-1533634242443-7c6ba6da4d8b?w=800',
      type: 'image' as const,
    },
    {
      url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
      type: 'image' as const,
    },
  ];

  const handleOpenViewer = (index = 0) => {
    mediaViewerRef.current?.show(index);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">多媒体查看器示例</h1>

      <div className="grid grid-cols-3 gap-4">
        {mediaList.map((item, index) => (
          <div
            key={index}
            onClick={() => handleOpenViewer(index)}
            className="cursor-pointer rounded-lg overflow-hidden bg-gray-200 hover:opacity-80 transition-opacity"
          >
            {item.type === 'image' ? (
              <img
                src={item.url}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-48 object-cover"
              />
            ) : (
              <video
                src={item.url}
                className="w-full h-48 object-cover"
              />
            )}
          </div>
        ))}
      </div>

      <MediaViewer ref={mediaViewerRef} list={mediaList} />
    </div>
  );
};

