# 招聘自动化工具（recruit-tool）

可操作的网页管理系统，覆盖招聘全流程自动化：**数据自动统计、漏斗分析、渠道效果分析、候选人跟进提醒、AI 简历辅助分析（AI 建议 + 人工确认）**。

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

## API 一览

- `GET/POST/PUT/DELETE /api/jobs`
- `GET/POST/PUT/DELETE /api/candidates`，`POST /api/candidates/:id/stage`，`POST /api/candidates/:id/follow`
- `GET /api/reminders`（到期/逾期跟进）
- `GET /api/stats/overview` | `/api/stats/funnel?jobId=` | `/api/stats/channels`
- `POST /api/ai/analyze`，`POST /api/ai/confirm`，`GET /api/ai/analysis/:candidateId`

## 重置演示数据

```bash
rm server/recruit.sqlite*    # 删除后重启后端即自动重新生成
```
