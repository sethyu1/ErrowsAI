import React, { useState, useEffect } from "react";
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Popconfirm,
  message,
  Alert,
  Spin,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SaveOutlined,
  HolderOutlined,
} from "@ant-design/icons";
import { theme } from "antd";
import type { DragEndEvent } from "@dnd-kit/core";
import { DndContext } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { fetchLegalTermsApi, updateLegalTermsApi } from "@/apis/legals";
import { usePermission } from "@/hooks/permission";

// 法律条款类型定义
interface LegalTerm {
  id: string;
  name: string;
  content: string;
  sort: number;
}

// 模拟数据
const mockLegalTerms: LegalTerm[] = [
  {
    id: "1",
    name: "用户协议",
    content:
      "<h2>用户协议</h2><p>欢迎使用我们的服务。在使用本服务之前，请您仔细阅读以下条款...</p><ul><li>条款一：账号注册</li><li>条款二：服务内容</li><li>条款三：用户行为规范</li></ul>",
    sort: 1,
  },
  {
    id: "2",
    name: "隐私政策",
    content:
      "<h2>隐私政策</h2><p>我们非常重视您的隐私保护。本隐私政策说明了我们如何收集、使用和保护您的个人信息...</p><ol><li>信息收集</li><li>信息使用</li><li>信息保护</li></ol>",
    sort: 2,
  },
  {
    id: "3",
    name: "免责声明",
    content:
      "<h2>免责声明</h2><p>本平台提供的内容仅供参考，不构成任何法律建议...</p>",
    sort: 3,
  },
];

// 可拖拽行组件
interface RowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  "data-row-key": string;
}

// 拖拽手柄组件
const DragHandle: React.FC<{ id: string }> = ({ id }) => {
  const { attributes, listeners, setNodeRef } = useSortable({ id });
  return (
    <span
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{ cursor: "grab", padding: "8px" }}
    >
      <HolderOutlined style={{ color: "#999" }} />
    </span>
  );
};

const DraggableRow: React.FC<RowProps> = (props) => {
  const { setNodeRef, transform, transition, isDragging } = useSortable({
    id: props["data-row-key"],
  });

  const style: React.CSSProperties = {
    ...props.style,
    transform: CSS.Transform.toString(transform),
    transition,
    ...(isDragging
      ? { position: "relative", opacity: 0.8}
      : {}),
  };

  return <tr {...props} ref={setNodeRef} style={style} />;
};

// 富文本编辑器配置
const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ color: [] }, { background: [] }],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ indent: "-1" }, { indent: "+1" }],
    ["link"],
    ["clean"],
  ],
};

const LegalConfig: React.FC = () => {
  const [originalTerms, setOriginalTerms] = useState<LegalTerm[]>([]);
  const [terms, setTerms] = useState<LegalTerm[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTerm, setEditingTerm] = useState<LegalTerm | null>(null);
  const [form] = Form.useForm();
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const { token } = theme.useToken();
  const { hasPermission } = usePermission();

  // 初始化获取数据
  useEffect(() => {
    fetchLegalTerms();
  }, []);

  // 获取法律条款列表
  const fetchLegalTerms = async () => {
    setLoading(true);
    try {
      const response = await fetchLegalTermsApi();
      const list = Array.isArray(response) ? response : [];
      // 将API数据转换为本地数据格式（添加id和sort字段）
      const termsWithId = list.map((item, index) => ({
        id: `${index + 1}`,
        name: item.name,
        content: item.content,
        sort: index + 1,
      }));
      setTerms(termsWithId);
      setOriginalTerms(termsWithId);
    } catch (error) {
      console.error("获取法律条款失败:", error);
      message.error("获取法律条款失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  // 配置说明
  const configRules = [
    "条款顺序为前台页面显示顺序，可拖拽调整",
    "各项法律条款的名称、详情均为必填项",
    "点击「新增」按钮添加一条新记录，点击「保存」按钮生效",
    "点击展开按钮可查看完整的富文本内容",
  ];

  // 打开新增/编辑弹窗
  const handleOpenModal = (term?: LegalTerm) => {
    if (term) {
      setEditingTerm(term);
      form.setFieldsValue(term);
    } else {
      setEditingTerm(null);
      form.resetFields();
    }
    setModalOpen(true);
  };

  // 关闭弹窗
  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingTerm(null);
    form.resetFields();
  };

  // 保存条款（本地）
  const handleSave = async (values: { name: string; content: string }) => {
    // 验证内容字段是否为空（去除 HTML 标签后检查是否有实际内容）
    const contentText = values.content?.replace(/<[^>]+>/g, "").trim();
    if (!contentText || contentText.length === 0) {
      form.setFields([
        {
          name: "content",
          errors: ["请输入条款内容"],
        },
      ]);
      return;
    }

    if (editingTerm) {
      // 编辑
      setTerms((prev) =>
        prev.map((t) =>
          t.id === editingTerm.id ? { ...t, ...values } : t
        )
      );
      setHasChanges(true);
    } else {
      // 新增
      const newTerm: LegalTerm = {
        id: Date.now().toString(),
        ...values,
        sort: terms.length + 1,
      };
      setTerms((prev) => [...prev, newTerm]);
      setHasChanges(true);
    }

    handleCloseModal();
  };

  // 删除条款
  const handleDelete = (id: string) => {
    setTerms((prev) => prev.filter((t) => t.id !== id));
    message.success("条款删除成功");
    setHasChanges(true);
  };

  // 拖拽排序
  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!hasPermission("configs_legal_edit")) return;
    if (active.id !== over?.id) {
      setTerms((prev) => {
        const activeIndex = prev.findIndex((i) => i.id === active.id);
        const overIndex = prev.findIndex((i) => i.id === over?.id);
        const newList = arrayMove(prev, activeIndex, overIndex);
        return newList.map((item, index) => ({ ...item, sort: index + 1 }));
      });
      setHasChanges(true);
    }
  };

  // 保存到服务器
  const handleSaveToServer = async () => {
    setSaving(true);
    try {
      // 将本地数据格式转换为API需要的格式（只保留name和content）
      const apiData: API.Legal.LEGAL_TERM[] = terms.map((term) => ({
        name: term.name,
        content: term.content,
      }));

      // 调用后端 API 保存数据
      await updateLegalTermsApi({ terms: apiData });

      message.success("保存成功");
      setOriginalTerms([...terms]);
      setHasChanges(false);
    } catch (error) {
      console.error("保存失败:", error);
      message.error("保存失败，请重试");
    } finally {
      setSaving(false);
    }
  };

  // 表格列配置
  const columns = [
    {
      title: "排序",
      dataIndex: "sort",
      width: 80,
      render: (_: unknown, record: LegalTerm) => (
        <div style={{ 
          opacity: hasPermission("configs_legal_edit") ? 1 : 0.5,
          cursor: hasPermission("configs_legal_edit") ? "grab" : "not-allowed"
        }}>
          <DragHandle id={record.id} />
        </div>
      ),
    },
    {
      title: "名称",
      dataIndex: "name",
      width: 200,
    },
    {
      title: "内容预览",
      dataIndex: "content",
      ellipsis: true,
      width: 300,
      render: (content: string) => {
        // 移除 HTML 标签显示纯文本预览
        const text = content.replace(/<[^>]+>/g, "");
        return text.length > 50 ? `${text.slice(0, 50)}...` : text;
      },
    },
    {
      title: "操作",
      key: "action",
      width: 150,
      render: (_: unknown, record: LegalTerm) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleOpenModal(record)}
            disabled={!hasPermission("configs_legal_edit")}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除这条法律条款吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
            disabled={!hasPermission("configs_legal_edit")}
          >
            <Button 
              type="link" 
              danger 
              icon={<DeleteOutlined />}
              disabled={!hasPermission("configs_legal_edit")}
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
      {/* 配置说明 */}
      <Alert
        message="配置说明"
        description={
          <ol style={{ margin: 0, paddingLeft: 20 }}>
            {configRules.map((rule, index) => (
              <li key={index} style={{ marginBottom: 4 }}>
                {rule}
              </li>
            ))}
          </ol>
        }
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      {/* 条款列表 */}
      <Card
        title="法律条款列表"
        extra={
          <Space>
            <Button
              icon={<PlusOutlined />}
              onClick={() => handleOpenModal()}
              disabled={loading || !hasPermission("configs_legal_edit")}
            >
              新增条款
            </Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={saving}
              disabled={!hasChanges || loading || !hasPermission("configs_legal_edit")}
              onClick={handleSaveToServer}
            >
              {saving ? "保存中..." : "保存"}
            </Button>
          </Space>
        }
      >
          <DndContext onDragEnd={handleDragEnd}>
            <SortableContext
              items={terms.map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              <Table
                rowKey="id"
                columns={columns}
                dataSource={terms}
                pagination={false}
                components={{
                  body: {
                    row: DraggableRow,
                  },
                }}
                loading={loading}
                expandable={{
                  expandedRowRender: (record) => (
                    <div
                      style={{
                        padding: "16px 24px",
                        background: token.colorBgContainer,
                        borderRadius: token.borderRadius,
                        border: `1px solid ${token.colorBorderSecondary}`,
                        color: token.colorText,
                      }}
                      dangerouslySetInnerHTML={{ __html: record.content }}
                    />
                  ),
                  rowExpandable: () => true,
                }}
              />
            </SortableContext>
          </DndContext>
      </Card>

      {/* 新增/编辑弹窗 */}
      <Modal
        title={editingTerm ? "编辑法律条款" : "新增法律条款"}
        open={modalOpen}
        onOk={() => {
          form.submit();
        }}
        onCancel={handleCloseModal}
        okText="确定"
        cancelText="取消"
        width={900}
        styles={{ body: { maxHeight: "75vh", overflow: "auto" } }}
        okButtonProps={{
          disabled: !hasPermission("configs_legal_edit")
        }}
      >
        <Form 
          form={form} 
          layout="vertical" 
          style={{ marginTop: 16 }}
          onFinish={handleSave}
        >
          <Form.Item
            name="name"
            label="条款名称"
            rules={[{ required: true, message: "请输入条款名称" }]}
          >
            <Input placeholder="请输入条款名称，如：用户协议、隐私政策" maxLength={50} />
          </Form.Item>

          <Form.Item
            name="content"
            label="条款内容"
            rules={[
              { required: true, message: "请输入条款内容" },
              {
                validator: (_, value) => {
                  if (!value) {
                    return Promise.reject(new Error("请输入条款内容"));
                  }
                  // 去除 HTML 标签后检查是否有实际内容
                  const text = value.replace(/<[^>]+>/g, "").trim();
                  if (!text || text.length === 0) {
                    return Promise.reject(new Error("请输入条款内容"));
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <ReactQuill
              theme="snow"
              modules={quillModules}
              placeholder="请输入条款内容..."
              style={{ height: 300, marginBottom: 50 }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default LegalConfig;
