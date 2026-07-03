import { useState, useEffect } from 'react';
import { Card, Alert, Input, Tag, Space, Button, Empty, message } from 'antd';
import { CloseOutlined, SearchOutlined } from '@ant-design/icons';
import { getGenerateParamsApi, updateKeywordsConfigApi } from '@/apis/generate-params';
import { usePermission } from '@/hooks/permission';
import styles from './index.module.less';

const CONFIG_RULES = [
  "关键词之间，用英文逗号分隔；关键词可重复",
  "双击关键词可进行编辑，直接修改关键词；最后单击文本输入框以外，自动保存，实时生效",
  "关键词可以支持精确匹配搜索"
];

interface KeywordItem {
  id: string;
  text: string;
  isEditing?: boolean;
}

const KeywordsConfig = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [keywords, setKeywords] = useState<KeywordItem[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const { hasPermission } = usePermission();

  // 初始化加载数据
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const response = await getGenerateParamsApi();
        const list = Array.isArray(response) ? response : [];
        setKeywords(list.map((keyword, index) => ({
          id: `${index}-${keyword}`,
          text: keyword,
        })));
      } catch (error) {
        console.error('Failed to load generate params:', error);
        messageApi.error('加载配置失败');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [messageApi]);

  // 处理输入框回车
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      addKeyword();
    }
  };

  // 添加关键词
  const addKeyword = () => {
    if (!hasPermission('configs_image_params_edit')) {
      messageApi.warning('无权限执行此操作');
      return;
    }
    const trimmedValue = inputValue.trim();
    if (!trimmedValue) {
      messageApi.warning('请输入关键词');
      return;
    }

    // 检查是否已存在
    if (keywords.some(k => k.text === trimmedValue)) {
      messageApi.warning('该关键词已存在');
      return;
    }

    const newKeyword: KeywordItem = {
      id: `${Date.now()}-${trimmedValue}`,
      text: trimmedValue,
    };

    setKeywords([...keywords, newKeyword]);
    setInputValue('');
  };

  // 删除关键词
  const deleteKeyword = (id: string) => {
    if (!hasPermission('configs_image_params_edit')) {
      messageApi.warning('无权限执行此操作');
      return;
    }
    setKeywords(keywords.filter(k => k.id !== id));
  };

  // 编辑关键词
  const editKeyword = (id: string) => {
    setKeywords(keywords.map(k => 
      k.id === id ? { ...k, isEditing: true } : k
    ));
  };

  // 保存编辑的关键词
  const saveEditKeyword = (id: string, newText: string) => {
    if (!hasPermission('configs_image_params_edit')) {
      messageApi.warning('无权限执行此操作');
      return;
    }
    const trimmedValue = newText.trim();
    
    if (!trimmedValue) {
      messageApi.warning('关键词不能为空');
      return;
    }

    // 检查是否有重复
    const isDuplicate = keywords.some(k => 
      k.id !== id && k.text === trimmedValue
    );

    if (isDuplicate) {
      messageApi.warning('该关键词已存在');
      return;
    }

    setKeywords(keywords.map(k => 
      k.id === id ? { ...k, text: trimmedValue, isEditing: false } : k
    ));
  };

  // 处理标签编辑
  const handleTagEdit = (id: string, value: string) => {
    setKeywords(keywords.map(k => 
      k.id === id ? { ...k, text: value } : k
    ));
  };

  // 高亮搜索关键词
  const highlightKeyword = (text: string, search: string) => {
    if (!search.trim()) return text;

    const regex = new RegExp(`(${search})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) => {
      if (part.toLowerCase() === search.toLowerCase()) {
        return (
          <span key={index} className={styles.highlight}>
            {part}
          </span>
        );
      }
      return part;
    });
  };

  // 过滤搜索结果
  const filteredKeywords = searchValue.trim() 
    ? keywords.filter(k => k.text.toLowerCase().includes(searchValue.toLowerCase()))
    : keywords;

  // 保存配置
  const handleSave = async () => {
    try {
      setSaveLoading(true);
      const keywordsList = keywords.map(k => k.text);
      await updateKeywordsConfigApi({ keywords: keywordsList });
      messageApi.success('配置保存成功');
    } catch (error) {
      console.error('Failed to save keywords:', error);
      messageApi.error('保存失败，请重试');
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <Card
      loading={loading}
      styles={{
        body: {
          padding: 12,
        }
      }}
    >
      {contextHolder}

      {/* 配置说明 */}
      <Alert
        message="配置说明"
        description={
          <ol style={{ margin: 0, paddingLeft: 20 }}>
            {CONFIG_RULES.map((rule, index) => (
              <li key={index} style={{ marginBottom: 4 }}>
                {rule}
              </li>
            ))}
          </ol>
        }
        type="info"
        showIcon
        closable
        style={{ marginBottom: 16 }}
      />

      <div className={styles.container}>
        {/* 搜索框 */}
        <div className={styles.searchSection}>
          <Input
            placeholder="关键词搜索"
            prefix={<SearchOutlined />}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            allowClear
            size="large"
            className={styles.searchInput}
          />
        </div>

        {/* 输入框 */}
        <div className={styles.inputSection}>
            <Input
              placeholder="输入关键词，按 Enter 添加"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleInputKeyDown}
              size="large"
              className={styles.keywordInput}
              disabled={!hasPermission('configs_image_params_edit')}
            />
          <Button
            type="primary"
            onClick={addKeyword}
            size="large"
            className={styles.addButton}
            disabled={!hasPermission('configs_image_params_edit')}
          >
            添加关键词
          </Button>
        </div>

        {/* 关键词标签区域 */}
        <div className={styles.tagSection}>
          {filteredKeywords.length > 0 ? (
            <Space wrap size={[8, 8]}>
              {filteredKeywords.map(keyword => (
                <div
                  key={keyword.id}
                  className={styles.tagWrapper}
                >
                  {keyword.isEditing ? (
                    <Input
                      autoFocus
                      size="small"
                      value={keyword.text}
                      onChange={(e) => handleTagEdit(keyword.id, e.target.value)}
                      onBlur={() => saveEditKeyword(keyword.id, keyword.text)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          saveEditKeyword(keyword.id, keyword.text);
                        } else if (e.key === 'Escape') {
                          setKeywords(keywords.map(k => 
                            k.id === keyword.id ? { ...k, isEditing: false } : k
                          ));
                        }
                      }}
                      className={styles.editInput}
                    />
                  ) : (
                    <Tag
                      onDoubleClick={() => {
                        if (hasPermission('configs_image_params_edit')) {
                          editKeyword(keyword.id);
                        }
                      }}
                      closeIcon={hasPermission('configs_image_params_edit') ? <CloseOutlined /> : null}
                      onClose={() => deleteKeyword(keyword.id)}
                      color="blue"
                      className={styles.keywordTag}
                      style={{
                        cursor: hasPermission('configs_image_params_edit') ? 'pointer' : 'default',
                        opacity: hasPermission('configs_image_params_edit') ? 1 : 0.6
                      }}
                    >
                      {highlightKeyword(keyword.text, searchValue)}
                    </Tag>
                  )}
                </div>
              ))}
            </Space>
          ) : (
            <Empty
              description={searchValue ? '未找到匹配的关键词' : '暂无关键词'}
              style={{ padding: '40px 0' }}
            />
          )}
        </div>

        {/* 底部按钮 */}
        <div className={styles.footer}>
          <Space>
            <Button onClick={() => setInputValue('')} disabled={saveLoading}>
              取消
            </Button>
            <Button
              type="primary"
              loading={saveLoading}
              onClick={handleSave}
              disabled={!hasPermission('configs_image_params_edit')}
            >
              保存
            </Button>
          </Space>
        </div>
      </div>
    </Card>
  );
};

export default KeywordsConfig;

