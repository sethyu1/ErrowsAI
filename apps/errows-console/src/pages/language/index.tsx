import { useState, useEffect, useCallback } from 'react';
import { Card, Button, Space, message, Alert, Checkbox, InputNumber } from 'antd';
import { useNavigate } from 'react-router';
import { getLanguageConfigApi, updateLanguageConfigApi } from '@/apis/language';
import styles from './index.module.less';

// 配置说明
const CONFIG_RULES = [
  '语言顺序为前台页面显示顺序',
  '英语为默认语言，不可修改和删除',
  '语言包保存后英时生效，可多选',
];

const LanguagePage = () => {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [languages, setLanguages] = useState<API.Language.LanguageConfig[]>([]);
  const [originalLanguages, setOriginalLanguages] = useState<API.Language.LanguageConfig[]>([]);

  // 获取语言配置列表
  const fetchLanguages = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getLanguageConfigApi();
      const sortedLanguages = response.sort((a, b) => a.order - b.order);
      setLanguages(sortedLanguages);
      setOriginalLanguages(JSON.parse(JSON.stringify(sortedLanguages)));
    } catch (error) {
      messageApi.error('获取语言配置失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [messageApi]);

  useEffect(() => {
    fetchLanguages();
  }, [fetchLanguages]);

  // 处理勾选变化
  const handleCheckChange = (code: string, checked: boolean) => {
    setLanguages(prev =>
      prev.map(lang =>
        lang.code === code ? { ...lang, enabled: checked } : lang
      )
    );
  };

  // 处理顺序变化
  const handleOrderChange = (code: string, order: number | null) => {
    if (order === null || order < 0) return;
    
    setLanguages(prev =>
      prev.map(lang =>
        lang.code === code ? { ...lang, order } : lang
      )
    );
  };

  // 保存配置
  const handleSave = async () => {
    try {
      setSaveLoading(true);

      // 验证顺序是否有重复
      const orders = languages.map(l => l.order);
      const uniqueOrders = new Set(orders);
      if (orders.length !== uniqueOrders.size) {
        messageApi.warning('显示顺序不能重复，请调整后再保存');
        return;
      }

      // 验证顺序是否为有效数字
      const hasInvalidOrder = languages.some(l => 
        typeof l.order !== 'number' || l.order < 0
      );
      if (hasInvalidOrder) {
        messageApi.warning('显示顺序必须是大于等于0的数字');
        return;
      }

      // 调用 API 保存
      await updateLanguageConfigApi({ languages });
      
      messageApi.success('保存成功');
      
      // 更新原始数据
      setOriginalLanguages(JSON.parse(JSON.stringify(languages)));
    } catch (error) {
      console.error('保存失败:', error);
      const errorMsg = error instanceof Error ? error.message : '保存失败，请重试';
      messageApi.error(errorMsg);
    } finally {
      setSaveLoading(false);
    }
  };

  // 取消编辑
  const handleCancel = () => {
    // 重置到原始数据
    setLanguages(JSON.parse(JSON.stringify(originalLanguages)));
    messageApi.info('已取消编辑');
    // 返回运营配置总览页
    navigate('/configs');
  };

  return (
    <div className={styles.wrapper}>
      {contextHolder}
      <Card
        className={styles.card}
        title="多语言配置"
        loading={loading}
      >
        {/* 配置说明 */}
        <div className={styles.configSection}>
          <Alert
            message="配置说明："
            description={
              <ol className={styles.rules}>
                {CONFIG_RULES.map((rule, index) => (
                  <li key={index}>{rule}</li>
                ))}
              </ol>
            }
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />
        </div>

        {/* 语言配置表格 */}
        <div className={styles.languageTable}>
          <div className={styles.tableHeader}>
            <div className={styles.col}></div>
            <div className={styles.col}>语言包名称：</div>
            <div className={styles.col}>显示顺序：</div>
          </div>

          <div className={styles.tableBody}>
            {languages.map((lang) => (
              <div
                key={lang.code}
                className={`${styles.languageRow} ${lang.isDefault ? styles.disabled : ''}`}
              >
                <div className={styles.col}>
                  <Checkbox
                    checked={lang.enabled}
                    disabled={lang.isDefault}
                    onChange={(e) => handleCheckChange(lang.code, e.target.checked)}
                  />
                </div>
                <div className={styles.col}>
                  {lang.name}
                  {lang.isDefault && (
                    <span className={styles.defaultBadge}>默认</span>
                  )}
                </div>
                <div className={styles.col}>
                  <InputNumber
                    value={lang.order}
                    min={0}
                    precision={0}
                    onChange={(value) => handleOrderChange(lang.code, value)}
                    disabled={lang.isDefault}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 操作按钮 */}
        <div className={styles.buttonGroup}>
          <Space>
            <Button onClick={handleCancel} disabled={saveLoading}>
              取 消
            </Button>
            <Button type="primary" loading={saveLoading} onClick={handleSave}>
              保 存
            </Button>
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default LanguagePage;

