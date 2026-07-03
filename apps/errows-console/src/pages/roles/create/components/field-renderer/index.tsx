import React, { useState } from 'react';
import { Input, Select, Button, Space, InputNumber } from 'antd';
import { PlusOutlined, MinusCircleOutlined, BulbOutlined } from '@ant-design/icons';
import { SectionTitle } from '../section-title';
import { PillButtonSelector } from '../pill-button-selector';
import { ImageSelectorLarge } from '../image-selector-large';
import { TagsSelectorModal } from '../tags-selector-modal';
import { VoiceSelector } from '../voice-selector';
import type { RoleDict, FieldOption } from '../../types';
import { INPUT_PLACEHOLDER } from '../../constants';
import { CREATE_ROLE_DICT } from '@/constants';
import styles from './index.module.less';

const { TextArea } = Input;

interface FieldRendererProps {
    fieldConfig: RoleDict;
    value: any;
    onChange: (value: any) => void;
    formValues: Record<string, any>;
}

/**
 * 字符计数器组件
 */
function CharacterCounter({ current, max }: { current: number; max: number }) {
    return (
        <span className={current > max ? styles.counterError : styles.counter}>
            {current}/{max} 字符
        </span>
    );
}

/**
 * 检查字段是否应该显示（根据依赖条件）
 */
function shouldShowField(field: RoleDict, formValues: Record<string, any>): boolean {
    if (!field.depends || field.depends.length === 0) {
        return true;
    }

    // 所有依赖条件都必须满足
    return field.depends.every(([depKey, depValues]) => {
        const currentValue = formValues[depKey];
        return depValues.includes(currentValue);
    });
}

/**
 * 图片选择器
 */
function ImageSelect({ options, value, onChange }: { options: FieldOption[]; value: any; onChange: (v: any) => void }) {
    return (
        <div className={styles.imageSelectWrapper}>
            {options.map((option) => (
                <div
                    key={option.value}
                    className={`${styles.imageCard} ${value === option.value ? styles.selected : ''}`}
                    onClick={() => onChange(option.value)}
                >
                    <img src={option.url} alt={option.label || option.value} />
                    <div className={styles.imageLabel}>{CREATE_ROLE_DICT.labels[option.value as keyof typeof CREATE_ROLE_DICT.labels] || option.label || option.value}</div>
                </div>
            ))}
        </div>
    );
}

/**
 * 颜色选择器
 */
function ColorSelect({ options, value, onChange }: { options: FieldOption[]; value: any; onChange: (v: any) => void }) {
    return (
        <div className={styles.colorSelectWrapper}>
            {options.map((option) => (
                <div
                    key={option.value}
                    className={`${styles.colorButton} ${value === option.value ? styles.selected : ''}`}
                    style={{ backgroundColor: (option as any).color || '#000000' }}
                    onClick={() => onChange(option.value)}
                    title={option.label || option.value}
                >
                    {value === option.value && <span className={styles.checkIcon}>✓</span>}
                </div>
            ))}
        </div>
    );
}

/**
 * 对话列表
 */
function DialogueList({ value, onChange }: { value: any; onChange: (v: any) => void }) {
    const conversations = Array.isArray(value) ? value : [];

    const handleAdd = () => {
        onChange([...conversations, { user: '', character: '' }]);
    };

    const handleRemove = (index: number) => {
        onChange(conversations.filter((_, i) => i !== index));
    };

    const handleChange = (index: number, field: 'user' | 'character', val: string) => {
        const newConversations = [...conversations];
        if (!newConversations[index]) {
            newConversations[index] = { user: '', character: '' };
        }
        newConversations[index] = { ...newConversations[index], [field]: val };
        onChange(newConversations);
    };

    return (
        <div className={styles.dialogueList}>
            {conversations.map((conv: any, index: number) => (
                <div key={index} className={styles.dialogueItem}>
                    <div className={styles.dialogueField}>
                        <label>用户:</label>
                        <Input
                            value={conv.user || ''}
                            onChange={(e) => handleChange(index, 'user', e.target.value)}
                            placeholder="输入用户消息"
                        />
                    </div>
                    <div className={styles.dialogueField}>
                        <label>角色:</label>
                        <TextArea
                            value={conv.character || ''}
                            onChange={(e) => handleChange(index, 'character', e.target.value.slice(0, 300))}
                            placeholder="输入角色回复"
                            rows={3}
                            maxLength={300}
                        />
                        <CharacterCounter current={(conv.character || '').length} max={300} />
                    </div>
                    <Button
                        type="text"
                        danger
                        icon={<MinusCircleOutlined />}
                        onClick={() => handleRemove(index)}
                    >
                        删除
                    </Button>
                </div>
            ))}
            <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={handleAdd}
                block
            >
                添加对话
            </Button>
        </div>
    );
}

/**
 * 多个语音选择器的包装组件
 * 用于管理多个 VoiceSelector 之间的播放状态
 */
const VoiceSelectorWrapper: React.FC<{
    options: FieldOption[];
    value: any;
    onChange: (value: any) => void;
}> = ({ options, value, onChange }) => {
    const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);

    const handlePlayStart = (voiceValue: string) => {
        // 停止其他正在播放的音频
        setPlayingVoiceId(voiceValue);
    };

    const handlePlayStop = () => {
        setPlayingVoiceId(null);
    };

    const handleVoiceChange = (voiceValue: string) => {
        onChange(voiceValue);
    };

    return (
        <div className={styles.voiceSelectorWrapper}>
            {options.map((option) => (
                <VoiceSelector
                    key={option.value}
                    source={option}
                    selected={value === option.value}
                    onChange={handleVoiceChange}
                    isPlaying={playingVoiceId === option.value}
                    onPlayStart={handlePlayStart}
                    onPlayStop={handlePlayStop}
                />
            ))}
        </div>
    );
}

/**
 * 根据 input_type 渲染对应的组件
 */
function renderFieldComponent(
    fieldConfig: RoleDict,
    value: any,
    onChange: (value: any) => void,
) {
    const { key, input_type, options, max_select } = fieldConfig;

    switch (input_type) {
        case 'pill_select':
        case 'gender_select':
            // 胶囊按钮选择器（用于性别等）
            return (
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <PillButtonSelector
                        value={value}
                        onChange={onChange}
                        options={options.map(opt => ({
                            value: opt.value,
                            prompt: opt.label || opt.value,
                        }))}
                    />
                </div>
            );

        case 'image_select':
            if (key === 'type') {
                // 其他字段使用大图片选择器
                return <ImageSelectorLarge options={options} value={value} onChange={onChange} />;
            }
            else return <ImageSelect options={options} value={value} onChange={onChange} />;

        case 'image_select_big':
            // 如果是 gender 字段，使用胶囊按钮选择器
            if (key === 'gender') {
                return (
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <PillButtonSelector
                            value={value}
                            onChange={onChange}
                            options={options.map(opt => ({
                                value: opt.value,
                                prompt: opt.label || opt.value,
                            }))}
                        />
                    </div>
                );
            }
            // 其他字段使用大图片选择器
            return <ImageSelectorLarge options={options} value={value} onChange={onChange} />;

        case 'color_select':
            return <ColorSelect options={options} value={value} onChange={onChange} />;

        case 'voice_select':
            return <VoiceSelectorWrapper options={options} value={value} onChange={onChange} />;

        case 'discrete_sliders':
            return (
                <Space wrap style={{ justifyContent: 'center' }}>
                    {options.map((option) => (
                        <Button
                            key={option.value}
                            type={value === option.value ? 'primary' : 'default'}
                            onClick={() => onChange(option.value)}
                            size="large"
                            style={{ minWidth: 100 }}
                        >
                            {option.label || option.value}
                        </Button>
                    ))}
                </Space>
            );

         case 'text_input': {
             const maxLength = key === 'nickname' ? 20 : undefined;
             const currentLength = typeof value === 'string' ? value.length : 0;
 
             return (
                 <div style={{ position: 'relative', width: '100%', maxWidth: '800px' }}>
                     <Input
                         value={value || ''}
                         onChange={(e) => onChange(maxLength ? e.target.value.slice(0, maxLength) : e.target.value)}
                         placeholder={`请输入${INPUT_PLACEHOLDER[fieldConfig.key] || fieldConfig.title}`}
                         maxLength={maxLength}
                         size="large"
                     />
                     {maxLength && (
                         <div style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)' }}>
                             <CharacterCounter current={currentLength} max={maxLength} />
                         </div>
                     )}
                 </div>
             );
         }

         case 'long_text_input': {
             const getMaxLength = () => {
                 if (key === 'settings') return 5000;
                 if (key === 'description' || key === 'dialogue_settings') return 500;
                 if (key === 'greeting' || key === 'dialogue_greeting') return 300;
                 if (key === 'personality' || key === 'dialogue_personality') return 500;
                 return undefined;
             };
             const maxLength = getMaxLength();
             const currentLength = typeof value === 'string' ? value.length : 0;
 
             return (
                 <div style={{ position: 'relative', width: '100%', maxWidth: '800px' }}>
                     <TextArea
                         value={value || ''}
                         onChange={(e) => onChange(maxLength ? e.target.value.slice(0, maxLength) : e.target.value)}
                         placeholder={`请输入${INPUT_PLACEHOLDER[fieldConfig.key] || fieldConfig.title}`}
                         rows={6}
                         maxLength={maxLength}
                         size="large"
                     />
                     {maxLength && (
                         <div style={{ position: 'absolute', right: 8, bottom: 8 }}>
                             <CharacterCounter current={currentLength} max={maxLength} />
                         </div>
                     )}
                 </div>
             );
         }

         case 'text_select':
             return (
                 <TagsSelectorModal
                     options={options}
                     value={value}
                     onChange={onChange}
                     maxSelect={max_select || 9}
                 />
             );

        case 'dialogue_list':
            return <DialogueList value={value} onChange={onChange} />;

        default:
            return <div>未知的输入类型: {input_type}</div>;
    }
}

/**
 * 字段渲染器主组件
 */
export function FieldRenderer({ fieldConfig, value, onChange, formValues }: FieldRendererProps) {
    if (!shouldShowField(fieldConfig, formValues)) {
        return null;
    }

    // 对于 hair_color 字段，需要在标题右侧显示选中的颜色名称
    let rightText: string | undefined;
    if (fieldConfig.key === 'hair_color' && value) {
        const selectedOption = fieldConfig.options?.find((opt) => opt.value === value);
        rightText = selectedOption?.label || value;
    }

    const isTextInput = ['text_input', 'long_text_input', 'text_select', 'dialogue_list'].includes(fieldConfig.input_type);
    // 性别、风格等字段不显示标题，直接显示选择器
    const hideTitle = ['pill_select', 'gender_select', 'image_select_big'].includes(fieldConfig.input_type);

    // 对于 settings 字段，检查是否有 options（建议值）
    const isDescription = fieldConfig.key === 'settings';
    const hasSuggestions = isDescription && fieldConfig.options && fieldConfig.options.length > 0;

    // 处理建议值点击
    const handleSuggestionClick = (option: FieldOption) => {
        const nickname = formValues.nickname || '';
        let suggestionValue = option.value || '';

        // 替换占位符
        const replacements = {
            '{character}': nickname,
            '{user}': localStorage.getItem('errows.console.user.name') || '',
        };

        Object.entries(replacements).forEach(([key, value]) => {
            if (value) {
                suggestionValue = suggestionValue.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);        
            }
        });

        onChange(suggestionValue);
    };

    return (
        <div className={styles.fieldWrapper}>
            {fieldConfig.title && !hideTitle && (
                <>
                    <SectionTitle center={!isTextInput} rightText={rightText}>
                        {CREATE_ROLE_DICT.titles[fieldConfig.key as keyof typeof CREATE_ROLE_DICT.titles] || fieldConfig.title}
                        {fieldConfig.required && <span style={{ color: 'red', marginLeft: 4 }}>*</span>}
                    </SectionTitle>
                    {hasSuggestions && (
                        <div className={styles.suggestionsWrapper}>
                            <div className={styles.suggestionsLabel}>
                                <BulbOutlined style={{ marginRight: 4 }} />
                                建议内容
                            </div>
                            <div className={styles.suggestionsButtons}>
                                {fieldConfig.options.map((option, index) => (
                                    <Button
                                        key={index}
                                        size="small"
                                        onClick={() => handleSuggestionClick(option)}
                                        className={styles.suggestionButton}
                                    >
                                        {CREATE_ROLE_DICT.labels[option.title as keyof typeof CREATE_ROLE_DICT.labels] || option.title || option.label || `示例 ${index + 1}`}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
            {renderFieldComponent(fieldConfig, value, onChange)}
        </div>
    );
}

