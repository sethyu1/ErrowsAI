import React from 'react';
import GrafanaIframe from '../components/grafana-iframe';

/**
 * 模型接口调用可视化页面
 * 嵌入 Grafana 图表展示 LLM 接口调用相关数据
 */
const LLMVisualization: React.FC = () => {
  // TODO: 替换为实际的 Grafana URL
  // 环境变量使用 VITE_ 前缀，例如: VITE_GRAFANA_LLM_URL
  const grafanaUrl = import.meta.env.VITE_GRAFANA_LLM_URL || 'https://grafana.example.com/d/llm-dashboard';

  return (
    <GrafanaIframe
      url={grafanaUrl}
      title="模型接口调用"
      height="calc(100vh - 200px)"
    />
  );
};

export default LLMVisualization;

