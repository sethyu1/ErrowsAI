import React, { useState } from 'react';
import { ProTable, type ProColumns, DrawerForm, ProFormText, ProFormTextArea } from '@ant-design/pro-components';
import { Button, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { fetchPixelListApi, createPixelApi, updatePixelApi, type PixelScope } from '@/apis/pixel';

type PixelInfo = API.Pixel.Info;

export interface PixelPageProps {
  scope?: PixelScope;
  title?: string;
}

const Pixel: React.FC<PixelPageProps> = ({ scope = 'pixel', title = 'Meta Pixel' }) => {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingPixel, setEditingPixel] = useState<PixelInfo | null>(null);
  const [reload, setReload] = useState(0);

  const columns: ProColumns<PixelInfo>[] = [
    {
      title: 'Pixel ID',
      dataIndex: 'pixel_id',
      width: '20%',
    },
    {
      title: 'Access Token',
      dataIndex: 'access_token',
      ellipsis: true,
      copyable: true,
    },
    {
      title: '备注',
      dataIndex: 'remark',
      width: '20%',
    },
    {
      title: '操作',
      valueType: 'option',
      width: 150,
      render: (_, record) => [
        <Button
          key="edit"
          type="link"
          onClick={() => {
            setEditingPixel(record);
            setDrawerVisible(true);
          }}
        >
          编辑
        </Button>,
      ],
    },
  ];

  const handleFinish = async (values: PixelInfo) => {
    try {
      if (editingPixel) {
        await updatePixelApi(scope, values);
        message.success('修改成功');
      } else {
        await createPixelApi(scope, values);
        message.success('创建成功');
      }
      setDrawerVisible(false);
      setReload(prev => prev + 1);
      return true;
    } catch (error) {
      console.error('Save pixel error:', error);
      message.error('操作失败');
      return false;
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <ProTable<PixelInfo>
        columns={columns}
        actionRef={undefined}
        params={{ reload }}
        request={async (params) => {
          const { current = 1, pageSize = 20 } = params;
          const res = await fetchPixelListApi(scope, {
            page: current - 1,
            size: pageSize,
          });
          return {
            data: res.data,
            success: true,
            total: res.count,
          };
        }}
        rowKey="pixel_id"
        pagination={{
          showQuickJumper: true,
          defaultPageSize: 20,
        }}
        search={false}
        dateFormatter="string"
        headerTitle={title}
        toolBarRender={() => [
          <Button
            key="button"
            icon={<PlusOutlined />}
            type="primary"
            onClick={() => {
              setEditingPixel(null);
              setDrawerVisible(true);
            }}
          >
            {`New ${title}`}
          </Button>,
        ]}
      />

      <DrawerForm<PixelInfo>
        title={editingPixel ? `Edit ${title}` : `New ${title}`}
        open={drawerVisible}
        onOpenChange={setDrawerVisible}
        initialValues={editingPixel || {}}
        onFinish={handleFinish}
        drawerProps={{
          destroyOnClose: true,
          maskClosable: false,
        }}
      >
        <ProFormText
          name="pixel_id"
          label="Pixel ID"
          placeholder="请输入 Pixel ID"
          rules={[{ required: true, message: 'Pixel ID 为必填项' }]}
          disabled={!!editingPixel}
        />
        <ProFormTextArea
          name="access_token"
          label="Access Token"
          placeholder="请输入 Access Token"
          rules={[{ required: true, message: 'Access Token 为必填项' }]}
        />
        <ProFormTextArea
          name="remark"
          label="备注"
          placeholder="请输入备注"
        />
      </DrawerForm>
    </div>
  );
};

export default Pixel;
