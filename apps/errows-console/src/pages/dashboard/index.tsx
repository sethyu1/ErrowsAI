import React from 'react';
import { Card, Col, Row, Statistic } from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  FileTextOutlined,
  PictureOutlined,
} from '@ant-design/icons';

const Dashboard: React.FC = () => {
  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="用户总数"
              value={11280}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="角色总数"
              value={1893}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="帖子总数"
              value={8846}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="媒体文件"
              value={23456}
              prefix={<PictureOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="最近注册用户">
            <p>暂无数据</p>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="最近创建角色">
            <p>暂无数据</p>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
