import React from 'react';

const Article= () => {
  const article = {
    title: '示例文章标题',
    author: '作者名',
    content: '这是文章的内容。这是一个示例文章，用于展示文章详情页面的结构。',
    date: '2023年10月10日',
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>{article.title}</h1>
      <p>
        <strong>作者:</strong> {article.author}
      </p>
      <p>
        <strong>发布日期:</strong> {article.date}
      </p>
      <div style={{ marginTop: '20px' }}>
        <p>{article.content}</p>
      </div>
    </div>
  );
};

export default Article;
