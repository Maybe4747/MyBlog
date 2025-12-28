/**
 * 验证工具函数
 */

/**
 * 验证密码强度
 * @param {string} password - 要验证的密码
 * @returns {object} 包含验证结果和强度等级的对象
 */
export const validatePassword = (password) => {
  if (!password || typeof password !== 'string') {
    return { isValid: false, strength: 0, errors: ['密码不能为空'] };
  }

  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const errors = [];
  if (password.length < minLength) {
    errors.push(`密码长度至少${minLength}位`);
  }
  if (!hasUpperCase) {
    errors.push('密码必须包含大写字母');
  }
  if (!hasLowerCase) {
    errors.push('密码必须包含小写字母');
  }
  if (!hasNumbers) {
    errors.push('密码必须包含数字');
  }
  if (!hasSpecialChar) {
    errors.push('密码必须包含特殊字符');
  }

  const isValid = errors.length === 0;
  
  // 计算密码强度等级 (1-4)
  let strength = 0;
  if (password.length >= minLength) strength++;
  if (hasUpperCase) strength++;
  if (hasLowerCase) strength++;
  if (hasNumbers) strength++;
  if (hasSpecialChar) strength++;

  return { 
    isValid, 
    strength, 
    errors,
    strengthLabel: getStrengthLabel(strength)
  };
};

/**
 * 获取密码强度标签
 * @param {number} strength - 强度等级 (0-4)
 * @returns {string} 强度标签
 */
const getStrengthLabel = (strength) => {
  if (strength === 0) return '无';
  if (strength <= 1) return '弱';
  if (strength <= 2) return '中';
  if (strength <= 3) return '强';
  return '很强';
};

/**
 * 验证用户名格式
 * @param {string} username - 要验证的用户名
 * @returns {object} 包含验证结果和错误信息的对象
 */
export const validateUsername = (username) => {
  if (!username || typeof username !== 'string') {
    return { isValid: false, errors: ['用户名不能为空'] };
  }

  const errors = [];
  
  if (username.length < 3) {
    errors.push('用户名长度至少3位');
  }
  
  if (username.length > 20) {
    errors.push('用户名长度不能超过20位');
  }
  
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    errors.push('用户名只能包含字母、数字和下划线');
  }
  
  if (/^\d/.test(username)) {
    errors.push('用户名不能以数字开头');
  }

  return { isValid: errors.length === 0, errors };
};

/**
 * 验证邮箱格式
 * @param {string} email - 要验证的邮箱
 * @returns {object} 包含验证结果和错误信息的对象
 */
export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return { isValid: false, errors: ['邮箱不能为空'] };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValid = emailRegex.test(email);
  
  const errors = [];
  if (!isValid) {
    errors.push('邮箱格式不正确');
  }

  return { isValid, errors };
};

/**
 * 验证手机号格式 (中国)
 * @param {string} phone - 要验证的手机号
 * @returns {object} 包含验证结果和错误信息的对象
 */
export const validatePhone = (phone) => {
  if (!phone || typeof phone !== 'string') {
    return { isValid: false, errors: ['手机号不能为空'] };
  }

  const phoneRegex = /^1[3-9]\d{9}$/;
  const isValid = phoneRegex.test(phone);
  
  const errors = [];
  if (!isValid) {
    errors.push('手机号格式不正确');
  }

  return { isValid, errors };
};

/**
 * 综合验证用户输入
 * @param {object} userData - 用户输入数据
 * @returns {object} 包含各项验证结果的对象
 */
export const validateUserInput = (userData) => {
  const { username, email, password, confirmPassword } = userData;
  
  return {
    username: validateUsername(username),
    email: validateEmail(email),
    password: validatePassword(password),
    confirmPassword: validateConfirmPassword(password, confirmPassword)
  };
};

/**
 * 验证确认密码
 * @param {string} password - 原密码
 * @param {string} confirmPassword - 确认密码
 * @returns {object} 包含验证结果和错误信息的对象
 */
const validateConfirmPassword = (password, confirmPassword) => {
  if (!confirmPassword || typeof confirmPassword !== 'string') {
    return { isValid: false, errors: ['请确认密码'] };
  }

  const errors = [];
  if (password !== confirmPassword) {
    errors.push('两次输入的密码不一致');
  }

  return { isValid: errors.length === 0, errors };
};