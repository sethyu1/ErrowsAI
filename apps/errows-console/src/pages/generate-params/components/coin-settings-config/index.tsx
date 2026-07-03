import { useEffect, useState } from 'react';
import { Card, Form, InputNumber, Button, Spin, message } from 'antd';
import { getCoinSettingsApi, updateCoinSettingsApi, type CoinSettings } from '@/apis/generate-params';
import { usePermission } from '@/hooks/permission';

const CoinSettingsConfig = () => {
  const [form] = Form.useForm<CoinSettings>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const { hasPermission } = usePermission();
  const canEdit = hasPermission('configs_image_params_edit');

  const load = async () => {
    try {
      setLoading(true);
      const res = await getCoinSettingsApi();
      const data =
        res && typeof res === 'object' && 'coin_free_balance' in res
          ? res
          : { coin_free_balance: 50, max_free_coins: 100, voice_call_min_coins: 60 };
      form.setFieldsValue(data);
    } catch (e) {
      messageApi.error('加载代币规则配置失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [messageApi]);

  const onFinish = async (values: CoinSettings) => {
    if (!canEdit) {
      messageApi.warning('无权限编辑');
      return;
    }
    try {
      setSaving(true);
      await updateCoinSettingsApi(values);
      messageApi.success('保存成功');
      await load();
    } catch (e) {
      messageApi.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {contextHolder}
      <Card size="small" title="代币规则配置">
        <p style={{ marginBottom: 16, color: 'rgba(0,0,0,0.45)', fontSize: 13 }}>
          初始免费币：新用户/初始化时的免费币数量。免费币上限：单用户免费币总上限。语音最低币：发起语音通话所需的最低余额。
        </p>
        <Spin spinning={loading}>
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            initialValues={{ coin_free_balance: 50, max_free_coins: 100, voice_call_min_coins: 60 }}
          >
            <Form.Item
              name="coin_free_balance"
              label="初始免费币"
              rules={[{ required: true }, { type: 'number', min: 0 }]}
            >
              <InputNumber min={0} disabled={!canEdit} style={{ width: 160 }} />
            </Form.Item>
            <Form.Item
              name="max_free_coins"
              label="免费币上限（单用户）"
              rules={[{ required: true }, { type: 'number', min: 0 }]}
            >
              <InputNumber min={0} disabled={!canEdit} style={{ width: 160 }} />
            </Form.Item>
            <Form.Item
              name="voice_call_min_coins"
              label="语音通话最低币"
              rules={[{ required: true }, { type: 'number', min: 0 }]}
            >
              <InputNumber min={0} disabled={!canEdit} style={{ width: 160 }} />
            </Form.Item>
            {canEdit && (
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={saving}>
                  保存
                </Button>
              </Form.Item>
            )}
          </Form>
        </Spin>
      </Card>
    </>
  );
};

export default CoinSettingsConfig;
