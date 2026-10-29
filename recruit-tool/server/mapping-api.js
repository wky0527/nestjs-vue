// 人才 Mapping 模块 API：画像 / 目标企业 / 信息表 / 数据统计
const { ALL_STATUS } = require('./mapping-seed');

// 搜索环节漏斗（到达某环节 = 处于该环节或更靠后的环节；no_answer/rejected 为流失）
const FUNNEL_ORDER = ['discovered', 'valid_resume', 'contacted', 'interested', 'interview_invite'];
const FUNNEL_LABELS = {
  discovered: '人才搜索',
  valid_resume: '有效简历',
  contacted: '初步沟通',
  interested: '有意向',
  interview_invite: '面试邀约',
};
const STATUS_SET = [...ALL_STATUS];

module.exports = function register(app, db) {
  const ok = (res, data) => res.json({ code: 0, data });
  const fail = (res, msg, status = 400) => res.status(status).json({ code: 1, message: msg });

  // ---------------- 人才画像 ----------------
  app.get('/api/mapping/roles', (req, res) => {
    ok(res, db.prepare('SELECT * FROM mapping_roles ORDER BY id').all());
  });

  app.post('/api/mapping/roles', (req, res) => {
    const b = req.body;
    if (!b.title) return fail(res, '岗位名称必填');
    const r = db.prepare(
      `INSERT INTO mapping_roles (title, tech_stack, must_have, nice_to_have, min_years, max_years, business_background, degree_required, salary_range, search_keywords)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
    ).run(
      b.title, b.tech_stack || '', b.must_have || '', b.nice_to_have || '', b.min_years ?? 0, b.max_years ?? null,
      b.business_background || '', b.degree_required || '', b.salary_range || '', b.search_keywords || '',
    );
    ok(res, { id: Number(r.lastInsertRowid) });
  });

  app.put('/api/mapping/roles/:id', (req, res) => {
    const b = req.body;
    if (!b.title) return fail(res, '岗位名称必填');
    db.prepare(
      `UPDATE mapping_roles SET title=?, tech_stack=?, must_have=?, nice_to_have=?, min_years=?, max_years=?,
       business_background=?, degree_required=?, salary_range=?, search_keywords=?, updated_at=datetime('now','localtime') WHERE id=?`,
    ).run(
      b.title, b.tech_stack || '', b.must_have || '', b.nice_to_have || '', b.min_years ?? 0, b.max_years ?? null,
      b.business_background || '', b.degree_required || '', b.salary_range || '', b.search_keywords || '', req.params.id,
    );
    ok(res, true);
  });

  // ---------------- 目标企业分析 ----------------
  app.get('/api/mapping/companies', (req, res) => {
    const { tier, keyword } = req.query;
    let sql = 'SELECT * FROM target_companies WHERE 1=1';
    const params = [];
    if (tier) { sql += ' AND tier = ?'; params.push(tier); }
    if (keyword) { sql += ' AND (name LIKE ? OR type LIKE ?)'; params.push(`%${keyword}%`, `%${keyword}%`); }
    sql += ' ORDER BY tier ASC, id ASC';
    ok(res, db.prepare(sql).all(...params));
  });

  app.post('/api/mapping/companies', (req, res) => {
    const b = req.body;
    if (!b.name) return fail(res, '企业名称必填');
    const r = db
      .prepare('INSERT INTO target_companies (name, type, tier, talent_distribution, search_direction, focus_stacks, salary_level, note) VALUES (?,?,?,?,?,?,?,?)')
      .run(b.name, b.type || '', b.tier || 'B', b.talent_distribution || '', b.search_direction || '', b.focus_stacks || '', b.salary_level || '', b.note || '');
    ok(res, { id: Number(r.lastInsertRowid) });
  });

  app.put('/api/mapping/companies/:id', (req, res) => {
    const b = req.body;
    if (!b.name) return fail(res, '企业名称必填');
    db.prepare(
      'UPDATE target_companies SET name=?, type=?, tier=?, talent_distribution=?, search_direction=?, focus_stacks=?, salary_level=?, note=? WHERE id=?',
    ).run(b.name, b.type || '', b.tier || 'B', b.talent_distribution || '', b.search_direction || '', b.focus_stacks || '', b.salary_level || '', b.note || '', req.params.id);
    ok(res, true);
  });

  app.delete('/api/mapping/companies/:id', (req, res) => {
    db.prepare('DELETE FROM target_companies WHERE id=?').run(req.params.id);
    ok(res, true);
  });

  // ---------------- Mapping 信息表 ----------------
  app.get('/api/mapping/records', (req, res) => {
    const { company, channel, status, match, keyword } = req.query;
    let sql = 'SELECT * FROM mapping_records WHERE is_deleted = 0';
    const params = [];
    if (company) { sql += ' AND company = ?'; params.push(company); }
    if (channel) { sql += ' AND source_channel = ?'; params.push(channel); }
    if (status) { sql += ' AND status = ?'; params.push(status); }
    if (match) { sql += ' AND match_level = ?'; params.push(match); }
    if (keyword) {
      sql += ' AND (name LIKE ? OR skill_keywords LIKE ? OR phone LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }
    sql += ' ORDER BY id DESC';
    ok(res, db.prepare(sql).all(...params));
  });

  app.post('/api/mapping/records', (req, res) => {
    const b = req.body;
    if (!b.name) return fail(res, '候选人姓名必填');
    if (b.status && !STATUS_SET.includes(b.status)) return fail(res, '无效状态');
    const r = db.prepare(
      `INSERT INTO mapping_records (name, phone, company, title, skill_keywords, years, degree, business_bg, salary_expect, source_channel, status, match_level, remark)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    ).run(
      b.name, b.phone || '', b.company || '', b.title || '', b.skill_keywords || '', b.years ?? null,
      b.degree || '', b.business_bg || '', b.salary_expect || '', b.source_channel || 'BOSS直聘',
      b.status || 'discovered', b.match_level || '', b.remark || '',
    );
    ok(res, { id: Number(r.lastInsertRowid) });
  });

  app.put('/api/mapping/records/:id', (req, res) => {
    const b = req.body;
    if (!b.name) return fail(res, '候选人姓名必填');
    const old = db.prepare('SELECT * FROM mapping_records WHERE id=?').get(req.params.id);
    if (!old) return fail(res, '记录不存在', 404);
    db.prepare(
      `UPDATE mapping_records SET name=?, phone=?, company=?, title=?, skill_keywords=?, years=?, degree=?, business_bg=?,
       salary_expect=?, source_channel=?, status=?, match_level=?, remark=?, updated_at=datetime('now','localtime') WHERE id=?`,
    ).run(
      b.name, b.phone || '', b.company || '', b.title || '', b.skill_keywords || '', b.years ?? null,
      b.degree || '', b.business_bg || '', b.salary_expect || '', b.source_channel || '',
      b.status || old.status, b.match_level || '', b.remark || '', req.params.id,
    );
    if (b.status && b.status !== old.status) {
      db.prepare('INSERT INTO mapping_status_logs (record_id, from_status, to_status) VALUES (?,?,?)').run(req.params.id, old.status, b.status);
    }
    ok(res, true);
  });

  // 快速流转状态
  app.post('/api/mapping/records/:id/status', (req, res) => {
    const { status } = req.body;
    if (!STATUS_SET.includes(status)) return fail(res, '无效状态');
    const old = db.prepare('SELECT * FROM mapping_records WHERE id=?').get(req.params.id);
    if (!old) return fail(res, '记录不存在', 404);
    db.prepare(`UPDATE mapping_records SET status=?, updated_at=datetime('now','localtime') WHERE id=?`).run(status, req.params.id);
    if (old.status !== status) {
      db.prepare('INSERT INTO mapping_status_logs (record_id, from_status, to_status) VALUES (?,?,?)').run(req.params.id, old.status, status);
    }
    ok(res, true);
  });

  app.delete('/api/mapping/records/:id', (req, res) => {
    db.prepare('UPDATE mapping_records SET is_deleted = 1 WHERE id=?').run(req.params.id);
    ok(res, true);
  });

  app.get('/api/mapping/records/:id/logs', (req, res) => {
    ok(res, db.prepare('SELECT * FROM mapping_status_logs WHERE record_id=? ORDER BY id').all(req.params.id));
  });

  // ---------------- 招聘数据统计（搜索→有效简历→初步沟通→面试邀约） ----------------
  app.get('/api/mapping/stats', (req, res) => {
    const rows = db.prepare('SELECT status, source_channel, company, skill_keywords, years, match_level FROM mapping_records WHERE is_deleted = 0').all();
    const byStatus = {};
    for (const r of rows) byStatus[r.status] = (byStatus[r.status] || 0) + 1;

    // 到达率漏斗：处于某环节或更靠后环节的人数之和
    const reached = FUNNEL_ORDER.map((st, i) => {
      const count = FUNNEL_ORDER.slice(i).reduce((s, x) => s + (byStatus[x] || 0), 0);
      return { status: st, label: FUNNEL_LABELS[st], count };
    });
    const funnel = reached.map((r, i) => {
      const prev = i === 0 ? null : reached[i - 1].count;
      return {
        ...r,
        conversion: i === 0 ? 100 : prev ? +((r.count / prev) * 100).toFixed(1) : 0,
      };
    });

    const total = rows.length;
    const interview = byStatus.interview_invite || 0;

    // 渠道产出：各渠道的搜索人数、有效简历数与面试邀约转化率
    const channelMap = {};
    for (const r of rows) {
      const ch = r.source_channel || '未知';
      if (!channelMap[ch]) channelMap[ch] = { channel: ch, total: 0, valid: 0, invites: 0 };
      channelMap[ch].total += 1;
      if (['valid_resume', 'contacted', 'interested', 'interview_invite'].includes(r.status)) channelMap[ch].valid += 1;
      if (r.status === 'interview_invite') channelMap[ch].invites += 1;
    }
    const channels = Object.values(channelMap)
      .map((c) => ({
        ...c,
        inviteRate: c.total ? +((c.invites / c.total) * 100).toFixed(1) : 0,
      }))
      .sort((a, b) => b.total - a.total);

    // 企业梯队分布
    const coRows = db
      .prepare(
        `SELECT t.tier, COUNT(*) c FROM mapping_records r LEFT JOIN target_companies t ON r.company = t.name
         WHERE r.is_deleted = 0 GROUP BY t.tier ORDER BY t.tier`,
      )
      .all();
    const companyTiers = coRows.map((r) => ({ tier: r.tier || '未匹配', count: r.c }));

    // 技能关键词词频（用于校验搜索方向是否跑偏）
    const kwCount = {};
    for (const r of rows) for (const k of (r.skill_keywords || '').split(/[,，]/)) if (k.trim()) kwCount[k.trim()] = (kwCount[k.trim()] || 0) + 1;
    const keywords = Object.entries(kwCount)
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12);

    // 匹配度分布
    const matchRows = db
      .prepare(`SELECT match_level, COUNT(*) c FROM mapping_records WHERE is_deleted = 0 AND match_level != '' GROUP BY match_level`)
      .all();

    ok(res, {
      total,
      funnel,
      summary: {
        searched: total,
        validResume: (byStatus.valid_resume || 0) + interview + (byStatus.contacted || 0) + (byStatus.interested || 0),
        contacted: interview + (byStatus.interested || 0) + (byStatus.contacted || 0),
        interviewInvite: interview,
        overallRate: total ? +((interview / total) * 100).toFixed(1) : 0,
      },
      channels,
      companyTiers,
      keywords,
      matchLevels: matchRows,
    });
  });
};
