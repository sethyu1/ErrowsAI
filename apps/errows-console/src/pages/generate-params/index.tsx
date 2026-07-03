import { useState } from 'react';
import { Tabs, Card } from 'antd';
import { KeywordsConfig, ProbabilityConfig, ModelCostConfig, CoinSettingsConfig, AiEndpointsConfig } from './components';
import styles from './index.module.less';

type TabKey = 'model-cost' | 'coin-settings' | 'ai-endpoints' | 'keywords' | 'probability';

interface TabItem {
  key: TabKey;
  label: string;
  children: React.ReactNode;
}

const tabs: TabItem[] = [
  { key: 'model-cost', label: '模型消耗配置', children: <ModelCostConfig /> },
  { key: 'coin-settings', label: '代币规则', children: <CoinSettingsConfig /> },
  { key: 'ai-endpoints', label: 'AI 服务地址', children: <AiEndpointsConfig /> },
  { key: 'keywords', label: '聊天随机生图关键词配置', children: <KeywordsConfig /> },
  { key: 'probability', label: '聊天随机生图概率配置', children: <ProbabilityConfig /> },
];

const GenerateParams = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('model-cost');

  return (
    <div className={styles.wrapper}>
      <Card
        className={styles.card}
        styles={{ body: { padding: 12 } }}
      >
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as TabKey)}
          items={tabs.map((tab) => ({
            key: tab.key,
            label: tab.label,
            children: tab.children,
          }))}
        />
      </Card>
    </div>
  );
};

export default GenerateParams;
