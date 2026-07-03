import React from 'react';
import styles from './index.module.less';

export interface GrafanaIframeProps {
  /**
   * Grafana 图表 URL
   * 例如: https://grafana.example.com/d/xxx/xxx?orgId=1
   */
  url: string;
  /**
   * iframe 标题
   */
  title?: string;
  /**
   * iframe 宽度，默认 100%
   */
  width?: string | number;
  /**
   * iframe 高度，默认 100%
   */
  height?: string | number;
  /**
   * 是否显示边框，默认 false
   */
  frameBorder?: boolean;
  /**
   * 是否允许全屏，默认 true
   */
  allowFullScreen?: boolean;
  /**
   * 是否启用沙箱模式，默认 false
   */
  sandbox?: string;
  /**
   * 其他 iframe 属性
   */
  [key: string]: any;
}

/**
 * Grafana iframe 组件
 * 统一封装 Grafana 图表的 iframe 嵌入方式
 */
const GrafanaIframe: React.FC<GrafanaIframeProps> = ({
  url,
  title,
  width = '100%',
  height = '100%',
  frameBorder = false,
  allowFullScreen = true,
  sandbox,
  ...restProps
}) => {
  // 构建 iframe 的 src URL，添加 Grafana 常用参数
  const buildGrafanaUrl = (baseUrl: string): string => {
    try {
      const urlObj = new URL(baseUrl);
      
      // 添加 Grafana iframe 常用参数
      // kiosk=tv 表示 TV 模式，隐藏顶部导航栏
      // theme=light 或 dark，根据需求设置主题
      if (!urlObj.searchParams.has('kiosk')) {
        urlObj.searchParams.set('kiosk', 'tv');
      }
      
      // 如果 URL 中没有 theme 参数，可以根据需要设置默认主题
      // urlObj.searchParams.set('theme', 'light');
      
      return urlObj.toString();
    } catch (error) {
      console.error('Invalid Grafana URL:', error);
      return baseUrl;
    }
  };

  const iframeUrl = buildGrafanaUrl(url);

  return (
    <div className={styles.grafanaIframeWrapper}>
      <iframe
        src={iframeUrl}
        title={title || 'Grafana Dashboard'}
        width={width}
        height={height}
        frameBorder={frameBorder ? '1' : '0'}
        allowFullScreen={allowFullScreen}
        sandbox={sandbox}
        className={styles.grafanaIframe}
        {...restProps}
      />
    </div>
  );
};

export default GrafanaIframe;

