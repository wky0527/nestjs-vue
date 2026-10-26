// 招聘自动化工具 - 后端服务
const express = require('express');
const { db, STAGES } = require('./db');
const { analyze } = require('./ai-analyzer');

const app = express();
app.use(express.json({ limit: '2mb' }));

const ok = (res, data) => res.json({ code: 0, data });
const fail = (res, msg, status = 400) => res.status(status).json({ code: 1, message: msg });

// 阶段推进顺序（用于漏斗到达率计算：处于某阶段 => 已到达该阶段及之前所有阶段）
const FUNNEL_ORDER = ['new_resume', 'screening', 'interview1', 'interview2', 'offer', 'hired'];

// ---------------- 职位管理 ----------------
app.get('/api/jobs', (req, res) => {
  const rows = db.prepare('SELECT * FROM jobs ORDER BY id DESC').all();
  ok(res, rows);
});

app.post('/api/jobs', (req, res) => {
  const { title, department, headcount = 1, salary_range, requirement, status = 'open' } = req.body;
  if (!title || !department) return fail(res, '职位名称和部门必填');
  const r = db
    .prepare('INSERT INTO jobs (title, department, headcount, salary_range, requirement, status) VALUES (?,?,?,?,?,?)')
    .run(title, department, headcount, salary_range || '', requirement || '', status);
  ok(res, { id: Number(r.lastInsertRowid) });
});

app.put('/api/jobs/:id', (req, res) => {
  const { title, department, headcount, salary_range, requirement, status } = req.body;
  db.prepare(
    'UPDATE jobs SET title=?, department=?, headcount=?, salary_range=?, requirement=?, status=? WHERE id=?',
  ).run(title, department, headcount, salary_range, requirement, status, req.params.id);
  ok(res, true);
});

app.delete('/api/jobs/:id', (req, res) => {
  db.prepare('DELETE FROM jobs WHERE id=?').run(req.params.id);
  ok(res, true);
});

// ---------------- 候选人管理 ----------------
app.get('/api/candidates', (req, res) => {
  const { jobId, stage, channel, keyword, aiStatus } = req.query;
  let sql = 'SELECT c.*, j.title AS job_title FROM candidates c LEFT JOIN jobs j ON c.job_id = j.id WHERE c.is_deleted = 0';
  const params = [];
  if (jobId) { sql += ' AND c.job_id = ?'; params.push(jobId); }
  if (stage) { sql += ' AND c.stage = ?'; params.push(stage); }
  if (channel) { sql += ' AND c.channel = ?'; params.push(channel); }
  if (aiStatus) { sql += ' AND c.ai_status = ?'; params.push(aiStatus); }
  if (keyword) { sql += ' AND (c.name LIKE ? OR c.phone LIKE ?)'; params.push(`%${keyword}%`, `%${keyword}%`); }
  sql += ' ORDER BY c.id DESC';
  const rows = db.prepare(sql).all(...params);
  ok(res, rows);
});

app.get('/api/candidates/:id', (req, res) => {
  const row = db
    .prepare('SELECT c.*, j.title AS job_title, j.requirement AS job_requirement FROM candidates c LEFT JOIN jobs j ON c.job_id = j.id WHERE c.id = ?')
    .get(req.params.id);
  if (!row) return fail(res, '候选人不存在', 404);
  const follows = db.prepare('SELECT * FROM follow_logs WHERE candidate_id=? ORDER BY id DESC').all(req.params.id);
  const analyses = db.prepare('SELECT * FROM ai_analyses WHERE candidate_id=? ORDER BY id DESC').all(req.params.id);
  ok(res, { ...row, follows, analyses });
});

app.post('/api/candidates', (req, res) => {
  const { name, phone, email, job_id, channel, stage = 'new_resume', resume_text, next_follow_date } = req.body;
  if (!name) return fail(res, '候选人姓名必填');
  const r = db
    .prepare(
      `INSERT INTO candidates (name, phone, email, job_id, channel, stage, resume_text, next_follow_date, stage_updated_at)
       VALUES (?,?,?,?,?,?,?,?,datetime('now','localtime'))`,
    )
    .run(name, phone || '', email || '', job_id || null, channel || '官网投递', stage, resume_text || '', next_follow_date || null);
  ok(res, { id: Number(r.lastInsertRowid) });
});

app.put('/api/candidates/:id', (req, res) => {
  const { name, phone, email, job_id, channel, stage, resume_text, next_follow_date } = req.body;
  const old = db.prepare('SELECT * FROM candidates WHERE id=?').get(req.params.id);
  if (!old) return fail(res, '候选人不存在', 404);
  const stageChanged = stage && stage !== old.stage;
  db.prepare(
    `UPDATE candidates SET name=?, phone=?, email=?, job_id=?, channel=?, stage=?, resume_text=?, next_follow_date=?,
     stage_updated_at=${stageChanged ? `datetime('now','localtime')` : 'stage_updated_at'} WHERE id=?`,
  ).run(name, phone, email, job_id || null, channel, stage, resume_text || '', next_follow_date || null, req.params.id);
  ok(res, true);
});

app.delete('/api/candidates/:id', (req, res) => {
  db.prepare('UPDATE candidates SET is_deleted = 1 WHERE id=?').run(req.params.id);
  ok(res, true);
});

// 快速推进阶段（漏斗操作）
app.post('/api/candidates/:id/stage', (req, res) => {
  const { stage } = req.body;
  if (!STAGES.includes(stage)) return fail(res, '无效阶段');
  db.prepare(`UPDATE candidates SET stage=?, stage_updated_at=datetime('now','localtime') WHERE id=?`).run(stage, req.params.id);
  ok(res, true);
});

// ---------------- 跟进提醒 ----------------
app.get('/api/reminders', (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const rows = db
    .prepare(
      `SELECT c.*, j.title AS job_title,
        CAST(julianday(?) - julianday(c.next_follow_date) AS INTEGER) AS overdue_days
       FROM candidates c LEFT JOIN jobs j ON c.job_id = j.id
       WHERE c.is_deleted = 0 AND c.next_follow_date IS NOT NULL
         AND c.next_follow_date <= ? AND c.stage NOT IN ('hired','rejected')
       ORDER BY c.next_follow_date ASC`,
    )
    .all(today, today);
  ok(res, rows);
});

app.post('/api/candidates/:id/follow', (req, res) => {
  const { content, next_follow_date } = req.body;
  if (!content) return fail(res, '跟进内容必填');
  db.prepare('INSERT INTO follow_logs (candidate_id, content) VALUES (?,?)').run(req.params.id, content);
  if (next_follow_date) {
    db.prepare('UPDATE candidates SET next_follow_date=? WHERE id=?').run(next_follow_date, req.params.id);
  }
  ok(res, true);
});

app.get('/api/candidates/:id/follows', (req, res) => {
  const rows = db.prepare('SELECT * FROM follow_logs WHERE candidate_id=? ORDER BY id DESC').all(req.params.id);
  ok(res, rows);
});

// ---------------- 招聘数据自动统计 ----------------
app.get('/api/stats/overview', (req, res) => {
  const one = (sql, ...p) => db.prepare(sql).get(...p);
  const stats = {
    jobOpen: one(`SELECT COUNT(*) c FROM jobs WHERE status='open'`).c,
    jobTotal: one('SELECT COUNT(*) c FROM jobs').c,
    candidateTotal: one('SELECT COUNT(*) c FROM candidates WHERE is_deleted=0').c,
    newThisWeek: one(
      `SELECT COUNT(*) c FROM candidates WHERE created_at >= datetime('now','localtime','-7 days')`,
    ).c,
    interviewing: one(
      `SELECT COUNT(*) c FROM candidates WHERE is_deleted=0 AND stage IN ('interview1','interview2')`,
    ).c,
    offerPending: one(`SELECT COUNT(*) c FROM candidates WHERE is_deleted=0 AND stage='offer'`).c,
    hired: one(`SELECT COUNT(*) c FROM candidates WHERE is_deleted=0 AND stage='hired'`).c,
    rejected: one(`SELECT COUNT(*) c FROM candidates WHERE is_deleted=0 AND stage='rejected'`).c,
    aiPending: one(`SELECT COUNT(*) c FROM candidates WHERE is_deleted=0 AND ai_status='pending' AND resume_text IS NOT NULL AND resume_text != ''`).c,
    aiWaitingConfirm: one(`SELECT COUNT(*) c FROM candidates WHERE is_deleted=0 AND ai_status='analyzed'`).c,
  };
  // 近8周投递趋势（自动按周分桶）
  const weeks = [];
  for (let i = 7; i >= 0; i--) {
    const row = one(
      `SELECT COUNT(*) c FROM candidates
       WHERE created_at >= datetime('now','localtime', ?) AND created_at < datetime('now','localtime', ?)`,
      `-${i * 7 + 7} days`,
      `-${i * 7} days`,
    );
    const label = new Date(Date.now() - i * 7 * 86400000).toISOString().slice(0, 10);
    weeks.push({ week: label, count: row.c });
  }
  // 渠道分布
  const channelDist = db
    .prepare(`SELECT channel, COUNT(*) c FROM candidates WHERE is_deleted=0 GROUP BY channel ORDER BY c DESC`)
    .all();
  // 需跟进数量
  stats.followDueToday = db
    .prepare(
      `SELECT COUNT(*) c FROM candidates WHERE is_deleted=0 AND next_follow_date <= date('now','localtime')
       AND next_follow_date >= date('now','localtime') AND stage NOT IN ('hired','rejected')`,
    )
    .get().c;
  stats.followOverdue = db
    .prepare(
      `SELECT COUNT(*) c FROM candidates WHERE is_deleted=0 AND next_follow_date < date('now','localtime')
       AND stage NOT IN ('hired','rejected')`,
    )
    .get().c;
  ok(res, { stats, weeks, channelDist });
});

// ---------------- 招聘漏斗分析 ----------------
app.get('/api/stats/funnel', (req, res) => {
  const { jobId } = req.query;
  const where = jobId ? 'AND c.job_id = ?' : '';
  const params = jobId ? [jobId] : [];
  const rows = db
    .prepare(`SELECT c.stage, COUNT(*) c FROM candidates c WHERE c.is_deleted=0 ${where} GROUP BY c.stage`)
    .all(...params);
  const map = Object.fromEntries(rows.map((r) => [r.stage, r.c]));

  // 到达某阶段人数 = 处于该阶段及更晚阶段的人数之和（hired计入offer及之前）
  const reached = FUNNEL_ORDER.map((stage) => {
    const idx = FUNNEL_ORDER.indexOf(stage);
    const sum = FUNNEL_ORDER.slice(idx).reduce((s, st) => s + (map[st] || 0), 0);
    return { stage, count: sum };
  });

  const labels = {
    new_resume: '投递简历',
    screening: '简历初筛',
    interview1: '一面',
    interview2: '二面',
    offer: '发放Offer',
    hired: '成功入职',
  };
  const funnel = reached.map((r, i) => {
    const prev = i === 0 ? null : reached[i - 1].count;
    return {
      stage: r.stage,
      label: labels[r.stage],
      count: r.count,
      conversion: prev ? (prev === 0 ? 0 : +( (r.count / prev) * 100).toFixed(1)) : 100,
    };
  });

  ok(res, {
    funnel,
    rejected: map.rejected || 0,
    total: Object.values(map).reduce((s, v) => s + v, 0),
    hireRate: reached[0].count ? +((map.hired || 0) / reached[0].count * 100).toFixed(1) : 0,
    avgStageDays: db
      .prepare(
        `SELECT ROUND(AVG(julianday(stage_updated_at) - julianday(created_at)),1) avg FROM candidates
         WHERE is_deleted=0 AND stage='hired' ${where.replace('c.', '')}`,
      )
      .get(...params).avg || 0,
  });
});

// ---------------- 招聘渠道效果分析 ----------------
app.get('/api/stats/channels', (req, res) => {
  const rows = db
    .prepare(
      `SELECT channel,
        COUNT(*) total,
        SUM(CASE WHEN stage IN ('screening','interview1','interview2','offer','hired') THEN 1 ELSE 0 END) passed_screen,
        SUM(CASE WHEN stage IN ('interview1','interview2','offer','hired') THEN 1 ELSE 0 END) interviewed,
        SUM(CASE WHEN stage IN ('offer','hired') THEN 1 ELSE 0 END) offers,
        SUM(CASE WHEN stage='hired' THEN 1 ELSE 0 END) hired,
        SUM(CASE WHEN stage='rejected' THEN 1 ELSE 0 END) rejected
       FROM candidates WHERE is_deleted=0 GROUP BY channel ORDER BY total DESC`,
    )
    .all();
  const list = rows.map((r) => ({
    ...r,
    interviewRate: r.total ? +(r.interviewed / r.total * 100).toFixed(1) : 0,
    hireRate: r.total ? +(r.hired / r.total * 100).toFixed(1) : 0,
    // 有效候选人占比（进入面试及之后）
    qualityRate: r.total ? +(r.interviewed / r.total * 100).toFixed(1) : 0,
  }));
  // 综合效果评分：入职率*0.5 + 面试率*0.3 + 投递规模归一化*0.2
  const maxTotal = Math.max(...list.map((l) => l.total), 1);
  for (const c of list) {
    c.score = +(c.hireRate * 0.5 + c.interviewRate * 0.3 + (c.total / maxTotal) * 100 * 0.2).toFixed(1);
  }
  list.sort((a, b) => b.score - a.score);
  ok(res, list);
});

// ---------------- AI 简历辅助分析 ----------------
// 分析（不落库为最终结论，仅生成建议 + 保存分析记录为待确认状态）
app.post('/api/ai/analyze', async (req, res) => {
  const { candidateId, resumeText, jobId } = req.body;
  let text = resumeText;
  let job = null;
  let candidate = null;

  if (candidateId) {
    candidate = db.prepare('SELECT * FROM candidates WHERE id=?').get(candidateId);
    if (!candidate) return fail(res, '候选人不存在', 404);
    text = text || candidate.resume_text;
    if (candidate.job_id) job = db.prepare('SELECT * FROM jobs WHERE id=?').get(candidate.job_id);
  }
  if (jobId) job = db.prepare('SELECT * FROM jobs WHERE id=?').get(jobId);

  if (!text || !text.trim()) return fail(res, '简历内容为空，无法分析');

  const result = await analyze(text, job);

  if (candidate) {
    db.prepare(
      `INSERT INTO ai_analyses (candidate_id, engine, score, result_json, status) VALUES (?,?,?,?, 'analyzed')`,
    ).run(candidate.id, result.engine, result.score, JSON.stringify(result));
    db.prepare(`UPDATE candidates SET ai_score=?, ai_conclusion=?, ai_status='analyzed' WHERE id=?`).run(
      result.score, result.conclusion, candidate.id,
    );
  }
  ok(res, { candidateId: candidate?.id ?? null, result });
});

// 人工确认：采纳 / 修改后采纳 / 不采纳
app.post('/api/ai/confirm', (req, res) => {
  const { candidateId, action, finalConclusion, finalScore, note } = req.body;
  if (!candidateId) return fail(res, '缺少候选人ID');
  const candidate = db.prepare('SELECT * FROM candidates WHERE id=?').get(candidateId);
  if (!candidate) return fail(res, '候选人不存在', 404);

  if (action === 'reject') {
    // 不采纳AI结论：清空AI建议但标记已人工处理
    db.prepare(`UPDATE candidates SET ai_status='confirmed', ai_confirmed_note=? WHERE id=?`).run(
      `人工不采纳AI结论${note ? '：' + note : ''}`, candidateId,
    );
    db.prepare(
      `UPDATE ai_analyses SET status='confirmed', confirmed_note=? WHERE candidate_id=? AND status='analyzed'`,
    ).run(`不采纳。${note || ''}`, candidateId);
    return ok(res, true);
  }

  // 采纳或修改后采纳
  db.prepare(
    `UPDATE candidates SET ai_status='confirmed', ai_conclusion=?, ai_score=?, ai_confirmed_note=? WHERE id=?`,
  ).run(
    finalConclusion || candidate.ai_conclusion,
    finalScore ?? candidate.ai_score,
    note || (action === 'adjust' ? '人工修改后采纳' : '人工确认采纳'),
    candidateId,
  );
  db.prepare(
    `UPDATE ai_analyses SET status='confirmed', confirmed_note=? WHERE candidate_id=? AND status='analyzed'`,
  ).run(`${action === 'adjust' ? '修改后采纳' : '采纳'}。${note || ''}`, candidateId);

  // 采纳"建议进入面试"时自动推进到初筛通过（人工可再调整）
  if (action === 'accept' && (finalConclusion || candidate.ai_conclusion) === '建议进入面试' && candidate.stage === 'new_resume') {
    db.prepare(`UPDATE candidates SET stage='screening', stage_updated_at=datetime('now','localtime') WHERE id=?`).run(candidateId);
  }
  ok(res, true);
});

// 查询某候选人最近一次AI分析详情
app.get('/api/ai/analysis/:candidateId', (req, res) => {
  const row = db.prepare('SELECT * FROM ai_analyses WHERE candidate_id=? ORDER BY id DESC LIMIT 1').get(req.params.candidateId);
  if (!row) return ok(res, null);
  ok(res, { ...row, result: JSON.parse(row.result_json) });
});

// ---------------- 前端静态文件托管（生产/单服务模式） ----------------
const path = require('path');
const fs = require('fs');

const webDist = path.join(__dirname, '..', 'web', 'dist');
if (fs.existsSync(webDist)) {
  app.use(express.static(webDist));
  console.log(`✅ 前端目录: ${webDist}`);
} else {
  console.warn(`⚠️ 前端目录不存在: ${webDist}（请先在 web 目录执行 npm run build）`);
}

// SPA history 路由回退：非 /api 的 GET 请求返回 index.html
app.use((req, res, next) => {
  if (req.method !== 'GET') return next();
  if (req.path.startsWith('/api')) return next();
  const indexPath = path.join(webDist, 'index.html');
  if (fs.existsSync(indexPath)) return res.sendFile(indexPath);
  next();
});

// ---------------- 启动 ----------------
const PORT = process.env.PORT || 3200;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`招聘自动化工具后端已启动，监听端口 ${PORT}`);
});
