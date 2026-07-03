import { useRef, useEffect, useState } from 'react';
import { Form, Card, Empty } from 'antd';
import type { FormInstance } from 'antd';
import ProductFields from './ProductFields';
import styles from '../index.module.less';

interface SubscriptionFormProps {
  products: API.Payment.SUBSCRIPTION_PRODUCT[];
  type: 'monthly' | 'yearly';
  onProductsChange?: (products: API.Payment.SUBSCRIPTION_PRODUCT[]) => void;
  onGetForms?: (forms: FormInstance[]) => void;
}

const PRODUCT_NAMES = ['star', 'luna', 'galaxy'] as const;

const getProductClassName = (productName: string): string => {
  const name = productName.toLowerCase();
  if (name === 'star') return styles.productStar;
  if (name === 'luna') return styles.productLuna;
  if (name === 'galaxy') return styles.productGalaxy;
  return '';
};

const ProductCard = ({ 
  product, 
  index, 
  type, 
  onFormReady
}: { 
  product: API.Payment.SUBSCRIPTION_PRODUCT; 
  index: number; 
  type: 'monthly' | 'yearly';
  onFormReady?: (form: FormInstance, index: number) => void;
}) => {
  const [form] = Form.useForm();
  const isInitialized = useRef(false);
  const productName = product?.name || PRODUCT_NAMES[index];
  const cardClassName = getProductClassName(productName);

  // 初始化表单值 - 仅在组件挂载时执行一次
  useEffect(() => {
    if (!isInitialized.current) {
      // 由于 ProductFields 使用了 name={[field, 'price']} 的嵌套格式
      // 需要将平铺的 product 对象转换为嵌套结构 { 0: product }
      form.setFieldsValue({ 0: product });
      isInitialized.current = true;
      // 通知父组件 form 已准备好
      if (onFormReady) {
        onFormReady(form, index);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Card
      key={`${productName}-${product.id}`}
      className={`${styles.productCard} ${cardClassName}`}
      title={`${productName.toUpperCase()}版本${type === 'yearly' ? '年度' : '月度'}付费`}
      size="small"
    >
      <Form
        form={form}
        layout="vertical"
        autoComplete="off"
        size='small'
      >
          <ProductFields
            fieldIndex={0}
            productName={productName}
            initialValues={product}
            type={type}
          />
      </Form>
    </Card>
  );
};

export const SubscriptionForm = ({ 
  products, 
  type, 
  onProductsChange, 
  onGetForms 
}: SubscriptionFormProps) => {
  const formsRef = useRef<Map<number, FormInstance>>(new Map());

  const handleFormReady = (form: FormInstance, index: number) => {
    formsRef.current.set(index, form);
    if (onGetForms) {
      onGetForms(Array.from(formsRef.current.values()));
    }
  };

  if (!products || products.length === 0) {
    return <Empty description="暂无数据" className={styles.emptyState} />;
  }

  return (
    <div className={styles.cardContainer}>
      {products.map((product, index) => (
        <ProductCard
          key={`${product.name}-${product.id}`}
          product={product}
          index={index}
          type={type}
          onFormReady={handleFormReady}
        />
      ))}
    </div>
  );
};

export default SubscriptionForm;

