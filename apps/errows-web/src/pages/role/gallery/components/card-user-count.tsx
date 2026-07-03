import { NRoleAttentionIcon } from '@errows/icons';

export interface RoleCardUserCountProps {
  /** 用户数 */
  users?: number;
  /** 格式化数字函数 */
  formatNumber: (num: number) => string;
}

/**
 * 角色卡片左上角用户数组件
 */
export function RoleCardUserCount({ users, formatNumber }: RoleCardUserCountProps) {
  if (users === undefined) {
    return null;
  }

  return (
    <div
      className="absolute top-2 left-2 px-2 h-5 flex items-center gap-1"
      style={{
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '7.65px',
      }}
    >
      <NRoleAttentionIcon className="w-3 h-3 text-white" />
      <span className="text-white text-xs font-urbanist font-medium">
        {formatNumber(users)}
      </span>
    </div>
  );
}

