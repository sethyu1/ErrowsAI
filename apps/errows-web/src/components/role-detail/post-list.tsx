import React from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@errows/design/lib/utils';
import { fetchPostsApi } from '@/apis/post';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { ArrowRightIcon } from '@errows/icons';

dayjs.extend(relativeTime);

export interface PostItem {
  id: string;
  avatar: string;
  content: string;
  timestamp: string;
}

export interface PostListProps {
  roleId: string;
  /** 查看更多帖子回调 */
  onMorePosts?: () => void;
  /** 是否为移动端布局 */
  isMobile?: boolean;
}

/**
 * 格式化时间为相对时间（如 "5 minutes ago"）
 */
const formatRelativeTime = (dateString: string): string => {
  try {
    return dayjs(dateString).fromNow();
  } catch {
    return dateString;
  }
};

/**
 * 帖子列表组件
 * 展示角色最近的帖子，支持查看更多
 */
export const PostList: React.FC<PostListProps> = ({
  roleId,
  onMorePosts,
  isMobile = false,
}) => {
  const { t } = useTranslation();
  const [data, setData] = React.useState<{ count: number; data: API.POST.POST[] } | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  // 使用 useEffect 监听 roleId 变化，获取帖子列表
  React.useEffect(() => {
    if (!roleId) {
      setData(null);
      return;
    }

    const fetchPosts = async () => {
      setIsLoading(true);
      try {
        const result = await fetchPostsApi({ cid: roleId, size: 50 });
        setData(result);
      } catch {
        setData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, [roleId]);

  const postItems: PostItem[] = React.useMemo(() => {
    return (data?.data || []).map((post) => ({
      id: post.id,
      avatar: post.images?.[0]?.url || post.character?.avatar_url || '',
      content: post.content ?? '',
      timestamp: formatRelativeTime(post.created_at),
    }));
  }, [data]);

  return (
    <div className={cn('flex flex-col gap-2 rounded-lg relative', isMobile ? 'w-full px-4' : '')} style={{
      border: '1px solid #2C2C38',
      padding: 12,
      height: 224,
    }}>
      {/* 帖子列表 */}
      <div className="space-y-2 overflow-y-auto custom-scrollbar">
        {isLoading ? (
          <div className="text-gray-500 text-sm font-urbanist text-center py-22">
            {t('common.loading')}
          </div>
        ) : postItems.length === 0 ? (
          <div className="text-gray-500 text-sm font-urbanist text-center py-22">
            {t('role.detail.noPosts')}
          </div>
        ) : (
          postItems.map((post) => (
            <div
              key={post.id}
              className={cn(
                'flex items-start gap-3 p-2 rounded-lg transition-colors cursor-pointer',
                'hover:bg-gray-900/30'
              )}
            >
              {/* 头像 */}
              <img
                src={post.avatar}
                alt="Post"
                className="w-10 h-10 rounded-lg object-cover shrink-0"
              />

              {/* 内容 */}
              <div className="flex-1 min-w-0">
                <p className="text-gray-300 text-sm font-urbanist truncate">
                  {post.content}
                </p>
                <p className="text-gray-500 text-xs font-urbanist mt-0.5">
                  {post.timestamp}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* More Posts 按钮 */}
      {onMorePosts && postItems?.length > 3 && (
        <div className='flex flex-row-reverse absolute bottom-3 right-3'>
          <div
            onClick={onMorePosts}
            className={cn(
              'w-22',
              'flex justify-between items-center ',
              'text-sm font-urbanist font-medium transition-colors cursor-pointer',
              'text-white',
              isMobile ? 'text-left' : 'text-right'
            )}
          >
            {t('role.detail.morePosts')}
            <ArrowRightIcon className="w-4 h-4" />
          </div >
        </div>
      )}
    </div>
  );
};

export default PostList;

