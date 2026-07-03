import React, { useCallback, useEffect, useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  message,
  Popconfirm,
  Tag,
} from 'antd';
import { PlusOutlined, CopyOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { fetchCdkeysApi, createCdkeysApi, deleteCdkeyApi, updateCdkeyApi } from '@/apis';
import dayjs from 'dayjs';

type CDKeyRow = API.Payment.CDKeyRow;

const PLAN_OPTIONS = [
  { value: 'free', label: 'Free' },
  { value: 'star', label: 'Star' },
  { value: 'luna', label: 'Luna' },
  { value: 'galaxy', label: 'Galaxy' },
];

export default function CdkeyConfig() {
  const [list, setList] = useState<CDKeyRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<CDKeyRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [redeemedFilter, setRedeemedFilter] = useState<boolean | undefined>();
  const [usageTypeFilter, setUsageTypeFilter] = useState<API.Payment.CDKeyUsageType | undefined>();
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchCdkeysApi({
        page,
        pageSize,
        redeemed: redeemedFilter,
        usage_type: usageTypeFilter,
      });
      setList(res?.list ?? []);
      setTotal(res?.total ?? 0);
    } catch (e) {
      console.error(e);
      message.error('获取 CD-Key 列表失败');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, redeemedFilter, usageTypeFilter]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      setCreating(true);
      const isMultiple = values.usage_type === 'multiple';
      const res = await createCdkeysApi({
        display_key: values.display_key ? String(values.display_key).trim() : undefined,
        usage_type: values.usage_type ?? 'one_time',
        max_redemptions: isMultiple ? values.max_redemptions : undefined,
        plan: 'free',
        coin_amount: 0,
        count: isMultiple ? undefined : (values.count ?? 1),
        valid_from: values.valid_from ? dayjs(values.valid_from).toISOString() : undefined,
        valid_to: values.valid_to ? dayjs(values.valid_to).toISOString() : undefined,
        benefit_plan: values.benefit_plan,
        benefit_plan_valid_from: values.benefit_plan_valid_from ? dayjs(values.benefit_plan_valid_from).toISOString() : undefined,
        benefit_plan_valid_to: values.benefit_plan_valid_to ? dayjs(values.benefit_plan_valid_to).toISOString() : undefined,
        benefit_coin_gold: values.benefit_coin_gold ?? 0,
        benefit_coin_free: values.benefit_coin_free,
      });
      const created = Array.isArray(res) ? res : [res];
      const first = created[0] as { display_key?: string; key?: string } | undefined;
      const displayKey = first?.display_key ?? first?.key;
      if (created.length === 1 && displayKey) {
        message.success(isMultiple ? `CD-Key 已生成：${displayKey}（多次兑换，上限 ${values.max_redemptions} 人）` : `CD-Key 已生成：${displayKey}（请将此 8 位码发给用户）`);
      } else {
        message.success(`已生成 ${created.length} 个 CD-Key`);
      }
      form.resetFields();
      setModalOpen(false);
      loadList();
    } catch (e: unknown) {
      if (e && typeof e === 'object' && 'errorFields' in e) return;
      console.error(e);
      message.error('生成失败');
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(key).then(
      () => message.success('已复制到剪贴板'),
      () => message.error('复制失败')
    );
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCdkeyApi(id);
      message.success('已删除');
      loadList();
    } catch (e) {
      console.error(e);
      message.error('删除失败，可能已被兑换');
    }
  };

  const handleEdit = (record: CDKeyRow) => {
    setEditingRecord(record);
    editForm.setFieldsValue({
      display_key: record.display_key ?? '',
      valid_from: record.valid_from ? dayjs(record.valid_from) : undefined,
      valid_to: record.valid_to ? dayjs(record.valid_to) : undefined,
      benefit_plan: record.benefit_plan ?? undefined,
      benefit_plan_valid_from: record.benefit_plan_valid_from ? dayjs(record.benefit_plan_valid_from) : undefined,
      benefit_plan_valid_to: record.benefit_plan_valid_to ? dayjs(record.benefit_plan_valid_to) : undefined,
      benefit_coin_gold: record.benefit_coin_gold ?? 0,
      benefit_coin_free: record.benefit_coin_free ?? 0,
      max_redemptions: record.max_redemptions ?? undefined,
    });
    setEditModalOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingRecord) return;
    try {
      const values = await editForm.validateFields();
      setUpdating(true);
      await updateCdkeyApi(editingRecord.id, {
        display_key: values.display_key != null ? String(values.display_key).trim() || undefined : undefined,
        valid_from: values.valid_from ? dayjs(values.valid_from).toISOString() : undefined,
        valid_to: values.valid_to ? dayjs(values.valid_to).toISOString() : undefined,
        benefit_plan: values.benefit_plan,
        benefit_plan_valid_from: values.benefit_plan_valid_from ? dayjs(values.benefit_plan_valid_from).toISOString() : undefined,
        benefit_plan_valid_to: values.benefit_plan_valid_to ? dayjs(values.benefit_plan_valid_to).toISOString() : undefined,
        benefit_coin_gold: values.benefit_coin_gold,
        benefit_coin_free: values.benefit_coin_free,
        max_redemptions: editingRecord.usage_type === 'multiple' ? values.max_redemptions : undefined,
      });
      message.success('已更新');
      setEditModalOpen(false);
      setEditingRecord(null);
      loadList();
    } catch (e: unknown) {
      if (e && typeof e === 'object' && 'errorFields' in e) return;
      console.error(e);
      message.error('更新失败');
    } finally {
      setUpdating(false);
    }
  };

  const columns = [
    {
      title: 'CD-Key（8-30 位）',
      key: 'display_key',
      width: 340,
      ellipsis: false,
      render: (_: unknown, record: CDKeyRow) => {
        const code = record.display_key ?? record.key;
        return (
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'nowrap', gap: 8, minWidth: 0 }}>
            <span style={{ fontFamily: 'monospace', fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }} title={code}>{code}</span>
            <Button
              type="link"
              size="small"
              icon={<CopyOutlined />}
              onClick={() => handleCopy(code)}
              style={{ flexShrink: 0 }}
            >
              复制
            </Button>
          </div>
        );
      },
    },
    {
      title: '有效期起',
      dataIndex: 'valid_from',
      width: 160,
      render: (t: string) => (t ? dayjs(t).format('YYYY-MM-DD HH:mm') : '-'),
    },
    {
      title: '有效期止',
      dataIndex: 'valid_to',
      width: 160,
      render: (t: string) => (t ? dayjs(t).format('YYYY-MM-DD HH:mm') : '-'),
    },
    {
      title: '权益',
      key: 'benefits',
      width: 200,
      render: (_: unknown, record: CDKeyRow) => (
        <span style={{ fontSize: 12 }}>
          {record.benefit_plan && record.benefit_plan !== 'free' && (
            <Tag color="blue">订阅 {record.benefit_plan}</Tag>
          )}
          {(record.benefit_plan_valid_from != null || record.benefit_plan_valid_to != null) && (
            <span>
              {' '}{record.benefit_plan_valid_from ? dayjs(record.benefit_plan_valid_from).format('YYYY-MM-DD HH:mm') : '?'} ～ {record.benefit_plan_valid_to ? dayjs(record.benefit_plan_valid_to).format('YYYY-MM-DD HH:mm') : '?'}
            </span>
          )}
          {(record.benefit_coin_gold ?? 0) > 0 && <Tag>金+{record.benefit_coin_gold}</Tag>}
          {(record.benefit_coin_free ?? 0) > 0 && <Tag>银+{record.benefit_coin_free}</Tag>}
        </span>
      ),
    },
    {
      title: '类型',
      dataIndex: 'usage_type',
      width: 80,
      render: (t: string) => (t === 'multiple' ? <Tag color="purple">多次</Tag> : <Tag>一次性</Tag>),
    },
    {
      title: '状态',
      key: 'redeemed',
      width: 100,
      render: (_: unknown, record: CDKeyRow) => {
        if (record.usage_type === 'multiple') {
          const cur = record.redemption_count ?? 0;
          const max = record.max_redemptions ?? 0;
          return <span>{cur}/{max} 已兑</span>;
        }
        return record.redeemed_at ? (
          <Tag color="default">已兑换</Tag>
        ) : (
          <Tag color="green">未兑换</Tag>
        );
      },
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      width: 160,
      render: (t: string) => (t ? dayjs(t).format('YYYY-MM-DD HH:mm') : '-'),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: unknown, record: CDKeyRow) => {
        const canEdit = record.usage_type === 'multiple' || !record.redeemed_at;
        const canDelete = record.usage_type === 'multiple' || !record.redeemed_at;
        return (
          <Space>
            {canEdit && (
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
              >
                编辑
              </Button>
            )}
            <Popconfirm
              title="确定删除该 CD-Key？"
              description={record.usage_type === 'multiple' ? '删除后不可恢复' : '仅可删除未兑换的 CD-Key'}
              onConfirm={() => handleDelete(record.id)}
              okText="确定"
              cancelText="取消"
              disabled={!canDelete}
            >
              <Button
                type="link"
                danger
                size="small"
                icon={<DeleteOutlined />}
                disabled={!canDelete}
              >
                删除
              </Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      <Card
        title="CD-Key 管理"
        extra={
          <Space>
            <Select
              placeholder="类型"
              allowClear
              style={{ width: 100 }}
              value={usageTypeFilter}
              onChange={setUsageTypeFilter}
              options={[
                { value: 'one_time', label: '一次性' },
                { value: 'multiple', label: '多次' },
              ]}
            />
            <Select
              placeholder="状态"
              allowClear
              style={{ width: 100 }}
              value={redeemedFilter}
              onChange={setRedeemedFilter}
              options={[
                { value: false, label: '未兑换' },
                { value: true, label: '已兑换' },
              ]}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
              生成 CD-Key
            </Button>
          </Space>
        }
      >
        <Table<CDKeyRow>
          rowKey="id"
          tableLayout="fixed"
          columns={columns}
          dataSource={list}
          loading={loading}
          scroll={{ x: 1320 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (n) => `共 ${n} 条`,
            pageSizeOptions: ['10', '20', '50'],
            onChange: (p, ps) => {
              setPage(p);
              if (typeof ps === 'number') setPageSize(ps);
            },
          }}
        />
      </Card>

      <Modal
        title="生成 CD-Key"
        open={modalOpen}
        onOk={handleCreate}
        onCancel={() => { setModalOpen(false); form.resetFields(); }}
        okText="生成"
        cancelText="取消"
        confirmLoading={creating}
        width={520}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }} initialValues={{ usage_type: 'one_time', count: 1, benefit_coin_gold: 0, benefit_coin_free: 0 }}>
          <Form.Item
            name="display_key"
            label="CD-Key 码（可选）"
            rules={[{
              validator: (_, value) => {
                const s = value != null ? String(value).trim() : '';
                if (s === '') return Promise.resolve();
                if (s.length < 8 || s.length > 30) return Promise.reject(new Error('8-30 位'));
                if (!/^[0-9A-Za-z]+$/.test(s)) return Promise.reject(new Error('仅限字母、数字'));
                return Promise.resolve();
              },
            }]}
          >
            <Input placeholder="留空则自动生成 8 位；自定义则 8-30 位字母或数字" maxLength={30} />
          </Form.Item>
          <Form.Item name="usage_type" label="类型" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'one_time', label: '一次性（每个码仅可兑换一次）' },
                { value: 'multiple', label: '多次（同一码可被多人兑换，有上限）' },
              ]}
            />
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(prev, curr) => prev.usage_type !== curr.usage_type}>
            {({ getFieldValue }) =>
              getFieldValue('usage_type') === 'multiple' ? (
                <Form.Item name="max_redemptions" label="最大兑换人数" rules={[{ required: true, message: '请填写最大兑换人数' }, { type: 'number', min: 1 }]}>
                  <InputNumber min={1} style={{ width: '100%' }} placeholder="例如 100" />
                </Form.Item>
              ) : (
                <Form.Item name="count" label="生成数量" rules={[{ required: true }]}>
                  <InputNumber min={1} max={100} style={{ width: '100%' }} placeholder="1" />
                </Form.Item>
              )
            }
          </Form.Item>
          <Form.Item
            name="valid_from"
            label="可兑换开始时间"
            rules={[
              { required: true, message: '请选择可兑换开始时间' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const to = getFieldValue('valid_to');
                  if (!value || !to) return Promise.resolve();
                  if (dayjs(value).isBefore(dayjs(to))) return Promise.resolve();
                  return Promise.reject(new Error('开始时间须早于结束时间'));
                },
              }),
            ]}
            dependencies={['valid_to']}
          >
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="valid_to"
            label="可兑换结束时间"
            rules={[
              { required: true, message: '请选择可兑换结束时间' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const from = getFieldValue('valid_from');
                  if (!value || !from) return Promise.resolve();
                  if (dayjs(value).isAfter(dayjs(from))) return Promise.resolve();
                  return Promise.reject(new Error('结束时间须晚于开始时间'));
                },
              }),
            ]}
            dependencies={['valid_from']}
          >
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="benefit_plan" label="权益-订阅套餐">
            <Select placeholder="不设则无订阅" allowClear options={PLAN_OPTIONS} />
          </Form.Item>
          <Form.Item
            name="benefit_plan_valid_from"
            label="权益-订阅开始时间"
            dependencies={['benefit_plan_valid_to']}
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const to = getFieldValue('benefit_plan_valid_to');
                  if (!value || !to) return Promise.resolve();
                  if (dayjs(value).isBefore(dayjs(to))) return Promise.resolve();
                  return Promise.reject(new Error('开始时间须早于结束时间'));
                },
              }),
            ]}
          >
            <DatePicker showTime style={{ width: '100%' }} placeholder="开始时间" />
          </Form.Item>
          <Form.Item
            name="benefit_plan_valid_to"
            label="权益-订阅结束时间"
            dependencies={['benefit_plan_valid_from']}
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const from = getFieldValue('benefit_plan_valid_from');
                  if (!value || !from) return Promise.resolve();
                  if (dayjs(value).isAfter(dayjs(from))) return Promise.resolve();
                  return Promise.reject(new Error('结束时间须晚于开始时间'));
                },
              }),
            ]}
          >
            <DatePicker showTime style={{ width: '100%' }} placeholder="结束时间" />
          </Form.Item>
          <Form.Item name="benefit_coin_gold" label="权益-金币数量">
            <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
          </Form.Item>
          <Form.Item name="benefit_coin_free" label="权益-银币数量">
            <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="编辑 CD-Key（码、有效期与权益）"
        open={editModalOpen}
        onOk={handleUpdate}
        onCancel={() => { setEditModalOpen(false); setEditingRecord(null); editForm.resetFields(); }}
        okText="保存"
        cancelText="取消"
        confirmLoading={updating}
        width={520}
      >
        <Form form={editForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="display_key" label="CD-Key 码" rules={[{ required: true, message: '必填' }, { min: 8, max: 30, message: '8-30 位' }, { pattern: /^[0-9A-Za-z]{8,30}$/, message: '仅限字母、数字' }]}>
            <Input placeholder="8-30 位字母或数字" maxLength={30} />
          </Form.Item>
          {editingRecord?.usage_type === 'multiple' && (
            <Form.Item name="max_redemptions" label="最大兑换人数" rules={[{ type: 'number', min: 1 }]}>
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
          )}
          <Form.Item
            name="valid_from"
            label="可兑换开始时间"
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const to = getFieldValue('valid_to');
                  if (!value || !to) return Promise.resolve();
                  if (dayjs(value).isBefore(dayjs(to))) return Promise.resolve();
                  return Promise.reject(new Error('开始时间须早于结束时间'));
                },
              }),
            ]}
            dependencies={['valid_to']}
          >
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="valid_to"
            label="可兑换结束时间"
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const from = getFieldValue('valid_from');
                  if (!value || !from) return Promise.resolve();
                  if (dayjs(value).isAfter(dayjs(from))) return Promise.resolve();
                  return Promise.reject(new Error('结束时间须晚于开始时间'));
                },
              }),
            ]}
            dependencies={['valid_from']}
          >
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="benefit_plan" label="权益-订阅套餐">
            <Select placeholder="free 表示无订阅" allowClear options={PLAN_OPTIONS} />
          </Form.Item>
          <Form.Item
            name="benefit_plan_valid_from"
            label="权益-订阅开始时间"
            dependencies={['benefit_plan_valid_to']}
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const to = getFieldValue('benefit_plan_valid_to');
                  if (!value || !to) return Promise.resolve();
                  if (dayjs(value).isBefore(dayjs(to))) return Promise.resolve();
                  return Promise.reject(new Error('开始时间须早于结束时间'));
                },
              }),
            ]}
          >
            <DatePicker showTime style={{ width: '100%' }} placeholder="开始时间" />
          </Form.Item>
          <Form.Item
            name="benefit_plan_valid_to"
            label="权益-订阅结束时间"
            dependencies={['benefit_plan_valid_from']}
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const from = getFieldValue('benefit_plan_valid_from');
                  if (!value || !from) return Promise.resolve();
                  if (dayjs(value).isAfter(dayjs(from))) return Promise.resolve();
                  return Promise.reject(new Error('结束时间须晚于开始时间'));
                },
              }),
            ]}
          >
            <DatePicker showTime style={{ width: '100%' }} placeholder="结束时间" />
          </Form.Item>
          <Form.Item name="benefit_coin_gold" label="权益-金币数量">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="benefit_coin_free" label="权益-银币数量">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
