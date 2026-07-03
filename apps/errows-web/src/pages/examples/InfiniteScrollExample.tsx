import { useState } from 'react';
import { InfiniteScroll } from '../../components/infinite-scroll';

interface Item {
  id: number;
  title: string;
  content: string;
}

// 模拟生成数据
const generateItems = (start: number, count: number): Item[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: start + i,
    title: `Item ${start + i}`,
    content: `This is the content for item ${start + i}. Lorem ipsum dolor sit amet.`,
  }));
};

// 模拟异步加载
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * 示例 1: 向下滚动加载更多
 */
export function DownScrollExample() {
  const [items, setItems] = useState<Item[]>(generateItems(1, 10));
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadMore = async () => {
    if (loading || !hasMore) return;
    
    setLoading(true);
    await delay(1000); // 模拟网络请求
    
    const newItems = generateItems(items.length + 1, 10);
    setItems([...items, ...newItems]);
    
    // 模拟只能加载到 50 条
    if (items.length + newItems.length >= 50) {
      setHasMore(false);
    }
    
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">示例 1: 向下滚动加载</h2>
      <p className="text-gray-600 mb-6">滚动到底部自动加载更多数据</p>
      
      <div className="border rounded-lg">
        <InfiniteScroll
          direction="down"
          onLoadMore={loadMore}
          loading={loading}
          hasMore={hasMore}
        >
          <div className="divide-y">
            {items.map((item) => (
              <div key={item.id} className="p-4 hover:bg-gray-50 transition">
                <h3 className="font-semibold text-lg">{item.title}</h3>
                <p className="text-gray-600 mt-1">{item.content}</p>
              </div>
            ))}
          </div>
        </InfiniteScroll>
      </div>
    </div>
  );
}

/**
 * 示例 2: 向上滚动加载更多（历史消息场景）
 */
export function UpScrollExample() {
  const [items, setItems] = useState<Item[]>(generateItems(41, 10));
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadPrevious = async () => {
    if (loading || !hasMore) return;
    
    setLoading(true);
    await delay(1000);
    
    const firstId = items[0].id;
    const newItems = generateItems(Math.max(1, firstId - 10), Math.min(10, firstId - 1));
    setItems([...newItems, ...items]);
    
    // 模拟加载到第 1 条就没有了
    if (newItems.length === 0 || newItems[0].id <= 1) {
      setHasMore(false);
    }
    
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">示例 2: 向上滚动加载</h2>
      <p className="text-gray-600 mb-6">滚动到顶部加载历史数据（类似聊天记录）</p>
      
      <div className="border rounded-lg max-h-[600px] overflow-y-auto">
        <InfiniteScroll
          direction="up"
          onLoadPrevious={loadPrevious}
          loadingPrevious={loading}
          hasPrevious={hasMore}
        >
          <div className="divide-y">
            {items.map((item) => (
              <div key={item.id} className="p-4 hover:bg-gray-50 transition">
                <h3 className="font-semibold text-lg">{item.title}</h3>
                <p className="text-gray-600 mt-1">{item.content}</p>
              </div>
            ))}
          </div>
        </InfiniteScroll>
      </div>
    </div>
  );
}

/**
 * 示例 3: 双向滚动加载
 */
export function BothDirectionExample() {
  const [items, setItems] = useState<Item[]>(generateItems(21, 10));
  const [loadingNext, setLoadingNext] = useState(false);
  const [loadingPrev, setLoadingPrev] = useState(false);
  const [hasNext, setHasNext] = useState(true);
  const [hasPrev, setHasPrev] = useState(true);

  const loadMore = async () => {
    if (loadingNext || !hasNext) return;
    
    setLoadingNext(true);
    await delay(1000);
    
    const lastId = items[items.length - 1].id;
    const newItems = generateItems(lastId + 1, 10);
    setItems([...items, ...newItems]);
    
    if (lastId + 10 >= 50) {
      setHasNext(false);
    }
    
    setLoadingNext(false);
  };

  const loadPrevious = async () => {
    if (loadingPrev || !hasPrev) return;
    
    setLoadingPrev(true);
    await delay(1000);
    
    const firstId = items[0].id;
    const newItems = generateItems(Math.max(1, firstId - 10), Math.min(10, firstId - 1));
    setItems([...newItems, ...items]);
    
    if (newItems.length === 0 || newItems[0].id <= 1) {
      setHasPrev(false);
    }
    
    setLoadingPrev(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">示例 3: 双向滚动加载</h2>
      <p className="text-gray-600 mb-6">顶部和底部都可以加载数据</p>
      
      <div className="border rounded-lg max-h-[600px] overflow-y-auto">
        <InfiniteScroll
          direction="both"
          onLoadMore={loadMore}
          loading={loadingNext}
          hasMore={hasNext}
          onLoadPrevious={loadPrevious}
          loadingPrevious={loadingPrev}
          hasPrevious={hasPrev}
        >
          <div className="divide-y">
            {items.map((item) => (
              <div key={item.id} className="p-4 hover:bg-gray-50 transition">
                <h3 className="font-semibold text-lg">{item.title}</h3>
                <p className="text-gray-600 mt-1">{item.content}</p>
              </div>
            ))}
          </div>
        </InfiniteScroll>
      </div>
    </div>
  );
}

/**
 * 主示例页面
 */
export default function InfiniteScrollExample() {
  const [activeExample, setActiveExample] = useState<'down' | 'up' | 'both'>('down');

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-6">
        <h1 className="text-4xl font-bold text-center mb-2">无限滚动组件示例</h1>
        <p className="text-center text-gray-600 mb-8">
          基于 Intersection Observer API 实现的高性能滚动加载组件
        </p>
        
        {/* 示例切换按钮 */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => setActiveExample('down')}
            className={`px-6 py-2 rounded-lg font-medium transition ${
              activeExample === 'down'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            向下滚动
          </button>
          <button
            onClick={() => setActiveExample('up')}
            className={`px-6 py-2 rounded-lg font-medium transition ${
              activeExample === 'up'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            向上滚动
          </button>
          <button
            onClick={() => setActiveExample('both')}
            className={`px-6 py-2 rounded-lg font-medium transition ${
              activeExample === 'both'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            双向滚动
          </button>
        </div>

        {/* 示例内容 */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          {activeExample === 'down' && <DownScrollExample />}
          {activeExample === 'up' && <UpScrollExample />}
          {activeExample === 'both' && <BothDirectionExample />}
        </div>

        {/* 使用说明 */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">使用说明</h2>
          <div className="space-y-4 text-gray-700">
            <div>
              <h3 className="font-semibold text-lg mb-2">基本用法</h3>
              <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
{`import { InfiniteScroll } from '@/components/infinite-scroll';

<InfiniteScroll
  direction="down"
  onLoadMore={loadMore}
  loading={loading}
  hasMore={hasMore}
>
  {items.map(item => <ItemComponent key={item.id} item={item} />)}
</InfiniteScroll>`}
              </pre>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-2">主要特性</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>基于 Intersection Observer API，性能优异</li>
                <li>支持向下滚动加载（常见列表场景）</li>
                <li>支持向上滚动加载（聊天记录、时间线场景）</li>
                <li>支持双向滚动加载</li>
                <li>自动处理加载状态和提示</li>
                <li>可自定义触发阈值、加载文案等</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">Props 说明</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-2 text-left">属性</th>
                      <th className="p-2 text-left">类型</th>
                      <th className="p-2 text-left">说明</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <tr>
                      <td className="p-2 font-mono">direction</td>
                      <td className="p-2 font-mono text-xs">'down' | 'up' | 'both'</td>
                      <td className="p-2">滚动方向</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-mono">onLoadMore</td>
                      <td className="p-2 font-mono text-xs">() =&gt; void</td>
                      <td className="p-2">向下加载更多的回调</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-mono">loading</td>
                      <td className="p-2 font-mono text-xs">boolean</td>
                      <td className="p-2">是否正在加载</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-mono">hasMore</td>
                      <td className="p-2 font-mono text-xs">boolean</td>
                      <td className="p-2">是否还有更多数据</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-mono">threshold</td>
                      <td className="p-2 font-mono text-xs">number</td>
                      <td className="p-2">触发加载的阈值 (0-1)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
