/**
 * 软件测试复习网站 - 试卷生成功能
 * 使用DeepSeek AI自动生成试卷
 */

// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', function() {
    // 初始化试卷生成按钮
    initPaperGenerator();
});

// DeepSeek API配置
// 警告：在前端代码中存储API密钥存在安全风险，生产环境中请使用后端代理调用API
const DEEPSEEK_API_CONFIG = {
    apiKey: 'sk-fc4e93f910194c57aaf071f894e485bc',
    apiUrl: 'http://localhost:3000/api/deepseek', // 使用本地代理服务器
    model: 'deepseek-reasoner'  // 使用deepseek-reasoner模型，具有更强的推理能力
};

// 初始化试卷生成功能
function initPaperGenerator() {
    // 获取生成试卷按钮
    const generateButton = document.getElementById('generate-paper');
    
    // 如果找到按钮，添加点击事件
    if (generateButton) {
        generateButton.addEventListener('click', function() {
            // 显示加载状态
            showLoadingState();
            
            // 获取MD文件内容
            fetchMdContent()
                .then(mdContent => {
                    // 调用DeepSeek API生成试卷
                    return generatePaperWithDeepSeek(mdContent);
                })
                .then(generatedPaper => {
                    // 显示生成的试卷
                    displayGeneratedPaper(generatedPaper);
                })
                .catch(error => {
                    console.error('试卷生成过程出错:', error);
                    
                    // 询问是否使用备用内容生成
                    if (confirm(`获取或处理内容时出错: ${error.message}\n\n是否使用备用内容继续生成试卷？`)) {
                        console.log('使用备用内容生成试卷');
                        // 使用预设的备用内容，确保功能不中断
                        const fallbackContent = getFallbackContent();
                        return generatePaperWithDeepSeek(fallbackContent);
                    } else {
                        // 显示错误信息
                        showErrorMessage(error);
                    }
                })
                .then(generatedPaper => {
                    // 检查是否有生成的试卷（使用备用内容生成的情况）
                    if (generatedPaper) {
                        // 显示生成的试卷
                        displayGeneratedPaper(generatedPaper);
                    }
                })
                .catch(error => {
                    // 显示最终错误信息
                    showErrorMessage(error);
                })
                .finally(() => {
                    // 隐藏加载状态
                    hideLoadingState();
                });
        });
    }
}

// 显示加载状态
function showLoadingState() {
    // 创建加载提示元素
    const loadingElement = document.createElement('div');
    loadingElement.id = 'paper-loading';
    loadingElement.className = 'paper-loading';
    loadingElement.innerHTML = `
        <div class="loading-spinner"></div>
        <p>正在生成试卷，请稍候...</p>
    `;
    
    // 添加到页面
    document.body.appendChild(loadingElement);
}

// 隐藏加载状态
function hideLoadingState() {
    // 移除加载提示元素
    const loadingElement = document.getElementById('paper-loading');
    if (loadingElement) {
        loadingElement.remove();
    }
}

// 获取MD文件内容
async function fetchMdContent() {
    try {
        console.log('开始获取软件测试重点整理.md文件内容...');
        
        // 发送请求获取MD文件内容
        const response = await fetch('软件测试/软件测试重点整理.md');
        
        // 检查请求是否成功
        if (!response.ok) {
            console.error(`无法获取MD文件: ${response.status} ${response.statusText}`);
            throw new Error(`无法获取MD文件: ${response.status} ${response.statusText}`);
        }
        
        // 获取文件内容
        const content = await response.text();
        
        // 检查内容是否为空
        if (!content || content.trim().length === 0) {
            console.error('获取的MD文件内容为空');
            throw new Error('获取的MD文件内容为空，请确认文件是否有效');
        }
        
        console.log(`成功获取MD文件内容，长度为 ${content.length} 字符`);
        console.log('文件内容预览：' + content.substring(0, 100) + '...');
        
        // 返回文件内容
        return content;
    } catch (error) {
        console.error('获取MD文件失败:', error);
        
        // 添加更详细的错误信息和调试建议
        throw new Error(`无法获取软件测试重点整理.md文件内容: ${error.message}。请检查文件路径是否正确，文件是否存在。`);
    }
}

// 使用DeepSeek AI生成试卷
async function generatePaperWithDeepSeek(mdContent) {
    try {
        // 验证mdContent是否有效
        if (!mdContent || mdContent.trim().length === 0) {
            throw new Error('MD文件内容为空，无法生成试卷');
        }
        
        console.log(`准备调用DeepSeek API，内容长度: ${mdContent.length}字符`);
        
        // 如果内容太长，可能需要截断
        let contentToUse = mdContent;
        if (mdContent.length > 60000) {
            console.warn(`内容过长(${mdContent.length}字符)，截断到60000字符`);
            contentToUse = mdContent.substring(0, 60000);
        }
        
        // 构建简化的提示词
        const prompt = `
请根据以下来自"软件测试重点整理.md"文件的知识点内容，生成一份完整的软件测试试卷。
试卷要求必须严格包含以下题型和分值：
1. 15道选择题，每题2分，共30分
2. 10道判断题，每题2分，共20分
3. 5道名词解释题，要求从第1-5章各选一个名词进行解释，每题4分，共20分
4. 6道简答题，要求从第1-6章各出一道题，每题5分，共30分

所有题目必须基于提供的内容，不要编造内容。

以下是知识点内容：
${contentToUse}
`;

        // 检查提示词是否包含内容
        console.log(`生成的提示词长度: ${prompt.length}字符`);

        // 构建请求参数
        const requestData = {
            model: DEEPSEEK_API_CONFIG.model,
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.7,
            max_tokens: 2000  // 减少token限制，降低超时风险
        };

        console.log('正在调用DeepSeek API生成试卷...');
        console.log(`使用模型: ${DEEPSEEK_API_CONFIG.model}`);
        
        // 调用代理服务器
        console.log(`发送请求到: ${DEEPSEEK_API_CONFIG.apiUrl}`);
        const response = await fetch(DEEPSEEK_API_CONFIG.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                apiKey: DEEPSEEK_API_CONFIG.apiKey,
                model: DEEPSEEK_API_CONFIG.model,
                messages: requestData.messages,
                temperature: requestData.temperature,
                max_tokens: requestData.max_tokens
            })
        });

        // 检查是否请求成功
        if (!response.ok) {
            let errorText = '';
            try {
                const errorData = await response.json();
                errorText = JSON.stringify(errorData);
                console.error('API请求失败:', errorData);
            } catch (e) {
                errorText = await response.text();
                console.error('无法解析错误响应:', errorText);
            }
            throw new Error(`API调用失败 (${response.status}): ${errorText}`);
        }

        // 获取API响应
        console.log('获取API响应中...');
        const responseData = await response.json();
        console.log('DeepSeek API响应成功');
        
        // 提取生成的试卷内容
        if (!responseData.choices || !responseData.choices[0] || !responseData.choices[0].message) {
            console.error('API响应格式不正确:', responseData);
            throw new Error('API响应格式不正确，无法提取生成内容');
        }
        
        const generatedContent = responseData.choices[0].message.content;
        console.log(`生成的内容长度: ${generatedContent.length}字符`);
        console.log('内容预览: ' + generatedContent.substring(0, 100) + '...');
        
        // 移除可能的Markdown标记，提取HTML内容
        let htmlContent = extractHtmlContent(generatedContent);
        
        // 如果内容不是HTML格式，尝试将其转换为HTML
        if (!htmlContent.trim().startsWith('<section>')) {
            console.log('生成的内容不是HTML格式，尝试转换...');
            htmlContent = convertTextToHtml(generatedContent);
        }

        console.log('试卷生成完成');
        
        // 返回试卷数据
        return {
            title: "软件测试模拟试卷（基于重点整理）",
            date: new Date().toLocaleDateString(),
            content: htmlContent
        };
    } catch (error) {
        console.error('生成试卷失败:', error);
        
        // 记录详细错误信息
        if (error.response) {
            console.error('错误响应状态:', error.response.status);
            console.error('错误响应数据:', error.response.data);
        }
        
        // 如果API调用失败，返回模拟数据以保持功能可用
        if (confirm(`API调用失败: ${error.message}\n\n是否使用模拟数据代替？`)) {
            return {
                title: "软件测试模拟试卷（基于重点整理 - 模拟数据）",
                date: new Date().toLocaleDateString(),
                content: generateMockPaper(mdContent)
            };
        } else {
            throw new Error('试卷生成失败：' + error.message);
        }
    }
}

// 从API响应中提取HTML内容
function extractHtmlContent(text) {
    // 检查是否包含HTML标签
    if (text.includes('<section>')) {
        // 尝试提取其中的HTML部分
        const htmlMatch = text.match(/<section>[\s\S]*<\/section>/g);
        if (htmlMatch) {
            return htmlMatch.join('\n');
        }
    }
    return text;
}

// 将文本转换为HTML格式（如果API返回纯文本）
function convertTextToHtml(text) {
    // 分离不同的题型
    const sections = text.split(/(?=一、|二、|三、|四、)/g);
    let htmlContent = '';
    
    sections.forEach((section, sectionIndex) => {
        // 确定题型
        let sectionType = '题目';
        let questionClass = 'q';
        let questionPrefix = '';
        
        if (section.includes('选择题')) {
            sectionType = '选择题（每题2分，共30分）';
            questionClass = 'q';
            questionPrefix = '';
        } else if (section.includes('判断题')) {
            sectionType = '判断题（每题2分，共20分）';
            questionClass = 'j';
            questionPrefix = '';
        } else if (section.includes('名词解释')) {
            sectionType = '名词解释（每题4分，共20分）';
            questionClass = 'def';
            questionPrefix = '';
        } else if (section.includes('简答题')) {
            sectionType = '简答题（每题5分，共30分）';
            questionClass = 'qa';
            questionPrefix = '';
        }
        
        // 开始一个新section
        htmlContent += `<section>\n<h2>`;
        
        // 添加标题
        if (section.includes('一、')) {
            htmlContent += `一、${sectionType}`;
        } else if (section.includes('二、')) {
            htmlContent += `二、${sectionType}`;
        } else if (section.includes('三、')) {
            htmlContent += `三、${sectionType}`;
        } else if (section.includes('四、')) {
            htmlContent += `四、${sectionType}`;
        } else {
            htmlContent += `${sectionType}`;
        }
        
        htmlContent += `</h2>\n`;
        
        // 分割题目
        const questionPattern = /(\d+[\s.、]+)([^答案：\n]+)([\s\S]*?)(?=\d+[\s.、]+|$)/g;
        let match;
        let questionCount = 0;
        
        while ((match = questionPattern.exec(section)) !== null) {
            questionCount++;
            const questionNum = match[1].trim();
            let questionText = match[2].trim();
            const questionContent = match[3].trim();
            
            // 提取章节信息（用于名词解释和简答题）
            let chapterInfo = '';
            if (questionClass === 'def' || questionClass === 'qa') {
                const chapterMatch = questionText.match(/（第(\d+)章）|（第(\d+)章）|\(第(\d+)章\)|\(第(\d+)章\)/);
                if (chapterMatch) {
                    chapterInfo = chapterMatch[0];
                    // 避免重复显示章节信息
                    questionText = questionText.replace(chapterMatch[0], '').trim();
                } else {
                    // 尝试从内容中识别章节信息
                    const contentChapterMatch = questionContent.match(/第(\d+)章/);
                    if (contentChapterMatch) {
                        chapterInfo = `（第${contentChapterMatch[1]}章）`;
                    }
                }
            }
            
            htmlContent += `<div class="question" id="${questionClass}${questionCount}">\n`;
            
            // 添加题目文本和章节信息
            if (chapterInfo) {
                htmlContent += `    <p>${questionNum} ${questionText}${chapterInfo}</p>\n`;
            } else {
                htmlContent += `    <p>${questionNum} ${questionText}</p>\n`;
            }
            
            // 处理选项（针对选择题）
            if (questionClass === 'q') {
                htmlContent += `    <div class="options">\n`;
                
                // 提取选项
                const optionPattern = /([A-D])[\s.、]+([^\n]+)/g;
                let optionMatch;
                const options = [];
                
                while ((optionMatch = optionPattern.exec(questionContent)) !== null) {
                    options.push({
                        letter: optionMatch[1],
                        text: optionMatch[2].trim()
                    });
                }
                
                // 提取答案
                const answerMatch = questionContent.match(/答案[：:]\s*([A-D])/);
                const correctOption = answerMatch ? answerMatch[1] : '';
                
                // 生成选项HTML
                options.forEach(option => {
                    const isCorrect = option.letter === correctOption;
                    htmlContent += `        <div class="choice-option" data-correct="${isCorrect}">${option.letter}. ${option.text}</div>\n`;
                });
                
                htmlContent += `    </div>\n`;
            } else if (questionClass === 'j') {
                // 针对判断题
                htmlContent += `    <div class="options">\n`;
                
                // 提取答案
                const answerMatch = questionContent.match(/答案[：:]\s*(√|×|对|错|正确|错误)/);
                const correctAnswer = answerMatch ? answerMatch[1] : '';
                const isTrue = ['√', '对', '正确'].includes(correctAnswer);
                
                htmlContent += `        <div class="judge-option" data-correct="${isTrue}">√</div>\n`;
                htmlContent += `        <div class="judge-option" data-correct="${!isTrue}">×</div>\n`;
                htmlContent += `    </div>\n`;
            }
            
            // 添加答案部分
            htmlContent += `    <div class="show-answer">显示答案</div>\n`;
            htmlContent += `    <div class="answer">\n`;
            
            // 提取答案和解析
            let answer = '';
            let explanation = '';
            
            const answerMatch = questionContent.match(/答案[：:]\s*([^\n]+)/);
            if (answerMatch) {
                answer = answerMatch[1].trim();
            }
            
            const explainMatch = questionContent.match(/解析[：:]\s*([\s\S]+?)(?=\d+[\s.、]+|$)/);
            if (explainMatch) {
                explanation = explainMatch[1].trim();
            }
            
            if (questionClass === 'q' || questionClass === 'j') {
                htmlContent += `        <p>正确答案：${answer}</p>\n`;
                if (explanation) {
                    htmlContent += `        <p>解析：${explanation}</p>\n`;
                }
            } else {
                htmlContent += `        <p>答案：${answer}</p>\n`;
                if (explanation) {
                    htmlContent += `        <p>${explanation}</p>\n`;
                }
            }
            
            htmlContent += `    </div>\n`;
            htmlContent += `</div>\n\n`;
        }
        
        htmlContent += `</section>\n\n`;
    });
    
    return htmlContent;
}

// 显示生成的试卷
function displayGeneratedPaper(paperData) {
    // 创建试卷显示容器
    const paperContainer = document.createElement('div');
    paperContainer.className = 'generated-paper-container';
    
    // 添加试卷内容
    paperContainer.innerHTML = `
        <div class="generated-paper">
            <div class="paper-header">
                <h2>${paperData.title}</h2>
                <p>生成日期: ${paperData.date}</p>
                <button id="close-paper" class="btn">关闭</button>
                <button id="download-paper" class="btn">下载试卷</button>
            </div>
            <div class="paper-content">
                ${paperData.content}
            </div>
        </div>
    `;
    
    // 添加到页面
    document.body.appendChild(paperContainer);
    
    // 添加关闭按钮事件
    document.getElementById('close-paper').addEventListener('click', function() {
        paperContainer.remove();
    });
    
    // 添加下载按钮事件
    document.getElementById('download-paper').addEventListener('click', function() {
        downloadPaper(paperData);
    });
    
    // 为显示/隐藏答案按钮绑定事件
    const showAnswerButtons = paperContainer.querySelectorAll('.show-answer');
    showAnswerButtons.forEach(button => {
        button.addEventListener('click', function() {
            const answer = this.nextElementSibling;
            if (answer.style.display === 'block') {
                answer.style.display = 'none';
                this.textContent = '显示答案';
            } else {
                answer.style.display = 'block';
                this.textContent = '隐藏答案';
            }
        });
    });
}

// 下载试卷
function downloadPaper(paperData) {
    // 创建HTML内容
    const htmlContent = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>${paperData.title}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1, h2, h3 { color: #1565c0; }
        .question { margin-bottom: 20px; padding: 15px; border-left: 4px solid #1e88e5; background-color: #e3f2fd; }
        .answer { margin-top: 10px; padding: 10px; background-color: #e8f5e9; border-left: 4px solid #43a047; }
        .options { margin-left: 20px; margin-top: 10px; }
        .choice-option, .judge-option { margin-bottom: 5px; padding: 5px; }
    </style>
</head>
<body>
    <h1>${paperData.title}</h1>
    <p>生成日期: ${paperData.date}</p>
    <div class="paper-content">
        ${paperData.content.replace(/data-correct="true"/g, 'style="color: #43a047; font-weight: bold;"').replace(/data-correct="false"/g, '')}
    </div>
    <script>
        // 替换"显示答案"按钮为直接显示答案
        document.querySelectorAll('.show-answer').forEach(btn => {
            btn.style.display = 'none';
            const answer = btn.nextElementSibling;
            if (answer) {
                answer.style.display = 'block';
            }
        });
    </script>
</body>
</html>
    `;
    
    // 创建Blob对象
    const blob = new Blob([htmlContent], { type: 'text/html' });
    
    // 创建下载链接
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${paperData.title}-${paperData.date}.html`;
    
    // 触发下载
    a.click();
    
    // 释放URL对象
    URL.revokeObjectURL(url);
}

// 显示错误信息
function showErrorMessage(error) {
    // 创建错误提示元素
    const errorElement = document.createElement('div');
    errorElement.className = 'paper-error';
    errorElement.innerHTML = `
        <div class="error-content">
            <h3>生成失败</h3>
            <p>${error.message || '未知错误，请稍后重试'}</p>
            <button id="close-error" class="btn">关闭</button>
        </div>
    `;
    
    // 添加到页面
    document.body.appendChild(errorElement);
    
    // 添加关闭按钮事件
    document.getElementById('close-error').addEventListener('click', function() {
        errorElement.remove();
    });
    
    // 5秒后自动关闭
    setTimeout(() => {
        if (document.body.contains(errorElement)) {
            errorElement.remove();
        }
    }, 5000);
}

// 生成模拟试卷内容（备用方案，仅在API调用失败时使用）
function generateMockPaper(mdContent) {
    // 这个函数用于生成模拟试卷
    // 实际项目中，这部分内容会由DeepSeek API返回
    
    return `
        <section>
            <h2>一、选择题（每题2分，共30分）</h2>
            <div class="question" id="q1">
                <p>1. 软件测试的定义是：</p>
                <div class="options">
                    <div class="choice-option" data-correct="true">A. 使用人工或自动手段来运行或测定某个系统的过程，其目的在于检验它是否满足规定的需求或弄清预期结果和实际结果之间的差别</div>
                    <div class="choice-option">B. 找出软件中的缺陷并修复它们</div>
                    <div class="choice-option">C. 确保软件没有任何错误</div>
                    <div class="choice-option">D. 证明软件符合用户需求</div>
                </div>
                <div class="show-answer">显示答案</div>
                <div class="answer">
                    <p>正确答案：A</p>
                    <p>解析：软件测试定义是指使用人工或自动手段来运行或测定某个系统的过程，其目的在于检验它是否满足规定的需求或弄清预期结果和实际结果之间的差别。</p>
                </div>
            </div>
            
            <!-- 更多选择题 -->
        </section>
        
        <section>
            <h2>二、判断题（每题2分，共20分）</h2>
            <div class="question" id="j1">
                <p>1. 白盒测试可以证明程序没有错误。</p>
                <div class="options">
                    <div class="judge-option">√</div>
                    <div class="judge-option" data-correct="true">×</div>
                </div>
                <div class="show-answer">显示答案</div>
                <div class="answer">
                    <p>正确答案：×</p>
                    <p>解析：软件测试原则之一是"软件测试不能证明程序无错"，任何测试方法（包括白盒测试）都无法证明程序完全没有错误。</p>
                </div>
            </div>
            
            <!-- 更多判断题 -->
        </section>
        
        <section>
            <h2>三、名词解释（每题4分，共20分）</h2>
            <div class="question" id="def1">
                <p>1. 软件缺陷(Bug)（第1章）</p>
                <div class="show-answer">显示答案</div>
                <div class="answer">
                    <p>答案：软件缺陷就是存在于软件(程序、数据和文档)中的那些不希望或不可接受的偏差，会导致软件产生质量问题。</p>
                </div>
            </div>
            
            <!-- 更多名词解释 -->
        </section>
        
        <section>
            <h2>四、简答题（每题5分，共30分）</h2>
            <div class="question" id="qa1">
                <p>1. 简述软件测试的主要原则及其含义（第1章）</p>
                <div class="show-answer">显示答案</div>
                <div class="answer">
                    <p>答案：软件测试的主要原则包括：</p>
                    <p>1) 软件测试不能证明程序无错：任何测试都不能保证程序完全没有缺陷。</p>
                    <p>2) 所有测试都应当追溯软件缺陷的起源：测试不仅要发现缺陷，还应追溯缺陷的根源。</p>
                    <p>3) 尽早和不断地进行软件测试：测试应该在软件开发的早期就开始，并贯穿整个开发过程。</p>
                    <p>4) 软件测试应尽可能具有独立性：测试应由独立的团队或人员来执行，以确保公正性。</p>
                    <p>5) Pareto原则：大约80%的错误集中在20%的模块中，应优先测试这些关键模块。</p>
                    <p>6) 重视无效数据和非预期的功能：测试应包括无效输入和边界条件，而不仅仅是预期的正常输入。</p>
                    <p>7) 完全测试不可行，测试需要适时终止：测试资源有限，需要在适当时候停止测试。</p>
                    <p>8) 重视回归测试的关联性：修复一个缺陷后，需要进行回归测试，确保修复没有引入新的问题。</p>
                    <p>9) 软件缺陷的免疫性：经过修复的软件缺陷可能会再次出现，需要关注。</p>
                    <p>10) 测试过程文档需要妥善保存：测试文档是软件质量的重要证据，需要妥善维护。</p>
                </div>
            </div>
            
            <!-- 更多简答题 -->
        </section>
    `;
}

// 获取备用内容（用于文件加载失败时）
function getFallbackContent() {
    console.log('使用备用内容');
    return `
# 软件测试基础知识全面解析
   
## 第一章 软件测试基础概念
   
### 1. 软件测试与软件缺陷
   
**软件测试定义**：使用人工或自动手段来运行或测定某个系统的过程，其目的在于检验它是否满足规定的需求或弄清预期结果和实际结果之间的差别.
   
**软件缺陷(Bug)定义**：软件缺陷就是存在于软件(程序、数据和文档)中的那些不希望或不可接受的偏差，会导致软件产生质量问题
   
**软件缺陷产生原因**：
   
- 需求分析不明确或不完整
- 设计阶段逻辑错误
- 编码错误或实现偏差
- 文档不完整或不准确
- 环境兼容性问题
- 人为因素导致的错误

## 第二章 白盒测试
   
**白盒测试概念**：是在已知产品内部工作流程的情况下，研究程序的源代码和程序结构，按照程序的内部结构测试程序。

## 第三章 黑盒测试
   
**黑盒测试概念**：黑盒测试又称为数据驱动测试。黑盒测试不关心程序内部结构，将程序看作不能打开的黑盒，用于检查程序所应具有的功能是否都已实现。

## 第四章 测试执行阶段
   
**单元测试概念**：针对软件最小可测试单元（通常是函数或类）进行的测试。

## 第五章 功能与非功能测试
   
**功能测试概念**：验证软件功能是否符合需求规格说明。

## 第六章 缺陷管理
   
**主要属性**：缺陷ID、缺陷标题、缺陷严重程度、缺陷优先级、缺陷状态、缺陷来源、缺陷类型、缺陷重现步骤、缺陷发现环境、缺陷发现者
    `;
}

// 添加CSS样式
function addStyles() {
    // 创建样式元素
    const styleElement = document.createElement('style');
    styleElement.textContent = `
    .paper-button {
        display: inline-flex;
        align-items: center;
        background-color: #8e44ad;
        color: white;
        padding: 10px 20px;
        border-radius: 25px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        margin-top: 15px;
    }
    
    .paper-button:hover {
        background-color: #7d3c98;
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    }
    
    .paper-button:active {
        transform: translateY(0);
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    }
    
    .paper-button::before {
        content: '';
        display: inline-block;
        width: 20px;
        height: 20px;
        margin-right: 8px;
        background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>');
        background-repeat: no-repeat;
        background-size: contain;
        background-position: center;
    }
    
    .paper-loading {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.7);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        color: white;
    }
    
    .loading-spinner {
        width: 50px;
        height: 50px;
        border: 5px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        border-top-color: white;
        animation: spin 1s ease-in-out infinite;
        margin-bottom: 20px;
    }
    
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
    
    .paper-error {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    }
    
    .error-content {
        background-color: white;
        padding: 20px;
        border-radius: 8px;
        max-width: 400px;
        text-align: center;
    }
    
    .error-content h3 {
        color: #e53935;
        margin-bottom: 10px;
    }
    
    .generated-paper-container {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        overflow: auto;
    }
    
    .generated-paper {
        background-color: white;
        width: 90%;
        max-width: 900px;
        height: 90%;
        border-radius: 8px;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }
    
    .paper-header {
        padding: 15px;
        background-color: #f5f5f5;
        border-bottom: 1px solid #ddd;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
    }
    
    .paper-header h2 {
        margin: 0;
        flex: 1;
    }
    
    .paper-header p {
        margin: 0 15px;
        color: #666;
    }
    
    .paper-content {
        padding: 20px;
        overflow-y: auto;
        flex: 1;
    }
    
    @media (max-width: 768px) {
        .paper-header {
            flex-direction: column;
            align-items: flex-start;
        }
        
        .paper-header p,
        .paper-header button {
            margin-top: 10px;
        }
    }
    `;
    
    // 添加到页面
    document.head.appendChild(styleElement);
}

// 在页面加载时添加样式
document.addEventListener('DOMContentLoaded', function() {
    addStyles();
}); 