import React, { useCallback, useEffect, useState } from 'react';
import { Card, Button, Tabs, Empty, Spin } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { getLLMDebugPayloadsApi, type LLMDebugPayloads } from '@/apis/llm-debug';

export default function LLMDebugPage() {
  const [data, setData] = useState<LLMDebugPayloads | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchPayloads = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getLLMDebugPayloadsApi();
      setData(res ?? { chat: [], voice: [], image: [], video: [] });
    } catch {
      setData({ chat: [], voice: [], image: [], video: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayloads();
  }, [fetchPayloads]);

  const renderEntries = (entries: LLMDebugPayloads['chat'] | LLMDebugPayloads['voice'] | LLMDebugPayloads['image'] | LLMDebugPayloads['video']) => {
    if (!entries?.length) return <Empty description="暂无请求" />;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {entries.map((entry, i) => {
          const title = `${entry.type} — ${entry.at}`;
          // Display only the request body (Chat: body sent to LLM; Voice: body sent to Agora API)
          return (
            <Card
              key={`${entry.at}-${i}`}
              size="small"
              title={<span>{title}</span>}
              extra={<code style={{ fontSize: 12 }}>{entry.type}</code>}
            >
              <pre
                style={{
                  margin: 0,
                  padding: 12,
                  background: '#000',
                  color: '#fff',
                  borderRadius: 4,
                  overflow: 'auto',
                  maxHeight: 400,
                  fontSize: 12,
                }}
              >
                {JSON.stringify(entry.payload, null, 2)}
              </pre>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div>
      <Card
        title="LLM 请求体（最近发送给 Chat / Voice 的 HTTP body）"
        extra={
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={fetchPayloads}
            loading={loading}
          >
            刷新
          </Button>
        }
      >
        <p style={{ marginBottom: 16, color: '#fff', fontSize: 13 }}>
          仅用于调试：展示最近发给 Chat 与 Voice（含 Agora ConvoAI）的请求体。数据仅存于内存，不落库，服务重启后清空。Chat / Voice 各自最多保留 20 条，超出时自动丢弃最旧的记录。
        </p>
        <Spin spinning={loading}>
          <Tabs
            items={[
              {
                key: 'chat',
                label: `Chat (${data?.chat?.length ?? 0})`,
                children: renderEntries(data?.chat ?? []),
              },
              {
                key: 'voice',
                label: `Voice (${data?.voice?.length ?? 0})`,
                children: renderEntries(data?.voice ?? []),
              },
              {
                key: 'image',
                label: `Image (${data?.image?.length ?? 0})`,
                children: renderEntries(data?.image ?? []),
              },
              {
                key: 'video',
                label: `Video (${data?.video?.length ?? 0})`,
                children: renderEntries(data?.video ?? []),
              },
            ]}
          />
        </Spin>
      </Card>
    </div>
  );
}
