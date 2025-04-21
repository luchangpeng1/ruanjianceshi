/**
 * 软件测试复习网站 - 搜索功能
 */

// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', function() {
    // 初始化搜索功能
    initSearch();
});

// 初始化搜索功能
function initSearch() {
    // 获取搜索框和搜索按钮
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    
    // 如果在搜索结果页面，获取相关元素
    const searchQuery = document.getElementById('search-query');
    const resultCount = document.getElementById('result-count');
    const searchResults = document.getElementById('search-results');
    const loadingIndicator = document.getElementById('loading-indicator');
    const noResults = document.getElementById('no-results');
    
    // 为搜索按钮添加点击事件
    if (searchButton) {
        searchButton.addEventListener('click', function() {
            handleSearch(searchInput.value);
        });
    }
    
    // 为搜索框添加回车键事件
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleSearch(searchInput.value);
            }
        });
    }
    
    // 在搜索结果页面执行搜索
    if (window.location.pathname.includes('search-results.html')) {
        // 获取URL中的查询参数
        const urlParams = new URLSearchParams(window.location.search);
        const query = urlParams.get('q');
        
        // 如果有查询参数，执行搜索
        if (query) {
            // 更新搜索框的值
            if (searchInput) {
                searchInput.value = query;
            }
            
            // 显示查询内容
            if (searchQuery) {
                searchQuery.textContent = `"${query}"`;
            }
            
            // 执行搜索
            performSearch(query);
        }
    }
}

// 处理搜索请求
function handleSearch(query) {
    if (query.trim() === '') {
        alert('请输入搜索内容');
        return;
    }
    
    // 导航到搜索结果页面
    window.location.href = `/search-results.html?q=${encodeURIComponent(query)}`;
}

// 执行搜索
function performSearch(query) {
    // 获取相关元素
    const searchResults = document.getElementById('search-results');
    const loadingIndicator = document.getElementById('loading-indicator');
    const noResults = document.getElementById('no-results');
    const resultCount = document.getElementById('result-count');
    
    // 显示加载指示器
    if (loadingIndicator) {
        loadingIndicator.style.display = 'block';
    }
    
    // 隐藏无结果提示
    if (noResults) {
        noResults.style.display = 'none';
    }
    
    // 清空之前的搜索结果
    const existingResults = searchResults.querySelectorAll('.search-item');
    existingResults.forEach(item => {
        if (item !== loadingIndicator && item !== noResults) {
            item.remove();
        }
    });
    
    // 模拟搜索延迟（实际项目中会替换为真实的搜索请求）
    setTimeout(() => {
        // 执行搜索
        const results = searchInContent(query);
        
        // 隐藏加载指示器
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
        
        // 更新结果计数
        if (resultCount) {
            resultCount.textContent = results.length;
        }
        
        // 显示搜索结果
        if (results.length > 0) {
            results.forEach(result => {
                const resultItem = createResultItem(result, query);
                searchResults.appendChild(resultItem);
            });
        } else {
            // 显示无结果提示
            if (noResults) {
                noResults.style.display = 'block';
            }
        }
    }, 500);
}

// 在内容中搜索（模拟）
function searchInContent(query) {
    // 实际项目中应该从服务器获取或使用预索引的数据
    const demoResults = [
        {
            title: '选择题：白盒测试的路径数',
            content: '白盒测试中，若程序盒图包含两组串行选择结构（路径数分别为3和5），最终可执行路径总数为15。',
            url: 'exams/exam2.html#q1',
            type: '选择题',
            chapter: '第2章'
        },
        {
            title: '判断题：等价类划分法测试用例覆盖',
            content: '等价类划分法的测试用例必须覆盖所有有效等价类。',
            url: 'exams/exam1.html#q1',
            type: '判断题',
            chapter: '第3章'
        },
        {
            title: '名词解释：等价类划分法',
            content: '等价类划分法是一种黑盒测试技术，将程序的输入域划分为多个等价类，从每个等价类中选择典型数据作为测试用例。',
            url: 'exams/exam1.html#def1',
            type: '名词解释',
            chapter: '第3章'
        },
        {
            title: '简答题：软件测试的四大基本原则',
            content: '软件测试的四大基本原则是：软件测试不能证明程序无错；尽早和不断地进行软件测试；Pareto原则（80/20法则）；软件测试应尽可能具有独立性。',
            url: 'exams/exam1.html#qa1',
            type: '简答题',
            chapter: '第1章'
        }
    ];
    
    // 模拟搜索
    const lowercaseQuery = query.toLowerCase();
    return demoResults.filter(result => {
        return (
            result.title.toLowerCase().includes(lowercaseQuery) ||
            result.content.toLowerCase().includes(lowercaseQuery) ||
            result.type.toLowerCase().includes(lowercaseQuery) ||
            result.chapter.toLowerCase().includes(lowercaseQuery)
        );
    });
}

// 创建搜索结果项
function createResultItem(result, query) {
    const resultItem = document.createElement('div');
    resultItem.className = 'search-item';
    
    // 创建标题元素
    const title = document.createElement('h3');
    title.innerHTML = highlightText(result.title, query);
    
    // 创建内容元素
    const content = document.createElement('p');
    content.innerHTML = highlightText(result.content, query);
    
    // 创建元信息元素
    const meta = document.createElement('div');
    meta.className = 'search-meta';
    meta.innerHTML = `<span class="search-type">${result.type}</span> | <span class="search-chapter">${result.chapter}</span>`;
    
    // 创建链接元素
    const link = document.createElement('a');
    link.href = result.url;
    link.className = 'btn';
    link.textContent = '查看详情';
    
    // 将元素添加到结果项
    resultItem.appendChild(title);
    resultItem.appendChild(content);
    resultItem.appendChild(meta);
    resultItem.appendChild(link);
    
    return resultItem;
}

// 高亮搜索词
function highlightText(text, query) {
    const words = query.trim().toLowerCase().split(/\s+/);
    let highlightedText = text;
    
    words.forEach(word => {
        if (word) {
            const regex = new RegExp(`(${escapeRegExp(word)})`, 'gi');
            highlightedText = highlightedText.replace(regex, '<span class="search-highlight">$1</span>');
        }
    });
    
    return highlightedText;
}

// 转义正则表达式特殊字符
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
} 