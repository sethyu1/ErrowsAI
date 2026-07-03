import React, { useEffect, useState } from "react";
import { Modal, Avatar, Image, Card, Row, Col, Button, Tag, Statistic } from "antd";
import {
  UserOutlined,
  HeartOutlined,
  MessageOutlined,
  PictureOutlined,
  VideoCameraOutlined,
  DownOutlined,
  UpOutlined,
  HeartFilled,
} from "@ant-design/icons";
import { fetchCharacterDetailApi } from '@/apis'
import styles from "./index.module.less";

interface RoleDetailModalProps {
  open: boolean;
  onClose: () => void;
  role: {
    id: string;
    nickname: string;
    avatar_url: string;
    description: string;
    introduction: string;
    type: string;
    gender: string;
    age: string;
    race: string;
    assortment: string;
    status: string;
    created_at: string;
    updated_at: string;
    social: {
      comments_count: number;
      likes_count: number;
      followed_count: number;
      posted_count: number;
      dialogues_count: number;
      video_count: number;
      intimacy_score: number;
    };
    owner: {
      id: string;
      name: string;
      avatar: string | null;
    };
  };
}

const RoleDetailModal: React.FC<RoleDetailModalProps> = ({
  open,
  onClose,
  role,
}) => {
  const [descExpanded, setDescExpanded] = useState(false);
  const [roleDetail, setRoleDetail] = useState<API.Character.CHARACTER | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const roleInfo = roleDetail || role;
  const description = roleInfo.introduction || roleInfo.description;
  const social = roleInfo.social ?? { comments_count: 0, likes_count: 0, followed_count: 0, posted_count: 0, dialogues_count: 0, video_count: 0, intimacy_score: 0 };
  const owner = roleInfo.owner ?? { id: '', name: 'Unknown', avatar: null };

  const getStatusTag = () => {
    const statusMap = {
      private: { color: 'orange', text: '待审核' },
      public: { color: 'green', text: '已通过' },
      rejected: { color: 'red', text: '未通过' },
    };
    const config = statusMap[roleInfo.status as keyof typeof statusMap] || { color: 'default', text: roleInfo.status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  useEffect(() => {
    if (roleInfo.id && open) {
      setLoadError(null);
      fetchCharacterDetailApi(roleInfo.id)
        .then((res) => {
          setRoleDetail(res);
          setLoadError(null);
        })
        .catch((err) => {
          setLoadError(err?.message || 'Failed to load character detail');
        });
    }
  }, [roleInfo.id, open]);

  return (
    <Modal
      title="角色详情"
      open={open}
      onCancel={onClose}
      footer={null}
      width={900}
      className={styles.roleDetailModal}
    >
      <div className={styles.container}>
        {/* 头部区域：角色名称和状态 */}
        <div className={styles.header}>
          <h2 className={styles.roleName}>{roleInfo.nickname}</h2>
          {getStatusTag()}
        </div>

        {/* 角色头像 - 使用 Image 组件支持预览 */}
        <div className={styles.imageSection}>
          <Image
            src={roleInfo.avatar_url}
            alt={roleInfo.nickname}
            className={styles.roleImage}
            preview={{
              mask: '点击查看大图',
            }}
          />
        </div>

        {loadError && (
          <div style={{ color: '#ff4d4f', marginBottom: 16 }}>{loadError}</div>
        )}
        {/* 社交数据统计 */}
        <Card className={styles.statsCard} size="small">
          <Row gutter={[16, 16]}>
            <Col span={4}>
              <Statistic
                title="关注"
                value={social.followed_count}
                prefix={<UserOutlined />}
                valueStyle={{ fontSize: 16 }}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="点赞"
                value={social.likes_count}
                prefix={<HeartOutlined />}
                valueStyle={{ fontSize: 16, color: '#ff4d4f' }}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="图片"
                value={social.posted_count}
                prefix={<PictureOutlined />}
                valueStyle={{ fontSize: 16 }}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="对话"
                value={social.dialogues_count}
                prefix={<MessageOutlined />}
                valueStyle={{ fontSize: 16 }}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="视频"
                value={social.video_count}
                prefix={<VideoCameraOutlined />}
                valueStyle={{ fontSize: 16 }}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="亲密度"
                value={social.intimacy_score}
                prefix={<HeartFilled />}
                valueStyle={{ fontSize: 16, color: '#eb2f96' }}
              />
            </Col>
          </Row>
        </Card>

        {/* 描述区域 - 默认收起 */}
        {description && (
          <Card className={styles.descCard} size="small">
            <div className={styles.descHeader}>
              <h4>角色描述</h4>
              <Button
                type="link"
                size="small"
                onClick={() => setDescExpanded(!descExpanded)}
                icon={descExpanded ? <UpOutlined /> : <DownOutlined />}
              >
                {descExpanded ? '收起' : '展开'}
              </Button>
            </div>
            {descExpanded && (
              <div className={styles.descContent}>
                {description}
              </div>
            )}
          </Card>
        )}

        {/* 基本信息 */}
        <Card title="基本信息" className={styles.infoCard} size="small">
          <Row gutter={[16, 12]}>
            <Col span={8}>
              <div className={styles.infoItem}>
                <span className={styles.label}>类型：</span>
                <Tag color="blue">{roleInfo.type}</Tag>
              </div>
            </Col>
            <Col span={8}>
              <div className={styles.infoItem}>
                <span className={styles.label}>性别：</span>
                <span className={styles.value}>{roleInfo.gender}</span>
              </div>
            </Col>
            <Col span={8}>
              <div className={styles.infoItem}>
                <span className={styles.label}>年龄：</span>
                <span className={styles.value}>{roleInfo.age}</span>
              </div>
            </Col>
            <Col span={12}>
              <div className={styles.infoItem}>
                <span className={styles.label}>种族：</span>
                <span className={styles.value}>{roleInfo.assortment}</span>
              </div>
            </Col>
            <Col span={12}>
              <div className={styles.infoItem}>
                <span className={styles.label}>角色ID：</span>
                <span className={styles.value} style={{ fontSize: 12, fontFamily: 'monospace' }}>{roleInfo.id}</span>
              </div>
            </Col>
          </Row>
        </Card>

        {/* 创建者信息 */}
        <Card title="创建者" className={styles.ownerCard} size="small">
          <div className={styles.ownerContent}>
            <Avatar src={owner.avatar} size={48}>
              {owner.name?.[0]?.toUpperCase()}
            </Avatar>
            <div className={styles.ownerInfo}>
              <div className={styles.ownerName}>{owner.name}</div>
              <div className={styles.ownerId}>ID: {owner.id || '-'}</div>
            </div>
          </div>
        </Card>

        {/* 时间信息 */}
        <Card title="时间信息" className={styles.timeCard} size="small">
          <Row gutter={[16, 12]}>
            <Col span={12}>
              <div className={styles.timeItem}>
                <span className={styles.timeLabel}>创建时间：</span>
                <div className={styles.timeValue}>
                  {new Date(roleInfo.created_at).toLocaleString('zh-CN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  })}
                </div>
              </div>
            </Col>
            <Col span={12}>
              <div className={styles.timeItem}>
                <span className={styles.timeLabel}>更新时间：</span>
                <div className={styles.timeValue}>
                  {new Date(roleInfo.updated_at).toLocaleString('zh-CN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  })}
                </div>
              </div>
            </Col>
          </Row>
        </Card>
      </div>
    </Modal>
  );
};

export default RoleDetailModal;

