import { request } from '@/apis/request';

/** 登录 */
export function loginApi(data: API.User.LoginData) {
  return request.post<API.User.LoginResult>('/user/login', data);
}