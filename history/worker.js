/**
 * =========================================================
 * 高考历史特训 - Cloudflare Worker 全栈版本
 * 版本号: v1.0.0 (艾宾浩斯记忆曲线 + D1数据库)
 * =========================================================
 * 
 * 部署指南：
 * 1. 在 Cloudflare D1 控制台创建一个名为 `history-training` 的数据库，并执行以下建表语句：
 * 
 * CREATE TABLE IF NOT EXISTS ebbinghaus_records (
 *   id TEXT PRIMARY KEY,
 *   user_profile TEXT NOT NULL,
 *   question_id INTEGER NOT NULL,
 *   level INTEGER NOT NULL DEFAULT 1,
 *   next_review_time INTEGER NOT NULL,
 *   last_updated INTEGER NOT NULL
 * );
 * CREATE INDEX idx_user_review ON ebbinghaus_records(user_profile, next_review_time);
 * 
 * 2. 创建一个 Worker，将此代码粘贴进去。
 * 3. 在 Worker 的 Settings -> Variables -> D1 Database Bindings 中，绑定刚才创建的 `history-training` 数据库，变量名必须为 "DB"。
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
        const { results } = await env.DB.prepare(
          "SELECT * FROM ebbinghaus_records WHERE user_profile = ? ORDER BY next_review_time ASC"
        ).bind(userProfile).all();

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
// 历史题目数据库 (从 index.html 提取核心知识点)
// ==========================================
const historyQuestions = [
  {
    id: 1,
    year: "2015",
    tag: "儒学发展",
    title: "汉代儒学与孔孟儒学的不同之处",
    question: "汉代儒学与孔孟儒学的不同之处是什么？宋代理学在哪些方面对儒学有所发展？",
    keyPoint: "孔孟讲仁礼民本；汉儒讲大一统、天人感应、君权神授；宋代理学吸收佛道，思辨化、哲学化，提出存天理灭人欲",
    commonError: "词汇匮乏，漏掉大一统思想，概念缺失",
    explanation: "汉代儒学在孔孟基础上吸纳法家、道家、阴阳家思想，形成天人感应理论；宋代理学使儒学哲学化，朱熹提出存天理灭人欲。"
  },
  {
    id: 2,
    year: "2015",
    tag: "工业革命",
    title: "科学技术与生产力公式探讨",
    question: "运用世界近现代史史实，对公式（生产力=科学技术×（劳动力+劳动工具+劳动对象+生产管理））进行探讨。",
    keyPoint: "科技是第一生产力；蒸汽机→电气化→自动化（工具）；工厂→垄断→现代管理（管理）；体力→脑力（劳动力）",
    commonError: "逻辑断层，未紧扣公式要素，缺少结构",
    explanation: "三次工业革命分别对应公式中的不同要素：第一次是工具变革（蒸汽机），第二次是管理变革（垄断组织），第三次是劳动力素质提升。"
  },
  {
    id: 3,
    year: "2015",
    tag: "唐代经济",
    title: "唐代币制改革",
    question: "唐代币制改革的主要内容和意义是什么？",
    keyPoint: "开创通宝/元宝体制；确立十进位制；结束混乱，确立后世范式，利于商品经济",
    commonError: "术语不准（应为通宝体制），深度不够",
    explanation: "唐代废除了以重量命名货币的制度，开创通宝/元宝体制，确立十进位制，成为后世铸币范式。"
  },
  {
    id: 4,
    year: "2015",
    tag: "抗战历史",
    title: "抗战前后党派地位变化",
    question: "抗战胜利前后各党派地位发生了什么变化？原因及影响是什么？",
    keyPoint: "国民党一党专政→各党派法律上平等；原因：团结抗战、中共增强、民心所向、国际制约；影响：促成政协会议",
    commonError: "严重漏答影响部分，原因不全",
    explanation: "抗战胜利后，各民主党派力量壮大，政治协商会议召开，打破了国民党一党专政局面。"
  },
  {
    id: 5,
    year: "2015",
    tag: "二战历史",
    title: "戴高乐与法国复兴",
    question: "戴高乐号召抵抗的理由是什么？法国复兴的历史经验有哪些？",
    keyPoint: "理由：胜败未定、有殖民地后盾、有盟友支持、正义必胜；经验：坚持独立主权、依靠人民、国际合作",
    commonError: "幻视（答成古代史），脱离材料",
    explanation: "戴高乐在1940年法国沦陷后，依靠殖民地和英美盟友，坚持自由法国运动，最终赢得胜利。"
  },
  {
    id: 6,
    year: "2016",
    tag: "清代人口",
    title: "清中期人口膨胀与近代主张",
    question: "清中期人口膨胀的原因及影响是什么？近代学者有何主张？",
    keyPoint: "原因：政治稳定、税改、高产作物；影响：人地矛盾、生态恶化、收入下降；主张：移民、实业、节育",
    commonError: "细节丢失，评价空泛",
    explanation: "清代人口从1亿增至4亿，引发严重人地矛盾；近代学者提出多种解决方案，各有优劣。"
  },
  {
    id: 7,
    year: "2016",
    tag: "启蒙思想",
    title: "卢梭思想与制度构想",
    question: "围绕'制度构想与实践'，结合卢梭思想拟定论题并阐述。",
    keyPoint: "卢梭主张直接民主（理想性），代议制是现实选择（现实性）；体现理想与现实的张力",
    commonError: "格式错误（未写论题），缺乏思辨",
    explanation: "卢梭批判代议制，主张人民主权；但大国实行直接民主困难，代议制成为现代政治的现实选择。"
  },
  {
    id: 8,
    year: "2018",
    tag: "基层治理",
    title: "乡约制度的变化",
    question: "宋代到明清时期乡约制度有何变化？积极作用是什么？",
    keyPoint: "变化：民间自发→官府主导，道德教化→宣讲圣谕，自我管理→国家控制；作用：维护秩序、道德教化、弥补行政不足",
    commonError: "变化答不完整，混入负面评价",
    explanation: "宋代乡约是民间士绅自发组织；明清时期成为官府推行圣谕、控制基层的工具。"
  },
  {
    id: 9,
    year: "2018",
    tag: "清末新政",
    title: "清末城镇乡地方自治的历史背景",
    question: "简述清末城镇乡地方自治的历史背景。",
    keyPoint: "民族危机、清末新政、西方民主思想传入、士绅推动、戊戌变法影响",
    commonError: "过于简略，缺乏展开",
    explanation: "清末在内忧外患下推行新政，地方自治被视为强国之基，受到西方思想和士绅阶层推动。"
  },
  {
    id: 10,
    year: "2018",
    tag: "现代政治",
    title: "村民自治的意义",
    question: "村民自治的意义是什么？",
    keyPoint: "扩大基层民主、加强基层政权建设、推动民主政治进程、为基层治理现代化提供保障",
    commonError: "未展开，遗漏法治建设等角度",
    explanation: "村民自治是中国特色社会主义民主政治的重要组成部分，扩大了基层民主权利。"
  },
  {
    id: 11,
    year: "2018",
    tag: "殖民扩张",
    title: "黑奴贸易的历史现象",
    question: "《鲁滨逊漂流记》中鲁滨逊贩卖黑奴的情节反映了什么历史现象？",
    keyPoint: "三角贸易/黑奴贸易；为欧洲提供资本积累，给非洲带来灾难，要批判其罪恶",
    commonError: "未点出情节，笼统说殖民扩张，评价不全面",
    explanation: "15-19世纪欧洲殖民者掳掠非洲黑人贩卖到美洲，是原始积累的重要手段，也是人类历史上的罪恶。"
  },
  {
    id: 12,
    year: "2018",
    tag: "古代制度",
    title: "年号纪年制的区别与影响",
    question: "年号纪年制与之前纪年制度的区别是什么？有何影响？",
    keyPoint: "区别：之前诸侯各自纪年，年号制统一全国通用；影响：强化皇权、维护统一、影响周边国家",
    commonError: "表述不完整",
    explanation: "汉武帝创立年号制，以皇帝年号纪年，全国统一使用，体现中央集权，影响朝鲜日本越南等国。"
  },
  {
    id: 13,
    year: "2018",
    tag: "两次世界大战",
    title: "一战与二战性质的不同认识",
    question: "1939年和1945年人们对一战与二战性质的两种不同认识是什么？",
    keyPoint: "1939年：都是帝国主义战争；1945年：二战是反法西斯的正义战争",
    commonError: "无",
    explanation: "二战初期英法绥靖，苏德条约，战争性质不明；反法西斯同盟形成后，战争性质明确为正义对邪恶。"
  },
  {
    id: 14,
    year: "2018",
    tag: "美国外交",
    title: "美国对拉美政策的变化",
    question: "20世纪30年代前后美国两种对拉美政策的不同特征是什么？",
    keyPoint: "30年代前：武力干涉、强权政策（大棒政策）；30年代后：睦邻友好、经济合作代替武力",
    commonError: "严重失分，未说明不同特征",
    explanation: "罗斯福推行睦邻政策，以经济援助代替武力干涉，但实质仍是维护美国在拉美的霸权。"
  },
  {
    id: 15,
    year: "2019",
    tag: "战后经济",
    title: "四国钢产量趋势及原因",
    question: "1950-1980年美国、苏联、日本、中国钢产量的总体发展趋势及基本原因。",
    keyPoint: "美国：战后繁荣→70年代滞胀下滑；苏联：持续增长→后期僵化；日本：高速增长→石油危机放缓；中国：快速增长但有波动",
    commonError: "原因笼统、缺乏条理、表述错误",
    explanation: "四国钢产量变化反映了各自经济体制和国际环境的影响，1970年代石油危机是共同转折点。"
  },
  {
    id: 16,
    year: "2019",
    tag: "改革开放",
    title: "改革开放后中国钢铁业发展原因",
    question: "改革开放以来中国钢铁业发展的主要原因是什么？",
    keyPoint: "改革开放政策、体制改革、资金投入、科技创新、国内需求旺盛、加入WTO",
    commonError: "答案简短、未结合材料、方向有误",
    explanation: "改革开放后钢铁业发展是政策、体制、资金、科技、需求等多因素共同作用的结果。"
  },
  {
    id: 17,
    year: "2019",
    tag: "史学思想",
    title: "钱穆《国史大纲》观点评析",
    question: "评析钱穆'对本国历史应有温情与敬意'的观点。",
    keyPoint: "积极：增强民族凝聚力、激励抗战；局限：可能压抑批判性反思；结论：既要认同又要理性批判",
    commonError: "用词错误、结论重复材料、缺乏辩证评析",
    explanation: "钱穆观点在抗战时期有积极意义，但过分强调温情可能不利于客观认识历史。"
  },
  {
    id: 18,
    year: "2019",
    tag: "秦汉制度",
    title: "秦二十等爵与曹魏五等爵",
    question: "秦二十等爵和曹魏五等爵反映的思想流派、授予对象和作用是什么？",
    keyPoint: "二十等爵：法家，军功授爵，打破世袭；五等爵：儒家，授予官员，笼络臣僚",
    commonError: "过于简单、缺乏说明",
    explanation: "商鞅变法以军功定爵位，体现法家思想；曹魏五等爵仿周礼，体现儒家复古理念。"
  },
  {
    id: 19,
    year: "2020",
    tag: "中德关系",
    title: "中国与两德关系变化及原因",
    question: "20世纪50～70年代中国与民主德国、联邦德国关系的变化及其原因。",
    keyPoint: "与民德：50年代密切→60年代冷淡；与西德：对立→建交；原因：阵营对立→中苏破裂→中美缓和",
    commonError: "原因逻辑混乱、遗漏新东方政策",
    explanation: "中德关系演变受冷战格局、中苏关系、中美关系等多重因素影响。"
  },
  {
    id: 20,
    year: "2020",
    tag: "明清特征",
    title: "明清历史特征论述",
    question: "自拟书名并论证明清时期的时代特征。",
    keyPoint: "书名：《由盛转衰：明清中国的历史转型》；论证：君主专制强化、资本主义萌芽受压制、闭关锁国",
    commonError: "书名不规范、史实空洞、逻辑矛盾",
    explanation: "明清时期是中国传统社会由盛转衰的关键时期，政治专制强化，经济发展受阻，逐渐落后于世界。"
  },
  {
    id: 21,
    year: "2021",
    tag: "史学比较",
    title: "希罗多德与司马迁的比较",
    question: "希罗多德《历史》与司马迁《史记》的共同点、产生背景及撰史要素。",
    keyPoint: "共同点：私人撰史、实地考察、广泛收集史料、客观记录、兼顾周边民族；要素：史料真实、体例完备、客观公正",
    commonError: "表述不准、遗漏重点",
    explanation: "两位史学家都开创了纪传体史学传统，重视实地考察和史料收集，为后世史学奠定基础。"
  },
  {
    id: 22,
    year: "2021",
    tag: "中共党史",
    title: "建党至建国的重要会议",
    question: "从建党至建国的重要会议中任选两次，分析两次会议间共产党的发展及原因。",
    keyPoint: "发展：组织壮大、思想成熟、军事壮大、政治成熟；原因：马列主义结合实际、纠正错误、群众支持",
    commonError: "格式不符、角度不清、缺少原因",
    explanation: "从一大到遵义会议，中国共产党从幼年到成熟，逐步找到正确的革命道路。"
  },
  {
    id: 23,
    year: "2022",
    tag: "科技引进",
    title: "中日技术引进特点比较",
    question: "20世纪五六十年代中日技术引进的特点、背景及中国科技发展的历史经验。",
    keyPoint: "日本：立法管理→逐步放宽，欧美来源；中国：国家主导，苏联来源，转向自力更生；经验：统一规划、引进与自研结合",
    commonError: "特点遗漏、背景分析浅、经验笼统",
    explanation: "中日技术引进的不同路径反映了两国不同的政治体制和国际环境。"
  },
  {
    id: 24,
    year: "2022",
    tag: "儒家思想",
    title: "东汉地方官治虎患的历史现象",
    question: "东汉地方官治虎患反映的历史现象是什么？",
    keyPoint: "现象：修德政→虎患息；结论：儒家仁政理念影响官吏施政，史书推崇德政",
    commonError: "归纳不够全面、结论层次较浅",
    explanation: "《后汉书》记载地方官以修德政治理虎患，体现儒家德治理念对东汉政治的影响。"
  },
  {
    id: 25,
    year: "2022",
    tag: "军事改革",
    title: "商鞅军事改革评价",
    question: "荀子为何称商鞅变法后的秦军为'盗兵'？如何评价商鞅军事改革？",
    keyPoint: "原因：荀子儒家立场，秦军求赏逐利无礼义；评价：积极（提升战力、打击贵族）、消极（功利驱动、精神凝聚不足）",
    commonError: "审题失误、严重跑题",
    explanation: "荀子从儒家礼义角度批评秦军以功利为驱动，缺乏道德教化，称之为'盗兵'。"
  },
  {
    id: 26,
    year: "2023",
    tag: "抗战胜利",
    title: "日本对华投降问题",
    question: "共产党、国民党、美国在日本对华投降问题上的主张、措施及评价。",
    keyPoint: "共产党：迅速解除敌伪武装，收复失地；国民党：只能向蒋介石投降，抢占要地；美国：助蒋反共",
    commonError: "严重缺失要点、评价缺乏辩证",
    explanation: "受降问题是战后国共争夺政权合法性的关键，美国明显偏袒国民党，加剧了中国内战。"
  },
  {
    id: 27,
    year: "2020",
    tag: "中德关系",
    title: "中德战略伙伴关系的历史条件",
    question: "根据材料并结合所学知识，简述中德建立战略伙伴关系的历史条件。",
    keyPoint: "冷战结束两极格局瓦解；中国改革开放市场巨大；德国统一经济发达；双方推动多极化共同利益",
    commonError: "未提冷战结束、遗漏多极化、表述方向有误",
    explanation: "1990年代冷战结束后，中德在各自改革开放和统一后，基于共同战略诉求建立战略伙伴关系。"
  },
  {
    id: 28,
    year: "2020",
    tag: "中德关系",
    title: "中德关系发展的历史启示",
    question: "根据材料并结合所学知识，简析20世纪70年代以来中德关系发展的历史启示。",
    keyPoint: "国家利益是外交核心驱动力；经济合作是关系发展纽带；坚持独立自主灵活调整",
    commonError: "启示未贴材料、遗漏核心要点",
    explanation: "中德关系发展表明，国家利益和共同利益是推动外交关系的根本动力，经济合作是深化关系的重要纽带。"
  },
  {
    id: 29,
    year: "2020",
    tag: "清末新政",
    title: "清政府奖励商业的主要措施",
    question: "根据材料，概括清政府奖励商业的主要措施。",
    keyPoint: "制定商业法律；建立商会组织；给予商人官衔；奖励创新制造；规范公司形式",
    commonError: "遗漏奖励创新、表述简略",
    explanation: "清末新政期间，清政府通过立法、设商会、授荣誉、奖创新等措施，改变了传统抑商政策。"
  },
  {
    id: 30,
    year: "2020",
    tag: "清末新政",
    title: "清政府商业改革的历史意义",
    question: "根据材料并结合所学知识，简析清政府商业改革的历史意义。",
    keyPoint: "否定抑商政策提高商人地位；引进近代公司制度；为民族资本主义提供法律保障；推动商业近代化",
    commonError: "表述模糊、遗漏核心意义、答题过短",
    explanation: "清末商业改革是晚清经济政策的重要转变，为民族工商业发展提供了制度和法律保障。"
  },
  {
    id: 31,
    year: "2021",
    tag: "清末新政",
    title: "江楚会奏与洋务运动的相同点",
    question: "根据材料，指出江楚会奏与洋务运动的相同点。",
    keyPoint: "都是自上而下改革；都向西方学习；都维护清朝统治；都涉及经济军事近代化；都未触动封建根本",
    commonError: "都以失败告终表述不当",
    explanation: "江楚会奏（清末新政）与洋务运动都是清政府自上而下的改革，旨在维护统治并向西方学习。"
  },
  {
    id: 32,
    year: "2021",
    tag: "清末新政",
    title: "评价江楚会奏变法方案",
    question: "根据材料，评价江楚会奏变法方案。",
    keyPoint: "积极：推动教育近代化、多领域改革、促进思想解放；局限：维护封建统治、治标不治本",
    commonError: "语句不通、评价不全、遗漏要点",
    explanation: "江楚会奏是较为全面的改革方案，推动近代化但根本目的是维护清朝统治，未能挽救清朝灭亡。"
  },
  {
    id: 33,
    year: "2021",
    tag: "越南战争",
    title: "美国放弃使用化学剂的原因",
    question: "根据材料，说明美国放弃在越战中使用化学剂的原因。",
    keyPoint: "科学界反对；联合国重视环境；国内反战运动；未达到战争目的；对美军士兵造成伤害",
    commonError: "可补充国际舆论压力",
    explanation: "美国因国内外多方压力和化学剂未能达到预期效果，最终放弃在越战中使用化学剂。"
  },
  {
    id: 34,
    year: "2021",
    tag: "越南战争",
    title: "使用化学剂的后果",
    question: "根据材料，说明美国在越战中使用化学剂的后果。",
    keyPoint: "生态环境破坏；越南人民健康受损；美军士兵患病；美国国际形象受损；推动环保立法",
    commonError: "国内经济破坏无依据、答案过于简略",
    explanation: "越战化学剂造成生态灾难和人员伤害，严重损害美国国际形象，推动了国际环保立法进程。"
  },
  {
    id: 35,
    year: "2021",
    tag: "史学评价",
    title: "三则材料对冯道的评价",
    question: "根据材料，分别概括三则材料对冯道的评价。",
    keyPoint: "评价一：学识渊博品行端正；评价二：肯定风度但质疑忠节；评价三：批判无礼无耻无气节",
    commonError: "评价二有误忽略质疑、评价三未补充儒家忠义观",
    explanation: "三则材料从不同立场评价冯道：《旧五代史》肯定其才学，史臣质疑其忠诚，欧阳修严厉批判。"
  },
  {
    id: 36,
    year: "2021",
    tag: "史学评价",
    title: "影响人物评价的因素",
    question: "根据材料，说明影响人物评价的因素。",
    keyPoint: "评价者立场；时代背景；传统观念；史料掌握；政治环境；评价标准差异",
    commonError: "三点均正确但可补充更多维度",
    explanation: "历史人物评价受多种因素影响，包括评价者的价值观、所处时代、掌握史料、政治环境等。"
  },
  {
    id: 37,
    year: "2022",
    tag: "苏伊士运河战争",
    title: "美国对英国态度变化及目的",
    question: "简析苏伊士运河战争爆发前后美国对英国的态度变化及其目的。",
    keyPoint: "变化：撤援激化矛盾→联合苏联施压停火；目的：削弱英法、扩大美国势力、防止苏联渗透",
    commonError: "态度变化描述有误、目的分析过浅",
    explanation: "美国借苏伊士运河战争削弱英法在中东的传统影响力，填补权力真空，扩大自身势力范围。"
  },
  {
    id: 38,
    year: "2022",
    tag: "苏伊士运河战争",
    title: "苏伊士运河战争对西方阵营的影响",
    question: "说明苏伊士运河战争对当时西方阵营的影响。",
    keyPoint: "英法大国地位受挫；加速殖民体系瓦解；西方阵营裂痕；推动欧洲一体化；美国扩大中东影响",
    commonError: "深度不足、可补充更多要点",
    explanation: "苏伊士运河战争严重打击英法地位，加剧西方阵营分裂，客观上推动欧洲一体化进程。"
  },
  {
    id: 39,
    year: "2022",
    tag: "新中国政治",
    title: "毛泽东高度重视各界人民代表会议的原因",
    question: "说明毛泽东高度重视各界人民代表会议的原因。",
    keyPoint: "党的性质宗旨；为人大制度做准备；团结各界壮大统一战线；巩固新解放城市政权；贯彻群众路线",
    commonError: "推翻国民党的需要史实错误、原因不完整",
    explanation: "1949年毛泽东重视各界人民代表会议，是为建立人大制度做准备，巩固新政权，发扬人民民主。"
  },
  {
    id: 40,
    year: "2022",
    tag: "新中国政治",
    title: "各界人民代表会议的历史意义",
    question: "简析毛泽东督促召开各界人民代表会议的历史意义。",
    keyPoint: "体现人民当家作主；为人大制度积累经验；巩固新生政权；推动民主政治建设；彰显党的历史担当",
    commonError: "意义较空洞、缺乏具体展开",
    explanation: "各界人民代表会议是新中国民主政治的重要实践，为人民代表大会制度的建立积累了宝贵经验。"
  },
  {
    id: 41,
    year: "2023",
    tag: "东汉儒学",
    title: "东汉儒学与民德（梁启超观点）",
    question: "选取中国古代史，对梁启超'东汉民德较优'观点提出看法并阐述。",
    keyPoint: "认同：东汉儒学浓厚、察举孝廉引导道德、士大夫清议气节、党锢之祸殉道精神",
    commonError: "论点模糊、史实错误刘秀结束西汉、史论脱节",
    explanation: "东汉光武帝崇尚儒学，察举制以孝廉为标准，士大夫形成清议风气，民德确实达到较高水准。"
  },
  {
    id: 42,
    year: "2023",
    tag: "一战历史",
    title: "飞机在一战中使用情况的变化",
    question: "概括飞机在第一次世界大战中使用情况的变化。",
    keyPoint: "侦察→空战→配置机枪→编队作战（空中马戏团）→全金属飞机→数量优势掌握制空权",
    commonError: "一战前民用无中生有、技术演变过程缺失",
    explanation: "一战初期飞机仅用于侦察，后逐步发展为空战武器，1918年协约国凭借空中优势掌握制空权。"
  },
  {
    id: 43,
    year: "2023",
    tag: "一战历史",
    title: "飞机应用于一战所产生的影响",
    question: "简析飞机应用于第一次世界大战所产生的影响。",
    keyPoint: "改变战争形态（平面→立体）；推动制空权理论；加速战争结束；刺激飞机制造业；平民伤亡加剧",
    commonError: "为出行便利不贴切时间范围、严重缺失核心影响",
    explanation: "飞机使战争从平面扩展到立体空间，推动制空权理论形成，加剧战争残酷性，刺激航空技术发展。"
  },
  {
    id: 44,
    year: "2024",
    tag: "古代农业",
    title: "中国与西欧古代农业土地利用方式差异",
    question: "概括中国与西欧古代农业在土地利用方式上的主要差异。",
    keyPoint: "中国：连作制、精耕细作、水利粪肥、圩田梯田；西欧：休耕轮作、二圃三圃制、敞地制度、农牧结合",
    commonError: "未点明最核心差异、淤田笔误、遗漏敞地制度",
    explanation: "中国以连作制和精耕细作为主，西欧以休耕轮作和敞地制度为特征，形成不同农业文明路径。"
  },
  {
    id: 45,
    year: "2024",
    tag: "古代农业",
    title: "古代农业对文明发展的影响",
    question: "分别说明中国和西欧古代农业对文明发展的影响。",
    keyPoint: "中国：养活庞大人口、支撑统一多民族国家、孕育繁荣文明；西欧：封建庄园基础、推动城镇化、为资本主义萌芽奠基",
    commonError: "重复表述、遗漏材料核心、过于笼统",
    explanation: "中国农业支撑了统一多民族国家和中华文明延续；西欧农业推动了封建制度和近代资本主义发展。"
  },
  {
    id: 46,
    year: "2024",
    tag: "抗日战争",
    title: "1932年中华民族抗战短评",
    question: "根据1932年新闻报道，拟定主题写一篇短评。",
    keyPoint: "主题：1932年民族危亡与多方应对；史实：一二八事变、伪满洲国、十九路军抗战、国共对立",
    commonError: "引入1935年一二九运动超时间范围、主题过大、未运用材料新闻标题",
    explanation: "1932年外有日本侵略步步紧逼，内有国共武装对立，国民政府妥协与人民抗争形成鲜明对比。"
  },
  {
    id: 47,
    year: "2024",
    tag: "现代工业",
    title: "新中国成立以来装备制造业的发展",
    question: "概述新中国成立以来装备制造业的发展。",
    keyPoint: "奠基阶段一五计划建立新部门；发展阶段改革开放形成制造基地；腾飞阶段新时代自给率85%世界第一",
    commonError: "无阶段性概述、未提具体成就、地域布局未提及",
    explanation: "中国装备制造业从一五计划奠基，到改革开放发展，再到新时代高质量发展，成为世界第一制造大国。"
  },
  {
    id: 48,
    year: "2024",
    tag: "现代工业",
    title: "新时代推动装备制造业发展的主要因素",
    question: "概括新时代推动中国装备制造业发展的主要因素。",
    keyPoint: "党中央领导；产业政策支持；自主创新加大科研投入；数字化智能化转型升级；完整产业体系基础；科技工作者奉献精神",
    commonError: "语义重复、未提数字化智能化转型、表述不够精准",
    explanation: "新时代装备制造业发展得益于党的领导、自主创新战略、数字化转型和完整工业体系支撑。"
  },
  {
    id: 49,
    year: "2025",
    tag: "魏晋医学",
    title: "魏晋南北朝时期医学发展的特点",
    question: "概括魏晋南北朝时期医学发展的特点。",
    keyPoint: "官方医政体系完备；医学典籍整理编撰成就突出；服务对象兼顾贵族与平民体现仁爱；对外医学交流活跃",
    commonError: "遗漏服务对象多元、表述模糊",
    explanation: "魏晋南北朝时期医学在官方管理、典籍整理、对外交流和人文关怀等方面取得显著发展。"
  },
  {
    id: 50,
    year: "2025",
    tag: "魏晋医学",
    title: "魏晋南北朝医学发展的意义",
    question: "分析魏晋南北朝时期医学发展的意义。",
    keyPoint: "丰富系统化中医理论；为隋唐医学繁荣奠定基础；体现仁爱救世人文精神；促进中外文化交流",
    commonError: "方向正确但偏空泛、遗漏具体表述",
    explanation: "魏晋医学发展为后世中医理论体系完善和中外医学交流奠定了重要基础。"
  },
  {
    id: 51,
    year: "2025",
    tag: "中共党史",
    title: "中共不同时期的调查研究",
    question: "从材料中任选三则调查研究内容，结合中共不同时期任务与举措加以阐释。",
    keyPoint: "新时代精准扶贫因地制宜；土地革命时期调查农村为土地政策和扩红提供依据；社会主义改造时期调查工商业为三大改造提供数据",
    commonError: "阐释深度严重不足仅罗列关键词、有错别字",
    explanation: "调查研究是党制定正确路线政策的重要前提，贯穿各个历史时期，体现实事求是和群众路线。"
  },
  {
    id: 52,
    year: "2025",
    tag: "中共党史",
    title: "中共调查研究的历史启示",
    question: "简析中共调查研究的历史启示。",
    keyPoint: "调查研究是制定正确路线政策的前提；坚持实事求是理论联系实际；贯彻群众路线深入基层",
    commonError: "可补充更多要点",
    explanation: "调查研究是党的优良传统，是保持先进性和制定正确决策的关键方法。"
  },
  {
    id: 53,
    year: "2025",
    tag: "近代财税",
    title: "近代中英地方财税体制的差异",
    question: "比较近代中英两国地方财税体制的差异。",
    keyPoint: "形成方式：中国被动战乱、英国主动立法；税收性质：中国非正式杂税、英国专项税法律保障；中央地方关系：中国争夺、英国协作；监督机制：中国缺乏、英国多元监督",
    commonError: "遗漏税收性质和监督机制差异",
    explanation: "近代中英财税体制差异反映了两国政治制度和现代化路径的根本不同。"
  },
  {
    id: 54,
    year: "2025",
    tag: "近代财税",
    title: "近代中英财税体制的影响",
    question: "分别说明近代中英地方财税体制的影响。",
    keyPoint: "中国：加剧地方离心、阻碍商品流通、但为洋务运动提供财力；英国：推动城市化工业化、完善代议制、为福利国家奠基",
    commonError: "中国影响遗漏洋务运动财力、英国影响可补充福利国家",
    explanation: "中英财税体制对各自近代化进程产生了深远但截然不同的影响。"
  }
];

// ==========================================
// 前端 HTML / CSS / JS 代码
// ==========================================
const HTML_CONTENT = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>高考历史特训 - 艾宾浩斯记忆系统</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
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
    </style>
</head>
<body class="h-screen flex flex-col overflow-hidden">

    <!-- Header -->
    <header class="bg-white shadow-sm z-10">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-16 items-center">
                <div class="flex items-center">
                    <i class="fa-solid fa-scroll text-amber-600 text-2xl mr-3"></i>
                    <h1 class="text-xl font-bold text-gray-900 hidden sm:block">高考历史特训 <span class="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-1 rounded-full ml-2 border">v1.0.0</span></h1>
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
                    <h2 class="text-lg font-bold text-gray-900 mb-2"><i class="fa-solid fa-graduation-cap mr-2 text-amber-600"></i>高考历史 · 艾宾浩斯记忆特训</h2>
                    <p class="text-gray-600 text-sm mb-4">
                        本系统收录 ${historyQuestions.length} 道高考历史真题核心知识点，采用艾宾浩斯遗忘曲线算法，
                        自动安排复习计划，帮助你高效掌握历史知识。
                    </p>
                    <div class="flex items-center space-x-4 text-sm text-gray-500">
                        <span><i class="fa-solid fa-database mr-1"></i> Cloudflare D1 云端同步</span>
                        <span><i class="fa-solid fa-clock mr-1"></i> 智能复习提醒</span>
                        <span><i class="fa-solid fa-chart-line mr-1"></i> 进度追踪</span>
                    </div>
                </div>

                <div class="bg-white rounded-lg shadow overflow-hidden">
                    <div class="bg-gray-100 px-6 py-3 border-b flex justify-between items-center">
                        <h3 class="font-bold text-gray-800">题目库概览</h3>
                        <span class="text-sm text-gray-500">共 ${historyQuestions.length} 题</span>
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
                        <h2 class="text-xl sm:text-2xl font-bold text-gray-900 mb-2">历史知识突击检查</h2>
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

    <!-- 前端逻辑 -->
    <script>
        let userRecords = []; 
        let currentProfile = 'user1';
        let currentQuestionIndex = 0;
        let score = 0;
        let quizData = [];
        let isAnswered = false;

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

        // 历史题目数据库
        const mistakeDatabase = ${JSON.stringify(historyQuestions)};

        document.getElementById('total-questions-count').innerText = mistakeDatabase.length;

        // 初始化环境与数据库连接
        async function initApp() {
            await fetchMemoryRecords();
            renderQuestionList();
        }

        // 渲染题目列表
        function renderQuestionList() {
            const container = document.getElementById('question-list');
            let html = '';
            mistakeDatabase.forEach(q => {
                html += \`
                    <div class="border-b border-gray-100 pb-4 last:border-0">
                        <div class="flex items-start justify-between mb-2">
                            <div>
                                <span class="inline-block bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded mr-2">\${q.year}</span>
                                <span class="inline-block bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">\${q.tag}</span>
                            </div>
                            <span class="text-xs text-gray-400">#\${q.id}</span>
                        </div>
                        <h4 class="font-medium text-gray-800 mb-1">\${q.title}</h4>
                        <p class="text-sm text-gray-500 line-clamp-2">\${q.question}</p>
                    </div>
                \`;
            });
            container.innerHTML = html;
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

        // 生成干扰选项
        function generateDistractors(correctAnswer, questionId) {
            // 从其他题目的keyPoint中选取作为干扰项
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
            document.getElementById('sync-status').innerHTML = '<span class="text-purple-600"><i class="fa-solid fa-spinner fa-spin"></i> 拉取 ' + currentProfile + ' 数据...</span>';
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
            if (!confirm('确定要清除账号 ' + currentProfile + ' 的所有历史记忆数据吗？此操作不可恢复！')) return;
            
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
                        '<p class="text-sm text-gray-600 mb-2">' + q.question + '</p>' +
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
            
            document.getElementById('q-year').innerText = q.year + '年高考';
            document.getElementById('q-tag').innerText = q.tag;
            document.getElementById('q-title').innerText = q.title;
            document.getElementById('q-question').innerText = q.question;
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
