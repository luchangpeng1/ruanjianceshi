// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', function() {
    // 初始化显示/隐藏答案功能
    initAnswerToggle();
    
    // 初始化选择题和判断题的交互功能
    initQuizInteraction();
    
    // 添加ID到题目元素，便于定位
    addQuestionIds();
});

// 添加ID到题目元素
function addQuestionIds() {
    // 获取所有题目元素
    const questions = document.querySelectorAll('.question');
    
    // 为题目添加ID
    if (questions.length > 0) {
        // 获取题目所在的章节
        const sections = document.querySelectorAll('main > section');
        let currentSectionIndex = 0;
        
        questions.forEach((question, index) => {
            // 确定题目所在的章节
            while (currentSectionIndex < sections.length - 1 && 
                   !sections[currentSectionIndex].contains(question)) {
                currentSectionIndex++;
            }
            
            // 根据题目类型设置前缀
            let prefix = 'q';
            if (sections[currentSectionIndex].querySelector('h2').textContent.includes('名词解释')) {
                prefix = 'def';
            } else if (sections[currentSectionIndex].querySelector('h2').textContent.includes('简答题')) {
                prefix = 'qa';
            }
            
            // 设置ID
            const questionIndex = Array.from(sections[currentSectionIndex].querySelectorAll('.question')).indexOf(question) + 1;
            question.id = `${prefix}${questionIndex}`;
        });
    }
}

// 显示/隐藏答案功能
function initAnswerToggle() {
    // 获取所有"显示答案"按钮
    const showAnswerButtons = document.querySelectorAll('.show-answer');
    
    // 为每个按钮添加点击事件
    showAnswerButtons.forEach(button => {
        button.addEventListener('click', function() {
            // 获取对应的答案元素
            const answer = this.nextElementSibling;
            
            // 切换答案的显示状态
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

// 选择题和判断题的交互功能
function initQuizInteraction() {
    // 获取所有单选题的选项
    const choiceOptions = document.querySelectorAll('.choice-option');
    
    // 为每个选项添加点击事件
    choiceOptions.forEach(option => {
        option.addEventListener('click', function() {
            // 获取当前问题的所有选项
            const questionOptions = this.parentElement.querySelectorAll('.choice-option');
            
            // 移除所有选项的选中状态
            questionOptions.forEach(opt => {
                opt.classList.remove('selected');
            });
            
            // 给当前选项添加选中状态
            this.classList.add('selected');
            
            // 检查答案
            checkAnswer(this);
        });
    });
    
    // 获取所有判断题的选项
    const judgeOptions = document.querySelectorAll('.judge-option');
    
    // 为每个选项添加点击事件
    judgeOptions.forEach(option => {
        option.addEventListener('click', function() {
            // 获取当前问题的所有选项
            const questionOptions = this.parentElement.querySelectorAll('.judge-option');
            
            // 移除所有选项的选中状态
            questionOptions.forEach(opt => {
                opt.classList.remove('selected');
            });
            
            // 给当前选项添加选中状态
            this.classList.add('selected');
            
            // 检查答案
            checkAnswer(this);
        });
    });
}

// 检查答案
function checkAnswer(selectedOption) {
    // 获取选中选项的数据属性
    const isCorrect = selectedOption.getAttribute('data-correct') === 'true';
    
    // 根据答案是否正确添加相应的样式
    if (isCorrect) {
        selectedOption.classList.add('correct');
        selectedOption.classList.remove('incorrect');
    } else {
        selectedOption.classList.add('incorrect');
        selectedOption.classList.remove('correct');
    }
} 