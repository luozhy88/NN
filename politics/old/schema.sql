-- D1 数据库表结构初始化脚本
-- 政治特训系统 - 艾宾浩斯记忆数据库

-- 题目表（如需动态添加题目可扩展）
CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY,
    subject TEXT NOT NULL,
    year TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    oldAnswer TEXT,
    scoreInfo TEXT,
    diagnosis TEXT,
    examinerNotes TEXT,  -- JSON 数组
    stdAnswer TEXT,
    takeaways TEXT       -- JSON 数组
);

-- 用户记忆记录表（艾宾浩斯记忆曲线）
CREATE TABLE IF NOT EXISTS memory_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,           -- 用户标识 (user1, user2, user3)
    question_id INTEGER NOT NULL,
    level INTEGER DEFAULT 0,         -- 记忆等级 0-8
    next_review_time INTEGER,        -- 下次复习时间戳（毫秒）
    created_at INTEGER,              -- 创建时间
    updated_at INTEGER,              -- 更新时间
    FOREIGN KEY (question_id) REFERENCES questions(id),
    UNIQUE(user_id, question_id)
);

-- 答题历史记录表
CREATE TABLE IF NOT EXISTS answer_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    question_id INTEGER NOT NULL,
    user_answer TEXT,
    status TEXT,                     -- 'mastered', 'review', 'skipped'
    created_at INTEGER,
    FOREIGN KEY (question_id) REFERENCES questions(id)
);

-- 创建索引以加速查询
CREATE INDEX IF NOT EXISTS idx_memory_user_time ON memory_records(user_id, next_review_time);
CREATE INDEX IF NOT EXISTS idx_memory_user_question ON memory_records(user_id, question_id);
CREATE INDEX IF NOT EXISTS idx_history_user ON answer_history(user_id, created_at);

-- 初始化题目数据（6道政治题）
INSERT OR IGNORE INTO questions (id, subject, year, title, content, oldAnswer, scoreInfo, diagnosis, examinerNotes, stdAnswer, takeaways) VALUES
(1, 'politics', '2025 高考政治', '第16题：法治与科技的"双向奔赴"', 
 '<strong>背景：</strong>某市形成"领军者+小微"格局，硬核科技成为名片。<br><strong>问题：</strong>结合材料，运用《政治与法治》知识，说明该市科技创新生态的优化得益于法治与科技的"双向奔赴"。',
 '坚持科学立法,政府要不断完素法治体系... 坚持严格必法,打法侵权行为... 坚持科技赋能...',
 '旧得分：主体错误 / 漏点',
 '1. <strong>主体错误：</strong> "政府立法"严重错误！立法是人大的职权，政府是制定行政法规。<br>2. <strong>漏点：</strong> 政治题首选必答<strong style="color:red">"党的领导"</strong>。<br>3. <strong>结合不够：</strong> 未具体展开法治如何保护科技（如知识产权）。',
 '["政治题"起手式"：党的领导是根本保证。","科学立法（人大/完善体系）+ 严格执法/公正司法（知识产权保护）。","全民守法（营造氛围）+ 科技赋能（提高法治效能）。"]',
 '① <strong>党的领导：</strong> 提供政治保证。<br>② <strong>科学立法：</strong> 完善科技法规，提供制度供给。<br>③ <strong>严格执法/公正司法：</strong> 保护知识产权，维护市场秩序。<br>④ <strong>全民守法：</strong> 营造尊重创新的氛围。<br>⑤ <strong>科技赋能：</strong> 利用大数据提升法治效能。',
 '["政治与法治大题结构：党 + 立法 + 执法/司法 + 守法 + 材料特色（科技赋能）。"]'
);

INSERT OR IGNORE INTO questions (id, subject, year, title, content, oldAnswer, scoreInfo, diagnosis, examinerNotes, stdAnswer, takeaways) VALUES
(2, 'politics', '2025 高考政治', '第17题：遗产保护中的"实事求是"',
 '<strong>背景：</strong>开封宋韵、苏州一宅一方案、屏南老屋认租。<br><strong>问题：</strong>运用《哲学与文化》知识，分析在历史文化遗产保护传承中如何从实际出发、实事求是。',
 '把主观能动性和尊重客观规律结合起来... 发挥人的主观能动性... 尊重物质运动的客观规律...',
 '旧得分：原理对但无结合',
 '1. <strong>空洞：</strong> 哲学题必须是"原理 + 方法论 + <strong style="color:red">材料分析</strong>"。你只背了原理。<br>2. <strong>漏点：</strong> 实事求是的前提是"调查研究"（了解古城实际）。',
 '["尊重客观规律：立足古城实际。","发挥主观能动性：解放思想，探索新模式（如认租）。","二者结合：既保护文物又发展民生（具体的历史的统一）。"]',
 '① <strong>尊重客观规律：</strong> 立足本地古城、老宅实际，探寻保护规律。<br>② <strong>发挥主观能动性：</strong> 解放思想，探索"认租"等新模式。<br>③ <strong>二者结合：</strong> 将保护与民生/产业结合，做到主观与客观具体的历史的统一。',
 '["哲学题公式：原理 + 方法论 + 材料（抄材料里的做法作为论据）。"]'
);

INSERT OR IGNORE INTO questions (id, subject, year, title, content, oldAnswer, scoreInfo, diagnosis, examinerNotes, stdAnswer, takeaways) VALUES
(3, 'politics', '2025 高考政治', '第18题：劳动权益与企业负担',
 '<strong>(1) 《法律与生活》：</strong>分析"两年不准结婚"合同的不当之处及维权途径。<br><strong>(2) 《经济与社会》：</strong>评析"给骑手交社保加重企业负担，不利于发展"的观点。',
 '(1) 侵犯休息权... 找第三方调解或直接仲裁/诉讼。\\n(2) 提高收入是消费基础... 提高工作积极性...',
 '旧得分：程序错误 / 单向思维',
 '1. <strong>程序错误：</strong> 劳动纠纷必须<strong style="color:red">先仲裁</strong>，不服才能诉讼（仲裁前置）。<br>2. <strong>漏权益：</strong> 漏了"婚姻自由权"、"平等就业权"。<br>3. <strong>评析题：</strong> 不能只说好处，要先承认"短期确实加重负担（合理性）"，再驳斥"长期有利（不合理性）"。',
 '["维权：投诉 -> 仲裁（必经） -> 诉讼。","评析：短期增加成本（合理）；长期增强凝聚力/拉动消费（不合理）。"]',
 '<strong>(1) 不当：</strong> 侵犯婚姻自由（无效条款）；侵犯休息权；违法解除合同（侵犯平等就业权）。<br><strong>维权：</strong> 投诉、申请仲裁（必经）、起诉。<br><br><strong>(2) 评析：</strong> 片面。<br>合理性：短期确实增加成本。<br>驳斥：微观利于留住人才/树立形象；宏观利于共同富裕/拉动消费。<br>结论：企业应承担社会责任。',
 '["劳动仲裁是诉讼的前置程序，不可直接起诉。","评析题逻辑：肯定合理点 + 否定不合理点 + 总结正确态度。"]'
);

INSERT OR IGNORE INTO questions (id, subject, year, title, content, oldAnswer, scoreInfo, diagnosis, examinerNotes, stdAnswer, takeaways) VALUES
(4, 'politics', '2025 高考政治', '第19题：周边外交与超前思维',
 '<strong>(1) 《当代国际政治与经济》：</strong>阐明构建周边命运共同体的原因。<br><strong>(2) 《逻辑与思维》：</strong>选领域描绘10年后成就，并说明构想方法。',
 '(1) 和平共处五项原则... 时代主题... 共同利益...',
 '旧得分：(1)优 (2)漏方法',
 '1. <strong>第一问很好：</strong> 踩中了国家利益、时代主题、外交政策。<br>2. <strong>第二问漏点：</strong> 题目问"构想方法"，不是让你写作文。要答<strong style="color:red">"矛盾分析"、"推理"、"想象"</strong>等思维方法。',
 '["超前思维题重点在"方法论"。","怎么推导出来的？用了矛盾分析、因果推理、创新思维。"]',
 '<strong>(1) 原因：</strong> 国家利益（共同利益）；时代主题（和平发展）；外交政策（亲诚惠容）；多极化趋势。<br><br><strong>(2) 方法：</strong> <br>① <strong>矛盾分析法：</strong> 分析现状与目标的矛盾。<br>② <strong>推理性：</strong> 根据现有政策推断未来趋势。<br>③ <strong>创新思维：</strong> 合理联想建构未来场景。',
 '["逻辑与思维新题型：问"方法"时，必须列举思维工具（推理、想象、矛盾分析）。"]'
);

INSERT OR IGNORE INTO questions (id, subject, year, title, content, oldAnswer, scoreInfo, diagnosis, examinerNotes, stdAnswer, takeaways) VALUES
(5, 'politics', '2024 模拟精选', '第20题：全过程人民民主',
 '<strong>背景：</strong>某社区设立"板凳议事会"，居民直接参与小区改造方案制定。<br><strong>问题：</strong>运用《政治与法治》知识，分析"板凳议事会"是如何体现全过程人民民主的。',
 '体现了民主选举、民主决策... 社区居委会是基层政权...',
 '旧得分：性质错误 / 概念混淆',
 '1. <strong>性质错误：</strong> 社区居委会是<strong style="color:red">基层群众性自治组织</strong>，绝不是"基层政权"（政府）。<br>2. <strong>匹配不准：</strong> "议事会"更多体现的是"民主协商"和"民主决策"，而非"民主选举"。',
 '["关键词：最广泛、最真实、最管用。","协商民主：有事好商量，众人的事情由众人商量。","基层自治：自我管理、自我教育、自我服务。"]',
 '① <strong>最广泛：</strong> 居民直接参与，主体广泛。<br>② <strong>最真实：</strong> "板凳议事"让民意真正落实到改造方案中，体现了协商民主。<br>③ <strong>最管用：</strong> 解决了居民实际问题，提升了治理效能。<br>④ <strong>制度载体：</strong> 依托基层群众自治制度，实践全过程人民民主。',
 '["死记硬背：居委会/村委会 = 基层群众自治组织 ≠ 基层政权 ≠ 国家机关。"]'
);

INSERT OR IGNORE INTO questions (id, subject, year, title, content, oldAnswer, scoreInfo, diagnosis, examinerNotes, stdAnswer, takeaways) VALUES
(6, 'politics', '2024 模拟精选', '第21题：辩证法的"危"与"机"',
 '<strong>背景：</strong>数字技术冲击传统就业，但也催生了新职业。<br><strong>问题：</strong>运用《哲学与文化》中矛盾的观点，分析如何看待数字技术带来的就业变局。',
 '要一分为二看问题... 既有好处也有坏处...',
 '旧得分：原理简单堆砌',
 '1. <strong>深度不足：</strong> 仅仅说"一分为二"太浅。要点出<strong style="color:red">"矛盾双方在一定条件下相互转化"</strong>。<br>2. <strong>缺方法论：</strong> 不仅要"看"，还要说"怎么办"（创造条件，促使危转机）。',
 '["矛盾对立统一：挑战与机遇并存。","矛盾转化：通过技能培训（条件），将就业压力转化为人才红利。","具体问题具体分析：针对不同群体制定政策。"]',
 '① <strong>矛盾即对立统一：</strong> 数字技术既冲击旧岗位（危），又创造新职业（机）。<br>② <strong>矛盾双方在一定条件下转化：</strong> 我们要发挥主观能动性，通过职业培训等手段，促使"就业难"向"就业新"转化。<br>③ <strong>两点论与重点论统一：</strong> 既要看到挑战，更要抓住数字经济发展的机遇。',
 '["遇到"双刃剑"问题，必答：对立统一 + 矛盾转化（创造条件）。"]'
);
