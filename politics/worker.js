// worker.js
var worker_default = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // 智能兼容不同的数据库绑定名称
    const db = env.DB || env["politics-review"];

    if (url.pathname === "/api/memory/get" && request.method === "GET") {
      const userProfile = url.searchParams.get("userProfile");
      if (!userProfile) return new Response("Missing userProfile", { status: 400 });
      if (!db) return new Response(JSON.stringify({ error: "Database binding not found" }), { status: 500 });
      
      try {
        const { results } = await db.prepare(
          "SELECT * FROM ebbinghaus_records WHERE user_profile = ? ORDER BY next_review_time ASC"
        ).bind(userProfile).all();
        const formattedResults = results.map((row) => ({
          id: row.id,
          questionId: row.question_id,
          level: row.level,
          nextReviewTime: row.next_review_time
        }));
        return new Response(JSON.stringify(formattedResults), {
          headers: { "Content-Type": "application/json" }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
      }
    }

    if (url.pathname === "/api/memory/upsert" && request.method === "POST") {
      if (!db) return new Response(JSON.stringify({ error: "Database binding not found" }), { status: 500 });
      try {
        const data = await request.json();
        const { userProfile, questionId, level, nextReviewTime } = data;
        const id = userProfile + "_" + questionId;
        const now = Date.now();
        await db.prepare(`
          INSERT INTO ebbinghaus_records (id, user_profile, question_id, level, next_review_time, last_updated)
          VALUES (?1, ?2, ?3, ?4, ?5, ?6)
          ON CONFLICT(id) DO UPDATE SET 
          level = excluded.level, 
          next_review_time = excluded.next_review_time, 
          last_updated = excluded.last_updated
        `).bind(id, userProfile, questionId, level, nextReviewTime, now).run();
        return new Response(JSON.stringify({ success: true }), {
          headers: { "Content-Type": "application/json" }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
      }
    }

    if (url.pathname === "/api/memory/clear" && request.method === "POST") {
      if (!db) return new Response(JSON.stringify({ error: "Database binding not found" }), { status: 500 });
      try {
        const data = await request.json();
        const { userProfile } = data;
        await db.prepare("DELETE FROM ebbinghaus_records WHERE user_profile = ?").bind(userProfile).run();
        return new Response(JSON.stringify({ success: true }), {
          headers: { "Content-Type": "application/json" }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
      }
    }

    return new Response(HTML_CONTENT, {
      headers: { "Content-Type": "text/html;charset=UTF-8" }
    });
  }
};

var HTML_CONTENT = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>高考政治特训 - 艾宾浩斯记忆系统</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <!-- 引入 EmailJS SDK -->
    <script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js"></script>
    <style>
        body { font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6; }
        .tab-active { border-bottom: 2px solid #2563eb; color: #2563eb; font-weight: 600; }
        .tab-inactive { color: #6b7280; }
        .tab-inactive:hover { color: #374151; }
        .fade-in { animation: fadeIn 0.3s ease-in-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        
        /* Quiz specific styles */
        .option-card { transition: all 0.2s; border: 2px solid transparent; }
        .option-card:hover { border-color: #bfdbfe; background-color: #eff6ff; }
        .option-selected-correct { border-color: #10b981; background-color: #ecfdf5; }
        .option-selected-wrong { border-color: #ef4444; background-color: #fef2f2; }
        
        .spinner { border: 3px solid #f3f3f3; border-radius: 50%; border-top: 3px solid #3498db; width: 20px; height: 20px; animation: spin 2s linear infinite; display: inline-block; vertical-align: middle; margin-right: 8px;}
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        
        /* Card styles */
        .history-card { 
            background: linear-gradient(135deg, #1e3a5f 0%, #2d3748 100%);
            color: white;
            border-radius: 12px;
            padding: 1.5rem;
            margin-bottom: 1rem;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .history-tag { 
            background: rgba(255,255,255,0.2);
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.75rem;
            display: inline-block;
            margin-bottom: 0.5rem;
        }
        
        /* Table styles */
        .db-table th { background-color: #f8fafc; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.05em; color: #64748b; }
        .db-table td { font-size: 0.875rem; color: #334155; }
        
        /* Content styles */
        .content-box { white-space: pre-wrap; line-height: 1.8; }
        .key-point { background: #fef3c7; padding: 2px 6px; border-radius: 4px; color: #92400e; font-weight: 600; }
        .error-point { background: #fee2e2; padding: 2px 6px; border-radius: 4px; color: #991b1b; }

        /* 发送邮件时的加载动画 */
        .loading-overlay {
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.8); color: white;
            display: none; justify-content: center; align-items: center; flex-direction: column; z-index: 1000;
        }
        .spinner-large {
            width: 40px; height: 40px; border: 4px solid #fff;
            border-top: 4px solid transparent; border-radius: 50%;
            animation: spin 1s linear infinite; margin-bottom: 1rem;
        }
    </style>
</head>
<body class="h-screen flex flex-col overflow-hidden">

    <!-- Header -->
    <header class="bg-white shadow-sm z-10">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-16 items-center">
                <div class="flex items-center">
                    <i class="fa-solid fa-scroll text-amber-600 text-2xl mr-3"></i>
                    <h1 class="text-xl font-bold text-gray-900 hidden sm:block">高考政治特训 <span class="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-1 rounded-full ml-2 border">v1.0.4</span></h1>
                </div>
                <div class="flex space-x-2 sm:space-x-8 overflow-x-auto hide-scrollbar">
                    <button onclick="window.switchTab('home')" id="tab-home" class="tab-active whitespace-nowrap px-3 py-2 text-sm font-medium transition-colors flex items-center">
                        <i class="fa-solid fa-house mr-1"></i> 首页
                    </button>
                    <button onclick="window.switchTab('review')" id="tab-review" class="tab-inactive whitespace-nowrap px-3 py-2 text-sm font-medium transition-colors flex items-center">
                        <i class="fa-solid fa-brain mr-2"></i> 挑战复习
                    </button>
                </div>
            </div>
        </div>
    </header>

    <!-- Main Content Area -->
    <main class="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div class="max-w-4xl mx-auto h-full">
            
            <!-- Home: Question List -->
            <div id="view-home" class="fade-in space-y-6">
                <div class="bg-white rounded-lg shadow p-6 border-l-4 border-amber-500">
                    <h2 class="text-lg font-bold text-gray-900 mb-2"><i class="fa-solid fa-graduation-cap mr-2 text-amber-600"></i>高考政治 · 艾宾浩斯记忆特训</h2>
                    <p class="text-gray-600 text-sm mb-4">
                        本系统收录 <span class="font-bold text-amber-600" id="header-total-count">0</span> 道高考政治真题核心知识点，采用艾宾浩斯遗忘曲线算法，
                        自动安排复习计划，帮助你高效掌握政治知识。
                    </p>
                    <div class="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                        <span><i class="fa-solid fa-database mr-1"></i> Cloudflare D1 云端同步</span>
                        <span><i class="fa-solid fa-clock mr-1"></i> 智能复习提醒</span>
                        <span><i class="fa-solid fa-envelope mr-1"></i> 自动复习报告</span>
                    </div>
                    
                    <!-- 新增的邮箱测试按钮区 -->
                    <div class="pt-4 border-t border-gray-100 flex items-center">
                        <button onclick="window.testEmailConfig()" class="text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 py-1.5 px-3 rounded border border-blue-200 transition inline-flex items-center">
                            <i class="fa-solid fa-paper-plane mr-1.5"></i> 邮箱发送测试
                        </button>
                        <span class="text-xs text-gray-400 ml-3">如果没收到答题邮件，请点击这里测试配置</span>
                    </div>
                </div>

                <div class="bg-white rounded-lg shadow overflow-hidden">
                    <div class="bg-gray-100 px-6 py-3 border-b flex justify-between items-center">
                        <h3 class="font-bold text-gray-800">题目库概览 <span class="text-xs font-normal text-gray-500 ml-2">(点击展开查看答案)</span></h3>
                        <span class="text-sm text-gray-500">共 <span id="list-total-count">0</span> 题</span>
                    </div>
                    <div class="p-4 space-y-4 max-h-[60vh] overflow-y-auto" id="question-list">
                        <!-- Questions will be injected here -->
                    </div>
                </div>
            </div>

            <!-- Review Mode: Quiz -->
            <div id="view-review" class="hidden fade-in h-full flex flex-col items-center justify-center pt-2 sm:pt-8">
                
                <!-- Start Screen -->
                <div id="quiz-start" class="text-center max-w-lg w-full px-4">
                    <div class="bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-gray-200">
                        <div class="bg-amber-100 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                            <i class="fa-solid fa-scroll text-amber-600 text-3xl sm:text-4xl"></i>
                        </div>
                        <h2 class="text-xl sm:text-2xl font-bold text-gray-900 mb-2">政治知识突击检查</h2>
                        <p class="text-gray-600 mb-2 text-sm sm:text-base">系统题库共收录 <span class="font-bold text-amber-600" id="total-questions-count">0</span> 个知识点。</p>
                        
                        <div id="ebbinghaus-status" class="mb-4 sm:mb-6">
                            <div class="inline-block bg-purple-50 text-purple-700 px-3 py-2 rounded-lg font-bold text-xs sm:text-sm shadow-sm border border-purple-100">
                                <i class="fa-solid fa-hourglass-half mr-1"></i> <span id="sync-status">正在连接 Cloudflare D1...</span>
                            </div>
                        </div>

                        <!-- User Selection -->
                        <div class="mb-4 text-left bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-100">
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                <i class="fa-solid fa-users mr-1 text-gray-500"></i> 选择学习账号 (独立记忆池):
                            </label>
                            <select id="user-profile" onchange="window.changeProfile()" class="block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm p-2 border bg-white font-medium text-gray-700">
                                <option value="user1">👤 User 1 (账号一)</option>
                                <option value="user2">👤 User 2 (账号二)</option>
                                <option value="user3">👤 User 3 (账号三)</option>
                                <option value="user4">👤 User 4 (账号四)</option>
                            </select>
                        </div>
                        
                        <!-- Daily Limit Setting -->
                        <div class="mb-6 text-left bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-100">
                            <label for="daily-limit" class="block text-sm font-medium text-gray-700 mb-2">
                                <i class="fa-solid fa-calendar-day mr-1 text-gray-500"></i> 今日目标题数:
                            </label>
                            <div class="flex items-center space-x-3">
                                <select id="daily-limit" class="block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm p-2 border bg-white font-medium text-gray-700">
                                    <option value="5">5 题</option>
                                    <option value="10" selected>10 题</option>
                                    <option value="20">20 题</option>
                                    <option value="999">全部错题</option>
                                </select>
                            </div>
                        </div>

                        <button id="btn-start" onclick="window.prepareQuiz()" class="w-full bg-amber-600 text-white py-3 px-6 rounded-lg font-bold hover:bg-amber-700 transition shadow-md hover:shadow-lg transform hover:-translate-y-1 disabled:opacity-50">
                            开始今日复习
                        </button>
                        
                        <button onclick="window.showMemoryDashboard()" class="w-full mt-3 bg-white text-purple-600 border border-purple-200 py-3 px-6 rounded-lg font-bold hover:bg-purple-50 transition shadow-sm">
                            <i class="fa-solid fa-database mr-1"></i> 查看当前账号 SQL 记忆库
                        </button>
                    </div>
                </div>

                <!-- Pre-Review Screen -->
                <div id="quiz-pre-review" class="hidden w-full max-w-2xl px-4">
                    <div class="bg-white rounded-xl shadow-xl border-t-4 border-yellow-400 overflow-hidden flex flex-col max-h-[85vh]">
                        <div class="p-4 bg-yellow-50 border-b border-yellow-100 flex items-center justify-between sticky top-0">
                            <h3 class="text-lg font-bold text-yellow-800"><i class="fa-solid fa-bolt mr-2"></i> 记忆突击: 提前复习</h3>
                            <span class="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full font-bold">艾宾浩斯算法拦截</span>
                        </div>
                        <div class="p-6 overflow-y-auto flex-1">
                            <p class="text-gray-600 mb-4 text-sm font-medium">系统检测到以下 <span id="pre-review-count" class="text-red-500 font-bold"></span> 个知识点已达到遗忘临界点。请在正式挑战前进行复习：</p>
                            <div id="pre-review-list" class="space-y-4"></div>
                        </div>
                        <div class="p-4 bg-gray-50 border-t border-gray-100 mt-auto">
                            <button onclick="window.enterQuizContext()" class="w-full bg-yellow-500 text-white py-3 px-6 rounded-lg font-bold hover:bg-yellow-600 transition shadow-md flex justify-center items-center">
                                我已复习完毕，开始挑战 <i class="fa-solid fa-arrow-right ml-2"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Quiz Card -->
                <div id="quiz-container" class="hidden w-full max-w-2xl px-4">
                    <div class="flex justify-between items-center mb-4">
                        <span class="text-sm font-medium text-gray-500">进度: <span id="current-q">1</span>/<span id="total-q">10</span></span>
                        <div class="h-2 w-48 bg-gray-200 rounded-full">
                            <div id="progress-bar" class="h-2 bg-amber-500 rounded-full transition-all duration-300" style="width: 0%"></div>
                        </div>
                    </div>

                    <div class="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden relative min-h-[400px] flex flex-col">
                        <div class="p-5 sm:p-8 flex-1">
                            <div class="mb-4 flex flex-wrap items-center gap-2">
                                <span id="q-year" class="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-gray-100 text-gray-600"></span>
                                <span id="q-tag" class="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-amber-100 text-amber-700"></span>
                                <span id="ebbinghaus-badge" class="hidden inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-purple-100 text-purple-600 shadow-sm border border-purple-200">
                                    <i class="fa-solid fa-brain mr-1"></i> 艾宾浩斯复习题
                                </span>
                            </div>

                            <h3 class="text-lg sm:text-xl text-gray-800 mb-4 font-bold" id="q-title"></h3>
                            <p class="text-gray-600 mb-4 text-sm italic bg-gray-50 p-3 rounded" id="q-question"></p>
                            
                            <div class="mb-6">
                                <p class="text-sm text-gray-500 mb-2">请选择正确的核心知识点：</p>
                                <div id="options-container" class="space-y-3"></div>
                            </div>
                        </div>

                        <!-- Feedback Area -->
                        <div id="feedback-area" class="hidden bg-gray-50 p-5 sm:p-6 border-t border-gray-100">
                            <div class="flex items-start">
                                <div id="feedback-icon" class="flex-shrink-0 mr-3 mt-1"></div>
                                <div class="flex-1">
                                    <h4 id="feedback-title" class="font-bold text-base sm:text-lg mb-1"></h4>
                                    <div id="feedback-content" class="text-gray-600 text-sm space-y-2">
                                        <p><strong class="text-amber-700">核心要点：</strong><span id="feedback-keypoint"></span></p>
                                        <p><strong class="text-red-700">常见错误：</strong><span id="feedback-error"></span></p>
                                        <p><strong class="text-blue-700">详细解析：</strong><span id="feedback-explanation"></span></p>
                                    </div>
                                    <button onclick="window.nextQuestion()" class="mt-4 bg-gray-900 text-white px-5 py-2 rounded text-sm font-medium hover:bg-gray-800 transition">
                                        下一题 <i class="fa-solid fa-arrow-right ml-1"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Results Screen -->
                <div id="quiz-results" class="hidden text-center max-w-lg w-full px-4">
                    <div class="bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-gray-200">
                        <div id="score-icon" class="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 bg-green-100 text-green-600">
                            <i class="fa-solid fa-trophy text-4xl"></i>
                        </div>
                        <h2 class="text-2xl font-bold text-gray-900 mb-2">复习完成!</h2>
                        <p class="text-gray-600 mb-6">今日得分: <span id="final-score" class="text-3xl font-bold text-amber-600"></span></p>
                        
                        <div class="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 justify-center mb-6">
                            <button onclick="window.switchTab('review'); document.getElementById('quiz-results').classList.add('hidden'); document.getElementById('quiz-start').classList.remove('hidden');" class="bg-amber-100 text-amber-700 py-2 px-6 rounded-lg font-medium hover:bg-amber-200">
                                返回面板
                            </button>
                            <button onclick="window.showMemoryDashboard()" class="bg-purple-100 text-purple-700 py-2 px-6 rounded-lg font-medium hover:bg-purple-200">
                                查看数据库变化
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </main>

    <!-- Database Modal -->
    <div id="memory-modal" class="hidden fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl fade-in overflow-hidden">
            <div class="flex justify-between items-center p-5 bg-gray-900 text-white border-b border-gray-800">
                <h3 class="text-lg font-bold flex items-center">
                    <i class="fa-solid fa-database mr-3 text-purple-400"></i>
                    <span id="memory-modal-title">Cloudflare D1 记忆库 (真实连接)</span>
                </h3>
                <div class="flex items-center space-x-4">
                    <button onclick="window.clearAllMemory()" class="bg-red-500/20 text-red-400 hover:bg-red-500/40 hover:text-red-300 px-3 py-1.5 rounded text-sm font-bold transition flex items-center border border-red-500/30">
                        <i class="fa-solid fa-trash-can mr-1"></i> 全部清除
                    </button>
                    <button onclick="document.getElementById('memory-modal').classList.add('hidden')" class="text-gray-400 hover:text-white transition">
                        <i class="fa-solid fa-xmark text-xl"></i>
                    </button>
                </div>
            </div>
            
            <div class="bg-gray-800 p-3 text-xs font-mono text-green-400 overflow-x-auto">
                <span class="text-gray-500">-- Current Query Executed:</span><br>
                SELECT * FROM <span class="text-yellow-300">ebbinghaus_records</span> WHERE user_profile = '<span class="text-blue-300" id="sql-user-id"></span>' ORDER BY next_review_time ASC;
            </div>

            <div class="overflow-y-auto flex-1 bg-white">
                <table class="min-w-full db-table text-left border-collapse">
                    <thead class="sticky top-0 bg-gray-50 shadow-sm">
                        <tr>
                            <th class="px-4 py-3 border-b">题目信息</th>
                            <th class="px-4 py-3 border-b text-center">状态</th>
                            <th class="px-4 py-3 border-b text-center">掌握等级</th>
                            <th class="px-4 py-3 border-b">下次复习时间</th>
                        </tr>
                    </thead>
                    <tbody id="db-table-body" class="divide-y divide-gray-100">
                        <!-- Rows injected by JS -->
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <!-- 加载中遮罩 (用于发送邮件) -->
    <div id="loading-overlay" class="loading-overlay">
        <div class="spinner-large"></div>
        <p>正在生成学习报告并发送邮件...</p>
        <p style="font-size: 0.8rem; opacity: 0.8;">请勿关闭页面</p>
    </div>

    <!-- 前端逻辑 -->
    <script>
        // 1. 初始化 EmailJS
        const EMAIL_CONFIG = {
            serviceID: "service_j2ak28v",
            templateID: "template_ol3ws9o",
            publicKey: "bGbqCw1wlTrkCwfFo"
        };
        (function() {
            emailjs.init(EMAIL_CONFIG.publicKey);
        })();

        // 将政治题库数据直接内置在前端代码中，避免因环境问题解析出错
        const politicsQuestions = [
          {
            id: 1,
            year: "2025",
            tag: "政治与法治",
            title: "法治与科技的“双向奔赴”",
            question: "背景：某市形成“领军者+小微”格局，硬核科技成为名片。\\n问题：结合材料，运用《政治与法治》知识，说明该市科技创新生态的优化得益于法治与科技的“双向奔赴”。",
            keyPoint: "党的领导（根本保证）+ 科学立法（完善科技法规）+ 严格执法/公正司法（保护知识产权）+ 全民守法（营造创新氛围）+ 科技赋能（大数据提升法治效能）",
            commonError: "主体错误：误将立法权赋予政府（立法是人大职权）。漏点：未答出政治大题起手式“党的领导”。未具体结合知识产权保护。",
            explanation: "政治题“起手式”：党的领导是根本保证。大题结构必备：党 + 立法 + 执法/司法 + 守法 + 材料特色（科技赋能提高法治效能）。"
          },
          {
            id: 2,
            year: "2025",
            tag: "哲学与文化",
            title: "遗产保护中的“实事求是”",
            question: "背景：开封宋韵、苏州一宅一方案、屏南老屋认租。\\n问题：运用《哲学与文化》知识，分析在历史文化遗产保护传承中如何从实际出发、实事求是。",
            keyPoint: "尊重客观规律（立足本地古城老宅实际） + 发挥主观能动性（解放思想探索认租新模式） + 二者结合（保护与民生产业结合，主客观具体的历史统一）",
            commonError: "空洞堆砌原理：只背诵哲学原理，缺乏材料分析。漏点：未答出实事求是的前提是“调查研究”。",
            explanation: "哲学题公式：原理 + 方法论 + 材料（抄材料里的做法作为论据）。实事求是不等于仅尊重规律，必须点明如何发挥能动性探索新模式。"
          },
          {
            id: 3,
            year: "2025",
            tag: "法律与社会",
            title: "劳动权益与企业负担",
            question: "(1) 分析“两年不准结婚”合同的不当之处及维权途径。\\n(2) 评析“给骑手交社保加重企业负担，不利于发展”的观点。",
            keyPoint: "(1) 侵犯婚姻自由、休息权、平等就业权。途径：投诉、仲裁（必经）、起诉。(2) 评析：短期增加成本（合理）；长期微观留住人才，宏观拉动消费（不合理），企业应担社会责任。",
            commonError: "程序错误：劳动纠纷误以为可直接起诉（必须仲裁前置）。评析题单向思维：只答缺点，忽略了“短期加重负担”的合理面。",
            explanation: "劳动纠纷维权程序：投诉 -> 仲裁（必经） -> 诉讼。评析题逻辑框架：肯定合理点（短期成本） + 否定不合理点（长期利好） + 总结正确态度。"
          },
          {
            id: 4,
            year: "2025",
            tag: "逻辑与思维",
            title: "周边外交与超前思维",
            question: "(1) 阐明构建周边命运共同体的原因。\\n(2) 选领域描绘10年后成就，并说明构想方法。",
            keyPoint: "(1) 国家利益（共同利益）、时代主题（和平发展）、外交政策、多极化趋势。(2) 构想方法：矛盾分析法、推理（因果推断）、创新思维（合理联想）。",
            commonError: "第二问漏点：题目问的是“构想方法”，考生未列举具体的思维工具（矛盾分析、推理等），误写为小作文。",
            explanation: "《逻辑与思维》新题型：当题目问“方法”时，必须明确列举思维工具（如矛盾分析、因果推理、创新想象）。超前思维题的核心在方法论落脚。"
          },
          {
            id: 5,
            year: "2024",
            tag: "政治与法治",
            title: "全过程人民民主",
            question: "背景：某社区设立“板凳议事会”，居民直接参与小区改造方案制定。\\n问题：运用《政治与法治》知识，分析“板凳议事会”是如何体现全过程人民民主的。",
            keyPoint: "最广泛（主体广泛）+ 最真实（协商民主落实民意）+ 最管用（提升治理效能）+ 制度载体（依托基层群众自治制度）。",
            commonError: "性质错误：把社区居委会当成“基层政权”（政府）。概念混淆：将协商民主误写为民主选举。",
            explanation: "居委会/村委会 = 基层群众性自治组织 ≠ 基层政权 ≠ 国家机关。“议事会”核心体现的是“协商民主”，即众人的事情由众人商量。"
          },
          {
            id: 6,
            year: "2024",
            tag: "哲学与文化",
            title: "辩证法的“危”与“机”",
            question: "背景：数字技术冲击传统就业，但也催生了新职业。\\n问题：运用《哲学与文化》中矛盾的观点，分析如何看待数字技术带来的就业变局。",
            keyPoint: "矛盾即对立统一（危与机并存） + 矛盾双方在一定条件下相互转化（促使就业难向就业新转化） + 两点论与重点论统一。",
            commonError: "深度不足：仅仅泛泛而谈“一分为二”。缺方法论：未提及“创造条件，促使危转机”。",
            explanation: "遇到“双刃剑”或“危机”问题，必答核心点：对立统一 + 矛盾转化。必须强调发挥主观能动性、通过技能培训等手段创造条件，促使转化。"
          }
        ];

        let userRecords = []; 
        let currentProfile = 'user1';
        let currentQuestionIndex = 0;
        let score = 0;
        let quizData = [];
        let isAnswered = false;
        let sessionLogs = []; // 用于记录本次答题历史以便发送邮件

        // 艾宾浩斯遗忘曲线间隔 (毫秒)
        const EBBINGHAUS_INTERVALS = [
            0, 
            5 * 60 * 1000,           // Lv.1: 5分钟
            30 * 60 * 1000,          // Lv.2: 30分钟
            12 * 60 * 60 * 1000,     // Lv.3: 12小时
            24 * 60 * 60 * 1000,     // Lv.4: 1天
            2 * 24 * 60 * 60 * 1000, // Lv.5: 2天
            4 * 24 * 60 * 60 * 1000, // Lv.6: 4天
            7 * 24 * 60 * 60 * 1000, // Lv.7: 7天
            15 * 24 * 60 * 60 * 1000,// Lv.8: 15天
            30 * 24 * 60 * 60 * 1000 // Lv.9: 30天 (Mastered)
        ];

        // 将全局数据赋给错题库
        const mistakeDatabase = politicsQuestions;

        // 设置前端界面的题目总数
        document.getElementById('total-questions-count').innerText = mistakeDatabase.length;
        document.getElementById('header-total-count').innerText = mistakeDatabase.length;
        document.getElementById('list-total-count').innerText = mistakeDatabase.length;

        // 初始化环境与数据库连接
        async function initApp() {
            await fetchMemoryRecords();
            renderQuestionList();
        }

        // 测试邮件发送配置功能
        window.testEmailConfig = function() {
            document.getElementById('loading-overlay').style.display = 'flex';
            
            const templateParams = {
                message: "【系统测试】这是一封来自高考政治特训系统的测试邮件。\\n如果您收到此邮件，说明您的 EmailJS 配置完全正常！\\n\\n发送时间：" + new Date().toLocaleString()
            };

            emailjs.send(EMAIL_CONFIG.serviceID, EMAIL_CONFIG.templateID, templateParams)
                .then(function(response) {
                    document.getElementById('loading-overlay').style.display = 'none';
                    console.log("Test Email Send Success:", response.status);
                    alert("✅ 测试邮件发送成功！\\n请前往您的邮箱检查是否收到邮件。\\n(状态码: " + response.status + ")");
                }, function(error) {
                    document.getElementById('loading-overlay').style.display = 'none';
                    console.error("Test Email Failed:", error);
                    alert("❌ 测试邮件发送失败！\\n请检查您的 Service ID, Template ID 和 Public Key 是否正确。\\n错误详细信息请按 F12 查看浏览器控制台。");
                });
        };

        // 控制题目详情展开/折叠
        window.toggleDetails = function(id) {
            const detailsDiv = document.getElementById('details-' + id);
            const icon = document.getElementById('icon-' + id);
            const preview = document.getElementById('preview-' + id);
            
            if (detailsDiv.classList.contains('hidden')) {
                detailsDiv.classList.remove('hidden');
                detailsDiv.classList.add('fade-in');
                icon.classList.add('rotate-180');
                preview.classList.remove('line-clamp-2'); // 展开完整题目
            } else {
                detailsDiv.classList.add('hidden');
                detailsDiv.classList.remove('fade-in');
                icon.classList.remove('rotate-180');
                preview.classList.add('line-clamp-2'); // 恢复两行截断
            }
        };

        // 渲染题库列表 (包含点击展开功能)
        function renderQuestionList() {
            const container = document.getElementById('question-list');
            let html = '';
            mistakeDatabase.forEach(q => {
                html += \`
                    <div class="border border-gray-100 pb-2 mb-3 cursor-pointer hover:bg-gray-50 transition-colors p-3 rounded-lg shadow-sm bg-white" onclick="window.toggleDetails(\${q.id})">
                        <div class="flex items-start justify-between mb-2">
                            <div>
                                <span class="inline-block bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded mr-2">\${q.year}</span>
                                <span class="inline-block bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">\${q.tag}</span>
                            </div>
                            <span class="text-xs text-gray-400 flex items-center">#\${q.id} <i class="fa-solid fa-chevron-down ml-2 text-gray-400 transition-transform duration-300" id="icon-\${q.id}"></i></span>
                        </div>
                        <h4 class="font-medium text-gray-800 mb-1">\${q.title}</h4>
                        <p class="text-sm text-gray-500 line-clamp-2" id="preview-\${q.id}">\${q.question.replace(/\\\\n/g, '<br>')}</p>
                        
                        <!-- 隐藏的答案详情区 -->
                        <div id="details-\${q.id}" class="hidden mt-4 space-y-3 bg-indigo-50 p-4 rounded-lg border border-indigo-100 cursor-default" onclick="event.stopPropagation()">
                            <div>
                                <strong class="text-amber-700 text-sm block mb-1"><i class="fa-solid fa-key mr-1"></i>核心要点：</strong>
                                <p class="text-sm text-gray-700 leading-relaxed">\${q.keyPoint}</p>
                            </div>
                            <div class="border-t border-indigo-200/60 pt-2">
                                <strong class="text-red-700 text-sm block mb-1"><i class="fa-solid fa-triangle-exclamation mr-1"></i>常见错误：</strong>
                                <p class="text-sm text-gray-700 leading-relaxed">\${q.commonError}</p>
                            </div>
                            <div class="border-t border-indigo-200/60 pt-2">
                                <strong class="text-blue-700 text-sm block mb-1"><i class="fa-solid fa-lightbulb mr-1"></i>详细解析：</strong>
                                <p class="text-sm text-gray-700 leading-relaxed">\${q.explanation}</p>
                            </div>
                        </div>
                    </div>
                \`;
            });
            container.innerHTML = html;
        }

        // 调用 Cloudflare API: 拉取记忆记录
        async function fetchMemoryRecords() {
            try {
                // 判断当前是否是本地打开，如果是本地环境给出友好提示
                if (window.location.protocol === 'file:') {
                     document.getElementById('sync-status').innerHTML = '<span class="text-amber-500"><i class="fa-solid fa-triangle-exclamation"></i> 本地预览模式 (无数据库) - 请部署到 Cloudflare Worker 以开启记忆功能</span>';
                     return;
                }

                const response = await fetch('/api/memory/get?userProfile=' + currentProfile);
                if (!response.ok) throw new Error('API Request Failed');
                userRecords = await response.json();
                updateSyncUI();
            } catch(e) {
                console.error("Fetch Data Error", e);
                document.getElementById('sync-status').innerHTML = '<span class="text-red-500"><i class="fa-solid fa-xmark"></i> 连接后端 API 失败 (请确保通过 Worker 域名访问)</span>';
            }
        }

        function updateSyncUI() {
            const now = Date.now();
            const dueCount = userRecords.filter(r => r.nextReviewTime <= now).length;
            const syncUI = document.getElementById('sync-status');
            syncUI.innerHTML = '<span class="text-green-600"><i class="fa-solid fa-cloud-arrow-down"></i> D1 Sync OK (' + currentProfile.toUpperCase() + ') | <b class="text-purple-700">' + dueCount + '</b> 题待复习</span>';
            document.getElementById('sql-user-id').innerText = currentProfile;
        }

        // 调用 Cloudflare API: 触发算法更新数据库
        async function updateMemoryRecord(questionId, isCorrect) {
            try {
                const existingIndex = userRecords.findIndex(r => r.questionId === questionId);
                const existing = existingIndex !== -1 ? userRecords[existingIndex] : null;
                const now = Date.now();
                let newData;

                if (!existing) {
                    if (!isCorrect) {
                        newData = { questionId: questionId, level: 1, nextReviewTime: now + EBBINGHAUS_INTERVALS[1] };
                    }
                } else {
                    if (isCorrect) {
                        const nextLevel = Math.min(existing.level + 1, EBBINGHAUS_INTERVALS.length - 1);
                        newData = { questionId: questionId, level: nextLevel, nextReviewTime: now + EBBINGHAUS_INTERVALS[nextLevel] };
                    } else {
                        newData = { questionId: questionId, level: 1, nextReviewTime: now + EBBINGHAUS_INTERVALS[1] };
                    }
                }

                if (newData) {
                    // 更新本地内存
                    if (existingIndex !== -1) {
                        userRecords[existingIndex] = newData;
                    } else {
                        userRecords.push(newData);
                    }
                    
                    if (window.location.protocol === 'file:') return; // 本地模式不发请求

                    // 发送 POST 到同源 Cloudflare API
                    await fetch('/api/memory/upsert', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            userProfile: currentProfile,
                            questionId: newData.questionId,
                            level: newData.level,
                            nextReviewTime: newData.nextReviewTime
                        })
                    });
                }
            } catch(e) {
                console.error("Update DB Failed", e);
            }
        }

        // 生成干扰选项
        function generateDistractors(correctAnswer, questionId) {
            // 从其他题目的 keyPoint 中选取作为干扰项
            const otherQuestions = mistakeDatabase.filter(q => q.id !== questionId);
            const distractors = [];
            
            // 随机选取2个干扰项
            const indices = [];
            while (indices.length < 2 && indices.length < otherQuestions.length) {
                const r = Math.floor(Math.random() * otherQuestions.length);
                if (!indices.includes(r)) indices.push(r);
            }
            
            indices.forEach(i => {
                // 截取前50个字符作为干扰项
                let text = otherQuestions[i].keyPoint.substring(0, 50);
                if (otherQuestions[i].keyPoint.length > 50) text += '...';
                distractors.push(text);
            });
            
            return distractors;
        }

        window.changeProfile = async function() {
            const profileSelect = document.getElementById('user-profile');
            currentProfile = profileSelect.value;
            
            if (window.location.protocol !== 'file:') {
                document.getElementById('sync-status').innerHTML = '<span class="text-purple-600"><i class="fa-solid fa-spinner fa-spin"></i> 拉取 ' + currentProfile + ' 数据...</span>';
            }
            
            await fetchMemoryRecords();
        };

        window.switchTab = function(tabName) {
            ['view-home', 'view-review'].forEach(id => {
                document.getElementById(id).classList.add('hidden');
            });
            ['tab-home', 'tab-review'].forEach(id => {
                document.getElementById(id).className = "tab-inactive whitespace-nowrap px-3 py-2 text-sm font-medium transition-colors flex items-center cursor-pointer";
            });
            document.getElementById('view-' + tabName).classList.remove('hidden');
            document.getElementById('tab-' + tabName).className = "tab-active whitespace-nowrap px-3 py-2 text-sm font-medium transition-colors flex items-center cursor-pointer";
        };

        window.clearAllMemory = async function() {
            if (!confirm('确定要清除账号 ' + currentProfile + ' 的所有学习记忆数据吗？此操作不可恢复！')) return;
            
            if (window.location.protocol === 'file:') {
                userRecords = [];
                window.showMemoryDashboard();
                alert('本地虚拟数据已清除！');
                return;
            }

            try {
                const response = await fetch('/api/memory/clear', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userProfile: currentProfile })
                });
                
                if (!response.ok) throw new Error('Clear Failed');
                
                userRecords = [];
                updateSyncUI();
                window.showMemoryDashboard();
                alert('数据已全部清除！');
            } catch(e) {
                console.error(e);
                alert('清除失败，请检查网络或后端配置。');
            }
        };

        function shuffleArray(array) {
            let arr = [...array];
            for (let i = arr.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [arr[i], arr[j]] = [arr[j], arr[i]];
            }
            return arr;
        }

        window.prepareQuiz = function() {
            const limitVal = parseInt(document.getElementById('daily-limit').value) || 10;
            const now = Date.now();
            const dueQuestionIds = userRecords.filter(r => r.nextReviewTime <= now).map(r => r.questionId);
            
            let dueQuestions = mistakeDatabase.filter(q => dueQuestionIds.includes(q.id));
            let newQuestions = mistakeDatabase.filter(q => !dueQuestionIds.includes(q.id));
            
            dueQuestions = shuffleArray(dueQuestions);
            newQuestions = shuffleArray(newQuestions);

            quizData = [...dueQuestions, ...newQuestions].slice(0, Math.min(limitVal, mistakeDatabase.length));
            
            document.getElementById('quiz-start').classList.add('hidden');
            document.getElementById('quiz-results').classList.add('hidden');
            sessionLogs = []; // 重置日志
            
            if (dueQuestions.length > 0) {
                showPreReviewScreen(dueQuestions);
            } else {
                window.enterQuizContext();
            }
        };

        function showPreReviewScreen(dueList) {
            const listContainer = document.getElementById('pre-review-list');
            document.getElementById('pre-review-count').innerText = dueList.length;
            listContainer.innerHTML = '';

            dueList.forEach(q => {
                const dbRecord = userRecords.find(r => r.questionId === q.id);
                const lvl = dbRecord ? dbRecord.level : 1;
                listContainer.innerHTML += 
                    '<div class="bg-white p-4 rounded-lg border border-yellow-200 shadow-sm relative overflow-hidden">' +
                        '<div class="absolute right-0 top-0 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-bl-lg font-bold">' +
                            'Lv.' + lvl +
                        '</div>' +
                        '<div class="flex items-center gap-2 mb-2">' +
                            '<span class="bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded">' + q.year + '</span>' +
                            '<span class="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">' + q.tag + '</span>' +
                        '</div>' +
                        '<h4 class="font-bold text-gray-800 mb-2">' + q.title + '</h4>' +
                        '<p class="text-sm text-gray-600 mb-2">' + q.question.replace(/\\n/g, '<br>') + '</p>' +
                        '<div class="bg-amber-50 p-2 rounded text-sm">' +
                            '<strong class="text-amber-700">核心要点：</strong>' + q.keyPoint +
                        '</div>' +
                    '</div>';
            });
            document.getElementById('quiz-pre-review').classList.remove('hidden');
        }

        window.enterQuizContext = function() {
            document.getElementById('quiz-pre-review').classList.add('hidden');
            document.getElementById('quiz-container').classList.remove('hidden');
            
            currentQuestionIndex = 0;
            score = 0;
            document.getElementById('total-q').innerText = quizData.length;
            loadQuestion();
        };

        function loadQuestion() {
            isAnswered = false;
            const q = quizData[currentQuestionIndex];
            
            const isReviewQuestion = userRecords.some(r => r.questionId === q.id && r.nextReviewTime <= Date.now());
            document.getElementById('ebbinghaus-badge').style.display = isReviewQuestion ? 'inline-flex' : 'none';

            document.getElementById('current-q').innerText = currentQuestionIndex + 1;
            document.getElementById('progress-bar').style.width = (((currentQuestionIndex) / quizData.length) * 100) + '%';
            
            document.getElementById('q-year').innerText = q.year + ' 高考题';
            document.getElementById('q-tag').innerText = q.tag;
            document.getElementById('q-title').innerText = q.title;
            document.getElementById('q-question').innerHTML = q.question.replace(/\\n/g, '<br>');
            document.getElementById('feedback-area').classList.add('hidden');

            const optionsDiv = document.getElementById('options-container');
            optionsDiv.innerHTML = '';

            // 生成选项
            let options = [
                { text: q.keyPoint, isCorrect: true },
                ...generateDistractors(q.keyPoint, q.id).map(d => ({ text: d, isCorrect: false }))
            ];
            options = shuffleArray(options);

            options.forEach((opt) => {
                const btn = document.createElement('div');
                btn.className = "option-card w-full p-3 sm:p-4 rounded-lg border border-gray-200 cursor-pointer flex items-center bg-white";
                btn.innerHTML = '<div class="w-5 h-5 rounded-full border-2 border-gray-300 mr-3 flex items-center justify-center dot-indicator shrink-0"></div><span class="font-medium text-gray-700 text-sm">' + opt.text + '</span>';
                btn.onclick = () => window.checkAnswer(opt, btn, q);
                optionsDiv.appendChild(btn);
            });
        }

        window.checkAnswer = async function(selectedOption, btnElement, questionData) {
            if (isAnswered) return;
            
            // 记录日志到 sessionLogs 用于发送邮件
            sessionLogs.push({
                title: questionData.title,
                year: questionData.year,
                status: selectedOption.isCorrect ? "✅ 正确" : "❌ 错误",
                userAnswer: selectedOption.text,
                correctAnswer: questionData.keyPoint
            });

            isAnswered = true;

            const allBtns = document.getElementById('options-container').children;

            if (selectedOption.isCorrect) {
                score++;
                btnElement.classList.add('option-selected-correct');
                btnElement.querySelector('.dot-indicator').innerHTML = '<i class="fa-solid fa-check text-green-500 text-xs"></i>';
                btnElement.querySelector('.dot-indicator').classList.add('border-green-500');
                showFeedback(true, questionData);
            } else {
                btnElement.classList.add('option-selected-wrong');
                btnElement.querySelector('.dot-indicator').innerHTML = '<i class="fa-solid fa-xmark text-red-500 text-xs"></i>';
                btnElement.querySelector('.dot-indicator').classList.add('border-red-500');
                
                Array.from(allBtns).forEach(b => {
                    if (b.innerText.includes(questionData.keyPoint.substring(0, 30))) {
                        b.classList.add('option-selected-correct');
                    }
                });
                showFeedback(false, questionData);
            }

            await updateMemoryRecord(questionData.id, selectedOption.isCorrect);
            updateSyncUI();
        };

        function showFeedback(isCorrect, data) {
            const fbArea = document.getElementById('feedback-area');
            const fbIcon = document.getElementById('feedback-icon');
            const fbTitle = document.getElementById('feedback-title');
            
            document.getElementById('feedback-keypoint').innerText = data.keyPoint;
            document.getElementById('feedback-error').innerText = data.commonError;
            document.getElementById('feedback-explanation').innerText = data.explanation;

            fbArea.classList.remove('hidden');
            fbArea.classList.add('fade-in');

            if (isCorrect) {
                fbIcon.innerHTML = '<div class="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center"><i class="fa-solid fa-check text-green-600"></i></div>';
                fbTitle.innerText = "正确! 算法已调高该题掌握层级";
                fbTitle.className = "font-bold text-base sm:text-lg mb-1 text-green-700";
            } else {
                fbIcon.innerHTML = '<div class="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center"><i class="fa-solid fa-xmark text-red-600"></i></div>';
                fbTitle.innerText = "答错了! 遗忘曲线已重置为Lv.1";
                fbTitle.className = "font-bold text-base sm:text-lg mb-1 text-red-700";
            }
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
            document.getElementById('final-score').innerText = score + ' / ' + quizData.length;

            // 答题结束，触发自动发送邮件
            if (sessionLogs.length > 0) {
                sendEmailReport();
            }
        }

        // 发送邮件报告的逻辑
        function sendEmailReport() {
            document.getElementById('loading-overlay').style.display = 'flex';

            // 格式化邮件内容
            let emailBody = "【高考政治特训报告 - " + currentProfile.toUpperCase() + "】\\n\\n";
            emailBody += \`完成时间: \${new Date().toLocaleString()}\\n\`;
            emailBody += \`今日得分: \${score} / \${quizData.length} 题\\n\\n\`;
            emailBody += "----------------------------------------\\n";

            sessionLogs.forEach((log, index) => {
                emailBody += \`题 \${index + 1}: \${log.title} (\${log.year})\\n\`;
                emailBody += \`掌握情况: \${log.status}\\n\`;
                emailBody += \`你的选择: \${log.userAnswer}\\n\`;
                if(log.status.includes("错误")) {
                    emailBody += \`正确答案: \${log.correctAnswer}\\n\`;
                }
                emailBody += "----------------------------------------\\n";
            });

            const templateParams = {
                message: emailBody,
            };

            emailjs.send(EMAIL_CONFIG.serviceID, EMAIL_CONFIG.templateID, templateParams)
                .then(function(response) {
                    document.getElementById('loading-overlay').style.display = 'none';
                    // 仅使用系统自带通知或控制台，不打断结果页的显示
                    console.log("Email Send Success:", response.status);
                    alert("🎉 今日复习完成！\\n系统已将你的答题报告发送至指定邮箱，请注意查收。");
                }, function(error) {
                    document.getElementById('loading-overlay').style.display = 'none';
                    console.log("Email Failed:", error);
                    alert("复习完成，但邮件报告发送失败。请检查网络或 EmailJS 配置。");
                });
        }

        window.showMemoryDashboard = function() {
            const modal = document.getElementById('memory-modal');
            const tbody = document.getElementById('db-table-body');
            
            if (userRecords.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" class="px-4 py-8 text-center text-gray-500">当前账号 (SELECT *) 结果为空。去答题写入数据吧！</td></tr>';
            } else {
                let html = '';
                const sorted = [...userRecords].sort((a,b) => a.nextReviewTime - b.nextReviewTime);
                const now = Date.now();

                sorted.forEach(record => {
                    const q = mistakeDatabase.find(x => x.id === record.questionId);
                    if(!q) return;

                    const dateObj = new Date(record.nextReviewTime);
                    const timeStr = dateObj.getFullYear() + '-' + 
                                    (dateObj.getMonth()+1).toString().padStart(2,'0') + '-' + 
                                    dateObj.getDate().toString().padStart(2,'0') + ' ' + 
                                    dateObj.getHours().toString().padStart(2,'0') + ':' + 
                                    dateObj.getMinutes().toString().padStart(2,'0');
                    
                    const isDue = record.nextReviewTime <= now;
                    const statusHtml = isDue 
                        ? '<span class="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">DUE (待复习)</span>' 
                        : '<span class="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">RETAINED</span>';

                    const timeClass = isDue ? 'text-red-500 font-bold' : 'text-gray-500';

                    html += 
                    '<tr class="hover:bg-gray-50 transition">' +
                        '<td class="px-4 py-3 border-b max-w-xs truncate">' +
                            '<span class="font-bold text-gray-700">[' + q.year + ']</span> ' + q.title + '<br>' +
                            '<span class="text-xs text-gray-400 font-mono">' + q.tag + '</span>' +
                        '</td>' +
                        '<td class="px-4 py-3 border-b text-center">' + statusHtml + '</td>' +
                        '<td class="px-4 py-3 border-b text-center">' +
                            '<div class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-bold text-sm">' +
                                record.level +
                            '</div>' +
                        '</td>' +
                        '<td class="px-4 py-3 border-b font-mono text-xs ' + timeClass + '">' +
                            timeStr + '<br>' +
                            '<span class="text-[10px] text-gray-400">TIMESTAMP: ' + record.nextReviewTime + '</span>' +
                        '</td>' +
                    '</tr>';
                });
                tbody.innerHTML = html;
            }
            modal.classList.remove('hidden');
        };

        // 启动应用
        initApp();
    </script>
</body>
</html>`;
export {
  worker_default as default
};