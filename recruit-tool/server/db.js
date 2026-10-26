// 数据库初始化与种子数据（使用 Node.js 内置 node:sqlite，无需原生编译依赖）
const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const DB_PATH = path.join(__dirname, 'recruit.sqlite');
const db = new DatabaseSync(DB_PATH);

db.exec('PRAGMA journal_mode = WAL;');

// ---------------- 表结构 ----------------
db.exec(`
CREATE TABLE IF NOT EXISTS jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  department TEXT NOT NULL,
  headcount INTEGER NOT NULL DEFAULT 1,
  salary_range TEXT,
  requirement TEXT,
  status TEXT NOT NULL DEFAULT 'open',        -- open / closed
  created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS candidates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  job_id INTEGER,
  channel TEXT NOT NULL DEFAULT '官网投递',    -- 招聘渠道
  stage TEXT NOT NULL DEFAULT 'new_resume',   -- 漏斗阶段，见 STAGES
  resume_text TEXT,                           -- 简历原文（供AI分析）
  ai_score REAL,                              -- AI评分（0-100）
  ai_conclusion TEXT,                         -- AI建议结论
  ai_status TEXT NOT NULL DEFAULT 'pending',  -- pending未分析 / analyzed待确认 / confirmed已人工确认
  ai_confirmed_note TEXT,                     -- 人工确认备注
  stage_updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
  next_follow_date TEXT,                      -- 下次跟进日期 YYYY-MM-DD
  is_deleted INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
  FOREIGN KEY (job_id) REFERENCES jobs(id)
);

CREATE TABLE IF NOT EXISTS follow_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  candidate_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
  FOREIGN KEY (candidate_id) REFERENCES candidates(id)
);

CREATE TABLE IF NOT EXISTS ai_analyses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  candidate_id INTEGER NOT NULL,
  engine TEXT,                                 -- rule / llm
  score REAL,
  result_json TEXT,                            -- 完整分析结果
  status TEXT NOT NULL DEFAULT 'analyzed',     -- analyzed / confirmed
  confirmed_note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
  FOREIGN KEY (candidate_id) REFERENCES candidates(id)
);
`);

// ---------------- 种子数据 ----------------
function seed() {
  const count = db.prepare('SELECT COUNT(*) AS c FROM jobs').get().c;
  if (count > 0) return;

  const insertJob = db.prepare(
    'INSERT INTO jobs (title, department, headcount, salary_range, requirement, created_at) VALUES (?,?,?,?,?,?)',
  );
  const jobs = [
    ['前端开发工程师', '研发部', 3, '18k-30k', 'Vue3/TypeScript/工程化，3年以上经验', '2026-07-02 10:00:00'],
    ['后端开发工程师(Node)', '研发部', 2, '20k-35k', 'Nest.js/TypeORM/MySQL，高并发经验优先', '2026-07-05 10:00:00'],
    ['产品经理', '产品部', 1, '20k-32k', 'B端产品经验，数据敏感度高', '2026-07-10 10:00:00'],
    ['UI设计师', '设计部', 1, '12k-20k', 'Figma，移动端设计规范', '2026-07-15 10:00:00'],
    ['数据分析师', '数据部', 2, '15k-25k', 'SQL/Python，漏斗与归因分析经验', '2026-08-01 10:00:00'],
    ['测试开发工程师', '研发部', 2, '14k-24k', '自动化测试平台搭建经验', '2026-08-10 10:00:00'],
  ];
  for (const j of jobs) insertJob.run(...j);

  const channels = ['BOSS直聘', '猎聘', '拉勾', '官网投递', '内推', '猎头'];
  // 漏斗阶段：new_resume -> screening -> interview1 -> interview2 -> offer -> hired / rejected
  const insertCandidate = db.prepare(
    `INSERT INTO candidates (name, phone, email, job_id, channel, stage, resume_text,
     stage_updated_at, next_follow_date, ai_score, ai_conclusion, ai_status, created_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
  );
  const insertFollow = db.prepare('INSERT INTO follow_logs (candidate_id, content, created_at) VALUES (?,?,?)');

  const firstNames = ['伟', '芳', '娜', '敏', '静', '磊', '洋', '艳', '勇', '军', '杰', '娟', '涛', '明', '超', '霞', '平', '刚', '桂英', '志强'];
  const lastNames = ['王', '李', '张', '刘', '陈', '杨', '赵', '黄', '周', '吴', '徐', '孙', '胡', '朱', '高', '林', '何', '郭', '马', '罗'];

  const resumeTpl = (jobTitle, years, skills) =>
    `${years}年工作经验，应聘岗位：${jobTitle}。精通 ${skills.join('、')}，` +
    `曾主导公司核心业务系统重构，负责性能优化与团队代码规范建设，` +
    `具备独立完成从需求分析到上线全流程的能力，带过${Math.max(2, Math.floor(years / 2))}人小团队。` +
    (years >= 5 ? '有跨部门协作与技术方案评审经验，稳定性强。' : '学习能力强，近期完成相关进阶课程。');

  // 每个职位生成不同数量的候选人，并模拟漏斗流失分布
  const jobList = db.prepare('SELECT * FROM jobs').all();
  const stageFlow = ['new_resume', 'screening', 'interview1', 'interview2', 'offer', 'hired', 'rejected'];
  let idx = 0;
  const rand = (n) => Math.floor(Math.random() * n);

  for (const job of jobList) {
    const total = 12 + rand(10); // 12~21 人/职位
    for (let i = 0; i < total; i++) {
      idx += 1;
      const name = lastNames[rand(lastNames.length)] + firstNames[rand(firstNames.length)];
      const channel = channels[rand(channels.length)];
      // 阶段分布：越多越早期。约 30% 淘汰，其余在漏斗各阶段
      const r = Math.random();
      let stage;
      if (r < 0.3) stage = 'rejected';
      else if (r < 0.45) stage = 'new_resume';
      else if (r < 0.6) stage = 'screening';
      else if (r < 0.72) stage = 'interview1';
      else if (r < 0.82) stage = 'interview2';
      else if (r < 0.92) stage = 'offer';
      else stage = 'hired';

      const years = 1 + rand(9);
      const skillPool = {
        前端开发工程师: ['Vue3', 'TypeScript', 'Webpack', 'React', 'CSS'],
        '后端开发工程师(Node)': ['Node.js', 'Nest.js', 'MySQL', 'Redis', 'Docker'],
        产品经理: ['需求分析', 'Axure', '数据分析', '项目管理', 'SQL'],
        UI设计师: ['Figma', 'Sketch', '交互设计', '视觉规范', 'Principle'],
        数据分析师: ['SQL', 'Python', 'Tableau', '统计建模', '漏斗分析'],
        测试开发工程师: ['Selenium', 'Pytest', 'CI/CD', '性能测试', 'JMeter'],
      };
      const skills = skillPool[job.title] || ['沟通', '协作'];
      const resume = resumeTpl(job.title, years, skills);

      const day = 1 + rand(25);
      const month = 8 + rand(2); // 2026-08 / 2026-09
      const createdAt = `2026-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} 09:30:00`;
      const stageUpdated = `2026-${String(month).padStart(2, '0')}-${String(Math.min(28, day + 2)).padStart(2, '0')} 15:00:00`;

      // 一部分候选人需要跟进：设置下次跟进日期（有的已过期，模拟提醒场景）
      let nextFollow = null;
      if (['new_resume', 'screening', 'interview1', 'interview2', 'offer'].includes(stage)) {
        if (Math.random() < 0.5) {
          const offset = rand(8) - 3; // -3 ~ +4 天（相对当前 2026-10-26）
          const d = new Date('2026-10-26T00:00:00');
          d.setDate(d.getDate() + offset);
          nextFollow = d.toISOString().slice(0, 10);
        }
      }

      // 少量预置已AI分析/已确认的数据，其余留待演示
      let aiScore = null;
      let aiConclusion = null;
      let aiStatus = 'pending';
      if (Math.random() < 0.25) {
        aiScore = Math.round(50 + Math.random() * 48);
        aiConclusion = aiScore >= 80 ? '建议进入面试' : aiScore >= 65 ? '待定，需补充面试考察' : '建议淘汰';
        aiStatus = Math.random() < 0.5 ? 'confirmed' : 'analyzed';
      }

      insertCandidate.run(
        name, `138${String(10000000 + rand(89999999)).slice(0, 8)}`, `${name}@example.com`.toLowerCase(),
        job.id, channel, stage, resume, stageUpdated, nextFollow, aiScore, aiConclusion, aiStatus, createdAt,
      );

      if (Math.random() < 0.4) {
        const cid = db.prepare('SELECT last_insert_rowid() AS id').get().id;
        insertFollow.run(cid, '电话沟通，候选人意向较强，约定面试时间。', createdAt);
      }
    }
  }
  console.log(`[seed] jobs=${jobList.length}, candidates=${idx}`);
}

seed();

module.exports = { db, STAGES: ['new_resume', 'screening', 'interview1', 'interview2', 'offer', 'hired', 'rejected'] };
