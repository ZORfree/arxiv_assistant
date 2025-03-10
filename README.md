# ArXiv 论文筛选助手

一个基于Next.js开发的智能论文筛选工具，帮助研究者快速找到感兴趣的ArXiv论文。

本项目所有代码均有claude-3.5-Sonnet and claude-3.7-Sonnet生成，包括本README.md

## 主要功能

- 🔍 智能论文搜索：支持在ArXiv数据库中搜索论文
- 🤖 AI辅助分析：根据用户偏好自动分析论文相关性
- 🌓 深色模式：支持浅色/深色主题切换
- 💾 偏好设置：保存用户研究兴趣和偏好
- 🔄 实时分析：并行处理多篇论文，提供即时分析结果
- 🌐 中文支持：提供论文标题和摘要的中文翻译
- ⚙️ 灵活配置：支持自定义API设置和并发请求数量

## 技术栈

- **前端框架**：Next.js 15.1.7
- **UI框架**：TailwindCSS 3.4.1
- **开发语言**：TypeScript
- **HTTP客户端**：Axios
- **XML解析**：xml2js
- **状态管理**：React Hooks
- **数据缓存**：Upstash Redis

## 快速开始

### 环境要求

- Node.js (推荐 v18 或更高版本)
- npm 或 yarn

### 安装步骤

1. 克隆项目
```bash
git clone <repository-url>
cd paper
```

2. 安装依赖
```bash
npm install
# 或
yarn install
```

3. 配置环境变量
在项目根目录创建`.env` 文件：
```env
# ArXiv API 配置【可选】
ARXIV_API_DELAY=3000
ARXIV_API_MAX_RESULTS=50

# Redis 配置【可选】
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

4. 启动开发服务器
```bash
npm run dev
# 或
yarn dev
```

访问 http://localhost:3000 即可看到应用界面。

### 生产环境部署

1. 构建项目
```bash
npm run build
# 或
yarn build
```

2. 启动生产服务器
```bash
npm run start
# 或
yarn start
```

## 使用指南

1. **首次使用配置**
   - 首次使用时，需要在设置界面配置AI服务API信息
   - 设置研究领域和兴趣方向
   - 可以自定义并发请求数量，优化分析速度

2. **搜索论文**
   - 输入关键词、作者或分类进行搜索
   - 支持多个搜索条件组合

3. **查看结果**
   - 系统会自动分析论文与您研究兴趣的相关性
   - 可以切换显示所有论文或仅显示相关论文
   - 每篇论文都提供标题和摘要的中文翻译

4. **修改设置**
   - 随时通过右上角的设置按钮更新API配置和研究偏好
   - 修改研究偏好后，系统会自动重新分析已加载的论文

## 项目结构

```
├── app/                # Next.js应用主目录
│   ├── api/            # API路由
│   │   └── analyze/    # 论文分析API
│   ├── components/     # React组件
│   │   ├── PaperList.tsx      # 论文列表组件
│   │   ├── PreferenceForm.tsx # 偏好设置表单
│   │   ├── SearchForm.tsx     # 搜索表单
│   │   └── Settings.tsx       # 设置界面组件
│   ├── layout.tsx     # 应用布局
│   └── page.tsx       # 主页面
├── lib/               # 工具库
│   ├── ai.ts         # AI服务接口
│   ├── arxiv.ts      # ArXiv API接口
│   ├── redis.ts      # Redis缓存服务
│   └── user.ts       # 用户服务
└── public/            # 静态资源
```

## 贡献指南

欢迎提交Issue和Pull Request来帮助改进项目。在提交PR之前，请确保：

1. 代码通过ESLint检查
2. 新功能包含适当的测试
3. 更新相关文档

## 许可证

本项目采用 MIT 许可证。详见 [LICENSE](LICENSE) 文件。
