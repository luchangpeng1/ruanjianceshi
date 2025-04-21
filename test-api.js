/**
 * DeepSeek API 测试脚本
 * 用于直接测试API连接是否正常工作
 */

const axios = require('axios');

// API密钥 - 请替换为你的实际密钥
const API_KEY = 'sk-fc4e93f910194c57aaf071f894e485bc';

// 测试函数
async function testDeepSeekAPI() {
    console.log('开始测试DeepSeek API...');
    
    try {
        // 发送一个简单的请求
        const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
            model: 'deepseek-reasoner',
            messages: [
                {
                    role: 'user',
                    content: '请用一句话回答：什么是软件测试？'
                }
            ],
            temperature: 0.7,
            max_tokens: 100
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            timeout: 30000 // 30秒超时
        });
        
        // 输出API响应
        console.log('API测试成功! 响应数据:');
        console.log(JSON.stringify(response.data, null, 2));
        
        // 如果有生成的内容，显示出来
        if (response.data.choices && response.data.choices.length > 0) {
            console.log('\n生成的内容:');
            console.log(response.data.choices[0].message.content);
        }
        
        return true;
    } catch (error) {
        console.error('API测试失败:');
        
        if (error.response) {
            // 请求已发出，服务器响应状态码超出2xx范围
            console.error(`错误状态码: ${error.response.status}`);
            console.error('错误响应数据:');
            console.error(JSON.stringify(error.response.data, null, 2));
        } else if (error.request) {
            // 请求已发出，但没有收到响应
            console.error('未收到响应:', error.message);
        } else {
            // 设置请求时发生错误
            console.error('请求错误:', error.message);
        }
        
        return false;
    }
}

// 执行测试
console.log('======== DeepSeek API 测试 ========');
testDeepSeekAPI()
    .then(success => {
        if (success) {
            console.log('\n✅ API测试成功，DeepSeek API工作正常');
        } else {
            console.log('\n❌ API测试失败，请检查错误信息');
        }
    })
    .catch(err => {
        console.error('\n💥 测试过程中发生意外错误:', err);
    });

// 如何使用:
// 1. 确保安装了axios: npm install axios
// 2. 运行: node test-api.js 