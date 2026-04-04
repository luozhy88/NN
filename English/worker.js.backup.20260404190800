/**
 * =========================================================
 * Cloudflare Worker 全栈单文件架构 (Frontend + D1 Backend)
 * 版本号: v1.2.0 (已新增 Learning English Beyond the Classroom 报告及知识点)
 * =========================================================
 * * 部署指南：
 * 1. 在 Cloudflare D1 控制台创建一个名为 `english-review` 的数据库，并执行以下建表语句：
 * * CREATE TABLE IF NOT EXISTS ebbinghaus_records (
 * id TEXT PRIMARY KEY,
 * user_profile TEXT NOT NULL,
 * question_id INTEGER NOT NULL,
 * level INTEGER NOT NULL DEFAULT 1,
 * next_review_time INTEGER NOT NULL,
 * last_updated INTEGER NOT NULL
 * );
 * CREATE INDEX idx_user_review ON ebbinghaus_records(user_profile, next_review_time);
 * * 2. 创建一个 Worker，将此代码粘贴进去。
 * 3. 在 Worker 的 Settings -> Variables -> D1 Database Bindings 中，绑定刚才创建的 `english-review` 数据库，且变量名(Variable name)必须严格填写为 "DB"。
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // ==========================================
    // 后端 API: 获取用户的艾宾浩斯记忆数据
    // ==========================================
    if (url.pathname === '/api/memory/get' && request.method === 'GET') {
      const userProfile = url.searchParams.get('userProfile');
      if (!userProfile) return new Response('Missing userProfile', { status: 400 });

      try {
        // 直接执行 D1 SQL 查询
        const { results } = await env.DB.prepare(
          "SELECT * FROM ebbinghaus_records WHERE user_profile = ? ORDER BY next_review_time ASC"
        ).bind(userProfile).all();

        // 格式化为前端所需的驼峰命名
        const formattedResults = results.map(row => ({
          id: row.id,
          questionId: row.question_id,
          level: row.level,
          nextReviewTime: row.next_review_time
        }));

        return new Response(JSON.stringify(formattedResults), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
      }
    }

    // ==========================================
    // 后端 API: 更新或插入错题记录
    // ==========================================
    if (url.pathname === '/api/memory/upsert' && request.method === 'POST') {
      try {
        const data = await request.json();
        const { userProfile, questionId, level, nextReviewTime } = data;
        const id = userProfile + '_' + questionId;
        const now = Date.now();

        // 执行 SQL: 若存在则更新，若不存在则插入
        await env.DB.prepare(`
          INSERT INTO ebbinghaus_records (id, user_profile, question_id, level, next_review_time, last_updated)
          VALUES (?1, ?2, ?3, ?4, ?5, ?6)
          ON CONFLICT(id) DO UPDATE SET 
          level = excluded.level, 
          next_review_time = excluded.next_review_time, 
          last_updated = excluded.last_updated
        `).bind(id, userProfile, questionId, level, nextReviewTime, now).run();

        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
      }
    }

    // ==========================================
    // 后端 API: 清除指定用户的所有记忆数据
    // ==========================================
    if (url.pathname === '/api/memory/clear' && request.method === 'POST') {
      try {
        const data = await request.json();
        const { userProfile } = data;
        
        await env.DB.prepare("DELETE FROM ebbinghaus_records WHERE user_profile = ?").bind(userProfile).run();

        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
      }
    }

    // ==========================================
    // 前端路由: 返回完整的 HTML SPA 页面
    // ==========================================
    return new Response(HTML_CONTENT, {
      headers: { 'Content-Type': 'text/html;charset=UTF-8' }
    });
  }
};

// ==========================================
// 前端 HTML / CSS / JS 代码字符串
// （已将所有内部逻辑重构为基于同源 Fetch API 的请求）
// ==========================================
const HTML_CONTENT = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>英语作文批改与复习系统 - Ebbinghaus Pro (Cloudflare) v1.3.0</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
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
        
        .spinner { border: 3px solid #f3f3f3; border-radius: 50%; border-top: 3px solid #3498db; width: 20px; height: 20px; -webkit-animation: spin 2s linear infinite; animation: spin 2s linear infinite; display: inline-block; vertical-align: middle; margin-right: 8px;}
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        
        /* Table styles for Dashboard */
        .db-table th { background-color: #f8fafc; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.05em; color: #64748b; }
        .db-table td { font-size: 0.875rem; color: #334155; }
    </style>
</head>
<body class="h-screen flex flex-col overflow-hidden">

    <!-- Header -->
    <header class="bg-white shadow-sm z-10">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-16 items-center">
                <div class="flex items-center">
                    <i class="fa-solid fa-graduation-cap text-blue-600 text-2xl mr-3"></i>
                    <h1 class="text-xl font-bold text-gray-900 hidden sm:block">英语作文批改与复习助手 <span class="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-1 rounded-full ml-2 border">v1.3.0</span></h1>
                </div>
                <div class="flex space-x-2 sm:space-x-8 overflow-x-auto hide-scrollbar">
                    <button onclick="window.goHome()" class="tab-inactive whitespace-nowrap px-3 py-2 text-sm font-medium transition-colors flex items-center hover:text-blue-600">
                        <i class="fa-solid fa-house mr-1"></i> 主页
                    </button>
                    <button onclick="window.switchTab('report1')" id="tab-report1" class="tab-active whitespace-nowrap px-3 py-2 text-sm font-medium transition-colors">
                        AI助力学习报告
                    </button>
                    <button onclick="window.switchTab('report2')" id="tab-report2" class="tab-inactive whitespace-nowrap px-3 py-2 text-sm font-medium transition-colors">
                        读后续写报告
                    </button>
                    <!-- 新增的 Report 3 标签 -->
                    <button onclick="window.switchTab('report3')" id="tab-report3" class="tab-inactive whitespace-nowrap px-3 py-2 text-sm font-medium transition-colors">
                        课外英语学习
                    </button>
                    <button onclick="window.switchTab('review')" id="tab-review" class="tab-inactive whitespace-nowrap px-3 py-2 text-sm font-medium transition-colors flex items-center">
                        <i class="fa-solid fa-clipboard-check mr-2"></i> 错题复习挑战
                    </button>
                </div>
            </div>
        </div>
    </header>

    <!-- Main Content Area -->
    <main class="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div class="max-w-4xl mx-auto h-full">
            
            <!-- Report 1: AI Learning -->
            <div id="view-report1" class="fade-in space-y-6">
                <div class="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
                    <h2 class="text-lg font-bold text-gray-900 mb-4"><i class="fa-solid fa-stethoscope mr-2"></i>原文诊断 (Diagnosis)</h2>
                    <div class="bg-gray-50 p-4 rounded text-sm text-gray-700 essay-content">
                        <span class="font-bold block mb-2">Student Essay (原文标记):</span>
                        I'm LiHua. Our school will hold an activity about AI in learning. I'm glad to share <span class="wrong-text">some my</span> <span class="correct-text">(some of my)</span> opinions with you. Firstly, <span class="wrong-text">with the development of society.</span> <span class="text-gray-500 text-xs">(incomplete)</span> AI can help <span class="wrong-text">our</span> <span class="correct-text">(us)</span> to <span class="wrong-text">better study</span> <span class="correct-text">(study better)</span>. For example, it can translate <span class="wrong-text">a</span> <span class="correct-text">(an)</span> English text so that we can understand the text. <span class="wrong-text">On the other hand</span> <span class="correct-text">(Besides)</span>, it <span class="wrong-text">show</span> <span class="correct-text">(shows)</span> <span class="wrong-text">a kind video</span> <span class="correct-text">(educational videos)</span> to help <span class="wrong-text">our</span> <span class="correct-text">(us)</span> to learn <span class="wrong-text">knowledges</span> <span class="correct-text">(knowledge)</span>. Finally, AI can make a study plan to <span class="wrong-text">suit yourself</span> <span class="correct-text">(suit us)</span>. It can help you <span class="wrong-text">more great</span> <span class="correct-text">(better)</span> to <span class="wrong-text">catch important knowledges</span> <span class="correct-text">(grasp important knowledge)</span>.
                    </div>
                    
                    <div class="bg-red-50 p-4 rounded-lg mt-4">
                        <h3 class="font-bold text-red-700 mb-2">典型错点解析 (Key Errors)</h3>
                        <ul class="list-disc list-inside text-sm text-gray-700 space-y-1">
                            <li><span class="wrong-text">some my</span> → <span class="correct-text">some of my</span> (限定词冲突，需加of)</li>
                            <li><span class="wrong-text">with the development of society.</span> → <span class="correct-text">(合并至主句)</span> (介词短语不能单独成句)</li>
                            <li><span class="wrong-text">better study</span> → <span class="correct-text">study better</span> (副词修饰动词的位置)</li>
                            <li><span class="wrong-text">a kind video</span> → <span class="correct-text">educational videos</span> (词汇搭配与复数)</li>
                            <li><span class="wrong-text">catch important knowledges</span> → <span class="correct-text">grasp important knowledge</span> (动词搭配及不可数名词)</li>
                            <li><span class="wrong-text">more great</span> → <span class="correct-text">better</span> (不规则比较级)</li>
                        </ul>
                    </div>
                </div>

                <div class="bg-white rounded-lg shadow overflow-hidden">
                    <div class="bg-gray-100 px-6 py-3 border-b flex justify-between items-center">
                        <h3 class="font-bold text-gray-800">修改建议</h3>
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
                 <div class="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
                    <h2 class="text-lg font-bold text-gray-900 mb-4"><i class="fa-solid fa-magnifying-glass-chart mr-2"></i>核心错误分析 (Key Errors)</h2>
                    <div class="space-y-4">
                        <div class="bg-red-50 p-4 rounded-lg">
                            <h3 class="font-bold text-red-700 mb-2">语法重灾区</h3>
                            <ul class="list-disc list-inside text-sm text-gray-700 space-y-1">
                                <li>I found some people <span class="wrong-text">stay</span> → <span class="correct-text">staying</span> (分词作宾补)</li>
                                <li>asked <span class="wrong-text">for</span> them → <span class="correct-text">asked them</span> (介词多余)</li>
                                <li>they <span class="wrong-text">heared</span> my topics → <span class="correct-text">heard</span> (不规则动词过去式拼写)</li>
                                <li>hurried up <span class="wrong-text">come</span> → <span class="correct-text">hurried to come / hurried over</span> (双动词冲突)</li>
                                <li>I <span class="wrong-text">with they went</span> → <span class="correct-text">I went with them</span> (中式语序，介词加宾格)</li>
                                <li>those <span class="wrong-text">kindmans</span> → <span class="correct-text">kind people</span> (单词拼写与复数)</li>
                            </ul>
                        </div>
                    </div>
                </div>

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
                        </div>
                        <div id="kindness-advanced" class="hidden essay-content text-gray-800">
                            <h4 class="font-bold mb-2 text-indigo-600">Advanced Version (细节描写与情感升华)</h4>
                            <p class="mb-4">But while I stood frozen, strangers stepped in without hesitation. Before I could even process what was happening, a construction worker... <span class="font-bold text-indigo-600">his calloused hands gently supporting her head</span>.</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Report 3: Learning English Beyond the Classroom -->
            <div id="view-report3" class="hidden fade-in space-y-6">
                <div class="bg-white rounded-lg shadow p-6 border-l-4 border-emerald-500">
                    <h2 class="text-lg font-bold text-gray-900 mb-4"><i class="fa-solid fa-book-open-reader mr-2"></i>原文诊断 (Diagnosis)</h2>
                    <div class="bg-gray-50 p-4 rounded text-sm text-gray-700 essay-content">
                        <span class="font-bold block mb-2">Student Essay (原文标记):</span>
                        Nowadays, learning English is not only in the classroom. <span class="wrong-text">There has</span> <span class="correct-text">(There are)</span> many ways to learn English beyond the classroom. For example, we can <span class="wrong-text">listen English</span> <span class="correct-text">(listen to English)</span> songs and <span class="wrong-text">watching</span> <span class="correct-text">(watch)</span> English movies. <span class="wrong-text">This ways</span> <span class="correct-text">(These ways)</span> can improve our listening skills. Besides, <span class="wrong-text">communicate</span> <span class="correct-text">(communicating)</span> with foreigners is also a good choice. I <span class="wrong-text">used to afraid</span> <span class="correct-text">(used to be afraid)</span> of speaking, but now I <span class="wrong-text">enjoy to share</span> <span class="correct-text">(enjoy sharing)</span> my ideas. In a word, <span class="wrong-text">learn English</span> <span class="correct-text">(learning English)</span> in daily life is very helpful.
                    </div>
                    
                    <div class="bg-red-50 p-4 rounded-lg mt-4">
                        <h3 class="font-bold text-red-700 mb-2">典型错点解析 (Key Errors)</h3>
                        <ul class="list-disc list-inside text-sm text-gray-700 space-y-1">
                            <li><span class="wrong-text">There has</span> → <span class="correct-text">There are</span> (There be句型误用)</li>
                            <li><span class="wrong-text">listen English</span> → <span class="correct-text">listen to English</span> (不及物动词缺少介词)</li>
                            <li><span class="wrong-text">watching</span> → <span class="correct-text">watch</span> (并列结构不一致)</li>
                            <li><span class="wrong-text">This ways</span> → <span class="correct-text">These ways</span> (指示代词单复数不匹配)</li>
                            <li><span class="wrong-text">communicate</span> → <span class="correct-text">communicating</span> (动名词作主语)</li>
                            <li><span class="wrong-text">used to afraid</span> → <span class="correct-text">used to be afraid</span> (used to后接原形动词/be动词)</li>
                            <li><span class="wrong-text">enjoy to share</span> → <span class="correct-text">enjoy sharing</span> (enjoy doing用法)</li>
                        </ul>
                    </div>
                </div>

                <div class="bg-white rounded-lg shadow overflow-hidden">
                    <div class="bg-gray-100 px-6 py-3 border-b flex justify-between items-center">
                        <h3 class="font-bold text-gray-800">修改建议</h3>
                    </div>
                    <div class="p-6">
                        <div class="flex space-x-2 mb-4">
                            <button onclick="window.toggleVersion('beyond', 'standard')" class="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium hover:bg-emerald-200">修正补全版</button>
                            <button onclick="window.toggleVersion('beyond', 'advanced')" class="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-sm font-medium hover:bg-teal-200">高分升格版</button>
                        </div>
                        
                        <div id="beyond-standard" class="essay-content text-gray-800">
                            <h4 class="font-bold mb-2 text-emerald-600">Standard Version (修正语法)</h4>
                            Nowadays, learning English is not only done in the classroom. <span class="font-bold text-green-600">There are</span> many ways to learn English beyond the classroom. For example, we can <span class="font-bold text-green-600">listen to English</span> songs and <span class="font-bold text-green-600">watch</span> English movies. <span class="font-bold text-green-600">These ways</span> can improve our listening skills. Besides, <span class="font-bold text-green-600">communicating</span> with foreigners is also a good choice. I <span class="font-bold text-green-600">used to be afraid</span> of speaking, but now I <span class="font-bold text-green-600">enjoy sharing</span> my ideas. In a word, <span class="font-bold text-green-600">learning English</span> in daily life is very helpful.
                        </div>

                        <div id="beyond-advanced" class="hidden essay-content text-gray-800">
                            <h4 class="font-bold mb-2 text-teal-600">Advanced Version (高分表达升格)</h4>
                            Currently, English acquisition <span class="font-bold text-teal-600">extends far beyond</span> the traditional classroom. Diverse avenues are available for extracurricular English learning. For instance, <span class="font-bold text-teal-600">immersing ourselves in</span> English auditory and visual materials, such as songs and movies, <span class="font-bold text-teal-600">significantly enhances</span> our listening comprehension. 
                            <br><br>
                            Furthermore, engaging in <span class="font-bold text-teal-600">authentic conversations</span> with native speakers is highly beneficial. Although I previously lacked the confidence to speak up, I now <span class="font-bold text-teal-600">take great pleasure in</span> exchanging ideas. Ultimately, integrating English into our daily routines <span class="font-bold text-teal-600">yields profound benefits</span>.
                        </div>
                    </div>
                </div>
            </div>

            <!-- Review Mode: Quiz -->
            <div id="view-review" class="hidden fade-in h-full flex flex-col items-center justify-center pt-2 sm:pt-8">
                
                <!-- Start Screen -->
                <div id="quiz-start" class="text-center max-w-lg w-full px-4">
                    <div class="bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-gray-200">
                        <div class="bg-blue-100 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                            <i class="fa-solid fa-brain text-blue-600 text-3xl sm:text-4xl"></i>
                        </div>
                        <h2 class="text-xl sm:text-2xl font-bold text-gray-900 mb-2">错题突击检查 (Ebbinghaus)</h2>
                        <p class="text-gray-600 mb-2 text-sm sm:text-base">系统题库共收录 <span class="font-bold text-blue-600" id="total-questions-count">0</span> 个知识点。</p>
                        
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
                            <select id="user-profile" onchange="window.changeProfile()" class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border bg-white font-medium text-gray-700">
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
                                <select id="daily-limit" class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border bg-white font-medium text-gray-700">
                                    <option value="5">5 题</option>
                                    <option value="10" selected>10 题</option>
                                    <option value="20">20 题</option>
                                    <option value="999">全部错题</option>
                                </select>
                            </div>
                        </div>

                        <button id="btn-start" onclick="window.prepareQuiz()" class="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-bold hover:bg-blue-700 transition shadow-md hover:shadow-lg transform hover:-translate-y-1 disabled:opacity-50">
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
                            <div id="progress-bar" class="h-2 bg-blue-500 rounded-full transition-all duration-300" style="width: 0%"></div>
                        </div>
                    </div>

                    <div class="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden relative min-h-[400px] flex flex-col">
                        <div class="p-5 sm:p-8 flex-1">
                            <div class="mb-4 flex flex-wrap items-center gap-2">
                                <span id="q-tag" class="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-gray-100 text-gray-600">Grammar</span>
                                <span id="ebbinghaus-badge" class="hidden inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-purple-100 text-purple-600 shadow-sm border border-purple-200">
                                    <i class="fa-solid fa-brain mr-1"></i> 艾宾浩斯复习题
                                </span>
                            </div>

                            <h3 class="text-lg sm:text-xl text-gray-800 mb-6 leading-relaxed">
                                原句中的错误部分是：<br>
                                "<span id="q-context" class="font-mono text-red-500 bg-red-50 px-1 rounded"></span>"
                            </h3>
                            <p class="text-gray-600 mb-6 text-sm">请选择正确的修正表达：</p>

                            <div id="options-container" class="space-y-3"></div>
                        </div>

                        <!-- Feedback Area -->
                        <div id="feedback-area" class="hidden bg-gray-50 p-5 sm:p-6 border-t border-gray-100">
                            <div class="flex items-start">
                                <div id="feedback-icon" class="flex-shrink-0 mr-3 mt-1"></div>
                                <div>
                                    <h4 id="feedback-title" class="font-bold text-base sm:text-lg mb-1"></h4>
                                    <p id="feedback-text" class="text-gray-600 text-sm"></p>
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
                        <p class="text-gray-600 mb-6">今日得分: <span id="final-score" class="text-3xl font-bold text-blue-600"></span></p>
                        
                        <div class="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 justify-center mb-6">
                            <button onclick="window.switchTab('review'); document.getElementById('quiz-results').classList.add('hidden'); document.getElementById('quiz-start').classList.remove('hidden');" class="bg-blue-100 text-blue-700 py-2 px-6 rounded-lg font-medium hover:bg-blue-200">
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
                            <th class="px-4 py-3 border-b">Question / Tag</th>
                            <th class="px-4 py-3 border-b text-center">Status</th>
                            <th class="px-4 py-3 border-b text-center">Level</th>
                            <th class="px-4 py-3 border-b">Next Review (SQL Timestamp)</th>
                        </tr>
                    </thead>
                    <tbody id="db-table-body" class="divide-y divide-gray-100">
                        <!-- Rows injected by JS -->
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <!-- 前端逻辑 (Fetch 访问同源 Cloudflare API) -->
    <script>
        let userRecords = []; 
        let currentProfile = 'user1';
        let currentQuestionIndex = 0;
        let score = 0;
        let quizData = [];
        let isAnswered = false;

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

        // 扩充至 25 个知识点 (含 Learning English Beyond the Classroom)
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
            
            // 以下为从 Report 1 & 2 HTML 文本内容中额外提取补充的 8 个知识点
            { id: 11, tag: "代词/限定词 (Determiner)", context: "I'm glad to share some my opinions with you.", incorrect: "some my", correct: "some of my", explanation: "当名词前已有 my/your 等物主代词时，前面的 some/many 需加 of，即 some of my opinions。", distractors: ["some mine", "some me"] },
            { id: 12, tag: "句子结构 (Fragment)", context: "Firstly, with the development of society.", incorrect: "with the development of society.", correct: "(连接主句，去除句号)", explanation: "这是一个介词短语，不能单独成句，应该作为状语连接到后面的主句中，中间用逗号隔开。", distractors: ["with society developing.", "society develop."] },
            { id: 13, tag: "副词位置 (Adverb Position)", context: "AI can help us to better study.", incorrect: "better study", correct: "study better", explanation: "修饰动词 study 的副词 better 通常放在动词或其宾语之后，即 study better。", distractors: ["more good study", "study good"] },
            { id: 14, tag: "词汇搭配 (Vocabulary)", context: "it shows a kind video to help us...", incorrect: "a kind video", correct: "educational videos", explanation: "表达'教育视频'应用 educational videos，'a kind video' 意为'一种视频'，不符合英语习惯。", distractors: ["a teach video", "a study video"] },
            { id: 15, tag: "动词搭配 (Collocation)", context: "to catch important knowledges.", incorrect: "catch important", correct: "grasp important", explanation: "掌握知识一般用 grasp/master knowledge，catch 通常指抓住具体飞来的物体。", distractors: ["take important", "keep important"] },
            { id: 16, tag: "动词用法 (Verb Usage)", context: "people hurried up come to help...", incorrect: "hurried up come", correct: "hurried to come / hurried over", explanation: "两个实义动词不能直接连用，应使用动词不定式 to 连接，即 hurried to come，或者改用 hurried over。", distractors: ["hurrying up come", "hurried coming"] },
            { id: 17, tag: "语序 (Word Order)", context: "I with they went to the hospital.", incorrect: "I with they went", correct: "I went with them", explanation: "典型的中式英语语序。英语中主谓通常紧密相连，介词短语(伴随状语)放后面，且介词后接宾格 them。", distractors: ["I went with they", "I with them went"] },
            { id: 18, tag: "单词拼写 (Spelling)", context: "Thank those kindmans for their help.", incorrect: "kindmans", correct: "kind people", explanation: "英语中没有 kindmans 这个词，表达'好心人'通常用 kind people (复数) 或 a kind person (单数)。", distractors: ["kind men", "kind mans"] },

            // 以下为从新增 Report 3 (Learning English Beyond the Classroom) 中提取的 7 个知识点
            { id: 19, tag: "There be 句型 (There be)", context: "...There has many ways to learn...", incorrect: "There has", correct: "There are", explanation: "表示'存在有'应用 There be 句型，且 ways 是复数，故用 There are。绝对不能用 There has。", distractors: ["There have", "They has"] },
            { id: 20, tag: "不及物动词与介词 (Intransitive Verb)", context: "...we can listen English songs...", incorrect: "listen English", correct: "listen to English", explanation: "Listen 是不及物动词，接宾语时必须加上介词 to。", distractors: ["listening English", "listen at English"] },
            { id: 21, tag: "平行结构 (Parallel Structure)", context: "...listen to English songs and watching...", incorrect: "watching", correct: "watch", explanation: "and 连接两个并列的动词，前面是 listen (原形，跟在 can 后面)，后面也应保持一致用动词原形 watch。", distractors: ["watches", "to watch"] },
            { id: 22, tag: "指示代词 (Demonstrative Pronoun)", context: "This ways can improve...", incorrect: "This ways", correct: "These ways", explanation: "Ways 是复数名词，前面的指示代词必须用复数 these，不能用单数 this。", distractors: ["That ways", "This way can"] },
            { id: 23, tag: "非谓语动词作主语 (Gerund as Subject)", context: "...communicate with foreigners is also...", incorrect: "communicate", correct: "communicating", explanation: "动词原形不能直接作主语，应改为动名词 (doing) 或不定式 (to do)。这里作一般性主语常用动名词。", distractors: ["communicated", "communicates"] },
            { id: 24, tag: "固定搭配 (Fixed Phrase)", context: "I used to afraid of speaking...", incorrect: "used to afraid", correct: "used to be afraid", explanation: "Afraid 是形容词，不能直接跟在 used to (to 是不定式符号，后接动词原形) 后面，需要加 be 动词。", distractors: ["used to afraid of", "using to afraid"] },
            { id: 25, tag: "动词用法 (Verb + doing)", context: "...I enjoy to share my ideas.", incorrect: "enjoy to share", correct: "enjoy sharing", explanation: "Enjoy 后面接动词时，必须使用动名词形式 (enjoy doing sth)。", distractors: ["enjoy share", "enjoying to share"] }
        ];

        document.getElementById('total-questions-count').innerText = mistakeDatabase.length;

        // 初始化环境与数据库连接
        async function initApp() {
            await fetchMemoryRecords();
        }

        // 调用 Cloudflare API: 拉取记忆记录
        async function fetchMemoryRecords() {
            try {
                const response = await fetch('/api/memory/get?userProfile=' + currentProfile);
                if (!response.ok) throw new Error('API Request Failed');
                userRecords = await response.json();
                updateSyncUI();
            } catch(e) {
                console.error("Fetch Data Error", e);
                document.getElementById('sync-status').innerHTML = '<span class="text-red-500"><i class="fa-solid fa-xmark"></i> 连接后端 API 失败</span>';
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

        window.changeProfile = async function() {
            const profileSelect = document.getElementById('user-profile');
            currentProfile = profileSelect.value;
            document.getElementById('sync-status').innerHTML = '<span class="text-purple-600"><i class="fa-solid fa-spinner fa-spin"></i> 拉取 ' + currentProfile + ' 数据...</span>';
            await fetchMemoryRecords();
        };

        window.switchTab = function(tabName) {
            ['view-report1', 'view-report2', 'view-report3', 'view-review'].forEach(id => {
                document.getElementById(id).classList.add('hidden');
            });
            ['tab-report1', 'tab-report2', 'tab-report3', 'tab-review'].forEach(id => {
                document.getElementById(id).className = "tab-inactive whitespace-nowrap px-3 py-2 text-sm font-medium transition-colors flex items-center cursor-pointer";
            });
            document.getElementById('view-' + tabName).classList.remove('hidden');
            document.getElementById('tab-' + tabName).className = "tab-active whitespace-nowrap px-3 py-2 text-sm font-medium transition-colors flex items-center cursor-pointer";
        };

        window.goHome = function() {
            window.switchTab('report1');
            document.getElementById('quiz-container').classList.add('hidden');
            document.getElementById('quiz-results').classList.add('hidden');
            document.getElementById('quiz-pre-review').classList.add('hidden');
            document.getElementById('quiz-start').classList.remove('hidden');
        };

        window.clearAllMemory = async function() {
            if (!confirm('确定要清除账号 ' + currentProfile + ' 的所有错题记忆数据吗？此操作不可恢复！')) return;
            
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

        window.toggleVersion = function(essay, version) {
            if (essay === 'ai') {
                document.getElementById('ai-standard').classList.add('hidden');
                document.getElementById('ai-advanced').classList.add('hidden');
                document.getElementById('ai-' + version).classList.remove('hidden');
            } else if (essay === 'kindness') {
                document.getElementById('kindness-revised').classList.add('hidden');
                document.getElementById('kindness-advanced').classList.add('hidden');
                document.getElementById('kindness-' + version).classList.remove('hidden');
            } else if (essay === 'beyond') {
                document.getElementById('beyond-standard').classList.add('hidden');
                document.getElementById('beyond-advanced').classList.add('hidden');
                document.getElementById('beyond-' + version).classList.remove('hidden');
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
                        '<p class="text-sm font-bold text-gray-800 mb-2">' + q.tag + '</p>' +
                        '<div class="text-sm bg-gray-50 p-3 rounded mb-2">' +
                            '<span class="line-through text-red-500 mr-2">' + q.incorrect + '</span>' +
                            ' <i class="fa-solid fa-arrow-right text-gray-400"></i> ' +
                            '<span class="text-green-600 font-bold ml-2">' + q.correct + '</span>' +
                        '</div>' +
                        '<p class="text-xs text-gray-600"><i class="fa-solid fa-circle-info text-blue-400 mr-1"></i> ' + q.explanation + '</p>' +
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
                btn.className = "option-card w-full p-3 sm:p-4 rounded-lg border border-gray-200 cursor-pointer flex items-center bg-white";
                btn.innerHTML = '<div class="w-5 h-5 rounded-full border-2 border-gray-300 mr-3 flex items-center justify-center dot-indicator shrink-0"></div><span class="font-medium text-gray-700 text-sm sm:text-base">' + opt.text + '</span>';
                btn.onclick = () => window.checkAnswer(opt, btn, q);
                optionsDiv.appendChild(btn);
            });
        }

        window.checkAnswer = async function(selectedOption, btnElement, questionData) {
            if (isAnswered) return;
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
                    if (b.innerText.includes(questionData.correct)) {
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
            const fbText = document.getElementById('feedback-text');

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
            document.getElementById('final-score').innerText = score + ' / ' + quizData.length;
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
                            '<span class="font-bold text-gray-700">[' + q.id + ']</span> ' + q.tag + '<br>' +
                            '<span class="text-xs text-gray-400 font-mono">' + q.incorrect + ' -> ' + q.correct + '</span>' +
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