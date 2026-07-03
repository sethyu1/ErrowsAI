import React, { useState } from 'react';
import { Modal, Button } from 'antd';
import { TagButton } from '../tag-button';
import type { FieldOption } from '../../types';
import { CREATE_ROLE_DICT } from '@/constants';
import styles from './index.module.less';

interface TagsSelectorModalProps {
  value: any[];
  onChange: (value: any[]) => void;
  options: FieldOption[];
  maxSelect: number;
}

/**
 * 标签选择模态框
 */
export function TagsSelectorModal({ value, onChange, options, maxSelect }: TagsSelectorModalProps) {
  const [open, setOpen] = useState(false);
  const [tempSelected, setTempSelected] = useState<string[]>(Array.isArray(value) ? value : []);

  const selectedValues = Array.isArray(value) ? value : [];

  const handleOpen = () => {
    setTempSelected(selectedValues);
    setOpen(true);
  };

  const handleToggle = (optionValue: string) => {
    if (tempSelected.includes(optionValue)) {
      setTempSelected(tempSelected.filter(v => v !== optionValue));
    } else {
      if (tempSelected.length < maxSelect) {
        setTempSelected([...tempSelected, optionValue]);
      }
    }
  };

  const handleOk = () => {
    onChange(tempSelected);
    setOpen(false);
  };

  const handleCancel = () => {
    setTempSelected(selectedValues);
    setOpen(false);
  };

  return (
    <>
      <Button size="large" onClick={handleOpen} className={styles.openButton}>
        {selectedValues.length > 0 
          ? `已选择 ${selectedValues.length} 个标签` 
          : '点击选择标签'}
      </Button>

      <Modal
        title={`选择标签 (最多${maxSelect}个)`}
        open={open}
        onOk={handleOk}
        onCancel={handleCancel}
        width={800}
        okText="确定"
        cancelText="取消"
        className={styles.modal}
      >
        <div className={styles.selectedInfo}>
          已选择: {tempSelected.length} / {maxSelect}
        </div>
        <div className={styles.tagsWrapper}>
          {options.map((option) => (
            <TagButton
              key={option.value}
              selected={tempSelected.includes(option.value)}
              disabled={!tempSelected.includes(option.value) && tempSelected.length >= maxSelect}
              onClick={() => handleToggle(option.value)}
            >
              {CREATE_ROLE_DICT.labels[option.value as keyof typeof CREATE_ROLE_DICT.labels] || option.label || option.value}
            </TagButton>
          ))}
        </div>
      </Modal>
    </>
  );
}

