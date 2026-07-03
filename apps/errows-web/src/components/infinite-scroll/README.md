# InfiniteScroll 无限滚动组件

基于 Intersection Observer API 实现的高性能无限滚动加载组件，支持上拉、下拉和双向滚动加载。

## 特性

- ✅ 基于 Intersection Observer API，性能优异
- ✅ 支持向下滚动加载（常见列表场景）
- ✅ 支持向上滚动加载（聊天记录、时间线场景）
- ✅ 支持双向滚动加载
- ✅ 自动处理加载状态和提示
- ✅ 可自定义触发阈值、加载文案等
- ✅ TypeScript 支持

## 安装

组件已内置在项目中，直接导入使用即可：

```tsx
import { InfiniteScroll } from '@/components/infinite-scroll';
```

## 基本用法

### 向下滚动加载（最常见）

```tsx
import { useState } from 'react';
import { InfiniteScroll } from '@/components/infinite-scroll';

function MyList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadMore = async () => {
    setLoading(true);
    try {
      const newItems = await fetchMoreItems();
      setItems([...items, ...newItems]);
      setHasMore(newItems.length > 0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <InfiniteScroll
      direction="down"
      onLoadMore={loadMore}
      loading={loading}
      hasMore={hasMore}
    >
      {items.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
    </InfiniteScroll>
  );
}
```

### 向上滚动加载（聊天历史）

```tsx
function ChatHistory() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadPrevious = async () => {
    setLoading(true);
    try {
      const oldMessages = await fetchOlderMessages();
      setMessages([...oldMessages, ...messages]);
      setHasMore(oldMessages.length > 0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen overflow-auto">
      <InfiniteScroll
        direction="up"
        onLoadPrevious={loadPrevious}
        loadingPrevious={loading}
        hasPrevious={hasMore}
      >
        {messages.map(msg => (
          <div key={msg.id}>{msg.content}</div>
        ))}
      </InfiniteScroll>
    </div>
  );
}
```

### 双向滚动加载

```tsx
function Timeline() {
  const [items, setItems] = useState([]);
  const [loadingNext, setLoadingNext] = useState(false);
  const [loadingPrev, setLoadingPrev] = useState(false);
  const [hasNext, setHasNext] = useState(true);
  const [hasPrev, setHasPrev] = useState(true);

  const loadMore = async () => {
    setLoadingNext(true);
    // 加载更新的数据
    const newer = await fetchNewerItems();
    setItems([...items, ...newer]);
    setHasNext(newer.length > 0);
    setLoadingNext(false);
  };

  const loadPrevious = async () => {
    setLoadingPrev(true);
    // 加载更旧的数据
    const older = await fetchOlderItems();
    setItems([...older, ...items]);
    setHasPrev(older.length > 0);
    setLoadingPrev(false);
  };

  return (
    <InfiniteScroll
      direction="both"
      onLoadMore={loadMore}
      loading={loadingNext}
      hasMore={hasNext}
      onLoadPrevious={loadPrevious}
      loadingPrevious={loadingPrev}
      hasPrevious={hasPrev}
    >
      {items.map(item => (
        <div key={item.id}>{item.content}</div>
      ))}
    </InfiniteScroll>
  );
}
```

## API

### InfiniteScroll Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `children` | `ReactNode` | - | 列表内容 |
| `direction` | `'down' \| 'up' \| 'both'` | `'down'` | 滚动方向 |
| `onLoadMore` | `() => void \| Promise<void>` | - | 向下加载更多的回调 |
| `loading` | `boolean` | `false` | 底部是否正在加载 |
| `hasMore` | `boolean` | `true` | 底部是否还有更多数据 |
| `onLoadPrevious` | `() => void \| Promise<void>` | - | 向上加载更多的回调 |
| `loadingPrevious` | `boolean` | `false` | 顶部是否正在加载 |
| `hasPrevious` | `boolean` | `true` | 顶部是否还有更多数据 |
| `threshold` | `number` | `0.1` | 触发加载的阈值 (0-1) |
| `loadingText` | `string` | `'加载中...'` | 底部加载中文案 |
| `loadingPreviousText` | `string` | `'加载中...'` | 顶部加载中文案 |
| `noMoreText` | `string` | `'没有更多了'` | 底部无更多数据文案 |
| `noPreviousText` | `string` | `'没有更多了'` | 顶部无更多数据文案 |
| `className` | `string` | `''` | 内容容器的样式类 |
| `containerClassName` | `string` | `''` | 外层容器的样式类 |

### LoadingTrigger Props

如果需要单独使用触发器组件：

```tsx
import { LoadingTrigger } from '@/components/infinite-scroll';

<LoadingTrigger
  onLoadMore={loadMore}
  loading={loading}
  hasMore={hasMore}
  threshold={0.1}
/>
```

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `onLoadMore` | `() => void \| Promise<void>` | - | 加载更多的回调 |
| `loading` | `boolean` | `false` | 是否正在加载 |
| `hasMore` | `boolean` | `true` | 是否还有更多数据 |
| `threshold` | `number` | `0.1` | 触发加载的阈值 (0-1) |
| `loadingText` | `string` | `'加载中...'` | 加载中文案 |
| `noMoreText` | `string` | `'没有更多了'` | 无更多数据文案 |
| `className` | `string` | `''` | 样式类 |

## 工作原理

组件使用 Intersection Observer API 监听触发器元素（`LoadingTrigger`）是否进入视口：

1. 当触发器元素进入视口时，自动调用 `onLoadMore` 或 `onLoadPrevious`
2. `loading` 状态为 `true` 时，Observer 会自动断开，避免重复触发
3. `hasMore` 为 `false` 时，Observer 也会断开
4. 加载完成后，Observer 会重新连接，等待下次触发

## 注意事项

1. **容器高度**：如果使用向上滚动，确保容器有固定高度和 `overflow-y: auto`
2. **防抖处理**：组件内部已处理防止重复加载，但建议在回调函数中也添加加载状态检查
3. **Key 值**：列表项必须有唯一的 `key` 属性
4. **性能优化**：对于大列表，建议使用虚拟滚动（virtual scroll）结合无限滚动

## 示例

完整的使用示例请查看：`src/pages/examples/InfiniteScrollExample.tsx`

运行项目后访问该页面可以看到三种场景的交互演示：
- 向下滚动加载
- 向上滚动加载
- 双向滚动加载

## License

MIT
