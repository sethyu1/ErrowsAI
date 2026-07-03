/* eslint-disable */
import React, { useState } from 'react';
import { SectionTitle } from './components/section-title';
import { RoleImageCard } from '@/components';
import { VideoSelector } from './components/video-selector'
import { TagsSelection } from './form-steps';
import { cn } from '@errows/design/lib/utils';
import { Icon } from '@iconify/react';
import { Input, Textarea, Button } from '@errows/design';
import { MagicOutlinedIcon } from '@errows/icons';
import { useTranslation } from 'react-i18next';
import type { FieldOption } from '../../types'
import type { TFunction } from 'i18next';
import type * as I18n from 'i18next'
import { getInputPlaceholderPrefix } from '../../role-util';
import { getExamplesForLanguage } from '@/locales/character-examples';
import { refineCharacterTextApi } from '@/apis/character';
import { toast } from 'sonner';

const HELP_TEXT_CONFIG: Record<string, string> = {
  nickname: 'createCharacter.helpText.nickname',
  introduction: 'createCharacter.helpText.introduction',
  settings: 'createCharacter.helpText.settings',
  greeting: 'createCharacter.helpText.greeting',
  personality: 'createCharacter.helpText.personality',
  scenario: 'createCharacter.helpText.scenario',
  conversation: 'createCharacter.helpText.conversation',
}

/**
 * 字符计数器组件
 */
function CharacterCounter({ current, max }: { current: number; max: number }) {
  const { t } = useTranslation();
  return (
    <span className={cn('text-xs text-gray-400', current > max && 'text-red-500')}>
      {current}/{max} {t('common.character')}
    </span>
  );
}

/** 字段配置类型 */
interface FieldConfig {
  key: string;
  title: string;
  required: boolean;
  max_select: number;
  depends: Array<[string, string[]]>;
  input_type: string;
  options: FieldOption[];
}

/** 表单值类型 */
interface FormValues {
  gender?: string;
  style?: string;
  assortment?: string;
  race?: string;
  [key: string]: any;
}

const mobileInputStyle = {
  height: 44,
  borderRadius: 40,
};

/**
 * 多个语音选择器的包装组件
 * 用于管理多个 VideoSelector 之间的播放状态
 */
function VoiceSelectorWrapper({
  options,
  value,
  onChange,
  isMobile,
}: {
  options: FieldOption[];
  value: any;
  onChange: (value: any) => void;
  isMobile?: boolean;
}) {
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

  const width = window.innerWidth <= 380 ? 104 : 114;

  return (
    <div className="w-full mx-auto px-2">
      <div className={`flex flex-wrap gap-3 sm:gap-4 ${window.innerWidth <= 640 ? 'justify-center' : ''}`}>
        {options.map((option, index) => (
          <VideoSelector
            key={option.value}
            style={{
              width,
            }}
            source={option}
            selected={value === option.value}
            onChange={handleVoiceChange}
            isPlaying={playingVoiceId === option.value}
            onPlayStart={handlePlayStart}
            onPlayStop={handlePlayStop}
            preload="auto"
          />
        ))}
      </div>
    </div>
  );
}

const REFINABLE_KEYS = ['settings', 'greeting'] as const;

/**
 * Long text input with optional "Refine with AI" button for Character Setting and Greeting.
 */
function LongTextInputWithRefine({
  fieldKey,
  value,
  onChange,
  translate,
  placeholder,
  rows,
  maxLength,
  isMobile,
}: {
  fieldKey: string;
  value: string;
  onChange: (v: string) => void;
  translate: TFunction;
  placeholder: string;
  rows: number;
  maxLength?: number;
  isMobile?: boolean;
}) {
  const [refining, setRefining] = useState(false);
  const canRefine = REFINABLE_KEYS.includes(fieldKey as (typeof REFINABLE_KEYS)[number]);
  const currentLength = typeof value === 'string' ? value.length : 0;

  const handleRefine = async () => {
    const text = (value ?? '').trim();
    if (!text || refining) return;
    setRefining(true);
    try {
      const res = await refineCharacterTextApi({
        type: fieldKey as 'settings' | 'greeting',
        text,
      });
      const refined = (res as { text?: string })?.text ?? '';
      if (refined) onChange(refined);
      toast.success(translate('common.refineSuccess') || 'Refined');
    } catch {
      toast.error(translate('common.refineFailed') || 'Refine failed');
    } finally {
      setRefining(false);
    }
  };

  return (
    <div className="w-full mx-auto">
      <div className="relative w-full">
        <Textarea
          style={{ width: '100%' }}
          value={value ?? ''}
          onChange={(e) => {
            const val = maxLength != null ? e.target.value.slice(0, maxLength) : e.target.value;
            onChange(val);
          }}
          placeholder={placeholder}
          rows={rows}
          className="w-full text-justify bg-[#1D1E27] border-[#2C2C38] text-white placeholder:text-gray-500 resize-y min-h-[120px]"
          maxLength={maxLength}
        />
        {maxLength !== undefined && (
          <CharacterCounter current={currentLength} max={maxLength} />
        )}
        {canRefine && (value ?? '').trim().length > 0 && (
          <button
            type="button"
            onClick={handleRefine}
            disabled={refining}
            className="absolute right-2 bottom-2 flex items-center gap-1 px-2 py-1 rounded-md bg-white/10 text-white text-xs hover:bg-white/20 disabled:opacity-50"
            title={translate('createCharacter.refineWithAI') || 'Refine with AI'}
          >
            <MagicOutlinedIcon className="w-3.5 h-3.5" />
            {refining ? translate('common.loading') || '...' : (translate('createCharacter.refineWithAI') || 'Refine')}
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * 检查字段是否应该显示（根据依赖条件）
 */
export function shouldShowField(field: FieldConfig, formValues: FormValues): boolean {
  if (!field.depends || field.depends.length === 0) {
    return true;
  }

  // 所有依赖条件都必须满足（AND 逻辑）
  return field.depends.every(([depKey, depValues]) => {
    const currentValue = formValues[depKey];
    // 检查当前值是否在依赖值列表中
    return depValues.includes(currentValue);
  });
}

/**
 * 根据 input_type 渲染对应的组件
 */
export function renderFieldComponent(
  translate: TFunction,
  field: FieldConfig,
  value: any,
  onChange: (value: any) => void,
  formValues: FormValues,
  isMobile?: boolean,
) {
  const { key, input_type, options, title } = field;

  switch (input_type) {
    case 'image_select': {
      return (
        <div className="w-full mx-auto px-2">
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
            {options.map((option) => (
              <RoleImageCard
                key={option.value}
                imageUrl={option.url}
                name={translate(`characterOptions.labels.${option.value}`)}
                selected={value === option.value}
                onClick={() => onChange(option.value)}
                size={key == 'type' ? 'large' : 'small'}
              />
            ))}
          </div>
        </div>
      );
    }

    case 'color_select': {
      return (
        <div className="w-full mx-auto mt-6 px-2" >
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            {options.map((option) => {
              const isSelected = value === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onChange(option.value)}
                  className={cn(
                    'relative transition-all duration-200',
                    'focus:outline-none focus:ring-2 focus:ring-white/50',
                    'h-10 w-20 sm:h-12 sm:w-24',
                    'rounded-full',
                    isSelected
                      ? 'border-2 border-white'
                      : 'border border-[#2C2C38] hover:border-[#3A3A48]',
                    isSelected && 'scale-105'
                  )}
                  style={{
                    backgroundColor: option.color || '#000000',
                    boxShadow: isSelected ? '0 0 8px rgba(255, 255, 255, 0.3)' : 'none',
                  }}
                  aria-label={option.value}
                  aria-pressed={isSelected}
                >
                  {isSelected && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Icon
                        icon="mdi:check"
                        width={16}
                        height={16}
                        color="white"
                        strokeWidth={3}
                        className="drop-shadow-md"
                      />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    case 'voice_select': {
      return (
        <VoiceSelectorWrapper
          options={options}
          value={value}
          onChange={onChange}
          isMobile={isMobile}
        />
      );
    }

    case 'discrete_sliders': {
      return (
        <div className="w-full mx-auto px-2">
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
            {options.map((option) => {
              const isSelected = value === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onChange(option.value)}
                  style={{
                    borderRadius: 100,
                    height: 36,
                  }}
                  className={cn(
                    'px-6 rounded-md border transition-all flex items-center justify-center',
                    isSelected
                      ? 'border-white bg-white text-[#090A0A]'
                      : 'border-[#2C2C38] bg-[#1D1E27] hover:border-[#3A3A48] hover:text-white'
                  )}
                >
                  {translate(`characterOptions.labels.${option.value}`)}
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    case 'text_input': {
      // 根据字段 key 设置不同的最大长度
      const getMaxLength = () => {
        if (key === 'nickname') return 20;
        return undefined;
      };
      const maxLength = getMaxLength();
      const currentValue = value || '';
      const currentLength = typeof currentValue === 'string' ? currentValue.length : 0;

      return (
        <div className={cn("w-full mx-auto px-2", isMobile ? 'px-0' : '')}>
          <div className="relative">
            <Input
              value={currentValue}
              onChange={(e) => {
                const val = maxLength ? e.target.value.slice(0, maxLength) : e.target.value;
                onChange(val);
              }}
              placeholder={`${translate(getInputPlaceholderPrefix(key))} ${translate(`characterOptions.titles.${key}`)}`}
              className="w-full bg-[#1D1E27] border-[#2C2C38] text-white placeholder:text-gray-500"
              maxLength={maxLength}
              style={isMobile ? mobileInputStyle : {}}
            />
            {maxLength && (<CharacterCounter current={currentLength} max={maxLength} />)}
          </div>
        </div>
      );
    }

    case 'long_text_input': {
      const isSettings = key === 'settings';
      const getMaxLength = () => {
        if (isSettings) return 5000;
        if (key === 'introduction' || key === 'dialogue_settings') return 500;
        if (key === 'greeting' || key === 'dialogue_greeting') return 300;
        if (key === 'personality' || key === 'dialogue_personality') return 500;
        return undefined;
      };
      const maxLength = getMaxLength();
      const currentValue = value || '';

      return (
        <LongTextInputWithRefine
          fieldKey={key}
          value={currentValue}
          onChange={(v) => onChange(v)}
          translate={translate}
          placeholder={`${translate(getInputPlaceholderPrefix(key))} ${translate(`characterOptions.titles.${key}`)}`}
          rows={isSettings ? 5 : 3}
          maxLength={maxLength}
          isMobile={isMobile}
        />
      );
    }

    case 'text_select': {
      return (
        <div className="w-full mx-auto px-2">
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
            <TagsSelection value={value} onChange={onChange} max_select={field.max_select} defaultOptions={field.options} />
          </div>
        </div>
      )
    }

    case 'dialogue_list': {
      // 对话列表：数组类型，每个元素包含 user 和 character
      const conversations = Array.isArray(value) ? value : [];

      const handleConversationChange = (index: number, field: 'user' | 'character', val: string) => {
        const newConversations = [...conversations];
        if (!newConversations[index]) {
          newConversations[index] = { user: '', character: '' };
        }
        newConversations[index] = { ...newConversations[index], [field]: field === 'user' ? val : val.slice(0, 300) };
        onChange(newConversations);
      };

      const handleConversationAdd = () => {
        onChange([...conversations, { user: '', character: '' }]);
      };

      const handleConversationRemove = (index: number) => {
        const newConversations = conversations.filter((_, i) => i !== index);
        onChange(newConversations);
      };

      return (
        <div className="w-full mx-auto space-y-4">
          {conversations.map((conv, index) => (
            <div key={index} className="space-y-3">
              <div className={`flex gap-2 ${isMobile ? 'flex-col' : 'items-center'}`}>
                <label className="text-sm text-[#A4ACB9] mb-2 block  font-urbanist"
                  style={{ width: '70px' }}
                >{translate('createCharacter.user')}</label>
                <div className="relative flex-1 items-center">
                  <Input
                    placeholder={translate('createCharacter.enterUserMessage')}
                    value={conv.user || ''}
                    onChange={(e) => handleConversationChange(index, 'user', e.target.value)}
                    className="w-full bg-[#1D1E27] border-[#2C2C38] text-white placeholder:text-gray-500"
                    style={isMobile ? mobileInputStyle : {}}
                  />
                </div>
              </div>

              <div className={`flex gap-2 ${isMobile ? 'flex-col' : 'items-center'}`}>
                <label className="text-sm text-[#A4ACB9] mb-2 block f font-urbanist"
                  style={{ width: '70px' }}
                >{translate('common.role')}</label>
                <div className="relative flex-1">
                  <Textarea
                    value={conv.character || ''}
                    onChange={(e) => handleConversationChange(index, 'character', e.target.value)}
                    className="w-full bg-[#1D1E27] border-[#2C2C38] text-white placeholder:text-gray-500"
                    maxLength={300}
                    rows={4}
                    placeholder={translate('createCharacter.enterCharacterMessage')}
                  />
                  <div className="absolute right-3 bottom-0 -translate-y-1/2">
                    <CharacterCounter current={(conv.character || '').length} max={300} />
                  </div>
                </div>
              </div>

              {/* 删除按钮 */}
              {conversations.length > 0 && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleConversationRemove(index)}
                    className="text-sm text-gray-400 hover:text-red-500 transition-colors"
                  >
                    {translate('createCharacter.remove')}
                  </button>
                </div>
              )}
            </div>
          ))}

          {/* 添加对话按钮 */}
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={handleConversationAdd}
              className="w-10 h-10 rounded-full border-2 border-white flex items-center justify-center text-white hover:bg-white/10 transition-colors"
            >
              <Icon icon="mdi:plus" className="w-5 h-5" />
            </button>
            <span className="text-sm text-gray-400">{translate('createCharacter.addConversation')}</span>
          </div>
        </div>
      );
    }

    default:
      return (
        <div className="w-full mx-auto px-2">
          <p className="text-gray-400 text-sm">Unknown input type: {input_type}</p>
        </div>
      );
  }
}

const TitleLeftTypes = ['text_input', 'long_text_input', 'text_select', 'dialogue_list'];
/**
 * 渲染字段（包含标题和组件）
 */
export function renderField(
  {
    t: translate,
    i18n,
  }: {
    t: TFunction;
    i18n: I18n.i18n;
  },
  field: FieldConfig,
  value: any,
  onChange: (value: any) => void,
  formValues: FormValues,
  form?: any,
  isMobile?: boolean,
) {

  if (!shouldShowField(field, formValues)) {
    return null;
  }

  // 对于 hair_color 字段，需要在标题右侧显示选中的颜色名称
  let rightText: string | undefined;
  if (field.key === 'hair_color' && value) {
    // 从选项中获取标签
    const selectedOption = field.options?.find((opt) => opt.value === value);
    rightText = translate(`createCharacter.${selectedOption?.title ||value}`) || value;
  }

  // 对于文本输入类型，使用左对齐布局
  const isTextInput = TitleLeftTypes.includes(field.input_type);

  // 对于 settings 字段，检查是否有 options（建议值）
  const isDescription = field.key === 'settings';
  const hasSuggestions = isDescription && field.options && field.options.length > 0;
  const helpText = HELP_TEXT_CONFIG[field.key];

  return (
    <section key={field.key} className={cn(
      "flex flex-col w-full",
      isTextInput ? 'px-2' : ''
    )}>
      {field.title && (
        <>
          <SectionTitle center={!isTextInput} mg0={!hasSuggestions} rightText={rightText} tooltip={helpText ? translate(helpText) : undefined}>
            {field.key === 'tags' ? `${translate('common.tags')}` : translate(`characterOptions.titles.${field.key}`)}
            {field.required && (
              <span className="text-red-500 ml-1">*</span>
            )}
          </SectionTitle>
          {hasSuggestions && (
            <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
              <div className="px-3 py-1.5 flex items-center justify-between gap-1 text-white text-sm">
                <MagicOutlinedIcon className="w-4 h-4" />
                {translate('common.suggestions')}
              </div>
              <div className={`flex items-center flex-wrap ${isMobile ? 'gap-1' : 'gap-2'}`}>
                {field.options.map((option, index) => {
                  // 如果有 form 实例，使用 Subscribe 动态监听 nickname
                  if (form) {
                    return (
                      <form.Subscribe key={index} selector={(state: any) => state.values.nickname} children={(nickname: string) => (
                        <Button
                          type="button"
                          onClick={() => {
                            // Example 按钮：设置对应的建议值
                            if (option && option.value) {
                              const examples = getExamplesForLanguage(i18n.language)
                              const replacements = {
                                '{character}': nickname || '',
                                '{user}': localStorage.getItem('errows.user.name') || ''
                              };
                              
                              let suggestionValue = examples[option.title] || option.value;
                              
                              Object.entries(replacements).forEach(([key, value]) => {
                                if (value) {
                                  suggestionValue = suggestionValue.replace(new RegExp(key, 'g'), value);
                                }
                              });                              
                              onChange(suggestionValue);
                            }
                          }}
                          className="px-3 py-1.5 rounded-md border border-[#2C2C38] bg-transparent text-white text-sm hover:bg-[#2C2C38] transition-colors"
                        >
                          {translate(`characterOptions.labels.${option.title}`)}
                        </Button>
                      )} />
                    );
                  }
                  // 如果没有 form 实例，使用静态的 formValues
                  return (
                    <Button
                      key={index}
                      type="button"
                      onClick={() => {
                        // Example 按钮：设置对应的建议值
                        const nickname = formValues.nickname || '';
                        if (option && option.value) {
                          const examples = getExamplesForLanguage(i18n.language)
                          const replacements = {
                            '{character}': nickname || '',
                            '{user}': localStorage.getItem('errows.user.name') || ''
                          };
                          
                          let suggestionValue = examples[option.title] || option.value;
                          
                          Object.entries(replacements).forEach(([key, value]) => {
                            if (value) {
                              suggestionValue = suggestionValue.replace(new RegExp(key, 'g'), value);
                            }
                          });                              
                          onChange(suggestionValue);
                        }
                      }}
                      className="px-3 py-1.5 rounded-md border border-[#2C2C38] bg-transparent text-white text-sm hover:bg-[#2C2C38] transition-colors"
                    >
                      {translate(`characterOptions.labels.${option.title}`)}
                    </Button>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
      {renderFieldComponent(translate, field, value, onChange, formValues, isMobile)}
    </section>
  );
}

