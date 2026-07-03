import { NRoleCommentIcon, HeartFilledIcon, HeartIcon } from '@errows/icons';

export interface RoleCardFooterProps {
  /** 表情图标 */
  emoji?: string;
  /** 评论数 */
  comments: number;
  /** 点赞数 */
  likes: number;
  /** 格式化数字函数 */
  formatNumber: (num: number) => string;
}

/**
 * 角色卡片底部信息栏组件
 */
export function RoleCardFooter({
  emoji,
  comments,
  likes,
  formatNumber,
}: RoleCardFooterProps) {
  return (
    <div
      className="absolute bottom-0 left-0 right-0 px-5 py-4 backdrop-blur-[24px] rounded-[14px] border-[0.36px]"
      style={{
        background: 'rgba(71, 65, 65, 0.3)',
        borderColor: 'rgba(255, 255, 255, 0.3)',
      }}
    >
      {/* 底部互动栏 */}
      <div className="flex items-center justify-between">
        {/* 左侧：表情和评论 */}
        <div className="flex items-center justify-between w-full">
          {emoji && <span className="text-lg w-5 ">{emoji}</span>}
          <div className="flex items-center">
            <NRoleCommentIcon className="text-base text-white w-4 h-4" />
            <div
              className="text-white-60 ml-2 font-urbanist font-[700] text-sm/4"
              style={{
                transform: 'translateY(1px)',
              }}
            >
              {formatNumber(comments)}
            </div>
          </div>
          {/* 右侧：点赞 */}
          <div className="flex items-center gap-1.5">
            {likes > 0 ? (
              <HeartFilledIcon className="text-base text-white w-4 h-4" />
            ) : (
              <HeartIcon className="text-base text-white w-4 h-4" />
            )}
            <div
              className="text-white-60 ml-2 font-urbanist font-[700] text-sm/4"
              style={{
                transform: 'translateY(1px)',
              }}
            >
              {formatNumber(likes)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

