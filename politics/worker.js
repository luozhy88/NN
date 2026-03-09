


<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>英语作文批改与复习系统</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <!-- EmailJS SDK -->
    <script type="text/javascript" src="https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js"></script>
    <style>
        body { font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6; }
        .tab-active { border-bottom: 2px solid #2563eb; color: #2563eb; font-weight: 600; }
        .tab-inactive { color: #6b7280; }
        .tab-inactive:hover { color: #374151; }
        .essay-content { white-space: pre-wrap; line-height: 1.8; }
        .wrong-text { text-decoration: line-through; color: #ef4444; margin-right: 4px; }
        .correct-text { color: #10b981; font-weight: bold; }
        .fade-in { animation: fadeIn 0.3s ease-in-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        
        /* Quiz specific styles */
        .option-card { transition: all 0.2s; border: 2px solid transparent; }
        .option-card:hover { border-color: #bfdbfe; background-color: #eff6ff; }
        .option-selected-correct { border-color: #10b981; background-color: #ecfdf5; }
        .option-selected-wrong { border-color: #ef4444; background-color: #fef2f2; }
        
        /* Loading spinner */
        .spinner { border: 3px solid #f3f3f3; border-radius: 50%; border-top: 3px solid #3498db; width: 20px; height: 20px; -webkit-animation: spin 2s linear infinite; animation: spin 2s linear infinite; display: inline-block; vertical-align: middle; margin-right: 8px;}
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    </style>
</head>
<body class="h-screen flex flex-col overflow-hidden">

    <!-- Header -->
    <header class="bg-white shadow-sm z-10">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-16 items-center">
                <div class="flex items-center">
                    <i class="fa-solid fa-graduation-cap text-blue-600 text-2xl mr-3"></i>
                    <h1 class="text-xl font-bold text-gray-900">英语作文批改与复习助手</h1>
                </div>
                <div class="flex space-x-8">
                    <button onclick="window.switchTab('report1')" id="tab-report1" class="tab-active px-3 py-2 text-sm font-medium transition-colors">
                        AI助力学习报告
                    </button>
                    <button onclick="window.switchTab('report2')" id="tab-report2" class="tab-inactive px-3 py-2 text-sm font-medium transition-colors">
                        读后续写报告
                    </button>
                    <button onclick="window.switchTab('review')" id="tab-review" class="tab-inactive px-3 py-2 text-sm font-medium transition-colors flex items-center">
                        <i class="fa-solid fa-clipboard-check mr-2"></i> 错题复习挑战
                    </button>
                </div>
            </div>
        </div>
    </header>

    <!-- Main Content Area -->
    <main class="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div class="max-w-4xl mx-auto">
            
            <!-- Report 1: AI Learning -->
            <div id="view-report1" class="fade-in space-y-6">
                <!-- Diagnosis Card -->
                <div class="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
                    <h2 class="text-lg font-bold text-gray-900 mb-4"><i class="fa-solid fa-stethoscope mr-2"></i>原文诊断 (Diagnosis)</h2>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div class="bg-green-50 p-3 rounded text-center"><span class="block text-sm text-gray-500">优势 (Advantages)</span><i class="fa-solid fa-check text-green-600 text-xl mt-1"></i></div>
                        <div class="bg-red-50 p-3 rounded text-center"><span class="block text-sm text-gray-500">潜在问题 (Problems)</span><i class="fa-solid fa-xmark text-red-600 text-xl mt-1"></i> <span class="text-xs text-red-600 block">缺失 (扣分点)</span></div>
                        <div class="bg-green-50 p-3 rounded text-center"><span class="block text-sm text-gray-500">个人观点 (Opinion)</span><i class="fa-solid fa-check text-green-600 text-xl mt-1"></i></div>
                    </div>
                    <div class="bg-gray-50 p-4 rounded text-sm text-gray-700 essay-content">
                        <span class="font-bold block mb-2">Student Essay (原文标记):</span>
                        I'm LiHua. Our school will hold an activity about AI in learning. I'm glad to share <span class="wrong-text">some my</span> <span class="correct-text">(some of my)</span> opinions with you. Firstly, <span class="wrong-text">with the development of society.</span> <span class="text-gray-500 text-xs">(incomplete)</span> AI can help <span class="wrong-text">our</span> <span class="correct-text">(us)</span> to <span class="wrong-text">better study</span> <span class="correct-text">(study better)</span>. For example, it can translate <span class="wrong-text">a</span> <span class="correct-text">(an)</span> English text so that we can understand the text. <span class="wrong-text">On the other hand</span> <span class="correct-text">(Besides)</span>, it <span class="wrong-text">show</span> <span class="correct-text">(shows)</span> <span class="wrong-text">a kind video</span> <span class="correct-text">(educational videos)</span> to help <span class="wrong-text">our</span> <span class="correct-text">(us)</span> to learn <span class="wrong-text">knowledges</span> <span class="correct-text">(knowledge)</span>. Finally, AI can make a study plan to <span class="wrong-text">suit yourself</span> <span class="correct-text">(suit us)</span>. It can help you <span class="wrong-text">more great</span> <span class="correct-text">(better)</span> to <span class="wrong-text">catch important knowledges</span> <span class="correct-text">(grasp important knowledge)</span>.
                    </div>
                </div>

                <!-- Revisions -->
                <div class="bg-white rounded-lg shadow overflow-hidden">
                    <div class="bg-gray-100 px-6 py-3 border-b flex justify-between items-center">
                        <h3 class="font-bold text-gray-800">修改建议</h3>
                        <div class="text-xs text-gray-500">点击切换版本</div>
                    </div>
                    <div class="p-6">
                        <div class="flex space-x-2 mb-4">
                            <button onclick="window.toggleVersion('ai', 'standard')" class="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium hover:bg-blue-200">修正补全版</button>
                            <button onclick="window.toggleVersion('ai', 'advanced')" class="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium hover:bg-purple-200">高分升格版</button>
                        </div>
                        
                        <div id="ai-standard" class="essay-content text-gray-800">
                            <h4 class="font-bold mb-2 text-blue-600">Standard Version (修正语法，补充缺点)</h4>
                            I'm Li Hua. Our school will hold an activity about AI in learning, and I'm glad to share my opinions.
                            Firstly, AI can help <span class="font-bold text-green-600">us study better</span>. For example, it can translate <span class="font-bold text-green-600">an</span> English text so that we can understand it easily. <span class="font-bold text-green-600">Besides</span>, it <span class="font-bold text-green-600">shows</span> educational videos to help <span class="font-bold text-green-600">us learn knowledge</span>. Finally, AI can make a study plan to <span class="font-bold text-green-600">suit our needs</span>, which helps us <span class="font-bold text-green-600">grasp important points better</span>.
                            <br><br>
                            <span class="bg-yellow-100 p-1 rounded">However, there are also problems. If we rely on AI too much, we may become lazy and stop thinking independently.</span>
                            <br><br>
                            In my opinion, AI is a useful tool, but we should use it wisely.
                        </div>

                        <div id="ai-advanced" class="hidden essay-content text-gray-800">
                            <h4 class="font-bold mb-2 text-purple-600">Advanced Version (高分词汇与句式)</h4>
                            With the rapid development of technology, AI has been widely applied in our daily study.
                            <br><br>
                            <span class="font-bold text-purple-600">On the one hand</span>, AI brings great <span class="font-bold text-purple-600">convenience</span>. It can <span class="font-bold text-purple-600">not only</span> translate foreign texts accurately <span class="font-bold text-purple-600">but also</span> provide <span class="font-bold text-purple-600">personalized study plans</span>, helping us learn <span class="font-bold text-purple-600">more efficiently</span>. 
                            <br><br>
                            <span class="font-bold text-purple-600">On the other hand</span>, potential problems cannot be ignored. <span class="font-bold text-purple-600">Over-reliance</span> on AI may lead to a lack of independent thinking and creativity.
                            <br><br>
                            In my opinion, AI is a <span class="font-bold text-purple-600">double-edged sword</span>. We should make good use of it as a helpful tool rather than depending on it completely. Only in this way can we truly benefit from it.
                        </div>
                    </div>
                </div>
            </div>

            <!-- Report 2: Strangers' Kindness -->
            <div id="view-report2" class="hidden fade-in space-y-6">
                <!-- Diagnosis Card -->
                 <div class="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
                    <h2 class="text-lg font-bold text-gray-900 mb-4"><i class="fa-solid fa-magnifying-glass-chart mr-2"></i>核心错误分析 (Key Errors)</h2>
                    
                    <div class="space-y-4">
                        <div class="bg-red-50 p-4 rounded-lg">
                            <h3 class="font-bold text-red-700 mb-2">语法重灾区</h3>
                            <ul class="list-disc list-inside text-sm text-gray-700 space-y-1">
                                <li>I found some people <span class="wrong-text">stay</span> → <span class="correct-text">staying</span> (分词作宾补)</li>
                                <li>asked <span class="wrong-text">for</span> them → <span class="correct-text">asked them</span></li>
                                <li>hurried up <span class="wrong-text">come</span> → <span class="correct-text">hurried to come / hurried over</span></li>
                                <li>I <span class="wrong-text">with they went</span> → <span class="correct-text">I went with them</span> (中式语序)</li>
                                <li><span class="wrong-text">kindmans</span> → <span class="correct-text">kind people</span> (单词拼写)</li>
                            </ul>
                        </div>
                        <div class="bg-yellow-50 p-4 rounded-lg">
                            <h3 class="font-bold text-yellow-700 mb-2">逻辑与情节硬伤</h3>
                            <p class="text-sm text-gray-700"><strong>误解原文：</strong> 妈妈是摔倒受伤，不是掉进"cracks" (裂缝)。<br><strong>不合常理：</strong> 用"strong stick"救助摔倒的人很奇怪，通常是扶起或检查伤势。</p>
                        </div>
                    </div>
                </div>

                <!-- Revisions -->
                <div class="bg-white rounded-lg shadow overflow-hidden">
                    <div class="bg-gray-100 px-6 py-3 border-b flex justify-between items-center">
                        <h3 class="font-bold text-gray-800">修改与升格</h3>
                         <div class="flex space-x-2">
                            <button onclick="window.toggleVersion('kindness', 'revised')" class="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium hover:bg-orange-200">纠错版</button>
                            <button onclick="window.toggleVersion('kindness', 'advanced')" class="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium hover:bg-indigo-200">高分版</button>
                        </div>
                    </div>
                    <div class="p-6">
                        <div id="kindness-revised" class="essay-content text-gray-800">
                            <h4 class="font-bold mb-2 text-orange-600">Revised Version (纠正语法与逻辑)</h4>
                            <p class="mb-4">But while I stood frozen, strangers stepped in without hesitation. A middle-aged man in a work uniform <span class="font-bold text-green-600">rushed over and knelt beside my mother</span>. "Don't move her yet," he said calmly, checking her pulse...</p>
                            <p>As my mother's breathing steadied, I thanked them again and again. "You don't need to thank us," the man smiled warmly. ... My faith in human nature, once so fragile, was restored by the simple act of people caring.</p>
                        </div>

                        <div id="kindness-advanced" class="hidden essay-content text-gray-800">
                            <h4 class="font-bold mb-2 text-indigo-600">Advanced Version (细节描写与情感升华)</h4>
                            <p class="mb-4">But while I stood frozen, strangers stepped in without hesitation. Before I could even process what was happening, a construction worker... <span class="font-bold text-indigo-600">his calloused hands gently supporting her head</span>. "Ma'am, can you hear me?" he <span class="font-bold text-indigo-600">murmured</span>...</p>
                            <p>... My cynicism had <span class="font-bold text-indigo-600">crumbled</span> in the face of their <span class="font-bold text-indigo-600">unscripted humanity</span>. These strangers had restored more than my mother's stability; they'd rebuilt my faith in the very essence of human goodness.</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Review Mode: Quiz -->
            <div id="view-review" class="hidden fade-in h-full flex flex-col items-center justify-center pt-8">
                
                <!-- Start Screen -->
                <div id="quiz-start" class="text-center max-w-lg w-full px-4">
                    <div class="bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
                        <div class="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <i class="fa-solid fa-brain text-blue-600 text-4xl"></i>
                        </div>
                        <h2 class="text-2xl font-bold text-gray-900 mb-2">错题突击检查</h2>
                        <p class="text-gray-600 mb-2">系统题库共收录 <span class="font-bold text-blue-600" id="total-questions-count">0</span> 个知识点。</p>
                        
                        <!-- 艾宾浩斯记忆提醒区域 -->
                        <div id="ebbinghaus-status" class="mb-6">
                            <div class="inline-block bg-purple-50 text-purple-700 px-4 py-2 rounded-lg font-bold text-sm shadow-sm border border-purple-100">
                                <i class="fa-solid fa-hourglass-half mr-1"></i> <span id="sync-status">正在连接艾宾浩斯云记忆库...</span>
                            </div>
                        </div>

                        <!-- User Profile Selection -->
                        <div class="mb-6 text-left bg-gray-50 p-4 rounded-lg border border-gray-100">
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                <i class="fa-solid fa-users mr-1 text-gray-500"></i> 选择学习账号 (独立记忆库):
                            </label>
                            <select id="user-profile" onchange="window.changeProfile()" class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border bg-white font-medium text-gray-700">
                                <option value="user1">👤 User 1 (账号一)</option>
                                <option value="user2">👤 User 2 (账号二)</option>
                                <option value="user3">👤 User 3 (账号三)</option>
                            </select>
                        </div>
                        
                        <!-- Daily Limit Setting -->
                        <div class="mb-6 text-left bg-gray-50 p-4 rounded-lg border border-gray-100">
                            <label for="daily-limit" class="block text-sm font-medium text-gray-700 mb-2">
                                <i class="fa-solid fa-calendar-day mr-1 text-gray-500"></i> 今日目标题数:
                            </label>
                            <div class="flex items-center space-x-3">
                                <select id="daily-limit" class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border bg-white font-medium text-gray-700">
                                    <option value="5">5</option>
                                    <option value="10">10</option>
                                    <option value="20">20</option>
                                    <option value="30">30</option>
                                    <option value="999">全部错题</option>
                                </select>
                                <span class="text-sm text-gray-500 whitespace-nowrap">题</span>
                            </div>
                            <p class="text-xs text-gray-400 mt-2">系统将优先为您推送需要复习的错题记录。</p>
                        </div>

                        <button id="btn-start" onclick="window.startQuiz()" class="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-bold hover:bg-blue-700 transition shadow-md hover:shadow-lg transform hover:-translate-y-1 disabled:opacity-50">
                            开始今日复习
                        </button>
                        
                        <!-- 🚀 新增：查看记忆库按钮 -->
                        <button onclick="window.showMemoryDashboard()" class="w-full mt-3 bg-white text-purple-600 border border-purple-200 py-3 px-6 rounded-lg font-bold hover:bg-purple-50 transition shadow-sm">
                            <i class="fa-solid fa-database mr-1"></i> 查看当前账号记忆库
                        </button>
                    </div>
                </div>

                <!-- Quiz Card -->
                <div id="quiz-container" class="hidden w-full max-w-2xl">
                    <div class="flex justify-between items-center mb-4">
                        <span class="text-sm font-medium text-gray-500">进度: <span id="current-q">1</span>/<span id="total-q">10</span></span>
                        <div class="h-2 w-48 bg-gray-200 rounded-full">
                            <div id="progress-bar" class="h-2 bg-blue-500 rounded-full transition-all duration-300" style="width: 0%"></div>
                        </div>
                    </div>

                    <div class="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden relative min-h-[400px] flex flex-col">
                        <div class="p-6 md:p-8 flex-1">
                            <!-- Context Label -->
                            <div class="mb-4 flex items-center">
                                <span id="q-tag" class="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-gray-100 text-gray-600">
                                    Grammar
                                </span>
                                <!-- 艾宾浩斯动态徽章 -->
                                <span id="ebbinghaus-badge" class="hidden inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-purple-100 text-purple-600 ml-2 shadow-sm border border-purple-200">
                                    <i class="fa-solid fa-brain mr-1"></i> 艾宾浩斯复习
                                </span>
                            </div>

                            <!-- Question Text -->
                            <h3 class="text-xl text-gray-800 mb-6 leading-relaxed">
                                原句中的错误部分是：<br>
                                "<span id="q-context" class="font-mono text-red-500 bg-red-50 px-1 rounded"></span>"
                            </h3>
                            <p class="text-gray-600 mb-6 text-sm">请选择正确的修正表达：</p>

                            <!-- Options -->
                            <div id="options-container" class="space-y-3">
                                <!-- Options injected by JS -->
                            </div>
                        </div>

                        <!-- Feedback Area (Hidden initially) -->
                        <div id="feedback-area" class="hidden bg-gray-50 p-6 border-t border-gray-100">
                            <div class="flex items-start">
                                <div id="feedback-icon" class="flex-shrink-0 mr-3 mt-1"></div>
                                <div>
                                    <h4 id="feedback-title" class="font-bold text-lg mb-1"></h4>
                                    <p id="feedback-text" class="text-gray-600 text-sm"></p>
                                    <button onclick="window.nextQuestion()" class="mt-4 bg-gray-900 text-white px-4 py-2 rounded text-sm font-medium hover:bg-gray-800">
                                        下一题 <i class="fa-solid fa-arrow-right ml-1"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Results Screen -->
                <div id="quiz-results" class="hidden text-center max-w-lg w-full">
                    <div class="bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
                        <div id="score-icon" class="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 bg-green-100 text-green-600">
                            <i class="fa-solid fa-trophy text-4xl"></i>
                        </div>
                        <h2 class="text-2xl font-bold text-gray-900 mb-2">复习完成!</h2>
                        <p class="text-gray-600 mb-6">今日得分: <span id="final-score" class="text-3xl font-bold text-blue-600"></span></p>
                        <p id="result-message" class="text-sm text-gray-500 mb-8"></p>
                        
                        <!-- Automatic Email Status Area -->
                        <div class="mb-6 border-t pt-6 bg-gray-50 rounded-lg p-4">
                             <!-- Status Text -->
                            <div id="email-status-container" class="text-center">
                                <p id="email-status" class="text-sm font-medium text-gray-600 flex items-center justify-center">
                                    等待发送...
                                </p>
                            </div>
                            <!-- Retry Button (Hidden by default, shown on failure) -->
                            <button id="btn-retry-email" onclick="window.sendReport()" class="hidden w-full mt-3 bg-red-100 text-red-700 py-2 px-4 rounded hover:bg-red-200 transition text-sm">
                                <i class="fa-solid fa-rotate-right mr-1"></i> 发送失败，点击重试
                            </button>
                        </div>

                        <div class="flex space-x-3 justify-center">
                            <button onclick="window.resetQuiz()" class="bg-blue-100 text-blue-700 py-2 px-6 rounded-lg font-medium hover:bg-blue-200">
                                再练一组
                            </button>
                            <button onclick="window.switchTab('report1')" class="bg-gray-100 text-gray-700 py-2 px-6 rounded-lg font-medium hover:bg-gray-200">
                                回顾错题
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </main>

    <!-- 🚀 新增：记忆库查看弹窗 (Modal) -->
    <div id="memory-modal" class="hidden fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl fade-in">
            <div class="flex justify-between items-center mb-4 border-b pb-3">
                <h3 class="text-xl font-bold text-gray-900"><i class="fa-solid fa-database mr-2 text-purple-500"></i><span id="memory-modal-title">账号记忆库</span></h3>
                <button onclick="document.getElementById('memory-modal').classList.add('hidden')" class="text-gray-400 hover:text-gray-700 transition">
                    <i class="fa-solid fa-xmark text-2xl"></i>
                </button>
            </div>
            <div class="overflow-y-auto flex-1 bg-gray-50 rounded-lg p-3 border border-gray-200" id="memory-list">
                <!-- Records injected by JS -->
            </div>
        </div>
    </div>

    <!-- 🌟 Firebase 云数据库配置 🌟 -->
    <script type="module">
        // --- 核心：配置免费云数据库 (Firebase Firestore) ---
        import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
        import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
        import { getFirestore, collection, doc, setDoc, getDocs, deleteDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

        // 用户提供的 Firebase 配置
        const isCanvasEnv = typeof __firebase_config !== 'undefined';
        const firebaseConfig = isCanvasEnv ? JSON.parse(__firebase_config) : {
            apiKey: "AIzaSyAytwqtNdtryI0V3IXpZ_i1PXnit8_ZLBU",
            authDomain: "english-62c4b.firebaseapp.com",
            projectId: "english-62c4b",
            storageBucket: "english-62c4b.firebasestorage.app",
            messagingSenderId: "342477459941",
            appId: "1:342477459941:web:249196c7bdc31fb3095f0c",
            measurementId: "G-KH7VZZ3XDE"
        };

        const appId = typeof __app_id !== 'undefined' ? __app_id : 'github-english-review-app';
        let app, auth, db, currentUser;
        let userRecords = []; // 本地缓存的艾宾浩斯记忆数据
        let currentProfile = 'user1'; // 当前选择的学习账号

        // 艾宾浩斯记忆曲线时间间隔配置
        const EBBINGHAUS_INTERVALS = [
            0, 
            5 * 60 * 1000,           // Lv.1: 5分钟
            30 * 60 * 1000,          // Lv.2: 30分钟
            12 * 60 * 60 * 1000,     // Lv.3: 12小时
            24 * 60 * 60 * 1000,     // Lv.4: 1天
            2 * 24 * 60 * 60 * 1000, // Lv.5: 2天
            4 * 24 * 60 * 60 * 1000, // Lv.6: 4天
            7 * 24 * 60 * 60 * 1000, // Lv.7: 7天
            15 * 24 * 60 * 60 * 1000 // Lv.8: 15天
        ];

        // --- EMAIL CONFIGURATION ---
        const EMAIL_CONFIG = {
            serviceID: "service_j2ak28v",
            templateID: "template_ol3ws9o",
            publicKey: "bGbqCw1wlTrkCwfFo"
        };
        emailjs.init(EMAIL_CONFIG.publicKey);

        // --- DATA ---
        const mistakeDatabase = [
            { id: 1, tag: "代词 (Pronoun)", context: "...help our to better study...", incorrect: "help our", correct: "help us", explanation: "Help 是动词，后面应该接宾格 (us)，而 our 是形容词性物主代词。", distractors: ["help ours", "helps our"] },
            { id: 2, tag: "不可数名词 (Uncountable)", context: "...learn knowledges...", incorrect: "knowledges", correct: "knowledge", explanation: "Knowledge 是不可数名词，不能加 's'。", distractors: ["a knowledge", "many knowledges"] },
            { id: 3, tag: "冠词 (Article)", context: "...translate a English text...", incorrect: "a English", correct: "an English", explanation: "English 以元音音素开头，不定冠词应用 an。", distractors: ["the English", "English"] },
            { id: 4, tag: "主谓一致 (Subject-Verb)", context: "...it show a kind video...", incorrect: "it show", correct: "it shows", explanation: "主语 It 是第三人称单数，动词 show 需加 s。", distractors: ["it showing", "it showed"] },
            { id: 5, tag: "比较级 (Comparative)", context: "...help you more great...", incorrect: "more great", correct: "better", explanation: "Good/Well 的比较级是 better，不是 more great。", distractors: ["greaters", "more good"] },
            { id: 6, tag: "连接词 (Logic)", context: "(Listing advantages) ...On the other hand, it shows...", incorrect: "On the other hand", correct: "Besides / In addition", explanation: "'On the other hand' 用于对比（相反方面）。这里是列举另一个优点，应用 'Besides'。", distractors: ["However", "Therefore"] },
            { id: 7, tag: "搭配 (Collocation)", context: "...plan to suit yourself...", incorrect: "suit yourself", correct: "suit our needs / suit us", explanation: "'Suit yourself' 通常意为'随你的便'（略带贬义或口语化）。", distractors: ["suit for us", "fit yourself"] },
            { id: 8, tag: "非谓语动词 (Participle)", context: "I found some people stay...", incorrect: "found ... stay", correct: "found ... staying", explanation: "Find sb. doing sth. 表示发现某人正在做某事。", distractors: ["found ... stayed", "found ... to stay"] },
            { id: 9, tag: "介词多余 (Preposition)", context: "I asked for them to help...", incorrect: "asked for them", correct: "asked them", explanation: "Ask sb. to do sth. 是固定用法，不需要加 for。", distractors: ["asked to them", "asked at them"] },
            { id: 10, tag: "拼写 (Spelling)", context: "When they heared my topics...", incorrect: "heared", correct: "heard", explanation: "Hear 的过去式是 heard，是不规则变化。", distractors: ["heareded", "hear"] },
            { id: 11, tag: "语序 (Word Order)", context: "I with they went to...", incorrect: "I with they went", correct: "I went with them", explanation: "典型的中式英语。应为主语 + 谓语 + 介词短语。", distractors: ["I went with they", "With they I went"] },
            { id: 12, tag: "生造词 (Vocabulary)", context: "I think they are kindmans.", incorrect: "kindmans", correct: "kind people", explanation: "英语中没有 kindman 这个词。", distractors: ["kind mans", "kinders"] },
            { id: 13, tag: "动词搭配 (Structure)", context: "The experience make me that I realized...", incorrect: "make me that I realized", correct: "made me realize", explanation: "Make sb. do sth. (使某人做某事)，后面接动词原形。", distractors: ["made me realized", "make me realizing"] },
            { id: 14, tag: "大写 (Capitalization)", context: "This saturday afternoon...", incorrect: "This saturday", correct: "This Saturday", explanation: "星期几是专有名词，首字母必须大写，如 Monday、Saturday 等。", distractors: ["this Saturday", "This SATURDAY"] },
            { id: 15, tag: "语法混乱 (Grammar)", context: "...cultural experience an activities can be able to help you...", incorrect: "an activities can be able to", correct: "a cultural experience event that will help you", explanation: "'Can be able to' 是冗余表达，can 与 be able to 二选一即可。此外 activities 不能用 an 修饰（复数）。", distractors: ["an activities can to", "activities can be able"] },
            { id: 16, tag: "大写 (Capitalization)", context: "...know about chinese traditions...", incorrect: "chinese traditions", correct: "Chinese traditions", explanation: "表示国籍、语言或民族的形容词（如 Chinese、English、French）首字母必须大写。", distractors: ["CHINESE traditions", "chinese Traditions"] },
            { id: 17, tag: "拼写 (Spelling)", context: "...chinese traditions cund have an unforgettable weekend...", incorrect: "cund", correct: "and", explanation: "'cund' 是拼写错误，根据上下文应为连词 'and'。", distractors: ["caned", "cond"] },
            { id: 18, tag: "表达不清 (Expression)", context: "...have a chance to make cutting and dumplings...", incorrect: "make cutting and dumplings", correct: "make paper cuttings and dumplings", explanation: "剪纸的英文是 paper cuttings，不能省略 paper，否则意思不清。", distractors: ["make paper cutting and dumpling", "make cuttings and dumplings"] },
            { id: 19, tag: "拼写 (Spelling)", context: "...make paper cuttings with stucents...", incorrect: "stucents", correct: "students", explanation: "'stucents' 是拼写错误，正确拼写为 students（s-t-u-d-e-n-t-s）。", distractors: ["studants", "studentes"] }
        ];

        document.getElementById('total-questions-count').innerText = mistakeDatabase.length;

        // 初始化 Firebase 与同步记忆数据
        async function initFirebaseAndSync() {
            const syncUI = document.getElementById('sync-status');
            try {
                app = initializeApp(firebaseConfig);
                auth = getAuth(app);
                db = getFirestore(app);

                // 静默匿名登录，获取跨刷新唯一的 UserID
                if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                    await signInWithCustomToken(auth, __initial_auth_token);
                } else {
                    await signInAnonymously(auth);
                }

                onAuthStateChanged(auth, async (user) => {
                    currentUser = user;
                    if (user) {
                        await fetchMemoryRecords();
                    }
                });
            } catch (e) {
                console.error("Firebase Initialization Failed", e);
                syncUI.innerHTML = `<span class="text-red-500"><i class="fa-solid fa-xmark"></i> 记忆库连接失败，请检查Firebase设置</span>`;
            }
        }

        async function fetchMemoryRecords() {
            if (!currentUser || !db) return;
            try {
                // 根据不同账号拉取独立的云端集合
                const collectionName = 'ebbinghaus_' + currentProfile;
                const snapshot = await getDocs(collection(db, 'artifacts', appId, 'users', currentUser.uid, collectionName));
                userRecords = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                
                const now = Date.now();
                const dueCount = userRecords.filter(r => r.nextReviewTime <= now).length;
                
                const syncUI = document.getElementById('sync-status');
                syncUI.innerHTML = `<span class="text-green-600"><i class="fa-solid fa-cloud-arrow-down"></i> 云端同步成功 (${currentProfile})。发现 <b class="text-purple-700">${dueCount}</b> 道待复习错题</span>`;
            } catch(e) {
                console.error("Fetch Data Error", e);
            }
        }

        // --- 核心：艾宾浩斯记录算法 ---
        async function updateMemoryRecord(questionId, isCorrect) {
            if (!currentUser || !db) return;
            try {
                // 确保数据路径严格遵循约束，根据账号隔离集合
                const collectionName = 'ebbinghaus_' + currentProfile;
                const docRef = doc(db, 'artifacts', appId, 'users', currentUser.uid, collectionName, `q_${questionId}`);
                const existingIndex = userRecords.findIndex(r => r.questionId === questionId);
                const existing = existingIndex !== -1 ? userRecords[existingIndex] : null;
                const now = Date.now();

                if (!existing) {
                    if (!isCorrect) {
                        // 首次做错，加入记忆库 (Lv.1: 5分钟后复习)
                        const nextTime = now + EBBINGHAUS_INTERVALS[1];
                        const newData = { questionId, level: 1, nextReviewTime: nextTime };
                        await setDoc(docRef, newData);
                        userRecords.push(newData);
                    }
                } else {
                    if (isCorrect) {
                        // 答对了，进入下一个记忆周期
                        const nextLevel = existing.level + 1;
                        if (nextLevel >= EBBINGHAUS_INTERVALS.length) {
                            await deleteDoc(docRef); // 已彻底掌握
                            userRecords.splice(existingIndex, 1);
                        } else {
                            const nextTime = now + EBBINGHAUS_INTERVALS[nextLevel];
                            const newData = { questionId, level: nextLevel, nextReviewTime: nextTime };
                            await setDoc(docRef, newData);
                            userRecords[existingIndex] = newData;
                        }
                    } else {
                        // 答错了，重置记忆曲线
                        const nextTime = now + EBBINGHAUS_INTERVALS[1];
                        const newData = { questionId, level: 1, nextReviewTime: nextTime };
                        await setDoc(docRef, newData);
                        userRecords[existingIndex] = newData;
                    }
                }
            } catch(e) {
                console.error("更新记忆数据失败", e);
            }
        }

        // --- UI & QUIZ LOGIC (Exposed to window) ---
        let currentQuestionIndex = 0;
        let score = 0;
        let quizData = [];
        let isAnswered = false;
        let attemptHistory = [];

        window.changeProfile = async function() {
            const profileSelect = document.getElementById('user-profile');
            currentProfile = profileSelect.value;
            const syncUI = document.getElementById('sync-status');
            syncUI.innerHTML = `<span class="text-purple-600"><i class="fa-solid fa-spinner fa-spin mr-1"></i> 正在拉取 ${profileSelect.options[profileSelect.selectedIndex].text} 的数据...</span>`;
            await fetchMemoryRecords();
        };

        window.switchTab = function(tabName) {
            ['view-report1', 'view-report2', 'view-review'].forEach(id => {
                document.getElementById(id).classList.add('hidden');
            });
            ['tab-report1', 'tab-report2', 'tab-review'].forEach(id => {
                document.getElementById(id).className = "tab-inactive px-3 py-2 text-sm font-medium transition-colors flex items-center cursor-pointer";
            });
            document.getElementById(`view-${tabName}`).classList.remove('hidden');
            document.getElementById(`tab-${tabName}`).className = "tab-active px-3 py-2 text-sm font-medium transition-colors flex items-center cursor-pointer";
        };

        window.toggleVersion = function(essay, version) {
            if (essay === 'ai') {
                document.getElementById('ai-standard').classList.add('hidden');
                document.getElementById('ai-advanced').classList.add('hidden');
                document.getElementById(`ai-${version}`).classList.remove('hidden');
            } else if (essay === 'kindness') {
                document.getElementById('kindness-revised').classList.add('hidden');
                document.getElementById('kindness-advanced').classList.add('hidden');
                document.getElementById(`kindness-${version}`).classList.remove('hidden');
            }
        };

        function shuffleArray(array) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
            return array;
        }

        // 🚀 新增：展示记忆库数据的弹窗逻辑
        window.showMemoryDashboard = function() {
            const modal = document.getElementById('memory-modal');
            const list = document.getElementById('memory-list');
            const profileSelect = document.getElementById('user-profile');
            const profileName = profileSelect.options[profileSelect.selectedIndex].text;
            document.getElementById('memory-modal-title').innerText = `${profileName} 的记忆库`;

            if (userRecords.length === 0) {
                list.innerHTML = '<div class="text-center text-gray-500 p-10 flex flex-col items-center"><i class="fa-solid fa-box-open text-4xl mb-3 text-gray-300"></i><p>你的记忆库目前空空如也，<br>快去挑战并产生第一道错题吧！</p></div>';
            } else {
                let html = '<div class="space-y-3">';
                // 按照复习时间排序，最紧急的在最上面
                const sortedRecords = [...userRecords].sort((a, b) => a.nextReviewTime - b.nextReviewTime);
                
                sortedRecords.forEach(record => {
                    const q = mistakeDatabase.find(x => x.id === record.questionId);
                    if (q) {
                        const dateObj = new Date(record.nextReviewTime);
                        const timeString = `${dateObj.getMonth()+1}月${dateObj.getDate()}日 ${dateObj.getHours().toString().padStart(2, '0')}:${dateObj.getMinutes().toString().padStart(2, '0')}`;
                        const isDue = record.nextReviewTime <= Date.now();
                        const dueBadge = isDue ? '<span class="bg-red-100 text-red-600 px-2 py-0.5 rounded text-xs ml-2 font-bold shadow-sm border border-red-200">待复习</span>' : '';
                        
                        html += `
                        <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:border-blue-200 transition">
                            <div class="flex items-center justify-between mb-2">
                                <div class="text-sm font-bold text-gray-800"><i class="fa-solid fa-tag text-blue-500 mr-1"></i> ${q.tag}</div>
                                <div>
                                    <span class="text-xs font-bold bg-purple-100 text-purple-600 px-2 py-0.5 rounded shadow-sm border border-purple-200">Lv.${record.level}</span>
                                    ${dueBadge}
                                </div>
                            </div>
                            <div class="text-sm text-gray-600 mb-2 p-2 bg-gray-50 rounded">
                                <span class="line-through text-red-400 mr-2">${q.incorrect}</span> 
                                <i class="fa-solid fa-arrow-right text-gray-400 text-xs"></i> 
                                <span class="text-green-600 font-bold ml-2">${q.correct}</span>
                            </div>
                            <div class="text-xs text-gray-400 flex items-center">
                                <i class="fa-regular fa-clock mr-1"></i> 下次复习安排: <span class="ml-1 ${isDue ? 'text-red-500 font-bold' : 'text-gray-500'}">${timeString}</span>
                            </div>
                        </div>
                        `;
                    }
                });
                html += '</div>';
                list.innerHTML = html;
            }
            modal.classList.remove('hidden');
        };

        window.startQuiz = function() {
            const dailyLimitInput = document.getElementById('daily-limit');
            let limit = parseInt(dailyLimitInput.value);
            if (isNaN(limit) || limit < 1) limit = 5;
            if (limit > mistakeDatabase.length) limit = mistakeDatabase.length;

            // 艾宾浩斯筛选逻辑：分离出待复习(到期)和新题
            const now = Date.now();
            const dueQuestionIds = userRecords.filter(r => r.nextReviewTime <= now).map(r => r.questionId);
            
            let dueQuestions = mistakeDatabase.filter(q => dueQuestionIds.includes(q.id));
            let newQuestions = mistakeDatabase.filter(q => !dueQuestionIds.includes(q.id));
            
            dueQuestions = shuffleArray(dueQuestions);
            newQuestions = shuffleArray(newQuestions);

            // 优先填满待复习题，不够的用新题补上
            quizData = [...dueQuestions, ...newQuestions].slice(0, limit);
            
            currentQuestionIndex = 0;
            score = 0;
            attemptHistory = [];
            
            document.getElementById('quiz-start').classList.add('hidden');
            document.getElementById('quiz-results').classList.add('hidden');
            document.getElementById('quiz-container').classList.remove('hidden');
            document.getElementById('total-q').innerText = quizData.length;
            document.getElementById('email-status').innerText = "";
            document.getElementById('email-status').className = "text-sm font-medium text-gray-600 flex items-center justify-center";
            document.getElementById('btn-retry-email').classList.add('hidden');
            
            loadQuestion();
        };

        function loadQuestion() {
            isAnswered = false;
            const q = quizData[currentQuestionIndex];
            
            // 判定当前题是否为艾宾浩斯“到期复习”的题
            const isReviewQuestion = userRecords.some(r => r.questionId === q.id && r.nextReviewTime <= Date.now());
            if (isReviewQuestion) {
                document.getElementById('ebbinghaus-badge').classList.remove('hidden');
            } else {
                document.getElementById('ebbinghaus-badge').classList.add('hidden');
            }

            document.getElementById('current-q').innerText = currentQuestionIndex + 1;
            document.getElementById('progress-bar').style.width = `${((currentQuestionIndex) / quizData.length) * 100}%`;
            
            document.getElementById('q-tag').innerText = q.tag;
            document.getElementById('q-context').innerText = q.incorrect;
            document.getElementById('feedback-area').classList.add('hidden');

            const optionsDiv = document.getElementById('options-container');
            optionsDiv.innerHTML = '';

            let options = [
                { text: q.correct, isCorrect: true },
                ...q.distractors.map(d => ({ text: d, isCorrect: false }))
            ];
            options = shuffleArray(options);

            options.forEach((opt) => {
                const btn = document.createElement('div');
                btn.className = "option-card w-full p-4 rounded-lg border border-gray-200 cursor-pointer flex items-center bg-white";
                btn.innerHTML = `<div class="w-5 h-5 rounded-full border-2 border-gray-300 mr-3 flex items-center justify-center dot-indicator"></div><span class="font-medium text-gray-700">${opt.text}</span>`;
                btn.onclick = () => window.checkAnswer(opt, btn, q);
                optionsDiv.appendChild(btn);
            });
        }

        window.checkAnswer = async function(selectedOption, btnElement, questionData) {
            if (isAnswered) return;
            isAnswered = true;

            const allBtns = document.getElementById('options-container').children;
            let resultStatus = "Wrong";

            if (selectedOption.isCorrect) {
                score++;
                resultStatus = "Correct";
                btnElement.classList.add('option-selected-correct');
                btnElement.querySelector('.dot-indicator').innerHTML = '<i class="fa-solid fa-check text-green-500 text-xs"></i>';
                btnElement.querySelector('.dot-indicator').classList.add('border-green-500');
                showFeedback(true, questionData);
            } else {
                btnElement.classList.add('option-selected-wrong');
                btnElement.querySelector('.dot-indicator').innerHTML = '<i class="fa-solid fa-xmark text-red-500 text-xs"></i>';
                btnElement.querySelector('.dot-indicator').classList.add('border-red-500');
                
                Array.from(allBtns).forEach(b => {
                    if (b.innerText.includes(questionData.correct)) {
                        b.classList.add('option-selected-correct');
                    }
                });
                showFeedback(false, questionData);
            }

            // 【触发艾宾浩斯记录算法】
            await updateMemoryRecord(questionData.id, selectedOption.isCorrect);

            attemptHistory.push({
                question: questionData.context,
                correctAnswer: questionData.correct,
                userResult: resultStatus,
                tag: questionData.tag
            });
        };

        function showFeedback(isCorrect, data) {
            const fbArea = document.getElementById('feedback-area');
            const fbIcon = document.getElementById('feedback-icon');
            const fbTitle = document.getElementById('feedback-title');
            const fbText = document.getElementById('feedback-text');

            fbArea.classList.remove('hidden');
            fbArea.classList.add('fade-in');

            if (isCorrect) {
                fbIcon.innerHTML = '<div class="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center"><i class="fa-solid fa-check text-green-600"></i></div>';
                fbTitle.innerText = "正确! Excellent!";
                fbTitle.className = "font-bold text-lg mb-1 text-green-700";
            } else {
                fbIcon.innerHTML = '<div class="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center"><i class="fa-solid fa-xmark text-red-600"></i></div>';
                fbTitle.innerText = "Oops! 答错了 (已自动纳入艾宾浩斯复习计划)";
                fbTitle.className = "font-bold text-lg mb-1 text-red-700";
            }
            fbText.innerText = data.explanation;
        }

        window.nextQuestion = function() {
            currentQuestionIndex++;
            if (currentQuestionIndex < quizData.length) {
                loadQuestion();
            } else {
                showResults();
            }
        };

        function showResults() {
            document.getElementById('quiz-container').classList.add('hidden');
            document.getElementById('quiz-results').classList.remove('hidden');
            
            const finalScore = document.getElementById('final-score');
            finalScore.innerText = `${score} / ${quizData.length}`;
            
            const percentage = (score / quizData.length) * 100;
            const msg = document.getElementById('result-message');
            const icon = document.getElementById('score-icon');

            if (percentage === 100) {
                msg.innerText = "完美通关！学习报告将自动发送。";
                icon.className = "w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 bg-yellow-100 text-yellow-600";
                icon.innerHTML = '<i class="fa-solid fa-crown text-4xl"></i>';
            } else if (percentage >= 80) {
                msg.innerText = "掌握得很好！错题已录入云端记忆库。";
                icon.className = "w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 bg-green-100 text-green-600";
                icon.innerHTML = '<i class="fa-solid fa-thumbs-up text-4xl"></i>';
            } else {
                msg.innerText = "还需努力，做错的题目系统会在最佳记忆点重新推送给你！";
                icon.className = "w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 bg-gray-100 text-gray-600";
                icon.innerHTML = '<i class="fa-solid fa-book-open text-4xl"></i>';
            }

            window.sendReport();
        }

        window.resetQuiz = function() {
            window.startQuiz();
        };

        window.sendReport = function() {
            const statusDiv = document.getElementById('email-status');
            const retryBtn = document.getElementById('btn-retry-email');
            
            statusDiv.innerHTML = '<div class="spinner text-blue-600"></div> <span class="text-blue-600">正在自动发送今日学习报告...</span>';
            retryBtn.classList.add('hidden');

            let detailedReport = `Date: ${new Date().toLocaleDateString()}\n`;
            detailedReport += `Score: ${score} / ${quizData.length}\n`;
            detailedReport += `-----------------------------------\n\n`;

            attemptHistory.forEach((item, index) => {
                const mark = item.userResult === "Correct" ? "✅" : "❌";
                detailedReport += `${index + 1}. [${item.tag}] ${mark}\n`;
                detailedReport += `   Context: ${item.question}\n`;
                if (item.userResult !== "Correct") {
                    detailedReport += `   Correct Answer: ${item.correctAnswer}\n`;
                }
                detailedReport += `\n`;
            });

            const params = {
                message: detailedReport,
                score: `${score} / ${quizData.length}`,
                to_name: "Teacher/User",
            };

            emailjs.send(EMAIL_CONFIG.serviceID, EMAIL_CONFIG.templateID, params)
                .then(function(response) {
                    statusDiv.innerHTML = '<span class="text-green-600 font-bold"><i class="fa-solid fa-check-circle mr-2"></i> 今日学习报告已成功发送至邮箱！</span>';
                }, function(error) {
                    console.error('Email Failed:', error);
                    statusDiv.innerHTML = '<span class="text-red-600"><i class="fa-solid fa-circle-exclamation mr-2"></i> 报告发送失败</span>';
                    retryBtn.classList.remove('hidden');
                });
        };

        // 启动时连接数据库
        initFirebaseAndSync();
    </script>
</body>
</html>
