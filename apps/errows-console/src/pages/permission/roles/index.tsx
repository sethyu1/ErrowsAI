import React, { useState } from "react";
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Checkbox,
  Tag,
  Popconfirm,
  Typography,
  Spin,
  Alert,
  theme,
  Skeleton,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CrownOutlined,
  LockOutlined,
} from "@ant-design/icons";
import { usePermission } from "@/hooks/permission";
import type { ColumnsType } from "antd/es/table";

const { Text } = Typography;

// 权限分组组件
interface PermissionGroupsProps {
  // form: any;
  value?: string[];
  onChange?: (value: string[]) => void;
  groupedPermissions: Record<string, API.Permission.OP_PERMISSION[]>;
  token: any;
}

const groupNameMap = {  
  dashboard: "数据监测",
  configs: "配置管理",
  roles: "角色管理",
  permission: "用户权限管理",
}

const PermissionGroups: React.FC<PermissionGroupsProps> = ({
  value,
  onChange,
  groupedPermissions,
  token,
}) => {
  return (
    <Space direction="vertical" style={{ width: "100%" }} size={16}>
      {Object.entries(groupedPermissions).map(([group, groupPermissions]) => {
        const groupName = groupNameMap[group as keyof typeof groupNameMap] ?? group;

        const groupPermissionNames = groupPermissions.map((p) => p.name);
        const checkedCount = groupPermissionNames.filter((name) =>
          value?.includes(name)
        ).length;
        const isAllChecked =
          checkedCount === groupPermissionNames.length && checkedCount > 0;
        const isIndeterminate =
          checkedCount > 0 && checkedCount < groupPermissionNames.length;

        return (
          <div
            key={group}
            style={{
              padding: "16px",
              background: token.colorBgContainer,
              borderRadius: token.borderRadius,
              border: `1px solid ${token.colorBorder}`,
            }}
          >
            {/* Group header with checkbox */}
            <div
              style={{
                marginBottom: 16,
                paddingBottom: 12,
                borderBottom: `1px solid ${token.colorBorderSecondary}`,
              }}
            >
              <Checkbox
                checked={isAllChecked}
                indeterminate={isIndeterminate}
                onChange={(e) => {
                  let newPermissions: string[];

                  if (e.target.checked) {
                    // Add all group permissions
                    newPermissions = Array.from(
                      new Set([...(value ?? []), ...groupPermissionNames])
                    );
                  } else {
                    // Remove all group permissions
                    newPermissions = (value ?? [])?.filter(
                      (p: string) => !groupPermissionNames.includes(p)
                    );
                  }
                  // 使用 setFieldValue 触发表单更新
                  // form.setFieldValue("permissions", newPermissions);
                  onChange?.(newPermissions);
                }}
              >
                <Text
                  strong
                  style={{
                    fontSize: 15,
                    color: token.colorTextHeading,
                  }}
                >
                  {groupName}
                </Text>
              </Checkbox>
            </div>

            {/* Group permissions */}
            <Space wrap size={[16, 8]}>
              {groupPermissions.map((permission) => (
                <Checkbox
                  key={permission.name}
                  value={permission.name}
                  checked={value?.includes(permission.name)}
                  onChange={(e) => {
                    let newPermissions: string[];
                    if (e.target.checked) {
                      newPermissions = Array.from(
                        new Set([...(value ?? []), permission.name])
                      );
                    } else {
                      newPermissions = (value ?? [])?.filter(
                        (p: string) => p !== permission.name
                      );
                    }
                    onChange?.(newPermissions);
                  }}
                >
                  {permission.title}
                </Checkbox>
              ))}
            </Space>
          </div>
        );
      })}
    </Space>
  );
};

const RolesPage: React.FC = () => {
  const { token } = theme.useToken();
  const { roles, permissions, hasPermission } = usePermission();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<API.Permission.OP_ROLE | null>(
    null
  );
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState("");

  if (roles.loading || permissions.loading) {
    return <Skeleton active />;
  }

  if (!roles.loaded || !permissions.loaded) {
    return null;
  }

  // 打开新增/编辑弹窗
  const handleOpenModal = (role?: API.Permission.OP_ROLE) => {
    if (role) {
      setEditingRole(role);
      form.setFieldsValue({
        name: role.name,
        permissions: role.permissions,
      });
    } else {
      setEditingRole(null);
      form.resetFields();
    }
    setModalOpen(true);
  };

  // 关闭弹窗
  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingRole(null);
    form.resetFields();
  };

  // 保存角色
  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      if (editingRole) {
        // 编辑角色
        await roles.updateRole(editingRole.id, {
          ...editingRole,
          ...values,
        });
      } else {
        // 新增角色
        await roles.createRole(values as API.Permission.OP_ROLE);
      }

      handleCloseModal();
    } catch (error) {
      console.error("Validate Failed:", error);
    }
  };

  // 删除角色
  const handleDelete = async (roleId: string) => {
    await roles.deleteRole(roleId);
  };

  // 过滤角色数据
  const filteredRoles = roles.data.filter((role) =>
    role.name.toLowerCase().includes(searchText.toLowerCase())
  );

  // 按权限分组进行分组
  const groupedPermissions = permissions.data.reduce((acc, permission) => {
    if (!acc[permission.group]) {
      acc[permission.group] = [];
    }
    acc[permission.group].push(permission);
    return acc;
  }, {} as Record<string, API.Permission.OP_PERMISSION[]>);

  // 表格列配置
  const columns: ColumnsType<API.Permission.OP_ROLE> = [
    {
      title: "角色名称",
      dataIndex: "name",
      width: 200,
      render: (text: string, record) => (
        <Space>
          <CrownOutlined />
          <Text strong>{text}</Text>
          {record.builtin && (
            <Tag color="blue" icon={<LockOutlined />}>
              内置
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: "权限数量",
      dataIndex: "permissions",
      width: 120,
      render: (permissions: string[]) => (
        <Tag color="green">{permissions?.length || 0} 项</Tag>
      ),
    },
    {
      title: "权限列表",
      dataIndex: "permissions",
      render: (permissionNames: string[]) => {
        const permissionList = permissions.data.filter((p) =>
          permissionNames.includes(p.name)
        );
        return (
          <Space wrap>
            {permissionList.length > 0 ? (
              permissionList.map((permission) => (
                <Tag key={permission.name}>{permission.title}</Tag>
              ))
            ) : (
              <Text type="secondary">无权限</Text>
            )}
          </Space>
        );
      },
    },
    {
      title: "操作",
      key: "action",
      width: 200,
      fixed: "right",
      render: (_: unknown, record: API.Permission.OP_ROLE) => (
        <Space>
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleOpenModal(record)}
              disabled={record.builtin  || !hasPermission("permission_roles_edit")}
            >
              编辑
            </Button>
            <Popconfirm
              title="确定删除这个角色吗？"
              description="此操作不可恢复，关联的用户将失去此角色"
              onConfirm={() => handleDelete(record.id)}
              okText="确定"
              cancelText="取消"
              disabled={record.builtin || !hasPermission("permission_roles_delete")}
            >
              <Button
                type="link"
                danger
                icon={<DeleteOutlined />}
                disabled={record.builtin}
              >
                删除
              </Button>
            </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* 角色列表 */}
      <Card
        title="角色管理"
        extra={
          <Space>
            <Input.Search
              placeholder="搜索角色名称"
              allowClear
              style={{ width: 250 }}
              onChange={(e) => setSearchText(e.target.value)}
              onSearch={setSearchText}
            />
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => handleOpenModal()}
                disabled={!hasPermission("permission_roles_create")}
              >
                新增角色
              </Button>
          </Space>
        }
      >
        <Alert
          message="提示"
          description="内置角色不可编辑和删除。角色的权限决定了用户可以访问和操作的功能范围。"
          type="info"
          showIcon
          closable
          style={{ marginBottom: 16 }}
        />
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredRoles}
          loading={roles.loading}
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

      {/* 新增/编辑角色弹窗 */}
      <Modal
        title={editingRole ? "编辑角色" : "新增角色"}
        open={modalOpen}
        onOk={handleSave}
        onCancel={handleCloseModal}
        okText="保存"
        cancelText="取消"
        width={700}
        confirmLoading={roles.optioning}
      >
        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: 24 }}
          autoComplete="off"
        >
          <Form.Item
            name="name"
            label="角色名称"
            rules={[
              { required: true, message: "请输入角色名称" },
              { min: 2, max: 50, message: "角色名称长度在 2-50 个字符" },
            ]}
          >
            <Input
              prefix={<CrownOutlined />}
              placeholder="请输入角色名称，如：管理员、编辑、访客等"
              maxLength={50}
            />
          </Form.Item>

          <Form.Item label="权限配置" required>
            <Form.Item
              name="permissions"
              rules={[{ required: true, message: "请选择至少一个权限" }]}
              noStyle
            >
              <PermissionGroups
                groupedPermissions={groupedPermissions}
                token={token}
              />
            </Form.Item>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default RolesPage;
