// 人才 Mapping 模块种子数据（以 Web 前端开发工程师为例的学习项目演示数据）
// 仅在 mapping_roles 为空时填充，避免覆盖用户手工维护的数据

const ALL_STATUS = ['discovered', 'valid_resume', 'contacted', 'interested', 'interview_invite', 'no_answer', 'rejected'];

function seed(db) {
  const count = db.prepare('SELECT COUNT(*) AS c FROM mapping_roles').get().c;
  if (count > 0) return;

  // ---------------- 1. 人才画像 ----------------
  db.prepare(
    `INSERT INTO mapping_roles
     (title, tech_stack, must_have, nice_to_have, min_years, max_years, business_background, degree_required, salary_range, search_keywords)
     VALUES (?,?,?,?,?,?,?,?,?,?)`,
  ).run(
    'Web前端开发工程师',
    'Vue3,React,TypeScript,Webpack,Vite,Node.js,CSS/HTML,小程序',
    '扎实 JavaScript 基础，熟悉 Vue 或 React 技术栈；掌握 TypeScript 工程化实践；具备独立完成需求开发到上线全流程的能力',
    '有大型项目性能优化经验；主导过组件库/工程脚手架建设；有跨端（小程序/Electron/RN）或 Node 全栈经验；开源贡献',
    3, 7,
    '电商,社交,音视频,企业服务SaaS,金融,出海',
    '本科及以上',
    '20k-35k·15薪',
    'Vue3,React,TypeScript,Vite,微前端,性能优化,Node.js,低代码,可视化大屏',
  );

  // ---------------- 2. 目标企业分析 ----------------
  const companies = [
    ['字节跳动', '大厂', 'S', '前端团队规模大、工程化体系成熟，候选人绩效导向强，平均司龄偏短（2-3年），流动率相对较高', '重点看抖音/电商等业务线 3-6 年经验 P6-P7 级工程师', 'React,TypeScript,性能优化', '25k-45k', '画像匹配度高但薪资溢价明显，注意期望差'],
    ['腾讯', '大厂', 'S', 'CSIG/WXG 前端底子厚，候选人稳定性好、平均司龄 4 年以上，技术深度强但薪资结构偏低现金', '看微信/会议/文档团队，偏业务深耕型人才', 'React,TypeScript,小程序', '24k-42k', '小程序+跨端背景与本公司生态高度契合'],
    ['阿里巴巴', '大厂', 'S', '淘天/本地生活前端以 React 为主，中台与组件库经验丰富，近两年组织调整带来的候选人流出增多', '抓住组织架构调整窗口期，优先接触近一年项目经历有变化的候选人', 'React,TypeScript,微前端', '25k-45k', '流出的中台人才适合平台型岗位'],
    ['美团', '大厂', 'A', '基础平台与到店/外卖前端团队规模稳定，工程务实，候选人多具备复杂业务系统经验', '看外卖/酒旅业务线 3-5 年工程师，抗压性与业务理解是优势', 'React,Vue3,TypeScript', '22k-40k', '薪资期望普遍在区间上限内，性价比可观'],
    ['快手', '大厂', 'A', '主站电商前端近年快速扩张，候选人成长快、项目密度大，京内人才池稳定', '重点看电商主站与可灵 AI 相关团队', 'React,TypeScript,可视化', '22k-38k', ''],
    ['小红书', '大厂', 'A', '社区与电商双线前端，候选人对产品体验敏感，设计还原要求高', '看社区技术/商业化团队，偏全栈趋势明显', 'React,TypeScript,Node.js', '22k-38k', '与设计/数据协作经历是加分项'],
    ['拼多多', '大厂', 'A', '前端规模精简、强度大，候选人多语言与性能功底扎实，但司龄普遍偏短', '适合快速补员场景，重点评估稳定性与协作风格匹配', 'React,TypeScript,性能优化', '26k-48k', '薪资高但工作强度需提前对齐预期'],
    ['大疆', '智能制造', 'B', '深圳软件前端偏可视化、WebGL、复杂交互，候选人工程与计算机图形学复合能力强', '看地图/图传/无人机软件部门前端，重可视化背景', 'Vue3,WebGL,TypeScript', '20k-35k', '可视化大屏经验与本岗位业务背景加分'],
    ['招商银行信用卡中心', '国企金融', 'B', '上海金融前端团队稳定、司龄长（平均 5 年+），技术栈偏 Vue，求稳型人才占比高', '看账单/还款/直播等 C 端模块负责人或资深工程师', 'Vue3,TypeScript,小程序', '18k-30k', '薪资期望多数落在本岗位区间内，稳定性好'],
    ['好未来', '教育', 'B', '教育科技前端规模大，互动课件与直播技术积累多，受行业调整影响有成熟人才流出', '优先接触互动课件/直播方向流出的 4-7 年经验工程师', 'React,Vue3,Node.js', '18k-32k', '流出人才性价比与稳定性兼顾'],
    ['Shopee', '出海电商', 'B', '出海电商前端规范化程度高，候选人英语与国际化协作能力强，多熟悉性能与弱网优化', '看虾皮/游戏业务前端，适合有出海诉求的候选人', 'React,TypeScript,性能优化', '20k-36k', '出海业务背景与本岗位业务要求契合'],
    ['SHEIN', '出海电商', 'B', '供应链与跨境电商品前端迭代快，候选人工程效率高、适应快节奏', '看广州总部商品/履约系统前端团队', 'Vue3,TypeScript,低代码', '20k-35k', ''],
    ['PingCAP', '基础软件', 'C', '基础设施软件公司前端偏可视化与大盘监控，候选人技术深度强、规模小但精', '看 TiDB Dashboard 相关团队，适合可视化方向深耕人才', 'React,TypeScript,可视化', '25k-40k', '人才池小，触达成本高，作为储备观察'],
    ['涂鸦智能', 'IoT', 'C', 'IoT 平台前端多涉及小程序与低代码搭建，候选人业务复合度高', '看开发者平台与 SaaS 控制台团队', 'Vue3,小程序,低代码', '18k-30k', ''],
  ];
  const insCompany = db.prepare(
    'INSERT INTO target_companies (name, type, tier, talent_distribution, search_direction, focus_stacks, salary_level, note) VALUES (?,?,?,?,?,?,?,?)',
  );
  for (const c of companies) insCompany.run(...c);

  // ---------------- 3. Mapping 信息表（结构化候选人台账） ----------------
  const lastNames = ['王', '李', '张', '刘', '陈', '杨', '赵', '黄', '周', '吴', '徐', '孙', '马', '朱', '胡', '郭', '何', '高', '林', '罗'];
  const firstNames = ['伟', '芳', '娜', '磊', '洋', '勇', '军', '杰', '涛', '明', '超', '鹏', '辉', '雪', '敏', '宇', '浩', '婷', '雷', '峰'];
  const skillPool = [
    ['Vue3', 'TypeScript', 'Vite', 'Element Plus'],
    ['React', 'TypeScript', 'Webpack', 'Redux'],
    ['Vue3', 'React', 'Node.js', '微前端'],
    ['React', '性能优化', 'TypeScript'],
    ['Vue3', '小程序', 'uni-app'],
    ['TypeScript', '可视化大屏', 'ECharts'],
    ['React', '低代码', 'Node.js', 'Nest.js'],
    ['Vue3', 'CSS工程化', 'webpack', '性能优化'],
  ];
  const titlesByTier = { S: ['高级前端工程师', '资深前端工程师', '前端技术专家'], A: ['高级前端工程师', '前端工程师', '资深前端工程师'], B: ['前端工程师', '资深前端工程师', '前端负责人'], C: ['前端工程师', '高级前端工程师'] };
  const degrees = ['本科', '本科', '本科', '硕士', '大专'];
  const channels = ['BOSS直聘', '脉脉', '掘金', 'GitHub', '猎聘', '内推', '领英'];
  const bizBg = ['电商', '社交', '音视频', '企业服务SaaS', '金融', '出海', '教育', 'IoT'];

  const rand = (n) => Math.floor(Math.random() * n);
  const tierList = db.prepare('SELECT name, tier FROM target_companies').all();

  // 状态分布：模拟真实 Mapping 台账 —— 大量刚发现，逐级收敛到面试邀约
  const statusFlow = [
    ...Array(12).fill('discovered'),
    ...Array(8).fill('valid_resume'),
    ...Array(6).fill('contacted'),
    ...Array(4).fill('interested'),
    ...Array(5).fill('interview_invite'),
    ...Array(3).fill('no_answer'),
    ...Array(4).fill('rejected'),
  ];

  const insRecord = db.prepare(
    `INSERT INTO mapping_records
     (name, phone, company, title, skill_keywords, years, degree, business_bg, salary_expect, source_channel, status, match_level, remark, created_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,datetime('now','localtime',?))`,
  );
  const insLog = db.prepare('INSERT INTO mapping_status_logs (record_id, from_status, to_status, created_at) VALUES (?,?,?,datetime(\'now\',\'localtime\',?))');

  for (let i = 0; i < statusFlow.length; i++) {
    const name = lastNames[rand(lastNames.length)] + firstNames[rand(firstNames.length)];
    const co = tierList[rand(tierList.length)];
    const years = 3 + rand(5); // 3~7 年，贴合画像
    const skills = skillPool[rand(skillPool.length)];
    const degree = degrees[rand(degrees.length)];
    // 匹配度：年限+学历+技术栈综合的简化模拟
    const matchRoll = Math.random();
    const match = matchRoll > 0.45 ? 'high' : matchRoll > 0.15 ? 'mid' : 'low';
    const salaryBase = 18 + years * 2 + rand(6);
    const daysAgo = -rand(21); // 近三周内陆续录入
    const status = statusFlow[i];

    insRecord.run(
      name,
      `139${String(10000000 + rand(89999999)).slice(0, 8)}`,
      co.name,
      titlesByTier[co.tier][rand(titlesByTier[co.tier].length)],
      skills.join(','),
      years,
      degree,
      bizBg[rand(bizBg.length)],
      `当前${salaryBase}k·期望${salaryBase + 3 + rand(5)}k`,
      channels[rand(channels.length)],
      status,
      match,
      status === 'interview_invite' ? '已约面，重点跟进' : status === 'no_answer' ? '两次触达未回复，一周后再试' : '',
      `${daysAgo} days`,
    );

    // 已进入后续环节的，补一条状态流转日志（初始发现 -> 当前状态）
    if (!['discovered'].includes(status)) {
      const rid = db.prepare('SELECT last_insert_rowid() AS id').get().id;
      insLog.run(rid, 'discovered', status, `${daysAgo + 1} days`);
    }
  }

  const total = db.prepare('SELECT COUNT(*) AS c FROM mapping_records').get().c;
  console.log(`[mapping-seed] roles=1, companies=${companies.length}, records=${total}`);
}

module.exports = { seed, ALL_STATUS };
