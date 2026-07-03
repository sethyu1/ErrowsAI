import React from 'react';
import GrafanaIframe from '../components/grafana-iframe';

/**
 * 用户登录信息可视化页面
 * 嵌入 Grafana 图表展示用户登录相关数据
 */
const UserVisualization: React.FC = () => {
  // TODO: 替换为实际的 Grafana URL
  // 环境变量使用 VITE_ 前缀，例如: VITE_GRAFANA_USER_URL
  const grafanaUrl = import.meta.env.VITE_GRAFANA_USER_URL || 'https://grafana.example.com/d/user-dashboard';

  return (
    <GrafanaIframe
      url={grafanaUrl}
      title="用户登录信息"
      height="calc(100vh - 200px)"
    />
  );
};

export default UserVisualization;

