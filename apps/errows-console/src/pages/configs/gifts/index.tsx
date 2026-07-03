import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Upload,
  Image,
  Popconfirm,
  message,
  Alert,
  Switch,
  Row,
  Col,
  Select,
  Tag
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import type { UploadFile } from "antd/es/upload/interface";
import { usePermission } from "@/hooks/permission";
import {
  fetchGiftsApi,
  addGiftApi,
  updateGiftApi,
  deleteGiftApi,
  uploadImageApi,
  type Gift,
} from "@/apis";
const GiftsConfig: React.FC = () => {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGift, setEditingGift] = useState<Gift | null>(null);
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string>("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const previewUrlRef = useRef<string>("");
  const { hasPermission } = usePermission();

  // 加载礼物列表
  const loadGifts = useCallback(async (currentPage = page, currentPageSize = pageSize) => {
    setLoading(true);
    try {
      const res = await fetchGiftsApi({ page: currentPage, size: currentPageSize });
      const loadedGifts = res.data || [];
      setGifts(loadedGifts);
      setTotal(res.count || 0);
    } catch (error) {
      console.error("加载礼物列表失败:", error);
      message.error("加载礼物列表失败");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  // 组件挂载时和分页变化时加载数据
  useEffect(() => {
    loadGifts(page, pageSize);
  }, [page, pageSize, loadGifts]);

  // 组件卸载时清理预览 URL
  useEffect(() => {
    return () => {
      if (previewUrlRef.current && previewUrlRef.current.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  // 配置说明
  const configRules = [
    "图片尺寸为：300×200，大小 100KB 以内，格式为 JPG、PNG、GIF、WEBP 图片",
    "礼物名称、图片、赠送礼物消耗代币数量、亲密度值均为必填项，且为正整数",
    "点击「新增」按钮添加新礼物",
    <span key="rule3">
      赠送礼物消耗代币数量值为：0 ~ 999999 之间的正整数
    </span>,
  ];

  // 打开新增/编辑弹窗
  const handleOpenModal = (gift?: Gift) => {
    if (gift) {
      setEditingGift(gift);
      form.setFieldsValue(gift);
      setFileList([
        {
          uid: "-1",
          name: "picture.png",
          status: "done",
          url: gift.picture_url,
        },
      ]);
    } else {
      setEditingGift(null);
      form.resetFields();
      setFileList([]);
    }
    setModalOpen(true);
  };

  // 关闭弹窗
  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingGift(null);
    form.resetFields();
    setFileList([]);
    setUploading(false);
  };

  // 自定义上传
  const handleCustomUpload = async (options: any) => {
    const { file, onSuccess, onError, onProgress } = options;
    
    setUploading(true);
    try {
      // 模拟上传进度
      onProgress({ percent: 50 });
      
      // 调用上传API
      const response = await uploadImageApi(file);
      // 上传成功
      onProgress({ percent: 100 });
      onSuccess(response, file);
      
      message.success('图片上传成功');
    } catch (error) {
      console.error('图片上传失败:', error);
      onError(error);
      message.error('图片上传失败，请重试');
    } finally {
      setUploading(false);
    }
  };

  // 处理图片预览
  const handlePreview = (file: UploadFile) => {
    // 释放之前创建的 URL
    if (previewUrlRef.current && previewUrlRef.current.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrlRef.current);
    }
    
    const url = file.url || file.response?.url || (file.originFileObj ? URL.createObjectURL(file.originFileObj) : "");
    if (url) {
      previewUrlRef.current = url;
      setPreviewImage(url);
      setPreviewOpen(true);
    }
  };

  // 保存礼物（新增或编辑）
  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      if (fileList.length === 0) {
        message.error("请上传礼物图片");
        return;
      }
      // 从上传响应中获取图片 URL
      const pictureUrl = 
        fileList[0].response?.url || 
        fileList[0].url || 
        "";

      if (!pictureUrl) {
        message.error("请等待图片上传完成");
        return;
      }

      setSaving(true);
      try {
        // 处理 valid_days：如果为空或 undefined，转换为 null
        const processedValues = {
          ...values,
          valid_days: values.valid_days === undefined || values.valid_days === null || values.valid_days === '' ? null : values.valid_days,
        };

        if (editingGift) {
          // 编辑
          const updatedGift: Gift = {
            ...editingGift,
            ...processedValues,
            picture_url: pictureUrl,
          };
          await updateGiftApi(editingGift.id, updatedGift);
          message.success("礼物修改成功");
          await loadGifts(page, pageSize);
        } else {
          // 新增
          const newGiftData = {
            ...processedValues,
            picture_url: pictureUrl,
          };
          await addGiftApi(newGiftData);
          message.success("礼物添加成功");
          // 新增后回到第一页
          if (page !== 0) {
            setPage(0);
          } else {
            await loadGifts(0, pageSize);
          }
        }
        handleCloseModal();
      } catch (error) {
        console.error("保存失败:", error);
        message.error("保存失败，请重试");
      } finally {
        setSaving(false);
      }
    } catch (error) {
      console.error("Validate Failed:", error);
    }
  };

  // 删除礼物
  const handleDelete = async (id: string) => {
    try {
      await deleteGiftApi(id);
      message.success("礼物删除成功");
      // 如果删除后当前页没有数据且不是第一页，则回到上一页
      if (gifts.length === 1 && page > 0) {
        setPage(page - 1);
      } else {
        await loadGifts(page, pageSize);
      }
    } catch (error) {
      console.error("删除失败:", error);
      message.error("删除失败，请重试");
    }
  };


  // 处理分页变化
  const handleTableChange = (pagination: any) => {
    const newPage = pagination.current - 1; // Ant Design 分页从 1 开始，API 从 0 开始
    const newPageSize = pagination.pageSize;
    
    if (newPage !== page) {
      setPage(newPage);
    }
    if (newPageSize !== pageSize) {
      setPageSize(newPageSize);
      setPage(0); // 改变页面大小时回到第一页
    }
  };

  // 表格列配置
  const columns = [
    {
      title: "序号",
      dataIndex: "sort",
      width: 80,
      render: (_: unknown, __: Gift, index: number) => page * pageSize + index + 1,
    },
    {
      title: "图片",
      dataIndex: "picture_url",
      width: 100,
      render: (picture_url: string) => (
        <Image
          src={picture_url}
          height={40}
          style={{ objectFit: "cover" }}
        />
      ),
    },
    {
      title: "名称",
      dataIndex: "name",
      width: 150,
    },
    {
      title: "消耗代币",
      dataIndex: "price",
      width: 120,
      render: (value: number) => value,
    },
    {
      title: "亲密度增加",
      dataIndex: "intimacy",
      width: 120,
      render: (value: number) => value,
    },
    {
      title: "是否需要领取",
      dataIndex: "need_claim",
      width: 120,
      render: (value: boolean) => <Switch checked={value}   size="small"  disabled/>,
    },
    {
      title: "赠送提示语",
      dataIndex: "prompt",
      width: 120,
      render: (value: string) => value,
    },
    {
      title: "礼物类型",
      dataIndex: "reply_type",
      width: 120,
      render: (value: 'text' | 'image') => {
        if(value === 'text') {
          return <Tag color="blue">文字</Tag>;
        } else if(value === 'image') {
          return <Tag color="green">图片</Tag>;
        } else {
          return '';
        }
      },
    },
    {
      title: "操作",
      key: "action",
      width: 150,
      render: (_: unknown, record: Gift) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleOpenModal(record)}
            disabled={!hasPermission("configs_gifts_edit")}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除这个礼物吗？"
            description="删除后无法恢复"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
            disabled={!hasPermission("configs_gifts_delete")}
          >
            <Button 
              type="link" 
              danger 
              icon={<DeleteOutlined />}
              disabled={!hasPermission("configs_gifts_delete")}
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

      {/* 礼物列表 */}
      <Card
        title="礼物列表"
        extra={
          <Space>
            <Button 
              icon={<PlusOutlined />} 
              onClick={() => handleOpenModal()}
              disabled={!hasPermission("configs_gifts_create")}
            >
              新增礼物
            </Button>
          </Space>
        }
      >
        <Table
          rowKey="id"
          columns={columns.map(i => ({
            ...i,
            align: "center",
          }))}
          dataSource={gifts}
          loading={loading}
          onChange={handleTableChange}
          pagination={{
            current: page + 1, // Ant Design 分页从 1 开始
            pageSize: pageSize,
            total: total,
            showSizeChanger: true,
            showQuickJumper: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>

      {/* 新增/编辑弹窗 */}
      <Modal
        title={editingGift ? "编辑礼物" : "新增礼物"}
        open={modalOpen}
        onOk={handleSave}
        onCancel={handleCloseModal}
        okText="保存"
        cancelText="取消"
        width={650}
        confirmLoading={saving || uploading}
        okButtonProps={{
          disabled: !hasPermission("configs_gifts_edit") && !hasPermission("configs_gifts_create")
        }}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            label="礼物图片"
            extra="尺寸 300×200，大小 100KB 以内，JPG、PNG、GIF、WEBP 格式"
            required
          >
            <Upload
              listType="picture-card"
              fileList={fileList}
              maxCount={1}
              customRequest={handleCustomUpload}
              onPreview={handlePreview}
              beforeUpload={(file) => {
                const isImage =
                  file.type === "image/jpeg" || 
                  file.type === "image/gif" || 
                  file.type === "image/png" ||
                  file.type === "image/webp";
                if (!isImage) {
                  message.error("只能上传 JPG、PNG、GIF 或 WEBP 格式的图片！");
                  return Upload.LIST_IGNORE;
                }
                const isLt100K = file.size / 1024 <= 100;
                if (!isLt100K) {
                  message.error("图片大小不能超过 100KB！");
                  return Upload.LIST_IGNORE;
                }
                return true; // 允许上传
              }}
              onChange={({ fileList: newFileList }) => setFileList(newFileList)}
            >
              {fileList.length === 0 && (
                <div>
                  <UploadOutlined />
                  <div style={{ marginTop: 8 }}>上传图片</div>
                </div>
              )}
            </Upload>
          </Form.Item>

          <Form.Item
            name="name"
            label="礼物名称"
            rules={[{ required: true, message: "请输入礼物名称" }]}
          >
            <Input placeholder="请输入礼物名称" maxLength={20} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="price"
                label="消耗代币数量"
                rules={[{ required: true, message: "请输入消耗代币数量" }]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  placeholder="请输入消耗代币数量"
                  min={0}
                  max={999999}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="intimacy"
                label="亲密度增加"
                rules={[{ required: true, message: "请输入亲密度增加值" }]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  placeholder="请输入亲密度增加值"
                  min={1}
                  max={999999}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="reply_type"
                label="礼物类型"
                rules={[{ required: true, message: "请选择礼物类型" }]}
              >
                <Select placeholder="请选择礼物类型">
                  <Select.Option value="text">文字</Select.Option>
                  <Select.Option value="image">图片</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="need_claim"
                label="是否需要领取"
                valuePropName="checked"
                initialValue={false}
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
                name="prompt"
                label="赠送提示语"
              >
                <Input.TextArea rows={4} placeholder="请输入赠送提示语" maxLength={100} />
              </Form.Item>

          <Form.Item
            name="valid_days"
            label="有效时间（天）"
            extra="留空表示永久有效"
          >
            <InputNumber
              style={{ width: "100%" }}
              placeholder="请输入有效天数，留空表示永久有效"
              min={1}
              max={999999}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 图片预览 */}
      {previewImage && (
        <Image
          wrapperStyle={{ display: 'none' }}
          preview={{
            visible: previewOpen,
            src: previewImage,
            onVisibleChange: (visible) => {
              setPreviewOpen(visible);
              if (!visible) {
                // 释放 blob URL
                if (previewUrlRef.current && previewUrlRef.current.startsWith('blob:')) {
                  URL.revokeObjectURL(previewUrlRef.current);
                }
                previewUrlRef.current = "";
                setPreviewImage("");
              }
            },
          }}
        />
      )}
    </div>
  );
};

export default GiftsConfig;
