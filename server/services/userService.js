import { getMySQLPool } from '../config/database.js';

/**
 * 获取用户详细信息（包含扩展字段）
 */
export const getUserById = async (userId) => {
  const pool = getMySQLPool();
  
  const [users] = await pool.execute(
    `SELECT u.id, u.username, u.email, u.avatar, u.created_at, u.updated_at, u.last_login,
            up.bio, up.location, up.website, up.company, up.position
     FROM users u
     LEFT JOIN user_profiles up ON u.id = up.user_id
     WHERE u.id = ?`,
    [userId]
  );
  
  if (users.length === 0) {
    return null;
  }
  
  // 获取用户技能
  const [skills] = await pool.execute(
    'SELECT skill_name FROM user_skills WHERE user_id = ?',
    [userId]
  );
  
  // 获取用户社交链接
  const [socialLinks] = await pool.execute(
    'SELECT platform, url FROM user_social_links WHERE user_id = ?',
    [userId]
  );
  
  // 获取用户工作经历
  const [experiences] = await pool.execute(
    `SELECT id, company, position, start_date, end_date, description
     FROM user_experiences
     WHERE user_id = ?
     ORDER BY start_date DESC`,
    [userId]
  );

  // 获取用户教育经历
  const [educations] = await pool.execute(
    `SELECT id, school, degree, major, start_date, end_date, description
     FROM user_education
     WHERE user_id = ?
     ORDER BY start_date DESC`,
    [userId]
  );

  // 获取用户隐私设置
  const [privacySettings] = await pool.execute(
    `SELECT profile_visibility, show_email, show_activity
     FROM user_privacy_settings
     WHERE user_id = ?`,
    [userId]
  );

  const user = users[0];
  user.skills = skills.map(skill => skill.skill_name);
  user.experiences = experiences;
  user.educations = educations;
  user.socialLinks = {};
  socialLinks.forEach(link => {
    user.socialLinks[link.platform] = link.url;
  });
  user.privacySettings = privacySettings[0] || {
    profile_visibility: 'public',
    show_email: 0,
    show_activity: 1
  };

  return user;
};

/**
 * 获取用户详细信息通过用户名
 */
export const getUserByUsername = async (username) => {
  const pool = getMySQLPool();
  
  const [users] = await pool.execute(
    `SELECT u.id, u.username, u.email, u.avatar, u.created_at, u.updated_at, u.last_login,
            up.bio, up.location, up.website, up.company, up.position
     FROM users u
     LEFT JOIN user_profiles up ON u.id = up.user_id
     WHERE u.username = ?`,
    [username]
  );
  
  if (users.length === 0) {
    return null;
  }
  
  // 获取用户技能
  const [skills] = await pool.execute(
    'SELECT skill_name FROM user_skills WHERE user_id = ?',
    [users[0].id]
  );
  
  // 获取用户社交链接
  const [socialLinks] = await pool.execute(
    'SELECT platform, url FROM user_social_links WHERE user_id = ?',
    [users[0].id]
  );
  
  // 获取用户工作经历
  const [experiences] = await pool.execute(
    `SELECT id, company, position, start_date, end_date, description
     FROM user_experiences
     WHERE user_id = ?
     ORDER BY start_date DESC`,
    [users[0].id]
  );

  // 获取用户教育经历
  const [educations] = await pool.execute(
    `SELECT id, school, degree, major, start_date, end_date, description
     FROM user_education
     WHERE user_id = ?
     ORDER BY start_date DESC`,
    [users[0].id]
  );

  // 获取用户隐私设置
  const [privacySettings] = await pool.execute(
    `SELECT profile_visibility, show_email, show_activity
     FROM user_privacy_settings
     WHERE user_id = ?`,
    [users[0].id]
  );

  const user = users[0];
  user.skills = skills.map(skill => skill.skill_name);
  user.experiences = experiences;
  user.educations = educations;
  user.socialLinks = {};
  socialLinks.forEach(link => {
    user.socialLinks[link.platform] = link.url;
  });
  user.privacySettings = privacySettings[0] || {
    profile_visibility: 'public',
    show_email: 0,
    show_activity: 1
  };

  return user;
};

/**
 * 创建用户扩展资料
 */
export const createUserProfile = async (userId, profileData, connection = null) => {
  const pool = getMySQLPool();
  const dbConnection = connection || pool;

  // 插入用户档案
  await dbConnection.execute(
    `INSERT INTO user_profiles (user_id, bio, location, website, company, position)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      userId,
      profileData.bio || null,
      profileData.location || null,
      profileData.website || null,
      profileData.company || null,
      profileData.position || null
    ]
  );

  // 插入技能
  if (profileData.skills && profileData.skills.length > 0) {
    const skillPromises = profileData.skills.map(skill =>
      dbConnection.execute(
        'INSERT IGNORE INTO user_skills (user_id, skill_name) VALUES (?, ?)',
        [userId, skill]
      )
    );
    await Promise.all(skillPromises);
  }

  // 插入社交链接
  if (profileData.socialLinks) {
    const socialLinkPromises = Object.entries(profileData.socialLinks)
      .filter(([platform, url]) => url)
      .map(([platform, url]) =>
        dbConnection.execute(
          `INSERT INTO user_social_links (user_id, platform, url)
           VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE url = ?`,
          [userId, platform, url, url]
        )
      );
    await Promise.all(socialLinkPromises);
  }

  // 插入隐私设置
  await dbConnection.execute(
    `INSERT INTO user_privacy_settings (user_id, profile_visibility, show_email, show_activity)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
     profile_visibility = VALUES(profile_visibility),
     show_email = VALUES(show_email),
     show_activity = VALUES(show_activity)`,
    [
      userId,
      profileData.profileVisibility || 'public',
      profileData.showEmail ? 1 : 0,
      profileData.showActivity ? 1 : 0
    ]
  );

  return await getUserById(userId);
};

/**
 * 更新用户资料
 */
export const updateUserProfile = async (userId, profileData) => {
  const pool = getMySQLPool();
  
  // 更新用户档案
  await pool.execute(
    `INSERT INTO user_profiles (user_id, bio, location, website, company, position) 
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE 
     bio = VALUES(bio),
     location = VALUES(location),
     website = VALUES(website),
     company = VALUES(company),
     position = VALUES(position)`,
    [
      userId,
      profileData.bio || null,
      profileData.location || null,
      profileData.website || null,
      profileData.company || null,
      profileData.position || null
    ]
  );
  
  // 如果提供了技能，则更新
  if (profileData.skills !== undefined) {
    // 先删除现有技能
    await pool.execute('DELETE FROM user_skills WHERE user_id = ?', [userId]);
    
    // 插入新技能
    if (profileData.skills && profileData.skills.length > 0) {
      const skillPromises = profileData.skills.map(skill => 
        pool.execute(
          'INSERT INTO user_skills (user_id, skill_name) VALUES (?, ?)',
          [userId, skill]
        )
      );
      await Promise.all(skillPromises);
    }
  }
  
  // 如果提供了社交链接，则更新
  if (profileData.socialLinks !== undefined) {
    // 先删除现有的社交链接
    await pool.execute('DELETE FROM user_social_links WHERE user_id = ?', [userId]);
    
    // 插入新的社交链接
    if (profileData.socialLinks) {
      const socialLinkPromises = Object.entries(profileData.socialLinks)
        .filter(([platform, url]) => url)
        .map(([platform, url]) => 
          pool.execute(
            'INSERT INTO user_social_links (user_id, platform, url) VALUES (?, ?, ?)',
            [userId, platform, url]
          )
        );
      await Promise.all(socialLinkPromises);
    }
  }
  
  // 如果提供了隐私设置，则更新
  if (profileData.privacySettings) {
    await pool.execute(
      `INSERT INTO user_privacy_settings (user_id, profile_visibility, show_email, show_activity) 
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
       profile_visibility = VALUES(profile_visibility),
       show_email = VALUES(show_email),
       show_activity = VALUES(show_activity)`,
      [
        userId,
        profileData.privacySettings.profileVisibility || 'public',
        profileData.privacySettings.showEmail ? 1 : 0,
        profileData.privacySettings.showActivity ? 1 : 0
      ]
    );
  }
  
  return await getUserById(userId);
};

/**
 * 获取用户统计信息
 */
export const getUserStats = async (userId) => {
  const pool = getMySQLPool();
  
  // 获取关注者数量
  const [followers] = await pool.execute(
    'SELECT COUNT(*) as count FROM follows WHERE following_id = ?',
    [userId]
  );
  
  // 获取文件数量
  const [filesCount] = await pool.execute(
    'SELECT COUNT(*) as count FROM user_files WHERE user_id = ? AND visibility = \'public\'',
    [userId]
  );
  
  // 获取总浏览量（这里简化处理，实际上可能需要更复杂的逻辑）
  // 假设通过文件下载次数来近似浏览量
  const [views] = await pool.execute(
    'SELECT COALESCE(SUM(download_count), 0) as total FROM user_files WHERE user_id = ?',
    [userId]
  );
  
  return {
    followers: followers[0].count,
    files: filesCount[0].count,
    views: views[0].total
  };
};