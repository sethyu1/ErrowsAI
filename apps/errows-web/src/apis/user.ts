import { request } from '@/apis/request';
import type { RequestClientConfig } from '@yunzhen/request';

export function sendVerificationCodeApi(data: API.User.SendVerificationCodeData) {
  return request.post<API.User.SendVerificationCodeResult>('/user/send_verification_code', data);
}

export function sendMobileVerificationCodeApi(data: API.User.SendMobileVerificationCodeData) {
  return request.post<API.User.SendMobileVerificationCodeResult>('/user/send_mobile_verification_code', data);
}

/** 注册 */
export function registerApi(data: API.User.RegisterData) {
  return request.post<API.User.RegisterResult>('/user/register', data);
}

export function mobileRegisterApi(data: API.User.MobileRegisterData) {
  return request.post<API.User.MobileRegisterResult>('/user/mobile_register', data);
}

/** 验证邮箱 */
export function verifyApi(data: API.User.VerifyData) {
  return request.post<API.User.VerifyResult>('/user/verify', data);
}

/** 登录 */
export function loginApi(data: API.User.LoginData) {
  return request.post<API.User.LoginResult>('/user/login', data);
}

export function mobileLoginApi(data: API.User.MobileLoginData) {
  return request.post<API.User.MobileLoginResult>('/user/mobile_login', data);
}

/** 谷歌登录 */
export function googleLoginApi(data: API.User.GoogleLoginData) {
  return request.post<API.User.GoogleLoginResult>('/user/login/google', data);
}

/** 忘记密码 - 发送邮箱验证码 */
export function forgotPasswordApi(data: API.User.ForgotPasswordData) {
  return request.post<API.User.ForgotPasswordResult>('/user/password/forgot', data);
}

export function mobileForgotPasswordApi(data: API.User.MobileForgotPasswordData) {
  return request.post<API.User.MobileForgotPasswordResult>('/user/mobile_password/forgot', data);
}

/** 更新用户信息 */
export function updateProfileApi(data: API.User.UpdateProfileData) {
  return request.put('/user/profile', data);
}

/** 更新用户密码 */
export function updatePasswordApi(data: API.User.UpdatePasswordData, config?: RequestClientConfig) {
  return request.put('/user/password', data, config);
}

/** 更新用户头像 */
export function updateAvatarApi(file: File) {
  return request.post<API.User.UpdateAvatarResult>(
    '/user/avatar',
    file,
    {
      timeout: 30 * 60 * 1000,
      headers: {
        // 'Content-Type': 'application/octet-stream',
        'Content-Type': file.type,
      },
    }
  );
}

/** 删除账号 */
export function deleteAccountApi() {
  return request.delete('/user/account');
}

/** 退出登录 */
export function logoutApi() {
  // 后端暂时无相关接口
  return Promise.resolve();
}

/** 获取当前用户信息 */
export function fetchCurrentUserApi(config?: RequestClientConfig) {
  return request.get<API.User.Info>('/user/profile', config);
}

/** 创建角色 */
export function createUserCharacterApi(uid: string, data: API.Character.Setting) {
  return request.post<void>(`/user/${uid}/characters`, data);
}

/** 更新角色 */
export function updateUserCharacterApi(uid: string, data: API.Character.Setting & { id: string }) {
  return request.put<void>(`/user/${uid}/characters/${data.id}`, data);
}

/** 删除角色 */
export function deleteUserCharacterApi(uid: string, cid: string) {
  return request.delete<void>(`/user/${uid}/characters/${cid}`);
}

/** 获取角色详情 */
export function fetchUserCharacterApi(uid: string, cid: string) {
  return request.get<API.Character.Setting & { id: string }>(`/user/${uid}/characters/${cid}`);
}
