import React, { useState, useEffect } from "react";
import {
  Card,
  Table,
  message,
} from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import { fetchSupportsApi, type Support } from "@/apis/support";

const SupportList: React.FC = () => {
  const [supports, setSupports] = useState<Support[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // 加载 Support 列表
  const loadSupports = async (page = 1, pageSize = 10) => {
    try {
      setLoading(true);
      const response = await fetchSupportsApi({
        page: page - 1, // 后端分页从 0 开始
        size: pageSize,
      });
      
      const data = response?.data || [];
      
      setSupports(data);
      setPagination({
        current: page,
        pageSize,
        total: response?.count || 0,
      });
    } catch (error) {
      console.error("Failed to load supports:", error);
      message.error("加载 Support 列表失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSupports(1, 10);
  }, []);

  // 处理分页变化
  const handleTableChange = (newPagination: TablePaginationConfig) => {
    if (newPagination.current && newPagination.pageSize) {
      loadSupports(newPagination.current, newPagination.pageSize);
    }
  };

  // 表格列配置
  const columns: ColumnsType<Support> = [
    {
      title: "User ID",
      dataIndex: "user_id",
      width: 280,
      align: 'center',
      ellipsis: true,
      render: (id: string | null | undefined) => id ?? "—",
    },
    {
      title: "邮箱",
      dataIndex: "email",
      width: 200,
      align: 'center',
    },
    {
      title: "类型",
      dataIndex: "type",
      width: 150,
      align: 'center',
    },
    {
      title: "描述",
      dataIndex: "description",
      ellipsis: true,
      width: 400,
      align: 'center',
    },
    {
      title: "提交时间",
      dataIndex: "created_at",
      width: 180,
      align: 'center',
      render: (time: string) => {
        if (!time) return '-';
        return new Date(time).toLocaleString('zh-CN');
      },
    },
  ];

  return (
    <div>
      <Card title="Support 列表">
        <Table
          rowKey="id"
          columns={columns}
          dataSource={supports}
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
          scroll={{ x: 1280 }}
        />
      </Card>
    </div>
  );
};

export default SupportList;
