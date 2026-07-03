import React, { useState, useEffect } from "react";
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Radio,
  Input,
  Avatar,
  Typography,
  message,
  Tag,
  Switch,
  Select,
  Tooltip,
} from "antd";
import { EyeOutlined, AuditOutlined, EditOutlined } from "@ant-design/icons";
import { usePermission } from "@/hooks/permission";
import { fetchOPSRolesApi, updateOPSRoleStatusApi, updateOPSRoleIsOfficialApi, updateOPSRoleDefaultOrderApi } from '@/apis'
import type { ColumnsType } from "antd/es/table";
import { RoleDetailModal, RoleEditModal } from "./components";
import styles from "./index.module.less";

const { Text, Paragraph } = Typography;

const SortCell: React.FC<{
  value: number | null | undefined;
  record: RoleItem;
  canEdit: boolean;
  onUpdate: (roleId: string, default_order: number) => void;
}> = ({ value, record, canEdit, onUpdate }) => {
  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState(String(value ?? ""));

  const handleBlur = () => {
    setEditing(false);
    const num = parseInt(inputValue, 10);
    if (!Number.isNaN(num) && num !== (value ?? null)) {
      onUpdate(record.id, num);
    } else {
      setInputValue(String(value ?? ""));
    }
  };

  if (!canEdit) {
    return <Text>{value ?? ""}</Text>;
  }
  if (editing) {
    return (
      <Input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onBlur={handleBlur}
        onPressEnter={handleBlur}
        autoFocus
        size="small"
        style={{ width: 64 }}
      />
    );
  }
  return (
    <Text
      style={{ cursor: "pointer" }}
      onClick={() => {
        setEditing(true);
        setInputValue(String(value ?? ""));
      }}
    >
      {value ?? "-"}
    </Text>
  );
};

const STATUS_MAP: Record<string, { color: string; text: string }> = {
  private: { color: "orange", text: "待审核" },
  public: { color: "green", text: "已通过" },
  rejected: { color: "red", text: "未通过" },
};

interface RoleItem {
  id: string;
  social: {
    comments_count: number;
    likes_count: number;
    followed_count: number;
    posted_count: number;
    dialogues_count: number;
    video_count: number;
    intimacy_score: number;
  };
  introduction: string;
  age: string;
  race: string;
  type: string;
  gender: string;
  nickname: string;
  assortment: string;
  description: string;
  liked: boolean;
  followed: boolean;
  created_at: string;
  updated_at: string;
  default_order?: number | null;
  avatar_url: string;
  status: string;
  ncover?: number | null;
  is_official: boolean;
  owner: {
    id: string;
    name: string;
    avatar: string | null;
  };
}

const RoleList: React.FC = () => {
  const { hasPermission } = usePermission();
  const [modalOpen, setModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleItem | null>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState("");
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // 加载角色列表
  const loadRoles = async (page = 1, pageSize = 10, search = "") => {
    try {
      setLoading(true);
      const response = await fetchOPSRolesApi({
        q: search || undefined,
        page: page - 1,
        size: pageSize,
      });

      setRoles((response?.data || []) as any);
      setPagination({
        current: page,
        pageSize,
        total: response?.count || 0,
      });
    } catch (error) {
      console.error("Failed to load roles:", error);
      message.error("加载角色列表失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoles(1, 10);
  }, []);

  // 打开审核弹窗
  const handleOpenModal = (role: RoleItem) => {
    setSelectedRole(role);
    form.resetFields();
    setModalOpen(true);
  };

  // 打开详情弹窗
  const handleOpenDetail = (role: RoleItem) => {
    setSelectedRole(role);
    setDetailModalOpen(true);
  };

  const handleOpenEdit = (role: RoleItem) => {
    setSelectedRole(role);
    setEditModalOpen(true);
  };

  const handleEditSuccess = () => {
    loadRoles(pagination.current, pagination.pageSize, searchText);
  };

  // 关闭审核弹窗
  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedRole(null);
    form.resetFields();
  };

  // 提交审核
  const handleSubmitReview = async () => {
    try {
      const values = await form.validateFields();

      if (!selectedRole?.id) {
        message.error("未选择角色");
        return;
      }

      // 将表单的 status 转换为 API 接受的状态
      // approved -> public, rejected -> rejected
      const apiStatus: 'public' | 'rejected' =
        values.status === 'approved' ? 'public' : 'rejected';

      // 调用更新状态API
      await updateOPSRoleStatusApi(selectedRole.id, apiStatus, values.reason);

      message.success(
        apiStatus === 'public' ? '角色已审核通过' : '角色已驳回'
      );

      handleCloseModal();

      // 重新加载列表
      loadRoles(pagination.current, pagination.pageSize, searchText);
    } catch (error: any) {
      console.error("审核失败:", error);
      message.error(error?.message || "审核提交失败，请重试");
    }
  };

  // 过滤角色数据
  const handleSearch = (value: string) => {
    setSearchText(value);
    loadRoles(1, pagination.pageSize, value);
  };

  // 处理分页变化
  const handleTableChange = (newPagination: any) => {
    loadRoles(newPagination.current, newPagination.pageSize, searchText);
  };


  const handleUpdateDefaultOrder = async (roleId: string, default_order: number) => {
    try {
      await updateOPSRoleDefaultOrderApi(roleId, default_order);
      message.success("Sort value updated");
      setRoles(prevRoles =>
        prevRoles.map(role =>
          role.id === roleId ? { ...role, default_order } : role
        )
      );
    } catch (error: any) {
      console.error("Update sort failed:", error);
      message.error(error?.message || "Update failed");
    }
  };

  const handleUpdateIsOfficial = async (roleId: string, is_official: boolean) => {
    try {
      await updateOPSRoleIsOfficialApi(roleId, is_official);
      message.success("官方认证状态更新成功");
      setRoles(prevRoles =>
        prevRoles.map(role =>
          role.id === roleId ? { ...role, is_official } : role
        )
      );
    } catch (error: any) {
      console.error("更新官方认证状态失败:", error);
      message.error(error?.message || "更新失败，请重试");
    }
  };

  const columns: ColumnsType<RoleItem> = [
    {
      title: "头像",
      dataIndex: "avatar_url",
      width: 80,
      align: 'center',
      render: (url: string) => (
        <Avatar src={url} size={48} />
      ),
    },
    {
      title: "角色名称",
      dataIndex: "nickname",
      width: 150,
      align: 'center',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: "创建者",
      dataIndex: "owner",
      width: 120,
      align: 'center',
      render: (owner: RoleItem['owner']) => (
        <Space>
          <Avatar src={owner?.avatar} size={24}>
            {owner?.name?.[0]?.toUpperCase()}
          </Avatar>
          <Text>{owner?.name}</Text>
        </Space>
      ),
    },
    {
      title: "状态",
      dataIndex: "status",
      width: 100,
      align: 'center',
      render: (status: string) => {
        const config = STATUS_MAP[status] || { color: "default", text: '未知状态' };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: "官方角色",
      dataIndex: "is_official",
      width: 100,
      align: 'center',
      render: (is_official: boolean, record: RoleItem) => {
        const canEdit = hasPermission("roles_review");

        return (
          <Switch
            checked={!!is_official}
            disabled={!canEdit}
            checkedChildren="yes"
            unCheckedChildren="no"
            onChange={(checked) => handleUpdateIsOfficial(record.id, checked)}
          />
        );
      }
    },
    {
      title: "创建时间",
      dataIndex: "created_at",
      width: 180,
      align: 'center',
      render: (time: string) => new Date(time).toLocaleString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }),
    },
    {
      title: (
        <Tooltip title="Higher numbers appear first. Set values in descending order (e.g. 100, 50, 10) for the desired display sequence.">
          <span style={{ cursor: "help", borderBottom: "1px dotted rgba(0,0,0,0.2)" }}>Sort</span>
        </Tooltip>
      ),
      dataIndex: "default_order",
      width: 100,
      align: 'center',
      render: (default_order: number | null | undefined, record: RoleItem) => (
        <SortCell
          value={default_order}
          record={record}
          canEdit={hasPermission("roles_review")}
          onUpdate={handleUpdateDefaultOrder}
        />
      ),
    },
    {
      title: "操作",
      key: "action",
      width: 160,
      align: 'center',
      fixed: "right",
      render: (_: unknown, record: RoleItem) => (
        <Space size="middle">
          <Tooltip title="Detail">
            <Button
              type="text"
              icon={<EyeOutlined style={{ fontSize: 18 }} />}
              onClick={() => handleOpenDetail(record)}
              style={{ padding: "6px 10px", minWidth: 40 }}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined style={{ fontSize: 18 }} />}
              disabled={!hasPermission("roles_review")}
              onClick={() => handleOpenEdit(record)}
              style={{ padding: "6px 10px", minWidth: 40 }}
            />
          </Tooltip>
          <Tooltip title="Review">
            <Button
              type="text"
              icon={<AuditOutlined style={{ fontSize: 18 }} />}
              disabled={!hasPermission("roles_review")}
              onClick={() => handleOpenModal(record)}
              style={{ padding: "6px 10px", minWidth: 40 }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* 角色列表 */}
      <Card
        title="角色列表"
        extra={
          <Space>
            <Input.Search
              placeholder="搜索角色名称"
              allowClear
              style={{ width: 250 }}
              onChange={(e) => setSearchText(e.target.value)}
              onSearch={handleSearch}
            />
          </Space>
        }
      >
        <Table
          className={styles.rolesTable}
          rowKey="id"
          columns={columns}
          dataSource={roles}
          loading={loading}
          size="small"
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            pageSizeOptions: ["10", "20", "50", "100"],
          }}
          onChange={handleTableChange}
          scroll={{ x: 930 }}
        />
      </Card>

      {/* 审核弹窗 */}
      <Modal
        title="角色审核"
        open={modalOpen}
        onOk={handleSubmitReview}
        onCancel={handleCloseModal}
        okText="提交"
        cancelText="取消"
        width={600}
      >
        {selectedRole && (
          <div>
            {/* 角色信息展示 */}
            <div style={{ marginBottom: 24, textAlign: 'center' }}>
              <Avatar src={selectedRole.avatar_url} size={80} />
              <div style={{ marginTop: 12 }}>
                <Text strong style={{ fontSize: 18 }}>
                  {selectedRole.nickname}
                </Text>
              </div>
            </div>

            {/* 审核表单 */}
            <Form
              form={form}
              layout="vertical"
              autoComplete="off"
            >
              <Form.Item
                name="status"
                label="审核结果"
                rules={[{ required: true, message: "请选择审核结果" }]}
              >
                <Radio.Group>
                  <Radio value="approved">通过</Radio>
                  <Radio value="rejected">不通过</Radio>
                </Radio.Group>
              </Form.Item>

              <Form.Item
                noStyle
                shouldUpdate={(prevValues, currentValues) =>
                  prevValues.status !== currentValues.status
                }
              >
                {({ getFieldValue }) => {
                  const status = getFieldValue("status");
                  return status === "rejected" ? (
                    <Form.Item
                      name="reason"
                      label="不通过理由"
                      rules={[
                        { required: true, message: "请输入不通过理由" },
                      ]}
                    >
                      <Input.TextArea
                        placeholder="请输入不通过理由"
                        rows={4}
                        maxLength={500}
                        showCount
                      />
                    </Form.Item>
                  ) : null;
                }}
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>

      {selectedRole && (
        <RoleDetailModal
          open={detailModalOpen}
          onClose={() => {
            setDetailModalOpen(false);
            setSelectedRole(null);
          }}
          role={selectedRole}
        />
      )}
      {selectedRole && (
        <RoleEditModal
          open={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setSelectedRole(null);
          }}
          roleId={selectedRole.id}
          roleName={selectedRole.nickname}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
};

export default RoleList;
