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
      /** 用户信息 */
      profile?: {
        /** 性别 */
        gender: string;
        /** 头像URL */
        avatar: string;
      }
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
  }
}
