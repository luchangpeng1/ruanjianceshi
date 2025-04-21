/**
 * 软件测试复习网站 - 错题本功能
 */

// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', function() {
    // 初始化错题本功能
    initMistakeCollection();
    
    // 如果在错题本页面，显示错题列表
    if (window.location.pathname.includes('mistake-collection.html')) {
        loadMistakes();
        setupFilters();
        setupControls();
        updateStats();
    }
});

// 初始化错题本功能
function initMistakeCollection() {
    // 扩展选择题和判断题的点击事件，记录错误答案
    const choiceOptions = document.querySelectorAll('.choice-option');
    const judgeOptions = document.querySelectorAll('.judge-option');
    
    // 为选择题选项添加错题收集功能
    choiceOptions.forEach(option => {
        option.addEventListener('click', function() {
            // 获取是否回答正确
            const isCorrect = this.getAttribute('data-correct') === 'true';
            
            // 如果回答错误，添加到错题本
            if (!isCorrect) {
                // 获取题目信息
                const questionElement = this.closest('.question');
                const questionId = questionElement.id;
                const questionType = questionElement.getAttribute('data-type') || '选择题';
                const questionChapter = questionElement.getAttribute('data-chapter') || '未知章节';
                const questionText = questionElement.querySelector('p').textContent;
                const correctOption = Array.from(questionElement.querySelectorAll('[data-correct="true"]'))[0].textContent;
                const wrongOption = this.textContent;
                const explanation = questionElement.querySelector('.answer p:nth-child(2)').textContent;
                
                // 获取当前页面信息
                const pageUrl = window.location.pathname;
                const examMatch = pageUrl.match(/exam(\d+)\.html/);
                const examId = examMatch ? examMatch[1] : '0';
                
                // 添加到错题本
                addMistake({
                    id: questionId,
                    type: questionType,
                    chapter: questionChapter,
                    question: questionText,
                    correctAnswer: correctOption,
                    wrongAnswer: wrongOption,
                    explanation: explanation,
                    examId: 'exam' + examId,
                    timestamp: new Date().getTime()
                });
            }
        });
    });
    
    // 为判断题选项添加错题收集功能
    judgeOptions.forEach(option => {
        option.addEventListener('click', function() {
            // 获取是否回答正确
            const isCorrect = this.getAttribute('data-correct') === 'true';
            
            // 如果回答错误，添加到错题本
            if (!isCorrect) {
                // 获取题目信息
                const questionElement = this.closest('.question');
                const questionId = questionElement.id;
                const questionType = questionElement.getAttribute('data-type') || '判断题';
                const questionChapter = questionElement.getAttribute('data-chapter') || '未知章节';
                const questionText = questionElement.querySelector('p').textContent;
                const correctOption = Array.from(questionElement.querySelectorAll('[data-correct="true"]'))[0].textContent;
                const wrongOption = this.textContent;
                const explanation = questionElement.querySelector('.answer p:nth-child(2)').textContent;
                
                // 获取当前页面信息
                const pageUrl = window.location.pathname;
                const examMatch = pageUrl.match(/exam(\d+)\.html/);
                const examId = examMatch ? examMatch[1] : '0';
                
                // 添加到错题本
                addMistake({
                    id: questionId,
                    type: questionType,
                    chapter: questionChapter,
                    question: questionText,
                    correctAnswer: correctOption,
                    wrongAnswer: wrongOption,
                    explanation: explanation,
                    examId: 'exam' + examId,
                    timestamp: new Date().getTime()
                });
            }
        });
    });
}

// 添加错题到本地存储
function addMistake(mistake) {
    // 获取现有错题
    let mistakes = JSON.parse(localStorage.getItem('mistakes') || '[]');
    
    // 检查是否已存在相同的错题
    const existingIndex = mistakes.findIndex(item => item.id === mistake.id);
    
    // 如果存在，更新错题信息
    if (existingIndex !== -1) {
        mistakes[existingIndex] = mistake;
    } else {
        // 否则添加新错题
        mistakes.push(mistake);
    }
    
    // 保存到本地存储
    localStorage.setItem('mistakes', JSON.stringify(mistakes));
}

// 加载错题列表
function loadMistakes() {
    // 获取错题列表容器
    const mistakeList = document.getElementById('mistake-list');
    const noMistakes = document.getElementById('no-mistakes');
    
    // 获取错题数据
    const mistakes = JSON.parse(localStorage.getItem('mistakes') || '[]');
    
    // 如果没有错题，显示提示
    if (mistakes.length === 0) {
        if (noMistakes) {
            noMistakes.style.display = 'block';
        }
        return;
    }
    
    // 隐藏"没有错题"提示
    if (noMistakes) {
        noMistakes.style.display = 'none';
    }
    
    // 清空现有内容
    const existingItems = mistakeList.querySelectorAll('.mistake-item');
    existingItems.forEach(item => {
        if (!item.id.includes('no-mistakes')) {
            item.remove();
        }
    });
    
    // 按时间倒序排序错题
    mistakes.sort((a, b) => b.timestamp - a.timestamp);
    
    // 添加错题到列表
    mistakes.forEach(mistake => {
        const mistakeItem = createMistakeItem(mistake);
        mistakeList.appendChild(mistakeItem);
    });
}

// 创建错题列表项
function createMistakeItem(mistake) {
    // 创建错题项容器
    const mistakeItem = document.createElement('div');
    mistakeItem.className = 'mistake-item';
    mistakeItem.setAttribute('data-type', mistake.type);
    mistakeItem.setAttribute('data-chapter', mistake.chapter);
    mistakeItem.setAttribute('data-exam', mistake.examId);
    
    // 创建错题内容
    const mistakeContent = document.createElement('div');
    mistakeContent.className = 'mistake-content';
    
    // 创建错题头部
    const mistakeHeader = document.createElement('div');
    mistakeHeader.className = 'mistake-header';
    
    // 创建错题标签
    const mistakeTags = document.createElement('div');
    mistakeTags.className = 'mistake-tags';
    mistakeTags.innerHTML = `
        <span class="tag tag-type">${mistake.type}</span>
        <span class="tag tag-chapter">${mistake.chapter}</span>
        <span class="tag tag-exam">试卷${mistake.examId.replace('exam', '')}</span>
    `;
    
    // 创建错题操作
    const mistakeActions = document.createElement('div');
    mistakeActions.className = 'mistake-actions';
    mistakeActions.innerHTML = `
        <button class="remove-mistake" data-id="${mistake.id}">删除</button>
    `;
    
    // 添加头部元素
    mistakeHeader.appendChild(mistakeTags);
    mistakeHeader.appendChild(mistakeActions);
    
    // 创建错题问题
    const mistakeQuestion = document.createElement('div');
    mistakeQuestion.className = 'mistake-question';
    mistakeQuestion.innerHTML = `<p>${mistake.question}</p>`;
    
    // 创建错题答案
    const mistakeAnswer = document.createElement('div');
    mistakeAnswer.className = 'mistake-answer';
    mistakeAnswer.innerHTML = `
        <p><span class="wrong">我的答案：${mistake.wrongAnswer}</span></p>
        <p><span class="correct">正确答案：${mistake.correctAnswer}</span></p>
        <p>解析：${mistake.explanation}</p>
    `;
    
    // 创建错题链接
    const mistakeLink = document.createElement('div');
    mistakeLink.className = 'mistake-link';
    mistakeLink.innerHTML = `
        <a href="exams/${mistake.examId}.html#${mistake.id}" class="btn btn-sm">查看原题</a>
    `;
    
    // 组装错题内容
    mistakeContent.appendChild(mistakeHeader);
    mistakeContent.appendChild(mistakeQuestion);
    mistakeContent.appendChild(mistakeAnswer);
    mistakeContent.appendChild(mistakeLink);
    
    // 添加到错题项
    mistakeItem.appendChild(mistakeContent);
    
    // 添加删除事件
    const removeButton = mistakeItem.querySelector('.remove-mistake');
    if (removeButton) {
        removeButton.addEventListener('click', function() {
            removeMistake(this.getAttribute('data-id'));
            mistakeItem.remove();
            updateStats();
            
            // 检查错题列表是否为空
            const mistakes = JSON.parse(localStorage.getItem('mistakes') || '[]');
            if (mistakes.length === 0) {
                const noMistakes = document.getElementById('no-mistakes');
                if (noMistakes) {
                    noMistakes.style.display = 'block';
                }
            }
        });
    }
    
    return mistakeItem;
}

// 从本地存储中删除错题
function removeMistake(id) {
    // 获取现有错题
    let mistakes = JSON.parse(localStorage.getItem('mistakes') || '[]');
    
    // 过滤掉要删除的错题
    mistakes = mistakes.filter(mistake => mistake.id !== id);
    
    // 保存到本地存储
    localStorage.setItem('mistakes', JSON.stringify(mistakes));
}

// 设置筛选功能
function setupFilters() {
    // 获取筛选控件
    const typeFilter = document.getElementById('type-filter');
    const chapterFilter = document.getElementById('chapter-filter');
    const examFilter = document.getElementById('exam-filter');
    
    // 添加筛选事件
    if (typeFilter && chapterFilter && examFilter) {
        typeFilter.addEventListener('change', applyFilters);
        chapterFilter.addEventListener('change', applyFilters);
        examFilter.addEventListener('change', applyFilters);
    }
}

// 应用筛选条件
function applyFilters() {
    // 获取筛选条件
    const typeFilter = document.getElementById('type-filter').value;
    const chapterFilter = document.getElementById('chapter-filter').value;
    const examFilter = document.getElementById('exam-filter').value;
    
    // 获取所有错题项
    const mistakeItems = document.querySelectorAll('.mistake-item');
    
    // 应用筛选条件
    mistakeItems.forEach(item => {
        const type = item.getAttribute('data-type');
        const chapter = item.getAttribute('data-chapter');
        const exam = item.getAttribute('data-exam');
        
        // 检查是否匹配筛选条件
        const typeMatch = typeFilter === 'all' || type === typeFilter;
        const chapterMatch = chapterFilter === 'all' || chapter === chapterFilter;
        const examMatch = examFilter === 'all' || exam === examFilter;
        
        // 显示或隐藏错题项
        if (typeMatch && chapterMatch && examMatch) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

// 设置控件功能
function setupControls() {
    // 获取控件
    const clearButton = document.getElementById('clear-mistakes');
    const exportButton = document.getElementById('export-mistakes');
    
    // 添加清空错题本事件
    if (clearButton) {
        clearButton.addEventListener('click', function() {
            if (confirm('确定要清空错题本吗？此操作不可恢复。')) {
                // 清空本地存储中的错题
                localStorage.removeItem('mistakes');
                
                // 重新加载页面
                loadMistakes();
                updateStats();
            }
        });
    }
    
    // 添加导出错题事件
    if (exportButton) {
        exportButton.addEventListener('click', function() {
            exportMistakes();
        });
    }
}

// 导出错题
function exportMistakes() {
    // 获取错题数据
    const mistakes = JSON.parse(localStorage.getItem('mistakes') || '[]');
    
    // 如果没有错题，提示用户
    if (mistakes.length === 0) {
        alert('错题本为空，没有可导出的内容。');
        return;
    }
    
    // 构建导出内容
    let exportContent = '# 软件测试复习 - 错题本\n\n';
    exportContent += `导出时间：${new Date().toLocaleString()}\n\n`;
    
    // 按章节分组错题
    const chapterMistakes = {};
    mistakes.forEach(mistake => {
        if (!chapterMistakes[mistake.chapter]) {
            chapterMistakes[mistake.chapter] = [];
        }
        chapterMistakes[mistake.chapter].push(mistake);
    });
    
    // 添加错题内容
    for (const chapter in chapterMistakes) {
        exportContent += `## ${chapter}\n\n`;
        
        chapterMistakes[chapter].forEach((mistake, index) => {
            exportContent += `### ${index + 1}. ${mistake.question}\n\n`;
            exportContent += `- 类型：${mistake.type}\n`;
            exportContent += `- 我的答案：${mistake.wrongAnswer}\n`;
            exportContent += `- 正确答案：${mistake.correctAnswer}\n`;
            exportContent += `- 解析：${mistake.explanation}\n\n`;
        });
    }
    
    // 创建下载链接
    const blob = new Blob([exportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `错题本_${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    
    // 释放URL对象
    URL.revokeObjectURL(url);
}

// 更新统计信息
function updateStats() {
    // 获取统计元素
    const totalMistakes = document.getElementById('total-mistakes');
    const choiceMistakes = document.getElementById('choice-mistakes');
    const judgeMistakes = document.getElementById('judge-mistakes');
    const mostMistakes = document.getElementById('most-mistakes');
    
    // 获取错题数据
    const mistakes = JSON.parse(localStorage.getItem('mistakes') || '[]');
    
    // 如果没有错题，清空统计信息
    if (mistakes.length === 0) {
        if (totalMistakes) totalMistakes.textContent = '0';
        if (choiceMistakes) choiceMistakes.textContent = '0';
        if (judgeMistakes) judgeMistakes.textContent = '0';
        if (mostMistakes) mostMistakes.textContent = '-';
        return;
    }
    
    // 计算选择题和判断题的数量
    const choiceCount = mistakes.filter(mistake => mistake.type === '选择题').length;
    const judgeCount = mistakes.filter(mistake => mistake.type === '判断题').length;
    
    // 计算各章节的错题数量
    const chapterCounts = {};
    mistakes.forEach(mistake => {
        if (!chapterCounts[mistake.chapter]) {
            chapterCounts[mistake.chapter] = 0;
        }
        chapterCounts[mistake.chapter]++;
    });
    
    // 找出错题最多的章节
    let maxChapter = '';
    let maxCount = 0;
    for (const chapter in chapterCounts) {
        if (chapterCounts[chapter] > maxCount) {
            maxCount = chapterCounts[chapter];
            maxChapter = chapter;
        }
    }
    
    // 更新统计信息
    if (totalMistakes) totalMistakes.textContent = mistakes.length;
    if (choiceMistakes) choiceMistakes.textContent = choiceCount;
    if (judgeMistakes) judgeMistakes.textContent = judgeCount;
    if (mostMistakes) mostMistakes.textContent = maxChapter || '-';
} 