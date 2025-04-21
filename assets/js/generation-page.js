/**
 * 试卷生成页面JavaScript
 * 负责处理用户交互、API调用和生成结果展示
 */

// 全局变量
let controller = null; // AbortController，用于取消API请求
let mdContent = null;  // 存储Markdown内容
let currentPaperType = ''; // 当前生成的试卷类型：'objective' 或 'subjective'

// DOM元素
const startButton = document.getElementById('start-generation');
const generateObjectiveButton = document.getElementById('generate-objective');
const generateSubjectiveButton = document.getElementById('generate-subjective');
const cancelButton = document.getElementById('cancel-generation');
const downloadButton = document.getElementById('download-paper');
const printButton = document.getElementById('print-paper');
const statusBox = document.getElementById('generation-status');
const thinkingBox = document.getElementById('thinking-process');
const generatedPaper = document.getElementById('generated-paper');
const errorBox = document.getElementById('generation-error');
const progressFill = document.getElementById('progress-fill');
const statusText = document.getElementById('status-text');
const paperContent = document.getElementById('paper-content');
const generationDate = document.getElementById('generation-date');
const diagnosticInfo = document.getElementById('diagnostic-info');
const diagnosticOutput = document.getElementById('diagnostic-output');
const testConnectionButton = document.getElementById('test-connection');
const useCorsProxyButton = document.getElementById('use-cors-proxy');
const useBackupEndpointButton = document.getElementById('use-backup-endpoint');

// 模型配置选择器
const modelSelect = document.getElementById('model-select');
const maxTokensSelect = document.getElementById('max-tokens');
const temperatureSelect = document.getElementById('temperature');

// API配置
const API_ENDPOINTS = {
    primary: 'https://api.deepseek.com/v1/chat/completions',
    backup: 'https://api.deepseek.ai/v1/chat/completions',  // 备用端点
    corsProxy: 'https://corsproxy.io/?'  // CORS代理
};
let currentEndpoint = 'primary'; // 当前使用的端点
let useCorsProxy = false; // 是否使用CORS代理
let simulationMode = false; // 是否使用模拟模式
const API_KEY = 'sk-fc4e93f910194c57aaf071f894e485bc'; // 使用真实密钥

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', () => {
    // 绑定事件
    generateObjectiveButton.addEventListener('click', () => {
        currentPaperType = 'objective';
        generatePaper();
    });
    generateSubjectiveButton.addEventListener('click', () => {
        currentPaperType = 'subjective';
        generatePaper();
    });
    startButton.addEventListener('click', generatePaper);
    cancelButton.addEventListener('click', cancelGeneration);
    downloadButton.addEventListener('click', downloadPaper);
    printButton.addEventListener('click', printPaper);
    
    // 绑定诊断按钮事件
    if (testConnectionButton) {
        testConnectionButton.addEventListener('click', testApiConnection);
    }
    
    if (useCorsProxyButton) {
        useCorsProxyButton.addEventListener('click', () => {
            useCorsProxy = true;
            logDiagnostic('已启用CORS代理。下次API请求将使用代理。');
            showDiagnosticInfo();
        });
    }
    
    if (useBackupEndpointButton) {
        useBackupEndpointButton.addEventListener('click', () => {
            currentEndpoint = currentEndpoint === 'primary' ? 'backup' : 'primary';
            logDiagnostic(`已切换到${currentEndpoint === 'primary' ? '主要' : '备用'}API端点。`);
            showDiagnosticInfo();
        });
    }
    
    // 添加模拟模式和快速测试按钮
    if (diagnosticInfo) {
        // 模拟模式按钮
        const simulationButton = document.createElement('button');
        simulationButton.id = 'toggle-simulation';
        simulationButton.className = 'btn';
        simulationButton.textContent = '启用模拟模式';
        simulationButton.style.marginLeft = '10px';
        simulationButton.addEventListener('click', () => {
            simulationMode = !simulationMode;
            simulationButton.textContent = simulationMode ? '禁用模拟模式' : '启用模拟模式';
            logDiagnostic(`模拟模式已${simulationMode ? '启用' : '禁用'}`);
        });
        
        // 快速测试生成按钮
        const testGenerateButton = document.createElement('button');
        testGenerateButton.id = 'test-generate';
        testGenerateButton.className = 'btn';
        testGenerateButton.textContent = '快速测试生成';
        testGenerateButton.style.marginLeft = '10px';
        testGenerateButton.addEventListener('click', () => {
            logDiagnostic('开始执行快速测试生成...');
            // 自动启用模拟模式
            simulationMode = true;
            simulationButton.textContent = '禁用模拟模式';
            // 执行生成
            generatePaper();
        });
        
        // 查看文档按钮
        const viewDocButton = document.createElement('button');
        viewDocButton.id = 'view-doc';
        viewDocButton.className = 'btn';
        viewDocButton.textContent = '查看文档内容';
        viewDocButton.style.marginLeft = '10px';
        viewDocButton.addEventListener('click', async () => {
            try {
                logDiagnostic('正在获取文档内容...');
                const content = await fetchMdContent('软件测试/软件测试重点整理.md');
                logDiagnostic(`文档获取成功, 长度: ${content.length} 字符`);
                
                // 显示前500个字符预览
                const preview = content.substring(0, 500) + '...';
                logDiagnostic('文档预览:');
                logDiagnostic(preview);
            } catch (error) {
                logDiagnostic(`获取文档失败: ${error.message}`);
            }
        });
        
        // 添加到诊断区域
        const buttonContainer = document.createElement('div');
        buttonContainer.style.marginTop = '15px';
        buttonContainer.appendChild(testConnectionButton.cloneNode(true)).addEventListener('click', testApiConnection);
        buttonContainer.appendChild(simulationButton);
        buttonContainer.appendChild(testGenerateButton);
        buttonContainer.appendChild(viewDocButton);
        
        // 替换原来的按钮
        const originalButtons = document.querySelectorAll('#diagnostic-info .btn');
        originalButtons.forEach(btn => btn.remove());
        
        // 添加新按钮容器
        document.getElementById('diagnostic-output').insertAdjacentElement('afterend', buttonContainer);
    }
    
    // 初始化UI
    resetUI();
    
    // 添加双击启用诊断功能
    document.querySelector('h2').addEventListener('dblclick', () => {
        showDiagnosticInfo();
        logDiagnostic('诊断模式已启用');
    });
});

/**
 * 重置UI状态
 */
function resetUI() {
    startButton.style.display = 'inline-block';
    cancelButton.style.display = 'none';
    statusBox.style.display = 'none';
    thinkingBox.style.display = 'none';
    generatedPaper.style.display = 'none';
    errorBox.style.display = 'none';
    errorBox.innerHTML = '';
    progressFill.style.width = '0%';
    thinkingBox.textContent = '';
    statusText.textContent = '正在准备生成...';
}

/**
 * 生成试卷的主函数
 */
async function generatePaper() {
    try {
        console.log('开始生成试卷流程...');
        
        // 更新UI状态
        startButton.style.display = 'none';
        cancelButton.style.display = 'inline-block';
        statusBox.style.display = 'block';
        thinkingBox.style.display = 'block';
        thinkingBox.textContent = ''; // 清空思考框内容
        generatedPaper.style.display = 'none';
        errorBox.style.display = 'none';
        
        updateStatus('正在获取软件测试资料...', 10);
        
        // 获取软件测试重点整理的内容
        if (!mdContent) {
            console.log('正在获取软件测试重点整理文档...');
            try {
                mdContent = await fetchMdContent('软件测试/软件测试重点整理.md');
                console.log('获取软件测试重点整理成功，内容长度:', mdContent.length);
            } catch (error) {
                console.error('获取文档失败:', error);
                throw error;
            }
        } else {
            console.log('使用缓存的文档内容，长度:', mdContent.length);
        }
        
        // 获取用户选择的参数
        const model = modelSelect.value;
        const maxTokens = parseInt(maxTokensSelect.value);
        const temperature = parseFloat(temperatureSelect.value);
        
        console.log('用户选择参数:', { model, maxTokens, temperature });
        updateStatus('正在构建提示词...', 20);
        
        // 构建提示词
        const prompt = buildPrompt(mdContent);
        console.log('提示词构建完成，长度:', prompt.length);
        
        // 创建AbortController用于取消请求
        controller = new AbortController();
        const signal = controller.signal;
        
        updateStatus('正在连接DeepSeek API...', 30);
        logDiagnostic('开始调用DeepSeek API生成试卷...');
        
        // 调用DeepSeek API
        try {
            console.log('正在调用API...');
            const response = await callDeepSeekAPI(prompt, model, temperature, maxTokens, signal);
            console.log('API调用成功，获取到响应');
            logDiagnostic('API调用成功，获取到完整响应');
            
            if (response && response.choices && response.choices.length > 0) {
                // 提取生成的内容
                console.log('正在处理API返回内容...');
                const generatedContent = processGeneratedContent(response.choices[0].message.content);
                
                // 显示生成的试卷
                console.log('正在显示生成的试卷...');
                displayGeneratedPaper(generatedContent);
                
                updateStatus('试卷生成完成!', 100);
                logDiagnostic('试卷生成全流程完成');
            } else {
                console.error('API响应格式不正确:', response);
                throw new Error('API返回格式不正确');
            }
        } catch (error) {
            console.error('API调用过程中发生错误:', error);
            throw error;
        }
    } catch (error) {
        console.error('生成试卷流程出错:', error);
        
        if (error.name === 'AbortError') {
            updateStatus('生成已取消', 0);
            logDiagnostic('生成流程被用户手动取消');
        } else {
            showError('生成试卷时出错: ' + error.message);
            logDiagnostic('生成试卷失败: ' + error.message);
        }
    } finally {
        controller = null;
        cancelButton.style.display = 'none';
        startButton.style.display = 'inline-block';
    }
}

/**
 * 检查网络连接
 * @returns {Promise<boolean>} 网络连接是否可用
 */
async function checkNetworkConnection() {
    // 暂时跳过网络检测，直接返回true
    console.log('跳过网络连接检测，直接继续');
    return true;
    
    /* 下面的代码暂时不使用
    try {
        // 使用可靠的Google服务检测网络连接
        const abortController = new AbortController();
        const timeoutId = setTimeout(() => abortController.abort(), 5000);
        
        // 尝试请求一个可靠的外部资源检测网络连接
        const response = await fetch('https://www.google.com/generate_204', { 
            method: 'HEAD',
            mode: 'no-cors',
            cache: 'no-cache',
            signal: abortController.signal
        });
        
        clearTimeout(timeoutId);
        return true;
    } catch (error) {
        console.error('网络连接检查失败:', error);
        // 如果fetch失败，使用浏览器的navigator.onLine作为备选
        const isOnline = navigator.onLine;
        console.log('浏览器网络状态检测:', isOnline ? '在线' : '离线');
        return isOnline;
    }
    */
}

/**
 * 获取Markdown文件内容
 * @param {string} filePath - Markdown文件路径
 * @returns {Promise<string>} Markdown内容
 */
async function fetchMdContent(filePath) {
    try {
        const response = await fetch(filePath);
        if (!response.ok) {
            throw new Error(`无法获取文件内容 (${response.status})`);
        }
        return await response.text();
    } catch (error) {
        showError('无法加载Markdown文件: ' + error.message);
        throw error;
    }
}

/**
 * 构建API提示词
 * @param {string} mdContent - Markdown内容
 * @returns {string} 提示词
 */
function buildPrompt(mdContent) {
    if (currentPaperType === 'objective') {
        return `你是一位专业的软件测试教师，精通软件测试的各个领域。我需要你基于以下软件测试核心内容，生成一份完整的软件测试模拟试卷的客观题部分，包括选择题和判断题。

试卷要求：
1. 包含15道选择题（每题2分，共30分）
2. 包含10道判断题（每题2分，共20分）
3. 所有题目必须包含标准答案
4. 所有题目必须包含详细解析
5. 所有题目必须具有交互功能，用户可以作答并获得对错反馈

试卷内容应覆盖以下核心知识点：
${mdContent}

生成格式要求：
1. 使用HTML格式输出，不要使用Markdown
2. 每个选择题选项使用input type="radio"元素，每组选项name属性设为"q"+题号(如第1题为"q1")
3. 每个选项设置data-correct="true/false"属性标记是否为正确答案
4. 每道判断题使用input type="radio"元素，name属性设为"j"+题号(如第1题为"j1")
5. 每个选项的value属性设置为选项的内容，如"A"或"B"或"正确"或"错误"
6. 每道题后添加一个"查看答案"按钮，点击后显示解析

请确保生成的HTML满足上述结构化要求，以便JavaScript能够正确处理用户交互。`;
    } else if (currentPaperType === 'subjective') {
        return `你是一位专业的软件测试教师，精通软件测试的各个领域。我需要你基于以下软件测试核心内容，生成一份完整的软件测试模拟试卷的主观题部分，包括名词解释和简答题。

试卷要求：
1. 包含5道名词解释题（从第1-5章各出一题，每题4分，共20分）
2. 包含6道简答题（从第1-6章各出一题，每题5分，共30分）
3. 所有题目必须包含标准答案
4. 所有题目必须包含详细解析
5. 所有题目必须具有交互功能，用户点击可查看参考答案

请特别注意：
- 名词解释必须从第1-5章各出一题
- 简答题必须从第1-6章各出一题
- 所有题目都需要标明所属章节

试卷内容应覆盖以下核心知识点：
${mdContent}

生成格式要求：
1. 使用HTML格式输出，不要使用Markdown
2. 名词解释题用div包裹，设置class="definition-question"和data-chapter="章节号"属性
3. 简答题用div包裹，设置class="essay-question"和data-chapter="章节号"属性
4. 答案和解析包含在div中，设置class="answer"并初始设置style="display:none;"
5. 每道题后添加一个"查看答案"按钮，设置class="show-answer"

请确保生成的HTML满足上述结构化要求，以便JavaScript能够正确处理用户交互。`;
    } else {
        // 原来的提示词作为默认
        return `你是一位专业的软件测试教师，精通软件测试的各个领域。我需要你基于以下软件测试核心内容，生成一份完整的软件测试模拟试卷，包括选择题、判断题、名词解释和简答题。

试卷要求：
1. 试卷总分100分
2. 包含15道选择题（每题2分，共30分）
3. 包含10道判断题（每题2分，共20分）
4. 包含5道名词解释题（从第1-5章各出一题，每题4分，共20分）
5. 包含6道简答题（从第1-6章各出一题，每题5分，共30分）
6. 所有题目必须包含标准答案
7. 所有题目必须包含详细解析

请特别注意：
- 名词解释必须从第1-5章各出一题
- 简答题必须从第1-6章各出一题
- 如不满足上述章节分布要求则重新生成

试卷内容应覆盖以下核心知识点：
${mdContent}

请生成一份格式清晰、结构合理、难度适中的软件测试模拟试卷，确保每个问题都有明确的答案和详细的解析。最终输出的试卷应当采用Markdown格式，便于阅读和打印。`;
    }
}

/**
 * 调用DeepSeek API
 * @param {string} prompt - 提示词
 * @param {string} model - 模型名称
 * @param {number} temperature - 温度参数
 * @param {number} maxTokens - 最大生成token数
 * @param {AbortSignal} signal - 取消信号
 * @returns {Promise<Object>} API响应
 */
async function callDeepSeekAPI(prompt, model, temperature, maxTokens, signal) {
    // 如果开启了模拟模式，返回模拟数据
    if (simulationMode) {
        logDiagnostic('使用模拟模式，不进行实际API调用');
        console.log('模拟模式已启用，返回模拟数据');
        
        // 延迟模拟API调用时间
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        updateStatus('正在模拟生成试卷...', 60);
        
        // 再延迟一段时间
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        return {
            choices: [
                {
                    message: {
                        content: getSimulatedPaper()
                    }
                }
            ]
        };
    }

    try {
        updateStatus('正在向DeepSeek API发送请求...', 40);
        let endpoint = API_ENDPOINTS[currentEndpoint];
        
        // 如果启用了CORS代理，添加代理前缀
        if (useCorsProxy) {
            endpoint = API_ENDPOINTS.corsProxy + encodeURIComponent(endpoint);
            console.log('使用CORS代理:', endpoint);
        }
        
        console.log('API请求信息:', {
            endpoint: endpoint,
            model: model,
            温度: temperature,
            最大Token: maxTokens,
            使用代理: useCorsProxy
        });
        
        // 设置30秒超时
        let timeoutId;
        const timeoutPromise = new Promise((_, reject) => {
            timeoutId = setTimeout(() => {
                if (controller) controller.abort();
                console.log('API请求超时，已取消请求');
                reject(new Error('API请求超时，已取消请求'));
            }, 30000);
        });
        
        // 构建请求体 - 修改为与test-api.js一致，不使用流式传输
        const requestBody = {
            model: model,
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: temperature,
            max_tokens: maxTokens,
            // 移除流式传输选项
            // stream: true
        };
        
        console.log('请求体:', JSON.stringify(requestBody, null, 2));
        
        // 发送请求
        console.log('发送API请求到:', endpoint);
        
        // 使用Promise.race竞争处理超时
        const response = await Promise.race([
            fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_KEY}`
                },
                body: JSON.stringify(requestBody),
                signal: signal
            }),
            timeoutPromise
        ]);
        
        // 清除超时
        clearTimeout(timeoutId);
        console.log('收到API响应:', response.status, response.statusText);
        
        if (!response.ok) {
            let errorMessage = `API请求失败 (${response.status})`;
            try {
                const errorText = await response.text();
                console.error('API错误详情:', errorText);
                errorMessage += `: ${errorText}`;
            } catch (e) {
                console.error('无法获取API错误详情:', e);
            }
            throw new Error(errorMessage);
        }
        
        // 处理非流式响应
        console.log('正在解析API响应...');
        const data = await response.json();
        console.log('解析完成的响应数据:', data);
        
        // 提取生成的内容
        if (data.choices && data.choices.length > 0) {
            const content = data.choices[0].message.content;
            thinkingBox.textContent = content;
            updateStatus('试卷生成完成!', 100);
            
            // 返回处理后的响应
            return {
                choices: [
                    {
                        message: {
                            content: content
                        }
                    }
                ]
            };
        } else {
            throw new Error('API响应格式不正确');
        }
    } catch (error) {
        console.error('API调用异常:', error);
        
        // 检查是否是CORS错误
        if (error.message.includes('CORS') || error.name === 'TypeError') {
            console.log('检测到可能的CORS错误，尝试使用CORS代理...');
            
            // 如果当前没有使用代理，尝试使用代理
            if (!useCorsProxy) {
                useCorsProxy = true;
                showError('检测到跨域限制，正在尝试使用CORS代理...');
                
                // 重新尝试API调用
                return callDeepSeekAPI(prompt, model, temperature, maxTokens, signal);
            }
        }
        
        // 如果当前端点失败且有备选端点
        if (currentEndpoint === 'primary' && 
            (error.message.includes('Failed to fetch') || 
             error.message.includes('ERR_CONNECTION_CLOSED') ||
             error.message.includes('404'))) {
            
            console.log('主端点失败，尝试切换到备用端点...');
            currentEndpoint = 'backup';
            // 重置代理状态
            useCorsProxy = false;
            showError('主API端点连接失败，正在尝试备用端点...');
            
            // 重新尝试API调用
            return callDeepSeekAPI(prompt, model, temperature, maxTokens, signal);
        }
        
        if (error.name !== 'AbortError') {
            showError('API调用失败: ' + error.message);
            
            // 添加更多具体的错误信息和解决方案
            if (error.message.includes('Failed to fetch') || 
                error.message.includes('ERR_CONNECTION_CLOSED')) {
                showError('网络连接问题: 无法连接到DeepSeek API服务器。请检查您的网络连接，或者服务器可能暂时不可用。');
            } else if (error.message.includes('401')) {
                showError('认证错误: API密钥可能无效或已过期。');
            } else if (error.message.includes('429')) {
                showError('请求频率过高: 已超出API调用限制，请稍后再试。');
            } else if (error.message.includes('404')) {
                showError('API端点错误: 所请求的资源不存在，请检查API端点设置。');
            } else {
                showError('详细错误: ' + error.toString());
            }
        }
        throw error;
    }
}

/**
 * 处理生成的内容
 * @param {string} content - API返回的内容
 * @returns {string} 处理后的内容
 */
function processGeneratedContent(content) {
    // 如果是HTML内容，进行额外处理
    if (currentPaperType === 'objective' || currentPaperType === 'subjective') {
        // 检查内容是否已经是HTML格式
        if (!content.includes('<html>') && !content.includes('<body>')) {
            // 添加基本的交互脚本
            content += `
<script>
document.addEventListener('DOMContentLoaded', function() {
    // 为所有选择题和判断题的选项添加点击事件
    const allOptions = document.querySelectorAll('input[type="radio"]');
    allOptions.forEach(option => {
        option.addEventListener('change', function() {
            const isCorrect = this.getAttribute('data-correct') === 'true';
            const resultSpan = document.createElement('span');
            resultSpan.className = isCorrect ? 'correct-answer' : 'wrong-answer';
            resultSpan.textContent = isCorrect ? ' ✓ 正确' : ' ✗ 错误';
            
            // 移除之前的结果显示
            const questionDiv = this.closest('.question');
            if (questionDiv) {
                const previousResults = questionDiv.querySelectorAll('.correct-answer, .wrong-answer');
                previousResults.forEach(el => el.remove());
                
                // 在选项后添加结果
                this.parentNode.appendChild(resultSpan);
                
                // 如果回答正确，禁用其他选项
                if (isCorrect) {
                    const otherOptions = questionDiv.querySelectorAll('input[type="radio"]:not(:checked)');
                    otherOptions.forEach(opt => {
                        opt.disabled = true;
                    });
                }
            }
        });
    });
    
    // 为所有"查看答案"按钮添加点击事件
    const showAnswerButtons = document.querySelectorAll('.show-answer');
    showAnswerButtons.forEach(button => {
        button.addEventListener('click', function() {
            const answerDiv = this.nextElementSibling;
            if (answerDiv && answerDiv.classList.contains('answer')) {
                if (answerDiv.style.display === 'none' || answerDiv.style.display === '') {
                    answerDiv.style.display = 'block';
                    this.textContent = '隐藏答案';
                } else {
                    answerDiv.style.display = 'none';
                    this.textContent = '查看答案';
                }
            }
        });
    });
});
</script>
<style>
.correct-answer {
    color: #4caf50;
    font-weight: bold;
    margin-left: 10px;
}
.wrong-answer {
    color: #f44336;
    font-weight: bold;
    margin-left: 10px;
}
.question {
    margin-bottom: 20px;
    padding: 15px;
    background-color: #f9f9f9;
    border-radius: 8px;
}
.answer {
    margin-top: 10px;
    padding: 10px;
    background-color: #e8f5e9;
    border-left: 4px solid #4caf50;
    border-radius: 4px;
}
.show-answer {
    background-color: #2196f3;
    color: white;
    border: none;
    padding: 5px 10px;
    border-radius: 4px;
    cursor: pointer;
    margin-top: 10px;
}
.show-answer:hover {
    background-color: #0b7dda;
}
.options {
    margin-left: 20px;
    margin-top: 10px;
}
.option {
    margin-bottom: 5px;
}
</style>`;
        }
    }
    
    return content;
}

/**
 * 显示生成的试卷
 * @param {string} content - 生成的试卷内容
 */
function displayGeneratedPaper(content) {
    try {
        // 检查showdown是否可用
        if (typeof showdown === 'undefined') {
            throw new Error('Showdown library not loaded');
        }

        // 将result-container改为paper-content
        const paperContentElement = document.getElementById('paper-content');
        
        // 如果是HTML格式的内容，直接显示
        if (content.trim().startsWith('<')) {
            paperContentElement.innerHTML = content;
            
            // 添加试卷互动功能
            setupPaperInteractions();
        } else {
            // 如果是Markdown，则转换为HTML
            const converter = new showdown.Converter();
            paperContentElement.innerHTML = converter.makeHtml(content);
        }
        
        // 显示生成日期
        const generationDateElement = document.getElementById('generation-date');
        if (generationDateElement) {
            generationDateElement.textContent = new Date().toLocaleString();
        }
        
        // 显示下载和打印按钮
        const paperActionsElement = document.querySelector('.generation-controls');
        if (paperActionsElement) {
            paperActionsElement.style.display = 'block';
        }

        // 显示生成的试卷区域
        const generatedPaperElement = document.getElementById('generated-paper');
        if (generatedPaperElement) {
            generatedPaperElement.style.display = 'block';
        }
    } catch (error) {
        console.error('显示试卷内容时出错:', error);
        showError(`显示试卷内容时出错: ${error.message}`);
        
        // 直接显示纯文本以防止完全失败
        const paperContentElement = document.getElementById('paper-content');
        if (paperContentElement) {
            paperContentElement.textContent = content;
        }
    }
}

/**
 * 设置试卷的交互功能
 */
function setupPaperInteractions() {
    // 获取所有"查看答案"按钮
    const showAnswerButtons = document.querySelectorAll('.show-answer');
    
    // 给每个按钮添加点击事件监听器
    showAnswerButtons.forEach(button => {
        button.addEventListener('click', function() {
            // 找到对应的答案区域
            const answerDiv = this.nextElementSibling;
            
            // 切换答案的显示状态
            if (answerDiv.style.display === 'none') {
                answerDiv.style.display = 'block';
                this.textContent = '隐藏答案';
            } else {
                answerDiv.style.display = 'none';
                this.textContent = '查看答案';
            }
        });
    });
    
    // 给选择题和判断题选项添加事件监听器
    const radioInputs = document.querySelectorAll('input[type="radio"]');
    radioInputs.forEach(input => {
        input.addEventListener('change', function() {
            // 找到所有同名的单选按钮
            const name = this.getAttribute('name');
            const options = document.querySelectorAll(`input[name="${name}"]`);
            
            // 移除之前的样式
            options.forEach(option => {
                option.parentElement.classList.remove('correct', 'incorrect');
            });
            
            // 添加新样式
            const isCorrect = this.getAttribute('data-correct') === 'true';
            this.parentElement.classList.add(isCorrect ? 'correct' : 'incorrect');
            
            // 自动显示答案（如果回答错误）
            if (!isCorrect) {
                const questionDiv = this.closest('.question');
                const answerDiv = questionDiv.querySelector('.answer');
                const showAnswerButton = questionDiv.querySelector('.show-answer');
                
                if (answerDiv && answerDiv.style.display === 'none') {
                    answerDiv.style.display = 'block';
                    if (showAnswerButton) {
                        showAnswerButton.textContent = '隐藏答案';
                    }
                }
            }
        });
    });
    
    // 添加样式
    addPaperStyles();
}

/**
 * 添加试卷所需的样式
 */
function addPaperStyles() {
    // 检查是否已添加样式
    if (document.getElementById('paper-styles')) {
        return;
    }
    
    // 创建样式元素
    const styleElement = document.createElement('style');
    styleElement.id = 'paper-styles';
    styleElement.textContent = `
        .question, .definition-question, .essay-question {
            margin-bottom: 20px;
            padding: 15px;
            border: 1px solid #e0e0e0;
            border-radius: 5px;
            background-color: #f9f9f9;
        }
        .options {
            margin: 10px 0;
        }
        .option {
            margin: 5px 0;
        }
        .correct {
            color: #2e7d32;
            font-weight: bold;
        }
        .incorrect {
            color: #c62828;
            text-decoration: line-through;
        }
        .show-answer {
            background-color: #1976d2;
            color: white;
            border: none;
            padding: 5px 10px;
            border-radius: 3px;
            cursor: pointer;
            margin-top: 10px;
        }
        .answer {
            margin-top: 10px;
            padding: 10px;
            background-color: #e3f2fd;
            border-radius: 3px;
        }
    `;
    
    // 添加到文档头部
    document.head.appendChild(styleElement);
}

/**
 * 取消生成过程
 */
function cancelGeneration() {
    if (controller) {
        controller.abort();
        resetUI();
        updateStatus('生成已取消', 0);
    }
}

/**
 * 下载生成的试卷
 */
function downloadPaper() {
    const content = paperContent.innerText;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `软件测试模拟试卷_${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * 打印生成的试卷
 */
function printPaper() {
    window.print();
}

/**
 * 更新状态信息
 * @param {string} message - 状态消息
 * @param {number} percent - 进度百分比
 */
function updateStatus(message, percent) {
    statusText.textContent = message;
    progressFill.style.width = `${percent}%`;
}

/**
 * 显示错误信息
 * @param {string} message - 错误消息
 */
function showError(message) {
    // 如果errorBox已经有内容，添加到现有内容
    if (errorBox.style.display === 'block') {
        errorBox.innerHTML += `<br><br>${message}`;
    } else {
        errorBox.innerHTML = message;
        errorBox.style.display = 'block';
        statusBox.style.display = 'none';
        thinkingBox.style.display = 'none';
    }
    
    // 如果是严重错误，显示重试按钮
    if (!errorBox.querySelector('.retry-button')) {
        const retryButton = document.createElement('button');
        retryButton.className = 'btn retry-button';
        retryButton.style.marginTop = '15px';
        retryButton.textContent = '重试';
        retryButton.addEventListener('click', function() {
            // 清除错误状态
            errorBox.style.display = 'none';
            errorBox.innerHTML = '';
            
            // 重置API端点到主要端点
            currentEndpoint = 'primary';
            
            // 重置UI状态
            resetUI();
            
            // 重新生成
            generatePaper();
        });
        
        errorBox.appendChild(retryButton);
    }
}

/**
 * 测试API连接
 */
async function testApiConnection() {
    logDiagnostic('正在测试API连接...');
    showDiagnosticInfo();
    
    try {
        // 构建一个简单的测试请求
        const endpoint = useCorsProxy 
            ? API_ENDPOINTS.corsProxy + encodeURIComponent(API_ENDPOINTS[currentEndpoint])
            : API_ENDPOINTS[currentEndpoint];
        
        logDiagnostic(`使用端点: ${endpoint}`);
        logDiagnostic(`使用CORS代理: ${useCorsProxy ? '是' : '否'}`);
        
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    {
                        role: 'user',
                        content: '简单测试'
                    }
                ],
                max_tokens: 10
            })
        });
        
        const statusText = `状态码: ${response.status} ${response.statusText}`;
        logDiagnostic(statusText);
        
        if (response.ok) {
            const data = await response.json();
            logDiagnostic('API连接测试成功!');
            logDiagnostic('响应数据:');
            logDiagnostic(JSON.stringify(data, null, 2));
        } else {
            const errorText = await response.text();
            logDiagnostic('API连接测试失败:');
            logDiagnostic(errorText);
        }
    } catch (error) {
        logDiagnostic('API连接测试出错:');
        logDiagnostic(error.toString());
        
        // 检查是否是CORS错误
        if (error.message.includes('CORS') || error.name === 'TypeError') {
            logDiagnostic('检测到可能的CORS错误，建议尝试使用CORS代理');
        }
    }
}

/**
 * 记录诊断信息
 * @param {string} message - 诊断信息
 */
function logDiagnostic(message) {
    const timestamp = new Date().toLocaleTimeString();
    const formattedMessage = `[${timestamp}] ${message}`;
    
    if (diagnosticOutput) {
        diagnosticOutput.textContent += formattedMessage + '\n';
        diagnosticOutput.scrollTop = diagnosticOutput.scrollHeight;
    }
    
    console.log('[诊断]', message);
}

/**
 * 显示诊断信息区域
 */
function showDiagnosticInfo() {
    if (diagnosticInfo) {
        diagnosticInfo.style.display = 'block';
    }
}

/**
 * 获取模拟试卷内容
 * @returns {string} 模拟试卷内容
 */
function getSimulatedPaper() {
    if (currentPaperType === 'objective') {
        return `
<h1>软件测试模拟试卷 - 客观题部分</h1>
<p>总分：50分 (选择题30分，判断题20分)</p>

<h2>一、选择题（每题2分，共30分）</h2>

<div class="question">
    <p>1. 下列关于软件测试的说法，错误的是：</p>
    <div class="options">
        <div class="option"><label><input type="radio" name="q1" value="A" data-correct="false"> A. 软件测试是为了发现错误而执行程序的过程</label></div>
        <div class="option"><label><input type="radio" name="q1" value="B" data-correct="true"> B. 软件测试可以证明程序没有错误</label></div>
        <div class="option"><label><input type="radio" name="q1" value="C" data-correct="false"> C. 软件测试应尽可能独立进行</label></div>
        <div class="option"><label><input type="radio" name="q1" value="D" data-correct="false"> D. 软件测试应尽早和不断地进行</label></div>
    </div>
    <button class="show-answer">查看答案</button>
    <div class="answer" style="display:none;">
        <p><strong>答案：B</strong></p>
        <p><strong>解析</strong>：软件测试的基本原则之一是"测试不能证明程序没有错误"。测试只能发现存在的错误，而不能证明不存在错误。</p>
    </div>
</div>

<div class="question">
    <p>2. 以下哪种测试需要了解代码内部结构？</p>
    <div class="options">
        <div class="option"><label><input type="radio" name="q2" value="A" data-correct="false"> A. 黑盒测试</label></div>
        <div class="option"><label><input type="radio" name="q2" value="B" data-correct="true"> B. 白盒测试</label></div>
        <div class="option"><label><input type="radio" name="q2" value="C" data-correct="false"> C. 系统测试</label></div>
        <div class="option"><label><input type="radio" name="q2" value="D" data-correct="false"> D. 验收测试</label></div>
    </div>
    <button class="show-answer">查看答案</button>
    <div class="answer" style="display:none;">
        <p><strong>答案：B</strong></p>
        <p><strong>解析</strong>：白盒测试需要了解程序内部逻辑结构，基于代码内部结构进行测试设计。而黑盒测试不需要了解内部结构，只关注输入和输出。</p>
    </div>
</div>

<div class="question">
    <p>3. 下列哪种覆盖率是最强的？</p>
    <div class="options">
        <div class="option"><label><input type="radio" name="q3" value="A" data-correct="false"> A. 语句覆盖</label></div>
        <div class="option"><label><input type="radio" name="q3" value="B" data-correct="false"> B. 判定覆盖</label></div>
        <div class="option"><label><input type="radio" name="q3" value="false"> C. 条件覆盖</label></div>
        <div class="option"><label><input type="radio" name="q3" value="D" data-correct="true"> D. 路径覆盖</label></div>
    </div>
    <button class="show-answer">查看答案</button>
    <div class="answer" style="display:none;">
        <p><strong>答案：D</strong></p>
        <p><strong>解析</strong>：覆盖度从弱到强排序为：语句覆盖 < 判定覆盖 < 条件覆盖 < 判定-条件覆盖 < 条件组合覆盖 < 路径覆盖。</p>
    </div>
</div>

<!-- 此处省略了其他12道选择题 -->
<p style="color: #666; font-style: italic;">（完整版试卷将包含15道选择题）</p>

<h2>二、判断题（每题2分，共20分）</h2>

<div class="question">
    <p>1. 软件测试可以证明软件没有错误。</p>
    <div class="options">
        <div class="option"><label><input type="radio" name="j1" value="正确" data-correct="false"> 正确</label></div>
        <div class="option"><label><input type="radio" name="j1" value="错误" data-correct="true"> 错误</label></div>
    </div>
    <button class="show-answer">查看答案</button>
    <div class="answer" style="display:none;">
        <p><strong>答案：错误</strong></p>
        <p><strong>解析</strong>：软件测试不能证明软件没有错误，只能证明软件存在错误。即使测试通过，也不能保证软件完全没有错误。</p>
    </div>
</div>

<div class="question">
    <p>2. 白盒测试又称为结构测试或逻辑驱动测试。</p>
    <div class="options">
        <div class="option"><label><input type="radio" name="j2" value="正确" data-correct="true"> 正确</label></div>
        <div class="option"><label><input type="radio" name="j2" value="错误" data-correct="false"> 错误</label></div>
    </div>
    <button class="show-answer">查看答案</button>
    <div class="answer" style="display:none;">
        <p><strong>答案：正确</strong></p>
        <p><strong>解析</strong>：白盒测试基于程序内部逻辑结构进行测试，也称为结构测试、透明盒测试或逻辑驱动测试。</p>
    </div>
</div>

<!-- 此处省略了其他8道判断题 -->
<p style="color: #666; font-style: italic;">（完整版试卷将包含10道判断题）</p>`;
    } else if (currentPaperType === 'subjective') {
        return `
<h1>软件测试模拟试卷 - 主观题部分</h1>
<p>总分：50分 (名词解释20分，简答题30分)</p>

<h2>三、名词解释（每题4分，共20分）</h2>

<div class="definition-question" data-chapter="1">
    <p>1. 【第1章】软件缺陷（Bug）</p>
    <button class="show-answer">查看答案</button>
    <div class="answer" style="display:none;">
        <p><strong>答案</strong>：软件缺陷就是存在于软件(程序、数据和文档)中的那些不希望或不可接受的偏差，会导致软件产品出现质量问题。</p>
        <p><strong>解析</strong>：软件缺陷是软件测试中的核心概念，它可能由需求分析不明确、设计阶段逻辑错误、编码错误或实现偏差、文档不完整或不准确、环境兼容性问题以及人为因素导致的错误等原因引起。</p>
    </div>
</div>

<div class="definition-question" data-chapter="2">
    <p>2. 【第2章】白盒测试</p>
    <button class="show-answer">查看答案</button>
    <div class="answer" style="display:none;">
        <p><strong>答案</strong>：白盒测试是在已知产品内部工作流程的情况下，研究程序源代码和程序结构，按照程序的内部结构测试程序的一种测试方法。</p>
        <p><strong>解析</strong>：白盒测试关注程序内部逻辑和结构，需要测试人员了解程序内部工作原理，包括语句覆盖、判定覆盖、条件覆盖等多种覆盖标准。</p>
    </div>
</div>

<div class="definition-question" data-chapter="3">
    <p>3. 【第3章】黑盒测试</p>
    <button class="show-answer">查看答案</button>
    <div class="answer" style="display:none;">
        <p><strong>答案</strong>：黑盒测试又称为数据驱动测试。黑盒测试不关心程序内部结构，将程序看作不能打开的黑盒，用于检查程序所应具有的功能是否都已实现，每个功能是否都能正常使用，是否满足用户的需求。</p>
        <p><strong>解析</strong>：黑盒测试着重于程序功能和外部特性的测试，不考虑程序内部结构和逻辑。黑盒测试方法主要包括等价类划分法、边界值分析法、错误推测法和因果图法等。</p>
    </div>
</div>

<!-- 此处省略了其他2道名词解释题 -->
<p style="color: #666; font-style: italic;">（完整版试卷将包含5道名词解释题，从第1-5章各出一题）</p>

<h2>四、简答题（每题5分，共30分）</h2>

<div class="essay-question" data-chapter="1">
    <p>1. 【第1章】简述软件测试的目的和原则。</p>
    <button class="show-answer">查看答案</button>
    <div class="answer" style="display:none;">
        <p><strong>答案</strong>：</p>
        <p>软件测试的目的：</p>
        <ol>
            <li>验证软件是否满足开发合同、开发计划、需求规格说明和设计说明等规定的软件质量要求。</li>
            <li>发现尽可能多的软件缺陷，消除它们，提高软件质量。</li>
            <li>对软件质量进行度量和评估。</li>
            <li>通过分析软件缺陷产生的原因，有针对性地进行软件过程改进。</li>
        </ol>
        <p>软件测试原则：</p>
        <ol>
            <li>软件测试不能证明程序无错。</li>
            <li>所有测试都应当追溯软件缺陷的起源。</li>
            <li>尽早和不断地进行软件测试。</li>
            <li>软件测试应尽可能具有独立性。</li>
            <li>Pareto原则。</li>
            <li>重视无效数据和非预期的功能。</li>
            <li>完全测试不可行，测试需要适时终止。</li>
        </ol>
        <p><strong>解析</strong>：本题考察对软件测试基本概念的理解。软件测试的目的总体来说是保证软件质量，其原则则是指导测试过程中应遵循的基本准则。理解这些目的和原则对把握软件测试方向有重要意义。</p>
    </div>
</div>

<div class="essay-question" data-chapter="2">
    <p>2. 【第2章】阐述逻辑覆盖测试的主要类型及其优缺点。</p>
    <button class="show-answer">查看答案</button>
    <div class="answer" style="display:none;">
        <p><strong>答案</strong>：</p>
        <p>逻辑覆盖测试主要类型包括：</p>
        <ol>
            <li>语句覆盖：要求测试用例能够执行程序中的每个语句至少一次。</li>
            <li>判定覆盖：要求测试用例使得程序中的每个判定语句的取真和取假结果都至少执行一次。</li>
            <li>条件覆盖：要求测试用例使得判定中的每个原子条件的真假值都至少出现一次。</li>
            <li>判定-条件覆盖：同时满足判定覆盖和条件覆盖的要求。</li>
            <li>条件组合覆盖：要求测试用例覆盖判定中所有可能的条件组合。</li>
            <li>路径覆盖：要求测试用例能够覆盖程序中所有可能的路径。</li>
        </ol>
        <p>优缺点：</p>
        <ul>
            <li>优点：逻辑覆盖测试能够系统地检查程序逻辑，发现代码中的潜在错误；覆盖程度可量化，便于评估测试充分性。</li>
            <li>缺点：高级别覆盖（如路径覆盖）在实际应用中难以实现，因为路径数量可能非常庞大甚至无限多；即使满足了覆盖要求，也不能保证程序完全没有错误。</li>
        </ul>
        <p><strong>解析</strong>：本题考察对白盒测试中逻辑覆盖技术的理解。不同覆盖方式有不同的强度和适用场景，选择合适的覆盖标准需要平衡测试成本和测试效果。</p>
    </div>
</div>

<!-- 此处省略了其他4道简答题 -->
<p style="color: #666; font-style: italic;">（完整版试卷将包含6道简答题，从第1-6章各出一题）</p>`;
    } else {
        // 原始的模拟试卷内容
        return `# 软件测试模拟试卷

总分：100分
考试时间：120分钟

## 一、选择题（每题2分，共30分）

1. 下列关于软件测试的说法，错误的是：
   A. 软件测试是为了发现错误而执行程序的过程
   B. 软件测试可以证明程序没有错误
   C. 软件测试应尽可能独立进行
   D. 软件测试应尽早和不断地进行

   **答案：B**
   
   **解析**：软件测试的基本原则之一是"测试不能证明程序没有错误"。测试只能发现存在的错误，而不能证明不存在错误。

// ... 省略后续内容 ...`;
    }
}

