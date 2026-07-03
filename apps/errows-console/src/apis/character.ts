import { request } from "@/apis/request";

/** 获取角色配置项 */
export function fetchCharacterOptionsApi() {
  return request.get("/characters/options");
}

/** 创建角色 */
export function createCharacterApi(data: API.Character.Setting) {
  return request.post("/my/characters", data);
}

/** 获取角色详情 */
export function fetchCharacterDetailApi(cid: string) {
  return request.get<API.Character.CHARACTER>(`/characters/${cid}`);
}

