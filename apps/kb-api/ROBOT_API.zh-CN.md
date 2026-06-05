# 机器人知识库检索接口（对接说明）

面向语音机器人 / Agent 负责人。仅一个统一入口，返回**一条**最佳回答及置信度。

## 1. 基本信息

| 项 | 值 |
| --- | --- |
| 方法 | `POST` |
| 路径 | `/api/robot/knowledge/query` |
| 完整 URL（本地） | `http://127.0.0.1:8080/api/robot/knowledge/query` |
| 鉴权 Header | `X-Robot-Api-Key: <密钥>`（默认开发密钥 `robot-dev-key`，生产在 `apps/kb-api/.env` 配置 `ROBOT_API_KEY`） |
| Content-Type | `application/json` |

## 2. 请求

```json
{
  "utterance": "卫生间在哪里",
  "hints": {
    "category": "卫生间"
  },
  "stationId": "default"
}
```

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `utterance` | 是 | 用户原话（ASR 文本） |
| `hints.category` | 否 | 限定问答库类目：`加油机` / `卫生间` / `便利店` / `营业时间` / `其他` |
| `stationId` | 否 | 油站 ID，默认 `default` |

## 3. 响应

外层统一包装：

```json
{
  "code": 0,
  "message": "ok",
  "data": {}
}
```

`code !== 0` 表示请求或鉴权错误；业务未命中时仍为 `code: 0`，看 `data.hit`。

### 3.1 `data` 字段

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `utterance` | string | 回显用户原话 |
| `hit` | boolean | **`true` 才可播报**；`false` 时勿读 `speak` |
| `library` | string \| null | 来源库：`qa` / `goods` / `campaign` |
| `libraryLabel` | string \| null | 中文库名 |
| `confidence` | number \| null | **综合置信度** 0~1，三库决选用分；未命中可能仍有分供排查 |
| `vectorConfidence` | number \| null | **向量相似度** 0~1；仅问答/商品走 pgvector 检索时有值 |
| `matchType` | string \| null | 匹配方式，见下表 |
| `display` | string \| null | 界面短标题（问题 / 商品名 / 活动名） |
| `speak` | string \| null | **TTS 播报正文** |

### 3.2 `matchType` 取值

| 值        | 含义                                    |
| --------- | --------------------------------------- |
| `keyword` | 关键词 / 文本相似度                     |
| `vector`  | 向量库（pgvector）语义检索为主          |
| `hybrid`  | 关键词 + 向量混合                       |
| `exact`   | 商品 SKU 精确匹配（如 `SKU-0005`）      |
| `intent`  | 规则汇总意图（活动列表 / 在售商品目录） |

### 3.3 置信度使用建议（负责人必读）

1. **播报门控**：仅当 `hit === true` 时播报 `speak`。  
   默认阈值 `MIN_RETRIEVE_SCORE = 0.35`（服务端环境变量可改）。

2. **`confidence`**：最终用于三库 PK 的综合分（关键词与向量加权后的结果）。**以它判断是否命中**。

3. **`vectorConfidence`**：向量检索的原始相似度（`1 - 向量距离`）。
   - 当 `matchType` 为 `vector` 或 `hybrid` 时可能有值。
   - 可用于 UI 展示「语义匹配度」或日志；**不可替代 `confidence` 做门控**。
   - 活动库、规则汇总意图一般为 `null`。

4. **汇总意图固定分**：如「近期有什么活动」「近期有什么商品」，`confidence` 固定 **0.92**，`matchType` 为 `intent`，`vectorConfidence` 为 `null`。

## 4. 识别逻辑（简述）

```
用户 utterance
  → 活动汇总意图？ → 仅活动库，开始时间倒序最多 3 条
  → 商品在售汇总意图？ → 仅商品库，类目聚合 + SKU 靠后 3 款
  → 否则并行检索问答 / 商品 / 活动各 Top1
  → 取 confidence 最高的一条
  → confidence ≥ 阈值 → hit=true
```

- **问答 / 商品**：有关键词 + 本地向量索引（`local-hash-v1`，表 `kb_qa_embedding` / `kb_goods_embedding`）。
- **活动**：关键词匹配；汇总意图不走向量。

## 5. 示例

### 5.1 问答命中（含向量时带 vectorConfidence）

```json
{
  "code": 0,
  "data": {
    "utterance": "卫生间在哪里",
    "hit": true,
    "library": "qa",
    "libraryLabel": "站级问答库",
    "confidence": 0.6881,
    "vectorConfidence": 0.72,
    "matchType": "hybrid",
    "display": "卫生间在哪里？",
    "speak": "进入便利店后左转即到，设有无障碍卫生间。"
  }
}
```

### 5.2 活动汇总

```json
{
  "hit": true,
  "library": "campaign",
  "libraryLabel": "营销活动库",
  "confidence": 0.92,
  "vectorConfidence": null,
  "matchType": "intent",
  "display": "近期活动（2条）",
  "speak": "按开始时间由晚到早，近期 2 条活动：1、…；2、…。"
}
```

### 5.3 未命中

```json
{
  "hit": false,
  "library": null,
  "libraryLabel": null,
  "confidence": 0.21,
  "vectorConfidence": 0.18,
  "matchType": "vector",
  "display": null,
  "speak": null
}
```

## 6. 调用示例

### curl（Windows PowerShell 注意 JSON）

```bash
curl.exe -s -X POST "http://127.0.0.1:8080/api/robot/knowledge/query" ^
  -H "Content-Type: application/json" ^
  -H "X-Robot-Api-Key: robot-dev-key" ^
  -d "{\"utterance\":\"卫生间在哪里\"}"
```

PowerShell 推荐：

```powershell
$body = @{ utterance = '卫生间在哪里' } | ConvertTo-Json -Compress
Invoke-RestMethod -Uri 'http://127.0.0.1:8080/api/robot/knowledge/query' `
  -Method Post -Headers @{ 'X-Robot-Api-Key' = 'robot-dev-key' } `
  -ContentType 'application/json; charset=utf-8' `
  -Body ([System.Text.Encoding]::UTF8.GetBytes($body))
```

### 常见话术

| utterance                       | 预期库                       |
| ------------------------------- | ---------------------------- |
| 卫生间在哪里                    | 问答                         |
| 矿泉水                          | 商品                         |
| 近期有什么活动 / 最近有没有活动 | 活动（汇总 3 条）            |
| 近期有什么商品                  | 商品（类目 + SKU 靠后 3 款） |

## 7. 错误码

| HTTP / code | 说明                             |
| ----------- | -------------------------------- |
| 401         | `X-Robot-Api-Key` 缺失或错误     |
| 400         | 请求体非法（如缺少 `utterance`） |

## 8. 部署注意

- 必须有一台运行中的 **kb-api**（见 [DEPLOY.zh-CN.md](./DEPLOY.zh-CN.md)），负责人才能调通。
- 文档中的 `127.0.0.1:8080` 仅为示例，生产改为 **`http(s)://<服务器域名或IP>:端口`**。
- 生产务必更换 `ROBOT_API_KEY`，通过环境变量或 `apps/kb-api/.env` 配置。
- 不要误打到前端 Mock（5320）；机器人只走 kb-api。

更多实现细节见 [`README.md`](./README.md)。
