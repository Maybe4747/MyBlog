// 用户信息接口类型
export  type USERINFO = {
      id: number;
      username: string;
      email: string;
      //头像URL
      avatar: string;
      //职位
      position: string;
      //公司
      company: string;
      //个人简介
      bio: string;
      location: string;
      //网站
      website: string;
      //技能
      skills: string[];
      //社交链接
      socialLinks: Record<string, string>;
      //隐私设置
      privacySettings: Record<string, any>;
}

// 注册参数类型
export interface registerData {
username: string;
email: string;
password: string;
}
// 登录参数类型
export interface loginData {
username: string;
password: string;
}