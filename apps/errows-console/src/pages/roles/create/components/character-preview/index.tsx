import React, { useState, useMemo } from 'react';
import { Card, Tag, Divider, Typography, Space, Button } from 'antd';
import { DownOutlined, UpOutlined } from '@ant-design/icons';
import { VoiceSelector } from '../voice-selector';
import type { CreateDialogFormData } from '../../types';
import type { RoleDict, FieldOption } from '../../types';
import { CREATE_ROLE_DICT } from '@/constants';
import styles from './index.module.less';

const { Title, Paragraph, Text } = Typography;

interface CharacterPreviewProps {
    data: Partial<CreateDialogFormData>;
    groupDict: Record<string, RoleDict[]>;
}

/**
 * 角色预览组件
 * 显示用户填写的所有信息
 */
export function CharacterPreview({ data, groupDict }: CharacterPreviewProps) {
    const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
    const [descExpanded, setDescExpanded] = useState(false);

    const description = data.introduction || data.description;

    // 查找选项（支持依赖条件匹配）
    const findOption = (key: string, value?: string): FieldOption | null => {
        if (!value) return null;
        const configs = groupDict[key];
        if (!configs || configs.length === 0) return null;

        // 首先尝试匹配依赖条件
        for (const config of configs) {
            if (config.depends && config.depends.length > 0) {
                const allDependsMatch = config.depends.every(([depKey, depValues]) => {
                    const formValue = (data as any)[depKey];
                    return depValues.includes(formValue);
                });
                if (!allDependsMatch) continue;
            }

            const option = config.options?.find(opt =>
                opt.value === value || opt.prompt === value || opt.label === value
            );
            if (option) return option;
        }

        // 如果没有匹配到，返回第一个配置的匹配选项
        for (const config of configs) {
            const option = config.options?.find(opt =>
                opt.value === value || opt.prompt === value || opt.label === value
            );
            if (option) return option;
        }

        return null;
    };

    // 获取字段的显示文本
    const getFieldLabel = (key: string, value: string): string => {
        const option = findOption(key, value);
        return CREATE_ROLE_DICT.labels[option?.value as keyof typeof CREATE_ROLE_DICT.labels] || option?.label || option?.value || value;
    };


    // 获取语音选项
    const voiceOption = useMemo(() => {
        if (!data.voice) return null;
        return findOption('voice', data.voice);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data.voice, groupDict]);

    // 获取主图片URL（优先级：type > assortment > race > body_type）
    const primaryImageUrl = useMemo(() => {
        return findOption('type', data.type)?.url ||
            findOption('assortment', data.assortment)?.url ||
            findOption('race', data.race)?.url ||
            findOption('body_type', data.body_type)?.url;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data.type, data.assortment, data.race, data.body_type, groupDict]);

    // 画廊项目（外观特征图片）
    const galleryItems = useMemo(() => {
        const items = [
            { key: 'race', value: data.race },
            { key: 'eye_color', value: data.eye_color },
            { key: 'hair_length', value: data.hair_length },
            { key: 'assortment', value: data.assortment },
            { key: 'hair_style', value: data.hair_style },
            { key: 'hair_bangs', value: data.hair_bangs },
        ];

        return items
            .filter(item => item.value)
            .map(item => {
                const option = findOption(item.key, item.value);
                return {
                    key: item.key,
                    label: getFieldLabel(item.key, item.value!),
                    imageUrl: option?.url,
                };
            })
            .filter(item => item.imageUrl); // 只显示有图片的项目
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data.race, data.eye_color, data.hair_length, data.assortment, data.hair_style, data.hair_bangs, groupDict]);

    // 体型相关项目
    const sizeItems = useMemo(() => {
        const items = [
            { key: 'body_type', value: data.body_type },
            { key: 'breast_size', value: data.breast_size, showFor: 'Female' },
            { key: 'butt_size', value: data.butt_size },
            { key: 'penis_size', value: data.penis_size, showFor: 'Male' },
        ];

        return items
            .filter(item => {
                if (!item.value) return false;
                if (item.showFor && data.gender !== item.showFor) return false;
                return true;
            })
            .map(item => {
                const option = findOption(item.key, item.value);
                return {
                    key: item.key,
                    label: getFieldLabel(item.key, item.value!),
                    imageUrl: option?.url,
                };
            })
            .filter(item => item.imageUrl);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data.body_type, data.breast_size, data.butt_size, data.penis_size, data.gender, groupDict]);

    // 发色信息
    const hairColorMeta = useMemo(() => {
        if (!data.hair_color) return null;
        return findOption('hair_color', data.hair_color);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data.hair_color, groupDict]);

    return (
        <div className={styles.previewContainer}>
            <Title level={3} className={styles.previewTitle}>
                确认角色信息
            </Title>
            <Paragraph type="secondary" className={styles.previewDesc}>
                请仔细检查以下信息，确认无误后点击"创建角色"按钮
            </Paragraph>

            {/* 基本信息和外观特征 */}
            <Card title="角色预览" className={styles.previewCard}>
                {/* 角色名称和标签 */}
                <div className={styles.characterHeader}>
                    <Title level={4} className={styles.characterName}>
                        {data.nickname || '未设置昵称'}
                    </Title>
                    <Space size="small" wrap>
                        {data.gender && (
                            <Tag color="blue">{getFieldLabel('gender', data.gender)}</Tag>
                        )}
                        {data.type && (
                            <Tag color="purple">{getFieldLabel('type', data.type)}</Tag>
                        )}
                        {data.age && (
                            <Tag color="green">{getFieldLabel('age', data.age)}</Tag>
                        )}
                    </Space>
                </div>

                {/* 外观特征图片展示 */}
                <div className={styles.visualSection}>
                    {/* 主图片 */}
                    {primaryImageUrl && (
                        <div className={styles.primaryImage}>
                            <img src={primaryImageUrl} alt={data.nickname || 'Character'} />
                            <div className={styles.imageLabel}>
                                {data.nickname || 'Character'}
                            </div>
                        </div>
                    )}

                    {/* 其他外观特征图片 */}
                    <div className={styles.galleryGrid}>
                        {galleryItems.map(item => (
                            <div key={item.key} className={styles.galleryItem}>
                                <img src={item.imageUrl} alt={item.label} />
                                <div className={styles.imageLabel}>{item.label}</div>
                            </div>
                        ))}

                        {/* 体型相关 */}
                        {sizeItems.map(item => (
                            <div key={item.key} className={styles.galleryItem}>
                                <img src={item.imageUrl} alt={item.label} />
                                <div className={styles.imageLabel}>{item.label}</div>
                            </div>
                        ))}

                        {/* 年龄标签卡片 */}
                        {data.age && (
                            <div className={styles.labelCard}>
                                <div className={styles.labelCardContent}>
                                    <Text strong className={styles.labelValue}>
                                        {getFieldLabel('age', data.age)}
                                    </Text>
                                    <Text type="secondary" className={styles.labelTitle} style={{ color: '#fff'}}>
                                        年龄
                                    </Text>
                                </div>
                            </div>
                        )}

                        {/* 发色卡片 */}
                        {data.hair_color && hairColorMeta && (
                            <div className={styles.labelCard}>
                                <div className={styles.labelCardContent}>
                                    <div
                                        className={styles.colorCircle}
                                        style={{ backgroundColor: (hairColorMeta as any).color || '#ffffff' }}
                                    />
                                    <Text type="secondary" className={styles.labelTitle} style={{ color: '#fff'}}>
                                        发色
                                    </Text>
                                </div>
                            </div>
                        )}

                        {data.voice && voiceOption && (
                            <div className={styles.labelCard}>
                                <div className={styles.labelCardContent}>
                                    <VoiceSelector
                                        source={voiceOption}
                                        isPlaying={playingVoiceId === data.voice}
                                        onPlayStart={(value) => setPlayingVoiceId(value)}
                                        onPlayStop={() => setPlayingVoiceId(null)}
                                    />
                                </div>
                            </div>
                        )}

                    </div>
                </div>

                {description && (
                    <>
                        <Divider />
                        <div>
                            <div className={styles.descHeader}>
                                <Text strong>角色描述：</Text>
                                <Button
                                    type="link"
                                    size="small"
                                    icon={descExpanded ? <UpOutlined /> : <DownOutlined />}
                                    onClick={() => setDescExpanded(!descExpanded)}
                                    className={styles.expandButton}
                                >
                                    {descExpanded ? '收起' : '展开'}
                                </Button>
                            </div>
                            {descExpanded && (
                                <Paragraph className={styles.description}>
                                    {description}
                                </Paragraph>
                            )}
                        </div>
                    </>
                )}
            </Card>

            {/* 个性设置 */}
            <Card title="个性设置" className={styles.previewCard}>
                {data.tags && data.tags.length > 0 && (
                    <>
                        <div>
                            <Text strong>标签：</Text>
                            <div style={{ marginTop: 8 }}>
                                <Space size="small" wrap>
                                    {data.tags.map((tag, index) => (
                                        <Tag key={index}>{CREATE_ROLE_DICT.labels[tag as keyof typeof CREATE_ROLE_DICT.labels] || tag}</Tag>
                                    ))}
                                </Space>
                            </div>
                        </div>
                    </>
                )}
             {data.introduction && (
                    <>
                        <Divider />
                        <div>
                            <Text strong>介绍：</Text>
                            <Paragraph className={styles.textContent}>
                                {data.introduction}
                            </Paragraph>
                        </div>
                    </>
                )}

                {data.personality && (
                    <>
                        <Divider />
                        <div>
                            <Text strong>性格：</Text>
                            <Paragraph className={styles.textContent}>
                                {data.personality}
                            </Paragraph>
                        </div>
                    </>
                )}

                {data.greeting && (
                    <>
                        <Divider />
                        <div>
                            <Text strong>问候语：</Text>
                            <Paragraph className={styles.textContent}>
                                {data.greeting}
                            </Paragraph>
                        </div>
                    </>
                )}

                {data.settings && (
                    <>
                        <Divider />
                        <div>
                            <Text strong>角色设定：</Text>
                            <Paragraph className={styles.textContent}>
                                {data.settings}
                            </Paragraph>
                        </div>
                    </>
                )}

                {data.scenario && (
                    <>
                        <Divider />
                        <div>
                            <Text strong>场景设定：</Text>
                            <Paragraph className={styles.textContent}>
                                {data.scenario}
                            </Paragraph>
                        </div>
                    </>
                )}

                {(data as any).conversation && (data as any).conversation.length > 0 && (
                    <>
                        <Divider />
                        <div>
                            <Text strong>示例对话：</Text>
                            <div className={styles.conversationList}>
                                {(data as any).conversation.map((conv: any, index: number) => (
                                    <div key={index} className={styles.conversationItem}>
                                        <div className={styles.userMessage}>
                                            <Text type="secondary">用户：</Text>
                                            <Text>{conv.user}</Text>
                                        </div>
                                        <div className={styles.characterMessage}>
                                            <Text type="secondary">角色：</Text>
                                            <Text>{conv.character}</Text>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </Card>
        </div>
    );
}

