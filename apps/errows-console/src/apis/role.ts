import { request } from '@/apis/request';

const API_PREFIX = '/ops';

/** 获取角色列表 */
export function fetchOPSRolesApi(
  params: Partial<API.Character.CHARACTER_LIST_PARAMS_BASE>
) {
  return request.get<{
    data: Array<{
      id: string;
      nickname: string;
      avatar_url: string;
    }>;
    count: number;
  }>(`${API_PREFIX}/characters`, { params });
}

/** 更新角色状态 */
export function updateOPSRoleStatusApi(
  roleId: string,
  status: 'public' | 'rejected',
  reason?: string
) {
  return request.put<void>(`${API_PREFIX}/characters/${roleId}/status`, { status, reason });
}

export function updateOPSRoleNcoverApi(
  roleId: string,
  ncover: number | null
) {
  return request.put<void>(`${API_PREFIX}/characters/${roleId}/ncover`, { ncover });
}

export function updateOPSRoleIsOfficialApi(
  roleId: string,
  is_official: boolean
) {
  return request.put<void>(`${API_PREFIX}/characters/${roleId}/is_official`, { is_official });
}

export function updateOPSRoleDefaultOrderApi(
  roleId: string,
  default_order: number
) {
  return request.put<void>(`${API_PREFIX}/characters/${roleId}/order/default`, { default_order });
}

export interface OPSCharacterSettings {
  attributes: Record<string, unknown>;
  avatar_url: string | null;
  greeting_image: string | null;
  background_image_files: string | null;
  ncover: number | null;
}

export function fetchOPSCharacterSettingsApi(cid: string) {
  return request.get<OPSCharacterSettings>(`${API_PREFIX}/characters/${cid}/settings`);
}

export function updateOPSCharacterSettingsApi(
  cid: string,
  data: Partial<OPSCharacterSettings>
) {
  return request.put<void>(`${API_PREFIX}/characters/${cid}/settings`, data);
}