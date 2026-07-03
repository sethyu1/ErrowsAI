import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Card, Alert, Input, InputNumber, Button, Space, message, Empty, Divider, Row, Col, Spin, Avatar } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { debounce } from 'lodash-es';
import InfiniteScroll from 'react-infinite-scroll-component';
import { getGlobalProbabilityConfigApi, getCharacterProbabilityConfigApi, updateGlobalProbabilityConfigApi, updateCharacterProbabilityConfigApi, fetchRolesApi } from '@/apis/generate-params';
import { usePermission } from '@/hooks/permission';
import styles from './index.module.less';

const CONFIG_RULES = [
    "输入框用于输入聊天轮数值：0-999的整数；概率值：0-100的整数；输入完成后点击保存按钮保存配置，实时生效",
    "支持对单个角色进行单独修改，单个角色的聊天轮数及概率值优先级高于所有角色的全局配置",
];

interface CharacterItem {
    id: string;
    nickname: string;
    avatar_url: string;
}

interface ConfigData {
    turns: number | undefined;  // 聊天轮数 (0-999)
    probability: number | undefined; // 概率值 (0-100)
}

const ProbabilityConfig = () => {
    const [messageApi, contextHolder] = message.useMessage();
    const { hasPermission } = usePermission();

    // 角色列表和搜索
    const [characters, setCharacters] = useState<CharacterItem[]>([]);
    const [searchValue, setSearchValue] = useState('');
    const [page, setPage] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);
    const isFetchingRef = useRef(false);

    // 全局配置
    const [globalConfig, setGlobalConfig] = useState<ConfigData>({
        turns:undefined,
        probability: undefined,
    });
    const [editGlobalConfig, setEditGlobalConfig] = useState<ConfigData>({
        turns: undefined,
        probability: undefined,
    });
    const [globalSaveLoading, setGlobalSaveLoading] = useState(false);

    // 选中的角色和其配置
    const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
    const [selectedCharacterInfo, setSelectedCharacterInfo] = useState<CharacterItem | null>(null);
    const [editCharacterConfig, setEditCharacterConfig] = useState<ConfigData>({
        turns: undefined,
        probability: undefined,
    });
    const [characterConfigLoading, setCharacterConfigLoading] = useState(false);
    const [characterSaveLoading, setCharacterSaveLoading] = useState(false);

    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // 初始化加载全局配置
    useEffect(() => {
        const loadGlobalConfig = async () => {
            try {
                const response = await getGlobalProbabilityConfigApi();
                if (response) {
                    setGlobalConfig({
                        turns: response.turns ?? undefined,
                        probability: response.probability ?? undefined,
                    });
                    setEditGlobalConfig({
                        turns: response.turns ?? undefined,
                        probability: response.probability ?? undefined,
                    });
                }
            } catch (error) {
                console.error('Failed to load global probability config:', error);
            }
        };

        loadGlobalConfig();

    }, []);


    useEffect(() => {
        setEditCharacterConfig({ ...globalConfig });
    }, [selectedCharacterId, globalConfig])

    // 加载角色列表
    const loadCharacters = useCallback(async (searchKeyword?: string, pageNum: number = 0) => {
        if (isFetchingRef.current) return;
        isFetchingRef.current = true;

        try {
            if (pageNum === 0) {
                const isSearch = searchKeyword && searchKeyword.trim();
                if (isSearch) {
                    setSearchLoading(true);
                } else {
                    setLoading(true);
                }
            }

            const response = await fetchRolesApi({
                q: searchKeyword?.trim(),
                page: pageNum,
                size: 20,
                sort: 'newest',
            });

            const newCharacters = Array.isArray(response?.data) ? response.data : [];
            const count = response?.count || 0;

            if (pageNum === 0) {
                setCharacters(newCharacters);
                setTotalCount(count);
                setPage(0);
                setHasMore(newCharacters.length < count);
            } else {
                setCharacters(prev => {
                    const updated = [...prev, ...newCharacters];
                    setHasMore(updated.length < count);
                    return updated;
                });
                setPage(pageNum);
            }
        } catch (error) {
            console.error('Failed to load characters:', error);
            messageApi.error('加载角色列表失败');
        } finally {
            isFetchingRef.current = false;
            setLoading(false);
            setSearchLoading(false);
        }
    }, [messageApi]);

    // 初始化加载角色列表
    useEffect(() => {
        loadCharacters();
    }, [loadCharacters]);

    // 搜索处理（防抖）
    const handleSearch = useCallback((value: string) => {
        setSearchValue(value);

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        searchTimeoutRef.current = setTimeout(() => {
            setPage(0);
            loadCharacters(value, 0);
        }, 500);
    }, [loadCharacters]);

    // 加载更多的回调
    const handleLoadMore = useCallback(async () => {
        if (isFetchingRef.current || !hasMore) return;
        const nextPage = page + 1;
        await loadCharacters(searchValue, nextPage);
    }, [page, searchValue, hasMore, loadCharacters]);

    // 选择角色并加载其配置（带防抖）
    const handleSelectCharacterImpl = useCallback(async (character: CharacterItem) => {
        try {
            // 如果点击的是当前选中的角色，则取消选择
            if (selectedCharacterId === character.id) return;

            setSelectedCharacterId(character.id);
            setSelectedCharacterInfo(character);
            setCharacterConfigLoading(true);

            const response = await getCharacterProbabilityConfigApi(character.id);
            if (response) {
                const config: ConfigData = {
                    turns: response.turns || 0,
                    probability: response.probability || 0,
                };
                setEditCharacterConfig(config);
            } else {
                setEditCharacterConfig({ ...globalConfig });
            }
        } catch (error) {
            console.error('Failed to load character config:', error);
            messageApi.error('加载角色配置失败');
        } finally {
            setCharacterConfigLoading(false);
        }
    }, [selectedCharacterId, globalConfig, messageApi]);

    // 创建防抖的选择函数
    const handleSelectCharacter = useMemo(
        () =>
            debounce((character: CharacterItem) => {
                handleSelectCharacterImpl(character);
            }, 300),
        [handleSelectCharacterImpl]
    );

    // 保存全局配置
    const handleSaveGlobalConfig = async () => {
        if (!hasPermission('configs_image_params_edit')) {
            messageApi.warning('无权限执行此操作');
            return;
        }
        try {
            // 验证数据
            if (editGlobalConfig.turns !== undefined && (editGlobalConfig.turns < 0 || editGlobalConfig.turns > 999)) {
                messageApi.warning('聊天轮数必须在 0-999 之间');
                return;
            }
            if (editGlobalConfig.probability !== undefined && (editGlobalConfig.probability < 0 || editGlobalConfig.probability > 100)) {
                messageApi.warning('概率值必须在 0-100 之间');
                return;
            }

            setGlobalSaveLoading(true);

            await updateGlobalProbabilityConfigApi({
                turns: editGlobalConfig.turns ?? 0,
                probability: editGlobalConfig.probability ?? 0,
            });

            setGlobalConfig({ ...editGlobalConfig });
            messageApi.success('全局配置保存成功');
        } catch (error) {
            console.error('Failed to save global config:', error);
            messageApi.error('保存失败，请重试');
        } finally {
            setGlobalSaveLoading(false);
        }
    };

    // 保存角色配置
    const handleSaveCharacterConfig = async () => {
        if (!hasPermission('configs_image_params_edit')) {
            messageApi.warning('无权限执行此操作');
            return;
        }
        try {
            // 验证数据
            if (editCharacterConfig.turns !== undefined && (editCharacterConfig.turns < 0 || editCharacterConfig.turns > 999)) {
                messageApi.warning('聊天轮数必须在 0-999 之间');
                return;
            }
            if (editCharacterConfig.probability !== undefined && (editCharacterConfig.probability < 0 || editCharacterConfig.probability > 100)) {
                messageApi.warning('概率值必须在 0-100 之间');
                return;
            }

            setCharacterSaveLoading(true);

            if (!selectedCharacterId) {
                messageApi.error('请选择一个角色');
                return;
            }

            await updateCharacterProbabilityConfigApi(selectedCharacterId, {
                turns: editCharacterConfig.turns ?? 0,
                probability: editCharacterConfig.probability ?? 0,
            });
            messageApi.success('角色配置保存成功');
        } catch (error) {
            console.error('Failed to save character config:', error);
            messageApi.error('保存失败，请重试');
        } finally {
            setCharacterSaveLoading(false);
        }
    };

    // 清除选择
    const handleClearSelection = () => {
        setSelectedCharacterId(null);
        setSelectedCharacterInfo(null);
        setEditCharacterConfig({ ...globalConfig });
    };

    return (
        <Card
            loading={false}
            styles={{
                body: {
                    padding: 12,
                }
            }}
            size="small"
        >
            {contextHolder}
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

            <div className={styles.container}>
                {/* 左侧：角色列表 */}
                <div className={styles.leftPanel}>
                    {/* 搜索框 */}
                    <Input
                        placeholder="搜索角色"
                        prefix={<SearchOutlined />}
                        value={searchValue}
                        onChange={(e) => handleSearch(e.target.value)}
                        allowClear
                        size="large"
                        className={styles.searchInput}
                        disabled={searchLoading}
                    />

                    {/* 角色列表 - 使用 react-infinite-scroll-component */}
                    {searchLoading ? (
                        <div className={styles.loadingContainer}>
                            <Spin />
                        </div>
                    ) : (
                        <div className={styles.characterList} id="scrollableDiv">
                            <InfiniteScroll
                                dataLength={characters.length}
                                next={handleLoadMore}
                                hasMore={hasMore}
                                loader={
                                    <div style={{ textAlign: 'center', padding: '16px' }}>
                                        <Spin size="small" />
                                    </div>
                                }
                                endMessage={
                                    characters.length > 0 && (
                                        <div style={{ textAlign: 'center', padding: '16px', color: '#999' }}>
                                            没有更多了
                                        </div>
                                    )
                                }
                                scrollableTarget="scrollableDiv"
                                className={styles.characterListInner}
                                scrollThreshold={0.95}
                            >
                                {characters.length > 0 ? (
                                    characters.map((character) => (
                                        <div
                                            key={character.id}
                                            className={`${styles.characterItem} ${selectedCharacterId === character.id ? styles.active : ''
                                                }`}
                                            onClick={() => handleSelectCharacter(character)}
                                        >
                                            <Avatar
                                                src={character.avatar_url}
                                                alt={character.nickname}
                                                className={styles.avatar}
                                            />
                                            <div className={styles.info}>
                                                <div className={styles.nickname}>{character.nickname}</div>
                                                <div className={styles.id}>{character.id}</div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <Empty
                                        description={searchValue ? '未找到匹配的角色' : '暂无角色'}
                                        style={{ padding: '40px 0' }}
                                    />
                                )}
                            </InfiniteScroll>
                        </div>
                    )}
                </div>

                {/* 右侧：配置面板 */}
                <div className={styles.rightPanel}>
                    <div className={styles.configWrapper}>
                        {/* 全局配置 */}
                        <div className={styles.configSection}>
                            <div className={styles.sectionTitle}>所有角色配置</div>
                            <div className={styles.configForm}>
                                <Row gutter={16} align="bottom">
                                    <Col span={10}>
                                        <div className={styles.formGroup}>
                                            <label className={styles.label}>所有角色聊天轮次</label>
                                            <InputNumber
                                                min={0}
                                                max={999}
                                                value={editGlobalConfig.turns}
                                                onChange={(value) =>
                                                    setEditGlobalConfig({
                                                        ...editGlobalConfig,
                                                        turns: value || 0,
                                                    })
                                                }
                                                className={styles.input}
                                                size="large"
                                                disabled={!hasPermission('configs_image_params_edit')}
                                            />
                                        </div>
                                    </Col>
                                    <Col span={10}>
                                        <div className={styles.formGroup}>
                                            <label className={styles.label}>所有角色全局概率值(%)</label>
                                            <InputNumber
                                                min={0}
                                                max={100}
                                                value={editGlobalConfig.probability}
                                                onChange={(value) =>
                                                    setEditGlobalConfig({
                                                        ...editGlobalConfig,
                                                        probability: value || 0,
                                                    })
                                                }
                                                className={styles.input}
                                                size="large"
                                                disabled={!hasPermission('configs_image_params_edit')}
                                            />
                                        </div>
                                    </Col>
                                    <Col span={4}>
                                        <Button
                                            type="primary"
                                            loading={globalSaveLoading}
                                            onClick={handleSaveGlobalConfig}
                                            className={styles.saveButton}
                                            disabled={!hasPermission('configs_image_params_edit')}
                                        >
                                            保存
                                        </Button>
                                    </Col>
                                </Row>
                            </div>
                        </div>

                        {/* 分割线 */}
                        {selectedCharacterId && (
                            <>
                                <Divider />

                                {/* 角色配置 */}
                                <div className={styles.configSection}>
                                    {characterConfigLoading ? (
                                        <div className={styles.loadingContainer}>
                                            <Spin />
                                        </div>
                                    ) : (
                                        <>
                                            <div className={styles.sectionTitle}>
                                                <div className={styles.characterHeader}>
                                                    {selectedCharacterInfo && (
                                                        <>
                                                            <img
                                                                src={selectedCharacterInfo.avatar_url}
                                                                alt={selectedCharacterInfo.nickname}
                                                                className={styles.avatar}
                                                            />
                                                            <div className={styles.characterInfo}>
                                                                <div className={styles.characterName}>
                                                                    {selectedCharacterInfo.nickname}
                                                                </div>
                                                                <div className={styles.characterId}>
                                                                    {selectedCharacterInfo.id}
                                                                </div>
                                                            </div>
                                                        </>
                                                    )}
                                                    <Button
                                                        type="text"
                                                        danger
                                                        onClick={handleClearSelection}
                                                        className={styles.clearBtn}
                                                    >
                                                        清除选择
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className={styles.configForm}>
                                                <Row gutter={16} align="bottom">
                                                    <Col span={10}>
                                                        <div className={styles.formGroup}>
                                                            <label className={styles.label}>
                                                                单一角色聊天轮数
                                                            </label>
                                                            <InputNumber
                                                                min={0}
                                                                max={999}
                                                                value={editCharacterConfig.turns}
                                                                onChange={(value) =>
                                                                    setEditCharacterConfig({
                                                                        ...editCharacterConfig,
                                                                        turns: value || 0,
                                                                    })
                                                                }
                                                                className={styles.input}
                                                                size="large"
                                                                disabled={!hasPermission('configs_image_params_edit')}
                                                            />
                                                        </div>
                                                    </Col>
                                                    <Col span={10}>
                                                        <div className={styles.formGroup}>
                                                            <label className={styles.label}>
                                                                单一角色全局概率值(%)
                                                            </label>
                                                            <InputNumber
                                                                min={0}
                                                                max={100}
                                                                value={editCharacterConfig.probability}
                                                                onChange={(value) =>
                                                                    setEditCharacterConfig({
                                                                        ...editCharacterConfig,
                                                                        probability: value || 0,
                                                                    })
                                                                }
                                                                className={styles.input}
                                                                size="large"
                                                                disabled={!hasPermission('configs_image_params_edit')}
                                                            />
                                                        </div>
                                                    </Col>
                                                    <Col span={4}>
                                                        <Button
                                                            type="primary"
                                                            loading={characterSaveLoading}
                                                            onClick={handleSaveCharacterConfig}
                                                            className={styles.saveButton}
                                                            disabled={!hasPermission('configs_image_params_edit')}
                                                        >
                                                            保存
                                                        </Button>
                                                    </Col>
                                                </Row>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default ProbabilityConfig;
