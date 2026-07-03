import { useEffect, useState } from 'react';
import { Card, Form, Input, Button, Spin, message, Collapse } from 'antd';
import { getAIEndpointsApi, updateAIEndpointsApi, type AIEndpointsConfig } from '@/apis/generate-params';
import { usePermission } from '@/hooks/permission';

const defaultEndpoints: AIEndpointsConfig = {
  image: { endpoint: '', baseUrl: '' },
  chat: { endpoint: '' },
  stream: { endpoint: '' },
  video: { endpoint: '', video_state: '', baseUrl: '' },
  tts: { endpoint: '', baseUrl: '' },
};

const AiEndpointsConfig = () => {
  const [form] = Form.useForm<AIEndpointsConfig>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const { hasPermission } = usePermission();
  const canEdit = hasPermission('configs_image_params_edit');

  const load = async () => {
    try {
      setLoading(true);
      const res = await getAIEndpointsApi();
      const data = res && typeof res === 'object'
        ? { ...defaultEndpoints, ...res }
        : defaultEndpoints;
      form.setFieldsValue(data);
    } catch (e) {
      messageApi.error('加载 AI 服务地址配置失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [messageApi]);

  const onFinish = async (values: AIEndpointsConfig) => {
    if (!canEdit) {
      messageApi.warning('无权限编辑');
      return;
    }
    try {
      setSaving(true);
      await updateAIEndpointsApi(values);
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
      <Card size="small" title="AI 服务地址配置">
        <p style={{ marginBottom: 16, color: 'rgba(0,0,0,0.45)', fontSize: 13 }}>
          配置各 AI 服务的 endpoint 与 baseUrl（不含语音通话 voiceCall）。留空则使用默认配置。
        </p>
        <Spin spinning={loading}>
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            initialValues={defaultEndpoints}
          >
            <Collapse
              defaultActiveKey={['image', 'chat', 'stream', 'video', 'tts']}
              items={[
                {
                  key: 'image',
                  label: 'Image（生图）',
                  children: (
                    <>
                      <Form.Item name={['image', 'endpoint']} label="endpoint">
                        <Input placeholder="留空使用默认" disabled={!canEdit} />
                      </Form.Item>
                      <Form.Item name={['image', 'baseUrl']} label="baseUrl">
                        <Input placeholder="留空使用默认" disabled={!canEdit} />
                      </Form.Item>
                    </>
                  ),
                },
                {
                  key: 'chat',
                  label: 'Chat（聊天）',
                  children: (
                    <Form.Item name={['chat', 'endpoint']} label="endpoint">
                      <Input placeholder="留空使用默认" disabled={!canEdit} />
                    </Form.Item>
                  ),
                },
                {
                  key: 'stream',
                  label: 'Stream（流式聊天）',
                  children: (
                    <Form.Item name={['stream', 'endpoint']} label="endpoint">
                      <Input placeholder="留空使用默认" disabled={!canEdit} />
                    </Form.Item>
                  ),
                },
                {
                  key: 'video',
                  label: 'Video（视频）',
                  children: (
                    <>
                      <Form.Item name={['video', 'endpoint']} label="endpoint">
                        <Input placeholder="留空使用默认" disabled={!canEdit} />
                      </Form.Item>
                      <Form.Item name={['video', 'video_state']} label="video_state">
                        <Input placeholder="留空使用默认" disabled={!canEdit} />
                      </Form.Item>
                      <Form.Item name={['video', 'baseUrl']} label="baseUrl">
                        <Input placeholder="留空使用默认" disabled={!canEdit} />
                      </Form.Item>
                    </>
                  ),
                },
                {
                  key: 'tts',
                  label: 'TTS（语音合成）',
                  children: (
                    <>
                      <Form.Item name={['tts', 'endpoint']} label="endpoint">
                        <Input placeholder="留空使用默认" disabled={!canEdit} />
                      </Form.Item>
                      <Form.Item name={['tts', 'baseUrl']} label="baseUrl">
                        <Input placeholder="留空使用默认" disabled={!canEdit} />
                      </Form.Item>
                    </>
                  ),
                },
              ]}
            />
            {canEdit && (
              <Form.Item style={{ marginTop: 16 }}>
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

export default AiEndpointsConfig;
