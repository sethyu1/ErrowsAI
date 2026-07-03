import { Form, Input, InputNumber } from 'antd';
import { usePermission } from '@/hooks/permission';
import styles from '../index.module.less';

interface ProductFieldsProps {
  fieldIndex: number;
  productName: string;
  initialValues?: any;
  type?: 'monthly' | 'yearly';
}


export const ProductFields = ({ fieldIndex, productName, type }: ProductFieldsProps) => {
  const field = fieldIndex;
  const { hasPermission } = usePermission();
  const canEdit = hasPermission('configs_membership_edit');

  return (
    <>
      <Form.Item
        name={[field, 'id']}
        className={styles.hiddenField}
      >
        <Input />
      </Form.Item>

      <Form.Item
        label="产品名称"
        name={[field, 'title']}
        rules={[
          { required: true, message: '请输入产品名称' },
        ]}
      >
        <Input disabled={!canEdit} />
      </Form.Item>
      <Form.Item
        name={[field, 'name']}
        className={styles.hiddenField}
      >
        <Input />
      </Form.Item>

      <Form.Item
        label="价格 ID"
        name={[field, 'price_id']}
        rules={[
          { required: true, message: '请输入价格 ID' },
        ]}
      >
        <Input disabled={!canEdit} />
      </Form.Item>

      <Form.Item
        label={type === 'yearly' ? '年度付费' : '月度付费'}
        name={[field, 'price']}
        rules={[
          { required: true, message: type === 'yearly' ? '请输入年度会员价格' : '请输入月度会员价格' },
          {
            validator: (_, value) => {
              if (value < 0 || value > 999999) {
                return Promise.reject(new Error('请输入0-999999之间的数字'));
              }
              return Promise.resolve();
            },
          },
        ]}
      >
        <InputNumber
          placeholder={type === 'yearly' ? '请输入年度会员价格' : '请输入月度会员价格'}
          min={0}
          max={999999}
          precision={2}
          className={styles.inputNumber}
          addonAfter={type === 'yearly' ? '美元/年' : '美元/月'}
          disabled={!canEdit}
        />
      </Form.Item>

      <Form.Item
        label="折扣率"
        name={[field, 'discount_rate']}
        rules={[
          { required: true, message: '请输入折扣率' },
          {
            validator: (_, value) => {
              if (value < 0 || value > 100) {
                return Promise.reject(new Error('请输入0-100之间的整数'));
              }
              return Promise.resolve();
            },
          },
        ]}
      >
        <InputNumber
          placeholder="请输入折扣率"
          min={0}
          max={100}
          precision={0}
          className={styles.inputNumber}
          addonAfter="%"
          disabled={!canEdit}
        />
      </Form.Item>

      <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues[field]?.price !== currentValues[field]?.price || prevValues[field]?.discount_rate !== currentValues[field]?.discount_rate}>
        {({ getFieldValue }) => {
          const realPrice = getFieldValue([field, 'price']);
          const discountRate = getFieldValue([field, 'discount_rate']);
          //  根据实际价格 和折扣率 计算折扣前的价格
          const beforeDiscountPrice = realPrice !== undefined && realPrice !== null && discountRate !== undefined && discountRate !== null 
            ? parseFloat((realPrice / (1 - discountRate / 100)).toFixed(2))
            : 0;
          const monthlyPrice = type === 'yearly' && beforeDiscountPrice ? (beforeDiscountPrice / 12).toFixed(2) : null;
          const displayPrice = beforeDiscountPrice.toFixed(2);
          
          return (
            <Form.Item
              label={type === 'yearly' ? `折前订阅价(${monthlyPrice || '0.00'}美元/月)` : '折前订阅价'}
              // name={[field, 'price']}
            >
              <Input
                disabled
                placeholder={displayPrice}
                value={displayPrice}
                addonAfter={type === 'yearly' ? '美元/年' : '美元/月'}
              />
            </Form.Item>
          );
        }}
      </Form.Item>

      <Form.Item
        label="每月赠送代币"
        name={[field, 'bonus_coin']}
        rules={[
          { required: true, message: '请输入每月赠送代币数量' },
          {
            validator: (_, value) => {
              if (value < 0 || value > 999999) {
                return Promise.reject(new Error('请输入0-999999之间的数字'));
              }
              return Promise.resolve();
            },
          },
        ]}
      >
        <InputNumber
          placeholder="请输入每月赠送代币数量"
          min={0}
          max={999999}
          precision={0}
          className={styles.inputNumber}
          addonAfter="个/月"
          disabled={!canEdit}
        />
      </Form.Item>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        <Form.Item
          label="每月发放日期"
          name={[field, 'bonus_date']}
          rules={[
            { required: true, message: '请输入发放日期' },
            {
              validator: (_, value) => {
                if (value !== undefined && (value < 1 || value > 31)) {
                  return Promise.reject(new Error('请输入1-31之间的整数'));
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <InputNumber
            placeholder="请输入1-28"
            min={1}
            max={28}
            precision={0}
            className={styles.inputNumber}
            addonAfter="日"
            disabled={!canEdit}
          />
        </Form.Item>

        <Form.Item
          label="每月发放时间"
          name={[field, 'bonus_time']}
          rules={[
            { required: true, message: '请输入发放时间' },
            {
              validator: (_, value) => {
                if (value !== undefined && (value < 0 || value > 24)) {
                  return Promise.reject(new Error('请输入0-24之间的整数'));
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <InputNumber
            placeholder="请输入0-24"
            min={0}
            max={24}
            precision={0}
            className={styles.inputNumber}
            addonAfter="点"
            disabled={!canEdit}
          />
        </Form.Item>
      </div>

      <Form.Item
        label="订阅价值描述"
        name={[field, 'value']}
        rules={[
          { required: true, message: '请输入订阅价值描述' },
        ]}
        className={styles.fullWidth}
      >
        <Input.TextArea
          placeholder="请输入订阅价值描述"
          rows={4}
          className={styles.textArea}
          disabled={!canEdit}
        />
      </Form.Item>

      <Form.Item
        label="订阅权益描述"
        name={[field, 'rights']}
        rules={[
          { required: true, message: '请输入订阅权益描述' },
        ]}
        className={styles.fullWidth}
      >
        <Input.TextArea
          placeholder="请输入订阅权益描述"
          rows={8}
          className={styles.textArea}
          disabled={!canEdit}
        />
      </Form.Item>
    </>
  );
};

export default ProductFields;

