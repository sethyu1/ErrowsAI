import React from 'react';
import { Card } from 'antd';
import { CheckCircleFilled } from '@ant-design/icons';
import type { FieldOption } from '../../types';
import { CREATE_ROLE_DICT } from '@/constants';
import styles from './index.module.less';

interface ImageSelectorLargeProps {
  options: FieldOption[];
  value: any;
  onChange: (value: any) => void;
}

/**
 * 大尺寸图片选择器
 * 用于 type (style) 字段等需要大图展示的场景
 */
export function ImageSelectorLarge({ options, value, onChange }: ImageSelectorLargeProps) {
  return (
    <div className={styles.container}>
      {options.map((option) => {
        const isSelected = value === option.value;        
        return (
          <Card
            key={option.value}
            hoverable
            className={`${styles.imageCard} ${isSelected ? styles.selected : ''}`}
            onClick={() => onChange(option.value)}
            cover={
              <div className={styles.imageWrapper}>
                <img
                  src={option.url}
                  alt={option.label || option.value}
                  className={styles.image}
                />
                {isSelected && (
                  <div className={styles.selectedOverlay}>
                    <CheckCircleFilled className={styles.checkIcon} />
                  </div>
                )}
              </div>
            }
          >
            <Card.Meta
              title={
                <div className={styles.title}>
                  {CREATE_ROLE_DICT.labels[option.value as keyof typeof CREATE_ROLE_DICT.labels] || option.label || option.value}
                </div>
              }
            />
          </Card>
        );
      })}
    </div>
  );
}

