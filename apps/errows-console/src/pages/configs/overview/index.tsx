import { Card, Row, Col, Empty } from 'antd';
import { RightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router';
import { routes } from '@/routes';
import styles from './index.module.less';

/**
 * 运营配置总览页面
 * 展示所有配置项的快捷入口
 */
const ConfigOverview = () => {
  const navigate = useNavigate();

  // 获取运营配置下的所有子项
  const configsRoute = routes.find(route => route.path === '/configs');
  const configItems = configsRoute?.children || [];

  if (!configItems || configItems.length === 0) {
    return <Empty description="暂无配置项" />;
  }

  const handleCardClick = (path: string) => {
    navigate(path);
  };

  return (
    <div className={styles.wrapper}>
      <Row gutter={[20, 20]}>
        {configItems.map((item) => (
          <Col key={item.path} xs={24} sm={12} lg={8} xl={6}>
            <div
              className={styles.configCard}
              onClick={() => handleCardClick(item.path)}
            >
              <div className={styles.cardContent}>
                {item.icon && <div className={styles.icon}>{item.icon}</div>}
                <h3 className={styles.name}>{item.name}</h3>
              </div>
              <div className={styles.arrow}>
                <RightOutlined />
              </div>
            </div>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default ConfigOverview;

