// AI 简历辅助分析引擎
// 默认使用内置规则引擎（离线可用）；若配置 OPENAI_API_KEY 则优先调用大模型，失败自动降级。
// 所有分析结果均需人工确认后才写入候选人档案（ai_status: analyzed -> confirmed）。

const SKILL_LIBRARY = [
  'Vue3', 'Vue', 'React', 'TypeScript', 'JavaScript', 'Webpack', 'Vite', 'CSS', 'HTML', '小程序',
  'Node.js', 'Nest.js', 'Express', 'Java', 'Python', 'Go', 'MySQL', 'PostgreSQL', 'Redis', 'MongoDB',
  'TypeORM', 'Docker', 'Kubernetes', 'CI/CD', '高并发', '微服务', '性能优化',
  'Figma', 'Sketch', '交互设计', '视觉规范', '原型设计',
  '需求分析', '项目管理', 'Axure', 'SQL', 'Python', 'Tableau', '统计建模', '漏斗分析', '归因分析', '数据看板',
  'Selenium', 'Pytest', 'JMeter', '自动化测试', '性能测试', '测试平台',
  '沟通', '协作', '团队管理', '跨部门', '带团队', '英语',
];

const DEGREES = ['博士', '硕士', '本科', '大专'];

function extractYears(text) {
  const m = text.match(/(\d+(?:\.\d+)?)\s*年(?:以下)?(?:工作)?经验/);
  return m ? parseFloat(m[1]) : 0;
}

function extractDegree(text) {
  for (const d of DEGREES) if (text.includes(d)) return d;
  return '未标注';
}

function extractSkills(text) {
  const found = [];
  for (const s of SKILL_LIBRARY) {
    const lower = text.toLowerCase();
    if (lower.includes(s.toLowerCase())) found.push(s);
  }
  return [...new Set(found)];
}

function extractHighlights(text) {
  const verbs = ['主导', '负责', '从0到1', '重构', '优化', '搭建', '设计', '独立完成', '带过'];
  const sentences = text.split(/[。；;\n]/).filter(Boolean);
  return sentences.filter((s) => verbs.some((v) => s.includes(v))).map((s) => s.trim()).slice(0, 5);
}

function requirementKeywords(requirement = '') {
  // 职位要求拆词：按 、/，,空格 拆分并去掉年限描述
  return requirement
    .split(/[、/，,\s]+/)
    .map((w) => w.replace(/\d+年以上?.*$/, '').trim())
    .filter((w) => w.length > 0);
}

function ruleAnalyze(resumeText, job) {
  const text = resumeText || '';
  const years = extractYears(text);
  const degree = extractDegree(text);
  const skills = extractSkills(text);
  const highlights = extractHighlights(text);

  const reqKw = requirementKeywords(job?.requirement);
  const matched = reqKw.filter((k) => skills.some((s) => s.toLowerCase().includes(k.toLowerCase())) || text.includes(k));
  const missing = reqKw.filter((k) => !matched.includes(k));
  const matchRate = reqKw.length ? matched.length / reqKw.length : 0.5;

  // 分项评分
  const skillScore = matchRate * 40; // 技能匹配 40
  const requireYears = job?.requirement ? (job.requirement.match(/(\d+)年以上/) || [])[1] || 3 : 3;
  const yearRatio = Math.min(1, years / Number(requireYears));
  const yearScore = yearRatio * 25; // 经验年限 25
  const degreeMap = { 博士: 15, 硕士: 13, 本科: 10, 大专: 6, 未标注: 3 };
  const degreeScore = degreeMap[degree]; // 学历 15
  const projectScore = Math.min(1, highlights.length / 3) * 20; // 项目深度 20
  const score = Math.round(Math.min(100, skillScore + yearScore + degreeScore + projectScore));

  const strengths = [];
  if (matched.length) strengths.push(`技能与岗位匹配：${matched.join('、')}`);
  if (years >= Number(requireYears)) strengths.push(`经验年限达标（${years}年 ≥ 要求${requireYears}年）`);
  if (degree === '硕士' || degree === '博士') strengths.push(`学历优势（${degree}）`);
  highlights.slice(0, 2).forEach((h) => strengths.push(`项目亮点：${h}`));

  const risks = [];
  if (missing.length) risks.push(`未覆盖岗位要求：${missing.join('、')}`);
  if (years < Number(requireYears)) risks.push(`经验年限不足（${years}年 < 要求${requireYears}年）`);
  if (degree === '未标注') risks.push('简历未标注学历信息，需核实');
  if (!highlights.length) risks.push('缺少可量化的项目成果描述');

  const questions = [];
  missing.slice(0, 3).forEach((k) => questions.push(`请描述一个你在真实项目中使用/解决「${k}」相关问题的案例。`));
  if (highlights.length) questions.push(`深入追问项目亮点：「${highlights[0]}」中你的具体分工与量化收益是什么？`);
  if (years < Number(requireYears)) questions.push('经验年限低于要求，请说明快速上手该岗位的计划和过往学习路径。');

  let conclusion;
  if (score >= 78) conclusion = '建议进入面试';
  else if (score >= 62) conclusion = '待定，需补充面试考察';
  else conclusion = '建议淘汰';

  return {
    engine: 'rule',
    score,
    conclusion,
    dimensions: {
      技能匹配: Math.round(skillScore),
      经验年限: Math.round(yearScore),
      学历背景: Math.round(degreeScore),
      项目深度: Math.round(projectScore),
    },
    extracted: { years, degree, skills, matchedRequirements: matched, missingRequirements: missing },
    strengths: strengths.length ? strengths : ['暂无显著亮点'],
    risks: risks.length ? risks : ['暂无明显风险'],
    interview_questions: questions.length ? questions : ['常规基础问题考察即可'],
    disclaimer: '以上为AI辅助分析结果，仅供参考，最终结论需招聘负责人人工确认。',
  };
}

// 可选：OpenAI 兼容大模型分析（未配置 key 时自动走规则引擎）
async function llmAnalyze(resumeText, job) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const prompt =
    `你是资深招聘专家。请分析以下简历并输出一段JSON（不要markdown代码块），字段：` +
    `score(0-100整数), conclusion(建议进入面试/待定，需补充面试考察/建议淘汰), strengths(字符串数组), ` +
    `risks(字符串数组), interview_questions(字符串数组)。\n` +
    `岗位：${job?.title || '未知'}，要求：${job?.requirement || '无'}\n简历原文：\n${resumeText}`;
  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || '';
    const json = JSON.parse(content.replace(/```json|```/g, '').trim());
    return { ...json, engine: 'llm', disclaimer: '以上为AI辅助分析结果，仅供参考，最终结论需招聘负责人人工确认。' };
  } catch {
    return null; // 降级到规则引擎
  }
}

async function analyze(resumeText, job) {
  const llm = await llmAnalyze(resumeText, job);
  return llm || ruleAnalyze(resumeText, job);
}

module.exports = { analyze };
