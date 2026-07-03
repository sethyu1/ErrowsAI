import { request } from '@/apis/request';

/** 模型消耗配置（coins charged）- 单条 */
export interface ModelCostItem {
  action: string;
  amount: number;
  description: string;
  unit?: string;
}

/**
 * 获取模型消耗配置（LLM / 生图 / 视频 / 语音 / 加速 等）
 * GET /ops/payment/prices
 */
export function getModelCostsApi() {
  return request.get<ModelCostItem[]>('/ops/payment/prices');
}

/**
 * 更新模型消耗配置（需提交完整列表）
 * PUT /ops/payment/prices
 */
export function updateModelCostsApi(prices: ModelCostItem[]) {
  return request.put<ModelCostItem[]>('/ops/payment/prices', { prices });
}

/** 代币规则配置（初始免费币、免费币上限、语音最低币） */
export interface CoinSettings {
  coin_free_balance: number;
  max_free_coins: number;
  voice_call_min_coins: number;
}

/**
 * 获取代币规则配置
 * GET /ops/config/coin-settings
 */
export function getCoinSettingsApi() {
  return request.get<CoinSettings>('/ops/config/coin-settings');
}

/**
 * 更新代币规则配置
 * PUT /ops/config/coin-settings
 */
export function updateCoinSettingsApi(data: Partial<CoinSettings>) {
  return request.put<CoinSettings>('/ops/config/coin-settings', data);
}

/**
 * 获取生图关键词配置
 * GET /ops/sessions/image/keywords
 * @TODO 后端需要实现此接口
 */
export function getGenerateParamsApi() {
  return request.get<string[]>('/ops/sessions/image/keywords');
}

/**
 * 更新关键词配置
 * PUT /ops/sessions/image/keywords
 */
export function updateKeywordsConfigApi(data: {
  keywords: string[];
}) {
  return request.put<void>('/ops/sessions/image/keywords', data);
}

/** 获取角色列表 */
export function fetchRolesApi(
  params: Partial<API.Character.CHARACTER_LIST_PARAMS_BASE>
) {
  return request.get<{
    data: Array<{
      id: string;
      nickname: string;
      avatar_url: string;
    }>;
    count: number;
  }>("/characters", { params });
}

/**
 * 获取全局概率配置
 * GET /ops/sessions/image/probability/default
 */
export function getGlobalProbabilityConfigApi() {
  return request.get<{
    turns: number;  // 聊天轮数 (0-999)
    probability: number; // 概率值 (0-100)
  }>('/ops/sessions/image/probability/default');
}

/**
 * 获取指定角色的概率配置
 * GET /ops/sessions/image/probability/character/:characterId
 */
export function getCharacterProbabilityConfigApi(characterId: string) {
  return request.get<{
    turns: number;  // 聊天轮数 (0-999)
    probability: number; // 概率值 (0-100)
  }>(`/ops/sessions/image/probability/character/${characterId}`);
}

/**
 * 更新全局概率配置
 * PUT /ops/sessions/image/probability/default
 */
export function updateGlobalProbabilityConfigApi(data: {
  turns: number;
  probability: number;
}) {
  return request.put<void>('/ops/sessions/image/probability/default', data);
}

/**
 * 更新指定角色的概率配置
 * PUT /ops/sessions/image/probability/character/:characterId
 */
export function updateCharacterProbabilityConfigApi(characterId: string, data: {
  turns: number;
  probability: number;
}) {
  return request.put<void>(`/ops/sessions/image/probability/character/${characterId}`, data);
}

/** AI 服务地址配置（不含 voiceCall） */
export interface AIEndpointsConfig {
  image?: { endpoint?: string; baseUrl?: string };
  chat?: { endpoint?: string };
  stream?: { endpoint?: string };
  video?: { endpoint?: string; video_state?: string; baseUrl?: string };
  tts?: { endpoint?: string; baseUrl?: string };
}

/**
 * 获取 AI 服务地址配置
 * GET /ops/config/ai-endpoints
 */
export function getAIEndpointsApi() {
  return request.get<AIEndpointsConfig>('/ops/config/ai-endpoints');
}

/**
 * 更新 AI 服务地址配置
 * PUT /ops/config/ai-endpoints
 */
export function updateAIEndpointsApi(data: AIEndpointsConfig) {
  return request.put<AIEndpointsConfig>('/ops/config/ai-endpoints', data);
}

