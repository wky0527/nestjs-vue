# 招聘自动化工具（recruit-tool）

可操作的网页管理系统，覆盖招聘全流程自动化：**数据自动统计、漏斗分析、渠道效果分析、候选人跟进提醒、AI 简历辅助分析（AI 建议 + 人工确认）**，以及**研发岗位人才 Mapping 实践**（人才画像 → 目标企业分析 → Mapping 信息表 → 招聘数据分析）。

## 技术栈

| 层 | 技术 |
|---|---|
| 后端 | Node.js + Express + `node:sqlite`（Node 内置 SQLite，零原生编译依赖） |
| 前端 | Vue 3 + Vite + Element Plus + ECharts |
| AI | 内置规则引擎（离线可用）；可选接入 OpenAI 兼容大模型 |
| 数据库 | `server/recruit.sqlite`（首次启动自动建表 + 写入种子数据） |

## 运行（需 Node.js ≥ 22.5，本环境为 24.x）

在仓库根目录：

```bash
# 1. 安装依赖（workspace 已包含 recruit-tool/server 与 recruit-tool/web）
pnpm install

# 2. 启动后端（端口 3200，首次启动自动初始化数据库和演示数据）
pnpm --filter recruit-server start

# 3. 另开终端，启动前端（端口 6200，/api 已代理到 3200）
pnpm --filter recruit-web dev
```

浏览器打开 **http://localhost:6200** 即可使用。

## 功能地图

| 模块 | 页面 | 说明 |
|---|---|---|
| 招聘数据自动统计 | 招聘工作台 | 在招职位/候选人/入职/待跟进等指标卡，近 8 周投递趋势、渠道分布自动统计，跟进提醒与 AI 待办直达 |
| 招聘漏斗分析 | 漏斗分析 | 投递→初筛→一面→二面→Offer→入职 漏斗图，各环节转化率与流失预警，支持按职位下钻 |
| 招聘渠道效果分析 | 渠道效果 | 各渠道投递/面试/入职对比、入职转化率、综合评分排名（入职率×0.5+面试率×0.3+规模×0.2）与投入建议 |
| 候选人跟进提醒 | 候选人管理 | 到期/逾期跟进自动提醒（侧边栏红点 + 顶部预警条），阶段推进、跟进日志、下次跟进日期 |
| AI 简历辅助分析 | AI简历分析 | 提取经验/学历/技能，与岗位要求匹配打分，输出优势、风险、建议面试题；**必须人工确认（采纳/修改后采纳/不采纳）后才写入档案** |
| 职位管理 | 职位管理 | 职位 CRUD，岗位要求用于 AI 匹配 |
| 人才画像梳理 | 人才 Mapping > 人才画像梳理 | 以 Web 前端开发工程师为例，从技术栈、工作年限、项目经历（加分项）、业务背景、薪资期望多维度建立画像，并可一键复制招聘平台检索关键词 |
| 目标企业分析 | 人才 Mapping > 目标企业分析 | 按 S/A/B/C 梯队维护目标企业，记录人才分布特点（团队规模、平均司龄、流动性）、搜索方向、侧重技术栈与薪资水平，可下钻该企业的 Mapping 人数 |
| 人才信息整理 | 人才 Mapping > Mapping 信息表 | 结构化台账记录技能关键词、年限、企业背景、来源渠道、跟进状态与画像匹配度；状态下拉直接流转并自动留痕，支持多条件筛选与导出 CSV |
| 招聘数据分析 | 人才 Mapping > 数据分析 | 人才搜索→有效简历→初步沟通→有意向→面试邀约 漏斗与各环转化率（附对应优化建议）、渠道产出对比、企业梯队分布、技能关键词热度、匹配度分布 |

## AI 程度说明（AI 辅助，人工确认）

- AI 只生成**建议**：评分、结论（建议进入面试/待定/建议淘汰）、优势、风险、面试问题。
- 分析结果状态为 `待人工确认`，招聘负责人可：
  - **采纳 AI 结论**（若结论为"建议进入面试"且候选人处于新投递阶段，自动推进到初筛，仍可手动调整）
  - **修改后采纳**（人工改结论/评分再确认）
  - **不采纳**（记录人工否决备注）
- 确认动作全部留痕于 `ai_analyses` 表（engine、result_json、confirmed_note）。

### 可选：接入大模型

默认使用内置规则引擎（离线可跑）。如需真实 LLM 分析，启动后端时注入环境变量即可，失败自动降级回规则引擎：

```bash
OPENAI_API_KEY=sk-xxx \
OPENAI_BASE_URL=https://api.openai.com/v1 \
OPENAI_MODEL=gpt-4o-mini \
pnpm --filter recruit-server start
```

## 人才 Mapping 实践（研发岗位）

该模块把“人才 Mapping”从口头流程变成可维护的数据闭环，四个页面对应四个实践环节：

```
人才画像（mapping_roles）  →  定义“我要找什么人”
目标企业（target_companies）→  定义“去哪些公司找”
信息表（mapping_records）   →  沉淀“找到的人、跟进得怎么样”
数据统计（/mapping/stats）  →  反向校验“画像与搜索方向跑偏了没”
```

关键设计：

- **转化漏斗采用“到达率”口径**：处于某环节及更靠后环节的人数之和即为该环节到达人数，避免中途淘汰的人被漏计。
- **状态即流程**：`discovered`（已搜索到）→ `valid_resume`（有效简历）→ `contacted`（初步沟通）→ `interested`（有意向）→ `interview_invite`（面试邀约），另有 `no_answer`/`rejected` 代表流失。
- **匹配度与画像挂钩**：每人标记 `high/mid/low`，统计页可看出当前人才池与画像的贴合程度。
- **关键词热度反向校验搜索方向**：统计实际 Mapping 到的技能词频，若与画像关键词偏差大，说明渠道或检索式需要调整。

## 部署（Render 单服务模式）

后端会同时托管前端构建产物，因此只需启动一个进程：

```bash
cd recruit-tool
npm run build   # 构建 web/dist + 安装 server 依赖
npm start       # http://localhost:3200
```

> 开发模式仍用 `pnpm --filter recruit-web dev`（6200 端口代理到 3200）。

## API 一览

- `GET/POST/PUT/DELETE /api/jobs`
- `GET/POST/PUT/DELETE /api/candidates`，`POST /api/candidates/:id/stage`，`POST /api/candidates/:id/follow`
- `GET /api/reminders`（到期/逾期跟进）
- `GET /api/stats/overview` | `/api/stats/funnel?jobId=` | `/api/stats/channels`
- `POST /api/ai/analyze`，`POST /api/ai/confirm`，`GET /api/ai/analysis/:candidateId`
- 人才 Mapping：
  - `GET/POST/PUT /api/mapping/roles`（人才画像）
  - `GET/POST/PUT/DELETE /api/mapping/companies`（目标企业，支持 `tier`/`keyword` 筛选）
  - `GET/POST/PUT/DELETE /api/mapping/records`（Mapping 信息表，支持 `company`/`channel`/`status`/`match`/`keyword`）
  - `POST /api/mapping/records/:id/status`（状态流转），`GET /api/mapping/records/:id/logs`（流转轨迹）
  - `GET /api/mapping/stats`（漏斗/渠道/梯队/关键词/匹配度统计）

## 重置演示数据

```bash
rm server/recruit.sqlite*    # 删除后重启后端即自动重新生成
```

---

📄 招聘业务视角的方法论与面试讲述稿（人才画像 → 目标企业地图 → 台账与触达节奏 → 漏斗与渠道复盘），见 [INTERVIEW.md](./INTERVIEW.md)。
