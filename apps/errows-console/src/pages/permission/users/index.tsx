import React, { useState } from "react";
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Tag,
  Popconfirm,
  Typography,
  Spin,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  MailOutlined,
  LockOutlined,
} from "@ant-design/icons";
import { usePermission } from "@/hooks/permission";
import type { ColumnsType } from "antd/es/table";

const { Text } = Typography;

const UsersPage: React.FC = () => {
  const { users, roles, hasPermission } = usePermission();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<API.Permission.OP_USER | null>(
    null
  );
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState("");

  if (users.loading || roles.loading) {
    return <Spin style={{ width: "100%", height: "100%" }} />;
  }

  if (!users.loaded || !roles.loaded) {
    return null;
  }

  // 打开新增/编辑弹窗
  const handleOpenModal = (user?: API.Permission.OP_USER) => {
    if (user) {
      setEditingUser(user);
      form.setFieldsValue({
        name: user.name,
        email: user.email,
        roles: user.roles.map((r) => r.id),
      });
    } else {
      setEditingUser(null);
      form.resetFields();
    }
    setModalOpen(true);
  };

  // 关闭弹窗
  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingUser(null);
    form.resetFields();
  };

  // 保存用户
  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      if (editingUser) {
        // 编辑用户
        await users.updateUser(String(editingUser.id), {
          ...editingUser,
          ...values,
        });
      } else {
        // 新增用户
        await users.createUser(values as API.Permission.OP_USER);
      }

      handleCloseModal();
    } catch (error) {
      console.error("Validate Failed:", error);
    }
  };

  // 删除用户
  const handleDelete = async (userId: number) => {
    await users.deleteUser(String(userId));
  };

  // 过滤用户数据
  const filteredUsers = users.data.filter(
    (user) =>
      user.name.toLowerCase().includes(searchText.toLowerCase()) ||
      user.email.toLowerCase().includes(searchText.toLowerCase())
  );

  // 表格列配置
  const columns: ColumnsType<API.Permission.OP_USER> = [
    // {
    //   title: "ID",
    //   dataIndex: "id",
    //   width: 80,
    //   sorter: (a, b) => a.id - b.id,
    // },
    {
      title: "用户名",
      dataIndex: "name",
      width: 180,
      render: (text: string) => (
        <Space>
          <UserOutlined />
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: "邮箱",
      dataIndex: "email",
      width: 300,
      render: (text: string) => (
        <Space>
          <MailOutlined />
          <Text copyable>{text}</Text>
        </Space>
      ),
    },
    {
      title: "角色",
      dataIndex: "roles",
      render: (roles: API.Permission.OP_ROLE[]) => (
        <Space wrap>
          {roles && roles.length > 0 ? (
            roles.map((role) => (
              <Tag color={role.builtin ? "blue" : "default"} key={role.id}>
                {role.name}
              </Tag>
            ))
          ) : (
            <Text type="secondary">无角色</Text>
          )}
        </Space>
      ),
    },
    {
      title: "操作",
      key: "action",
      width: 200,
      fixed: "right",
      render: (_: unknown, record: API.Permission.OP_USER) => (
        <Space>
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleOpenModal(record)}
              disabled={!hasPermission("permission_users_edit")}
            >
              编辑
            </Button>
            <Popconfirm
              title="确定删除这个用户吗？"
              description="此操作不可恢复"
              onConfirm={() => handleDelete(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="link" danger icon={<DeleteOutlined />} disabled={!hasPermission("permission_users_delete")}>
                删除
              </Button>
            </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* 用户列表 */}
      <Card
        title="用户管理"
        extra={
          <Space>
            <Input.Search
              placeholder="搜索用户名或邮箱"
              allowClear
              style={{ width: 250 }}
              onChange={(e) => setSearchText(e.target.value)}
              onSearch={setSearchText}
            />
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => handleOpenModal()}
                disabled={!hasPermission("permission_users_create")}
              >
                新增用户
              </Button>
          </Space>
        }
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredUsers}
          loading={users.loading}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            defaultPageSize: 10,
            pageSizeOptions: ["10", "20", "50", "100"],
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* 新增/编辑用户弹窗 */}
      <Modal
        title={editingUser ? "编辑用户" : "新增用户"}
        open={modalOpen}
        onOk={handleSave}
        onCancel={handleCloseModal}
        okText="保存"
        cancelText="取消"
        width={600}
        confirmLoading={users.optioning}
      >
        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: 24 }}
          autoComplete="off"
        >
          <Form.Item
            name="name"
            label="用户名"
            rules={[
              { required: true, message: "请输入用户名" },
              { min: 2, max: 50, message: "用户名长度在 2-50 个字符" },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="请输入用户名"
              maxLength={50}
            />
          </Form.Item>

          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: "请输入邮箱" },
              { type: "email", message: "请输入有效的邮箱地址" },
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="请输入邮箱"
              maxLength={100}
              autoComplete="off"
            />
          </Form.Item>

          {!editingUser && (
            <Form.Item
              name="password"
              label="密码"
              rules={[
                { required: true, message: "请输入密码" },
                { min: 6, message: "密码至少 6 个字符" },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="请输入密码"
                maxLength={100}
                autoComplete="new-password"
              />
            </Form.Item>
          )}

          <Form.Item
            name="roles"
            label="角色"
            rules={[{ required: true, message: "请选择至少一个角色" }]}
          >
            <Select
              mode="multiple"
              placeholder="请选择角色"
              loading={roles.loading}
              options={roles.data.map((role) => ({
                label: role.name,
                value: role.id,
              }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UsersPage;
