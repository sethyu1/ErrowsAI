/* eslint-disable @typescript-eslint/triple-slash-reference */
/// <reference path="./character.d.ts" />
/// <reference path="./pixel.d.ts" />

declare namespace API {
  namespace User {
    // ======================== 用户信息 ========================
    interface Info {
      /** 用户ID */
      id: string;
      /** 邮箱 */
      email: string;
      /** 用户名 */
      name: string;
      /** Pixel */
      pixel?: Pixel.BindPixelData;
      /** 用户信息 */
      profile?: {
        /** 性别 */
        gender: string;
        /** 头像URL */
        avatar: string;
      }
    }

    // ======================== 注册 ========================
    interface RegisterData {
      email: string;
      password: string;
      verificationCode: string;
      clickid?: string;
      siteid?: string;
    }

    interface SendVerificationCodeData {
      email: string;
      type: 1 | 2;
    }

    interface SendVerificationCodeResult {
      uid: string;
    }

    interface RegisterResult {
      token: string;
      user: Info;
    }

    interface SendMobileVerificationCodeData {
      mobile: string;
      type: 1 | 2;
    }

    interface SendMobileVerificationCodeResult {
      uid: string;
    }

    interface MobileRegisterData {
      mobile: string;
      password: string;
      verificationCode: string;
      clickid?: string;
      siteid?: string;
    }

    interface MobileRegisterResult {
      token: string;
      user: Info;
    }

    // ======================== 登录 ========================
    interface LoginData {
      email: string;
      password: string;
    }

    interface LoginResult {
      /** Token */
      token: string;
    }

    interface MobileLoginData {
      mobile: string;
      password: string;
    }

    interface MobileLoginResult {
      token: string;
    }

    // ======================== 谷歌登录 ========================
    interface GoogleLoginData {
      access_token: string;
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface GoogleLoginResult extends LoginResult {}

    // ======================== 更新账户信息 ========================
    interface UpdateProfileData {
      name: string;
      gender: string;
    }

    // ======================== 更新账户密码 ========================
    interface UpdatePasswordData {
      /** 新密码 */
      password: string;
    }

    // ======================== 更新账户头像 ========================
    interface UpdateAvatarResult {
      /** 头像URL */
      avatar_url: string;
    }

    // ======================== 忘记密码 - 发送邮箱验证码 ========================
    interface ForgotPasswordData {
      email: string;
      verificationCode: string;
      password: string;
    }

    interface ForgotPasswordResult {
      /** Token */
      token?: string;
      /** User info (only when verification code and password are provided) */
      user?: Info;
    }

    interface MobileForgotPasswordData {
      mobile: string;
      verificationCode: string;
      password: string;
    }

    interface MobileForgotPasswordResult {
      token?: string;
      user?: Info;
    }

    // ======================== 验证 ========================
    interface VerifyData {
      uid: string;
      code: string;
    }

    interface VerifyResult {
      /** Token */
      token: string;
    }
  }
}
