import { useState, useEffect, useRef, useCallback } from 'react';
import { Tabs, Card, Button, Space, message, Alert, Typography } from 'antd';
import { useNavigate } from 'react-router';
import { getSubscriptionProductsListApi, updateSubscriptionProductsApi } from '@/apis/member-ship';
import { usePermission } from '@/hooks/permission';
import { SubscriptionForm } from './components';
import styles from './index.module.less';

const { Text } = Typography;

interface TabContent {
    key: 'monthly' | 'yearly';
    label: string;
    products: API.Payment.SUBSCRIPTION_PRODUCT[];
}

const PRODUCT_NAMES = ['star', 'luna', 'galaxy'] as const;

// 配置说明
const CONFIG_RULES = [
    "直接输入费用项，保存后实时生效，所有值均为必填项",
    "购买费用值为：0-999999 之间的数字，支持两位小数",
    "折扣值为：0-100 之间的数字；折前订阅价算：付费价格÷(1-折扣值)（结果四舍五入保留两位小数）",
    "年度会员的年付费为自动计算值：年付费÷12个月（结果四舍五入保留两位小数）",
    <span key="rule5">
        代币值为：0-999999 之间的数字；发放时间为：1-28 之间整数日期及1-24 之间整数小时；发放次数为：0-999 之间的数字值
    </span>,
];

const MembershipPage = () => {
    const navigate = useNavigate();
    const [messageApi, contextHolder] = message.useMessage();
    const { hasPermission } = usePermission();
    const [tabData, setTabData] = useState<TabContent[]>([
        {
            key: 'yearly',
            label: '年度会员订阅',
            products: [],
        },
        {
            key: 'monthly',
            label: '月度会员订阅',
            products: [],
        },
    ]);

    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'monthly' | 'yearly'>('yearly');
    const [saveLoading, setSaveLoading] = useState(false);
    const formsRef = useRef<any[]>([]);

    // 初始化默认数据
    const initializeDefaultProducts = useCallback((): API.Payment.SUBSCRIPTION_PRODUCT[] => {
        return PRODUCT_NAMES.map(name => ({
            id: '', // 新数据不需要 id
            title: '',
            name: name as 'star' | 'luna' | 'galaxy',
            type: 'monthly' as const,
            price: 0,
            discount_rate: 0,
            before_discount_price: 0,
            bonus_coin: 0,
            bonus_date: 1,
            bonus_time: 12,
            value: '',
            rights: '',
            price_id: '',
        }));
    }, []);

    // 获取订阅产品列表
    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const response = await getSubscriptionProductsListApi();
            const products = response || [];

            if (products.length === 0) {
                // 如果为空，初始化默认数据
                const defaultProducts = initializeDefaultProducts();
                setTabData([
                    {
                        key: 'yearly',
                        label: '年度会员订阅',
                        products: defaultProducts.map(p => ({ ...p, type: 'yearly' })),
                    },
                    {
                        key: 'monthly',
                        label: '月度会员订阅',
                        products: defaultProducts.map(p => ({ ...p, type: 'monthly' })),
                    },
                ]);
            } else {
                // 按类型分组
                const monthlyProducts = products.filter(p => p.type === 'monthly');
                const yearlyProducts = products.filter(p => p.type === 'yearly');

                setTabData([
                    {
                        key: 'yearly',
                        label: '年度会员订阅',
                        products: yearlyProducts.length > 0 ? yearlyProducts : initializeDefaultProducts().map(p => ({ ...p, type: 'yearly' })),
                    },
                    {
                        key: 'monthly',
                        label: '月度会员订阅',
                        products: monthlyProducts.length > 0 ? monthlyProducts : initializeDefaultProducts().map(p => ({ ...p, type: 'monthly' })),
                    },
                ]);
            }
        } catch (error) {
            messageApi.error('获取订阅产品列表失败');
            console.error(error);
            // 初始化默认数据
            const defaultProducts = initializeDefaultProducts();
            setTabData([
                {
                    key: 'yearly',
                    label: '年度会员订阅',
                    products: defaultProducts.map(p => ({ ...p, type: 'yearly' })),
                },
                {
                    key: 'monthly',
                    label: '月度会员订阅',
                    products: defaultProducts.map(p => ({ ...p, type: 'monthly' })),
                },
            ]);
        } finally {
            setLoading(false);
        }
    }, [initializeDefaultProducts, messageApi]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    // 处理产品数据变化
    const handleProductsChange = (products: API.Payment.SUBSCRIPTION_PRODUCT[]) => {
        setTabData(prev =>
            prev.map(tab => {
                if (tab.key === activeTab) {
                    return {
                        ...tab,
                        products,
                    };
                }
                return tab;
            })
        );
    };

    // 获取表单实例
    const handleGetForms = (forms: any[]) => {
        formsRef.current = forms;
    };

    // 保存所有表单
    const handleSaveAll = async () => {
        try {
            setSaveLoading(true);
            
            // 验证所有表单
            const allValues = await Promise.all(
                formsRef.current.map(form => form.validateFields())
            );

            // 获取当前 tab 的产品
            const currentTab = tabData.find(tab => tab.key === activeTab);
            if (!currentTab) return;

            // 合并所有表单数据，从嵌套结构中提取实际值
            const updatedProducts = currentTab.products.map((product, index) => {
                // allValues[index] 的结构是 { "0": { ...fields } }
                // 需要提取 [0] 中的值
                const formData = allValues[index]?.[0] || allValues[index] || {};
                
                // 计算折扣后价格
                const realPrice = formData.price !== undefined ? formData.price : product.price;
                const discountRate = formData.discount_rate !== undefined ? formData.discount_rate : product.discount_rate;
                const before_discount_price = realPrice !== undefined && realPrice !== null && discountRate !== undefined && discountRate !== null
                    ? parseFloat((realPrice / (1 - discountRate / 100)).toFixed(2))
                    : product.price;
                
                const updatedProduct: any = {
                    type: activeTab,
                    ...formData,
                    name: product.name, // 放在最后确保正确的 name 值
                    before_discount_price,
                };
                
                // 只在有真实 id 时才包含（历史数据）
                if (product.id) {
                    updatedProduct.id = product.id;
                }
                
                return updatedProduct;
            });

            // 调用 API 保存
            await updateSubscriptionProductsApi({
                type: activeTab,
                products: updatedProducts,
            });
            messageApi.success('保存成功');
            handleProductsChange(updatedProducts);
        } catch (error) {
            console.error('full error:', error);
            const errorMsg = error instanceof Error ? error.message : '保存失败，请检查表单';
            messageApi.error(errorMsg);
        } finally {
            setSaveLoading(false);
        }
    };

    // 取消编辑 - 返回运营配置总览页
    const handleCancel = () => {
        // 重置所有表单到初始值
        formsRef.current.forEach((form, index) => {
            const currentTab = tabData.find(tab => tab.key === activeTab);
            if (currentTab && currentTab.products[index]) {
                // 使用嵌套结构重置表单
                form.setFieldsValue({ 0: currentTab.products[index] });
            }
        });
        messageApi.info('已取消编辑');
        // 返回运营配置总览页
        navigate('/configs');
    };


    return (
        <div className={styles.wrapper}>
            {contextHolder}
            <Card className={styles.card} loading={loading} styles={{
                body: {
                    padding: 12,
                }
            }}>
                {/* 配置说明 */}
                <Alert
                    message="配置说明"
                    description={
                        <ol style={{ margin: 0, paddingLeft: 20 }}>
                            {CONFIG_RULES.map((rule, index) => (
                                <li key={index} style={{ marginBottom: 4 }}>
                                    {rule}
                                </li>
                            ))}
                        </ol>
                    }
                    type="info"
                    showIcon
                    closable
                    style={{ marginBottom: 16 }}
                />

                <Tabs
                    activeKey={activeTab}
                    onChange={(key) => setActiveTab(key as 'monthly' | 'yearly')}
                    items={tabData.map(tab => ({
                        key: tab.key,
                        label: tab.label,
                        children: (
                            <SubscriptionForm
                                products={tab.products}
                                type={tab.key}
                                onProductsChange={handleProductsChange}
                                onGetForms={handleGetForms}
                            />
                        ),
                    }))}
                />
                <div className={styles.buttonGroup}>
                    <Space>
                        <Button 
                            onClick={handleCancel}
                            disabled={saveLoading}
                        >
                            取 消
                        </Button>
                        <Button 
                            type="primary"
                            loading={saveLoading}
                            onClick={handleSaveAll}
                            disabled={!hasPermission('configs_membership_edit')}
                        >
                            保 存
                        </Button>
                    </Space>
                </div>
      </Card>
    </div>
  );
};

export default MembershipPage;
