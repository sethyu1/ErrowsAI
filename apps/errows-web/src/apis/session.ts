import { request } from "@/apis/request";

/**
 * 获取聊天人设列表
 */

export const listSessionPersonaApi = () => {
  return request.get("/my/sessions/personas");
};

/**
 * 创建聊天人设
 */
export const createSessionPersonaApi = (
  data: API.SESSION.SESSION_PERSONA_BODY
) => {
  return request.post("/my/sessions/personas", data);
};

/**
 * 更新聊天人设
 */
export const updateSessionPersonaApi = (
  pid: string,
  data: API.SESSION.SESSION_PERSONA_BODY
) => {
  return request.put(`/my/sessions/personas/${pid}`, data);
};

/**
 * 删除聊天人设
 */
export const deleteSessionPersonaApi = (pid: string) => {
  return request.delete(`/my/sessions/personas/${pid}`);
};

/**
 * 创建会话
 */
export const createSessionApi = (
  pid: string,
  cid: string,
  data: API.SESSION.SESSION_SETTING
) => {
  return request.post(`/my/sessions/personas/${pid}/characters/${cid}`, data);
};

/**
 * 更新会话设置
 *
 */
export const updateSessionSettingApi = (
  sid: string,
  data: API.SESSION.SESSION_SETTING
) => {
  return request.put(`/my/sessions/${sid}`, data);
};

/**
 * 删除会话
 */
export const deleteSessionApi = (sid: string) => {
  return request.delete(`/my/sessions/${sid}`);
};

/**
 * 获取会话详情(聊天记录)
 */
export const getSessionApi = (sid: string) => {
  return request.get(`/my/sessions/${sid}`);
};

/**
 * 获取会话列表
 */
export const listSessionApi = () => {
  return request.get("/my/sessions");
};


/**
 * 获取礼物列表
 */
export const listSessionGiftApi = () => {
  return request.get("/my/sessions/gifts");
};
