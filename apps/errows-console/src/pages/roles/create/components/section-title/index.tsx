import React from 'react';
import { Typography } from 'antd';
import { CREATE_ROLE_DICT } from '@/constants';
import styles from './index.module.less';

const { Title } = Typography;

export interface SectionTitleProps {
  /** 标题文本 */
  children: React.ReactNode;
  /** 右侧辅助文字 */
  rightText?: string;
  /** 是否居中 */
  center?: boolean;
  /** 自定义类名 */
  className?: string;
}

/**
 * 表单区块标题组件
 */
export function SectionTitle({ 
  children, 
  rightText, 
  center = false,
  className 
}: SectionTitleProps) {
  if (center && rightText) {
    return (
      <div className={`${styles.sectionTitle} ${styles.centerWithRight} ${className || ''}`}>
        <Title level={5} className={styles.title}>
          {children}
        </Title>
        <span className={styles.rightText}>{CREATE_ROLE_DICT.labels[rightText as keyof typeof CREATE_ROLE_DICT.labels] || rightText}</span>
      </div>
    );
  }

  return (
    <div className={`${styles.sectionTitle} ${center ? styles.center : ''} ${className || ''}`}>
      <Title level={5} className={styles.title}>
        {children}
      </Title>
      {rightText && <span className={styles.rightText}>{rightText}</span>}
    </div>
  );
}

