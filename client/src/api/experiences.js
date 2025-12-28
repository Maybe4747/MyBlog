import api from './client';

/**
 * 获取当前用户的工作经历
 */
export const getUserExperiences = async () => {
  return api.get('/experiences');
};

/**
 * 添加工作经历
 */
export const addUserExperience = async (experienceData) => {
  return api.post('/experiences', experienceData);
};

/**
 * 更新工作经历
 */
export const updateUserExperience = async (id, experienceData) => {
  return api.put(`/experiences/${id}`, experienceData);
};

/**
 * 删除工作经历
 */
export const deleteUserExperience = async (id) => {
  return api.delete(`/experiences/${id}`);
};

/**
 * 获取当前用户的教育经历
 */
export const getUserEducations = async () => {
  return api.get('/educations');
};

/**
 * 添加教育经历
 */
export const addUserEducation = async (educationData) => {
  return api.post('/educations', educationData);
};

/**
 * 更新教育经历
 */
export const updateUserEducation = async (id, educationData) => {
  return api.put(`/educations/${id}`, educationData);
};

/**
 * 删除教育经历
 */
export const deleteUserEducation = async (id) => {
  return api.delete(`/educations/${id}`);
};