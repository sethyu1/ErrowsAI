import React, { useEffect, useState } from 'react';
import { ProForm, EditableProTable, type ProColumns } from '@ant-design/pro-components';
import { message, Button, Card } from 'antd';
import { nanoid } from 'nanoid';
import { fetchCoinProductsApi, updateCoinProductsApi } from '@/apis';
import { usePermission } from '@/hooks/permission';

type CoinProduct = API.Coin.Product;

export default function Coins() {
  const [editableKeys, setEditableRowKeys] = useState<React.Key[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = ProForm.useForm();
  const { hasPermission } = usePermission();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const res = await fetchCoinProductsApi();
        // 兼容处理：如果返回的是对象且包含products，则取products，否则假定返回的是数组
        // 根据类型定义 request.get<API.Coin.Product[]> 应该是数组，但为了稳健这里做个检查
        const products = Array.isArray(res) ? res : (res as any)?.products || [];

        form.setFieldsValue({
          products: products,
        });
      } catch (error) {
        console.error('Failed to fetch coin products:', error);
        message.error('获取产品列表失败');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [form]);

  const columns: ProColumns<CoinProduct>[] = [
    {
      title: '产品名称',
      dataIndex: 'title',
      width: 150,
      formItemProps: {
        rules: [{ required: true, message: '产品名称为必填项' }],
      },
    },
    {
      title: '支付平台标识',
      dataIndex: 'price_id',
      width: 200,
      formItemProps: {
        rules: [{ required: true, message: '支付平台标识为必填项' }],
      },
    },
    {
      title: '金币数量',
      dataIndex: 'amount',
      valueType: 'digit',
      width: 80,
      formItemProps: {
        rules: [{ required: true, message: '金币数量为必填项' }],
      },
    },
    {
      title: '价格',
      dataIndex: 'price',
      valueType: 'digit',
      width: 80,
      fieldProps: {
        prefix: '$',
        precision: 2,
      },
      formItemProps: {
        rules: [{ required: true, message: '价格为必填项' }],
      },
    },
    {
      title: '折扣率 (%)',
      dataIndex: 'discount_rate',
      valueType: 'digit',
      width: 80,
      fieldProps: {
        min: 0,
        max: 100,
      },
      formItemProps: {
        rules: [{ required: true, message: '折扣率为必填项' }],
      },
    },
    {
      title: '原价',
      dataIndex: 'before_discount_price',
      valueType: 'digit',
      width: 80,
      fieldProps: {
        prefix: '$',
        precision: 2,
        disabled: true,
      },
      formItemProps: {
        rules: [{ required: true, message: '原价为必填项' }],
      },
    },
    {
      title: '操作',
      valueType: 'option',
      fixed: 'right',
      width: 150,
      render: (text, record, _, action) => [
        <a
          key="editable"
          onClick={() => {
            action?.startEditable?.(record.id);
          }}
          style={{ 
            pointerEvents: hasPermission('configs_coins_edit') ? 'auto' : 'none',
            opacity: hasPermission('configs_coins_edit') ? 1 : 0.5,
            cursor: hasPermission('configs_coins_edit') ? 'pointer' : 'not-allowed'
          }}
        >
          编辑
        </a>,
        <a
          key="delete"
          onClick={() => {
            if (!hasPermission('configs_coins_edit')) return;
            const products = form.getFieldValue('products') || [];
            const newProducts = products.filter((item: CoinProduct) => item.id !== record.id);
            form.setFieldsValue({ products: newProducts });
          }}
          style={{ 
            pointerEvents: hasPermission('configs_coins_edit') ? 'auto' : 'none',
            opacity: hasPermission('configs_coins_edit') ? 1 : 0.5,
            cursor: hasPermission('configs_coins_edit') ? 'pointer' : 'not-allowed'
          }}
        >
          删除
        </a>,
      ],
    },
  ];

  return (
    <Card>
      <ProForm
        form={form}
        onFinish={async (values) => {
          setSubmitting(true);
          try {
            await updateCoinProductsApi({ products: values.products });
            message.success('保存成功');
            return true;
          } catch (error) {
            console.error('Failed to update coin products:', error);
            message.error('保存失败');
            return false;
          } finally {
            setSubmitting(false);
          }
        }}
        submitter={false}
      >
        <EditableProTable<CoinProduct>
          headerTitle="金币产品管理"
          name="products"
          rowKey="id"
          scroll={{ x: 1000 }}
          loading={loading}
          toolBarRender={() => [
            <Button
              key="save"
              type="primary"
              onClick={() => form.submit()}
              loading={submitting}
              disabled={!hasPermission('configs_coins_edit')}
            >
              保存
            </Button>
          ]}
          recordCreatorProps={{
            newRecordType: 'dataSource',
            position: 'bottom',
            record: () => ({
              id: nanoid(),
              price_id: '',
              amount: 0,
              price: 0,
              discount_rate: 0,
              before_discount_price: 0,
            } as CoinProduct),
            creatorButtonText: '新增产品',
            disabled: !hasPermission('configs_coins_edit'),
          }}
          columns={columns}
          editable={{
            type: 'multiple',
            editableKeys,
            onChange: setEditableRowKeys,
            onValuesChange: (record, recordList) => {
              const rate = record?.discount_rate ?? 0;
              const price = record?.price ?? 0;
              
              // 计算原价：原价 = 价格 / (折扣率 / 100)
              let beforeDiscountPrice = 0;
              if (rate > 0 && price > 0) {
                beforeDiscountPrice = price / (rate / 100);
              }

              const newProducts = recordList.map((item) => {
                if (item?.id === record?.id) {
                  return { ...item, before_discount_price: Number(beforeDiscountPrice.toFixed(2)) };
                }
                return item;
              });

              form.setFieldsValue({ products: newProducts });
            },
            actionRender: (row, config, defaultDom) => {
              const saveButton = defaultDom.save && React.isValidElement(defaultDom.save)
                ? React.cloneElement(defaultDom.save as React.ReactElement<any>, { 
                    disabled: !hasPermission('configs_coins_edit') || (defaultDom.save as any)?.props?.disabled 
                  })
                : defaultDom.save;
              const deleteButton = defaultDom.delete && React.isValidElement(defaultDom.delete)
                ? React.cloneElement(defaultDom.delete as React.ReactElement<any>, { 
                    disabled: !hasPermission('configs_coins_edit') || (defaultDom.delete as any)?.props?.disabled 
                  })
                : defaultDom.delete;
              return [saveButton, deleteButton].filter(Boolean);
            },
          }}
        />
      </ProForm>
    </Card>
  );
}
