/**
 * DeepSeek API 代理服务器
 * 用于解决前端直接调用DeepSeek API的CORS问题
 */

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const bodyParser = require('body-parser');

// 创建Express应用
const app = express();
const PORT = 3000;

// 启用CORS，允许任何来源
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// 解析JSON请求体，增加限制
app.use(bodyParser.json({ limit: '50mb' }));

// 创建一个简单的日志中间件
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// 创建代理接口
app.post('/api/deepseek', async (req, res) => {
    try {
        // 获取请求参数
        const { apiKey, model, messages, temperature, max_tokens } = req.body;
        
        // 验证必要参数
        if (!apiKey || !model || !messages) {
            console.error('请求参数不完整:', JSON.stringify(req.body, null, 2));
            return res.status(400).json({ error: '缺少必要参数' });
        }
        
        console.log(`接收到请求: 模型=${model}, 消息数量=${messages.length}`);
        
        // 检查消息内容大小
        const contentSize = JSON.stringify(messages).length;
        console.log(`消息内容大小: ${contentSize} 字节`);
        
        if (contentSize > 100000) {
            console.warn('警告: 消息内容较大，可能超出API限制');
        }
        
        // 构建请求参数
        const requestData = {
            model,
            messages,
            temperature: temperature || 0.7,
            max_tokens: max_tokens || 2000 // 降低token限制以减少超时风险
        };
        
        console.log('发送请求到DeepSeek API...');
        
        // 调用DeepSeek API
        const response = await axios.post('https://api.deepseek.com/v1/chat/completions', requestData, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            timeout: 60000 // 设置60秒超时
        });
        
        console.log('DeepSeek API响应成功');
        
        // 返回API响应
        res.json(response.data);
    } catch (error) {
        console.error('代理请求失败:');
        
        if (error.response) {
            // 请求已发出，服务器响应状态码超出2xx范围
            console.error('API响应错误状态码:', error.response.status);
            console.error('API响应错误数据:', JSON.stringify(error.response.data, null, 2));
            console.error('API响应头:', JSON.stringify(error.response.headers, null, 2));
        } else if (error.request) {
            // 请求已发出，但没有收到响应
            console.error('没有收到API响应:', error.request);
        } else {
            // 设置请求时发生错误
            console.error('请求错误:', error.message);
        }
        
        // 返回错误信息
        res.status(error.response?.status || 500).json({
            error: {
                message: error.response?.data?.error?.message || error.message,
                code: error.response?.data?.error?.code || 'unknown_error'
            }
        });
    }
});

// 添加测试接口，用于测试代理服务器是否工作
app.get('/api/test', (req, res) => {
    res.json({ success: true, message: '代理服务器工作正常' });
});

// 添加服务器状态检查
app.get('/api/status', (req, res) => {
    res.json({ status: 'ok', message: 'DeepSeek代理服务器运行正常' });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`DeepSeek代理服务器已启动: http://localhost:${PORT}`);
    console.log(`API代理端点: http://localhost:${PORT}/api/deepseek`);
    console.log(`状态检查: http://localhost:${PORT}/api/status`);
}); 