import { useEffect, useState } from 'react';
import { Table, Card, Spin, message, Button, InputNumber, Input } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { getModelCostsApi, updateModelCostsApi, type ModelCostItem } from '@/apis/generate-params';
import { usePermission } from '@/hooks/permission';

const ACTION_LABELS: Record<string, string> = {
  llm: 'LLM',
  image_generation: '生图',
  video_generation: '视频生成',
  voice_call: '语音通话',
  speed_up: '加速',
  tts: 'TTS / 语音生成',
};

const UNIT_LABELS: Record<string, string> = {
  per_request: '次',
  per_second: '秒',
  per_click: '次',
};

const ModelCostConfig = () => {
  const [data, setData] = useState<ModelCostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const { hasPermission } = usePermission();
  const canEdit = hasPermission('configs_image_params_edit');

  const load = async () => {
    try {
      setLoading(true);
      const res = await getModelCostsApi();
      const list = Array.isArray(res) ? res : (res as { data?: ModelCostItem[] })?.data;
      setData(Array.isArray(list) ? list : []);
    } catch (e) {
      messageApi.error('加载模型消耗配置失败');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [messageApi]);

  const updateRow = (action: string, field: keyof ModelCostItem, value: string | number) => {
    setData((prev) =>
      prev.map((row) =>
        row.action === action ? { ...row, [field]: value } : row
      )
    );
  };

  const handleSave = async () => {
    if (!canEdit) {
      messageApi.warning('无权限编辑');
      return;
    }
    try {
      setSaving(true);
      await updateModelCostsApi(data);
      messageApi.success('保存成功');
      await load();
    } catch (e) {
      messageApi.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const columns: ColumnsType<ModelCostItem> = [
    {
      title: '类型',
      dataIndex: 'action',
      key: 'action',
      width: 140,
      render: (action: string) => ACTION_LABELS[action] ?? action,
    },
    {
      title: '说明',
      dataIndex: 'description',
      key: 'description',
      render: (_, record) =>
        canEdit ? (
          <Input
            value={record.description ?? ''}
            onChange={(e) => updateRow(record.action, 'description', e.target.value)}
            size="small"
            placeholder="说明"
          />
        ) : (
          (record.description ?? '') || '—'
        ),
    },
    {
      title: '单价 (coins)',
      dataIndex: 'amount',
      key: 'amount',
      width: 140,
      align: 'right',
      render: (_, record) =>
        canEdit ? (
          <InputNumber
            min={0}
            value={record.amount}
            onChange={(val) => updateRow(record.action, 'amount', val ?? 0)}
            size="small"
            style={{ width: '100%' }}
          />
        ) : (
          record.amount
        ),
    },
    {
      title: '单位',
      dataIndex: 'unit',
      key: 'unit',
      width: 80,
      render: (unit: string) => (unit ? UNIT_LABELS[unit] ?? unit : '—'),
    },
  ];

  return (
    <>
      {contextHolder}
      <Card
        size="small"
        title="模型消耗配置"
        extra={
          canEdit && (
            <Button type="primary" onClick={handleSave} loading={saving}>
              保存
            </Button>
          )
        }
      >
        <p style={{ marginBottom: 16, color: 'rgba(0,0,0,0.45)', fontSize: 13 }}>
          配置 LLM、生图、视频生成、语音通话、加速、TTS 的单价（coins）。保存时提交完整列表。语音通话单位为「秒」。
        </p>
        <Spin spinning={loading}>
          <Table<ModelCostItem>
            rowKey="action"
            columns={columns}
            dataSource={data}
            pagination={false}
            size="small"
          />
        </Spin>
      </Card>
    </>
  );
};

export default ModelCostConfig;
