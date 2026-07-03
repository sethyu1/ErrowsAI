import { request } from "@/apis/request";

/** 获取角色配置项 */
export function fetchCharacterOptionsApi() {
  return request.get("/characters/options");
}

/** 获取公开角色列表（Discover页面）*/
export function fetchCharacterDiscoverListApi(
  params: Partial<API.Character.FetchListParams>
) {
  const { sort, ...rest } = params;
  const query = sort === "default" ? rest : params;
  return request.get("/characters", { params: query });
}

/** 获取角色详情 */
export function fetchCharacterDetailApi(cid: string) {
  return request.get<API.Character.CHARACTER>(`/characters/${cid}`);
}

/** 创建角色 */
export function createCharacterApi(data: API.Character.Setting) {
  return request.post("/my/characters", data);
}

/** 使用 AI 润色角色设定或问候语文案 */
export function refineCharacterTextApi(params: {
  type: "settings" | "greeting";
  text: string;
}) {
  return request.post<{ text: string }>("/my/character/refine", params);
}

/** 获取我的角色设置详情 */
export function fetchMyCharacterSettingApi(cid: string) {
  return request.get<API.Character.Setting>(`/my/characters/${cid}/settings`);
}

/** 更新我的角色设置 */
export function updateMyCharacterSettingApi(
  cid: string,
  data: API.Character.Setting
) {
  return request.put(`/my/characters/${cid}/settings`, data);
}

/** 获取我的角色列表 - 支持多种过滤类型 */
export interface FetchMyCharactersParams extends API.Common.PaginationParams {
  /** 搜索关键词 */
  q?: string;
  sort?: API.Character.FetchListParams['sort'];
}

export function fetchMyCharactersApi(
  type: "owned" | "followed" | "liked" | "public" | "deleted",
  params?: Partial<FetchMyCharactersParams>
) {
  return request.get(`/my/characters/${type}`, { params });
}

/** 删除我的角色 */
export function deleteMyCharacterApi(cid: string) {
  return request.delete(`/my/characters/${cid}`);
}

export function likeCharacterApi(cid: string) {
  return request.post(`/characters/${cid}/like`);
}

export function unlikeCharacterApi(cid: string) {
  return request.delete(`/characters/${cid}/like`);
}

export function followCharacterApi(cid: string) {
  return request.post(`/characters/${cid}/follow`);
}

export function unfollowCharacterApi(cid: string) {
  return request.delete(`/characters/${cid}/follow`);
}
/** 查询角色生成图片配置项 */
export function fetchCharacterImageGenerationOptionsApi() {
  return request.get('/characters/images/options');
}

/** 创建角色生图任务 */
export function createCharacterImageGenTaskApi(
  cid: string,
  data: API.Character.ImageGenSetting
) {
  return request.post<{ id: string }>(`/characters/${cid}/images/tasks`, data);
}

/** 查询角色生图任务状态 */
export function fetchCharacterImageGenTaskStatusApi(
  cid: string,
  taskId: string
) {
  return request.get<API.Character.ImageGenTaskStatusResponse>(
    `/characters/${cid}/images/tasks/${taskId}`
  );
}

export function retryCharacterImageGenTaskApi(cid: string, taskId: string) {
  return request.post<{ id: string; already_completed?: boolean }>(
    `/characters/${cid}/images/tasks/${taskId}/retry`,
    {}
  );
}

/** 创建角色图生视频任务 */
export function createCharacterImageToVideoTaskApi(
  cid: string,
  aid: string
) {
  return request.post<{ id: string }>(
    `/characters/${cid}/images/${aid}/videos/tasks`
  );
}

/** 任务加速 */
export function speedUpTaskApi(cid: string, tid: string) {
  return request.post(`/characters/${cid}/tasks/${tid}/speed-up`);
}

/** 查询角色图生视频任务状态 */
export function fetchCharacterImageToVideoTaskStatusApi(
  cid: string,
  tid: string,
) {
  return request.get<API.Character.VideoGenTaskStatusResponse>(
    `/characters/${cid}/videos/tasks/${tid}`
  );
}

export function retryCharacterVideoGenTaskApi(cid: string, taskId: string) {
  return request.post<{ id: string; already_completed?: boolean }>(
    `/characters/${cid}/videos/tasks/${taskId}/retry`,
    {}
  );
}

/** 查询用户图片媒体库 */
export function fetchMyCharacterImagesApi(params: Partial<API.Character.FetchMediaListParams>) {
  return request.get<API.Character.AssetImageSummary[]>(
    '/my/characters/images',
    { params }
  );
}

/** 查询用户图片媒体库 */
export function fetchMyCharacterVideosApi(params: Partial<API.Character.FetchMediaListParams>) {
  return request.get<API.Character.AssetImageSummary[]>(
    '/my/characters/videos',
    { params }
  );
}

/** 查询用户-具体角色图片列表 */
export function fetchMyCharacterImagesByCidApi(cid: string, params?: Partial<API.Character.FetchMediaListParams>) {
  return request.get<{ count: number; data: API.Character.AssetImage[] }>(
    `/my/characters/${cid}/images`,
    { params }
  );
}

/** 查询用户-具体角色视频库列表 */
export function fetchMyCharacterVideosByCidApi(cid: string, params?: Partial<API.Character.FetchMediaListParams>) {
  return request.get<{ count: number; data: API.Character.AssetVideo[] }>(
    `/my/characters/${cid}/videos`,
    { params }
  );
}

/** 删除用户角色图片 */
export function deleteMyCharacterImageApi(cid: string, aid: string) {
  return request.delete(`/my/characters/${cid}/images/${aid}`);
}

/** 删除用户角色视频 */
export function deleteMyCharacterVideoApi(cid: string, aid: string) {
  return request.delete(`/my/characters/${cid}/videos/${aid}`);
}

/** 查询富媒体 图片列表 */
export function fetchCharacterMediaListApi(params: API.Character.FetchMediaListParams) {
  return request.get('/media/characters/images', {
    params
  });
}

/** 一键生成 头像 */
export function generateCharacterAvatarApi(cid: string) {
  return request.post(`my/characters/${cid}/avatar`);
}

/** 获取具体角色生成未完成的图片任务状态 */
export function fetchImageGenTaskStatusByRoleApi(cid: string) {
  return request.get<API.Character.ImageGenTaskStatusResponse[]>(
    `/characters/${cid}/images/tasks`
  );
}

/** 获取具体角色生成未完成的视频任务状态 */
export function fetchVideoGenTaskStatusByRoleApi(cid: string) {
  return request.get<API.Character.VideoGenTaskStatusResponse[]>(
    `/characters/${cid}/videos/tasks`
  );
}