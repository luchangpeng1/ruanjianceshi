# DeepSeek API 代理服务器

这是一个简单的Node.js代理服务器，用于解决前端直接调用DeepSeek API时遇到的CORS问题。

## 安装步骤

1. 确保已安装Node.js（建议 v14.0.0 或更高版本）
2. 克隆或下载此代理服务器代码
3. 在项目目录中安装依赖:

```bash
npm install
```

## 启动服务器

在项目目录中运行:

```bash
npm start
```

或者直接使用node命令:

```bash
node deepseek-proxy-server.js
```

服务器将在 http://localhost:3000 上启动

## 使用方法

1. 服务器启动后，前端代码应该向 `http://localhost:3000/api/deepseek` 发送请求
2. 请求格式示例:

```javascript
fetch('http://localhost:3000/api/deepseek', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    apiKey: 'your-api-key',
    model: 'deepseek-reasoner',
    messages: [
      {
        role: 'user',
        content: '您的提示词内容'
      }
    ],
    temperature: 0.7,
    max_tokens: 4000
  })
})
```

## 前端代码修改

在现有网站中，需要将 `paper-generator.js` 文件中的API调用部分修改为调用代理服务器。具体修改方法请参考下一节。

## 安全注意事项

- 此代理服务器仅用于开发环境，不建议在生产环境中使用
- API密钥仍然在前端暴露，生产环境应考虑将密钥安全地存储在后端 