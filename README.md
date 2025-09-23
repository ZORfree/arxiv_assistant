# ArXiv 论文筛选助手

一个基于Next.js开发的智能论文筛选工具，帮助研究者快速找到感兴趣的ArXiv论文。

## ✨ 主要功能

### 🔍 智能搜索与分析
- **智能论文搜索**：支持在ArXiv数据库中按关键词、作者、分类搜索论文
- **AI辅助分析**：根据用户研究偏好自动分析论文相关性，提供相关度评分
- **并行处理**：支持多篇论文同时分析，提供实时进度显示
- **中文翻译**：自动提供论文标题和摘要的中文翻译

### ❤️ 收藏管理系统
- **智能收藏**：一键收藏感兴趣的论文，支持快速收藏（Shift+点击）
- **分类管理**：预设7个专业分类（识别、唤醒、大模型、计算机视觉、自然语言处理、机器学习、其他）
- **自定义分类**：支持创建、编辑、删除个人分类，自定义颜色和描述
- **搜索筛选**：支持按标题、摘要、作者、备注搜索收藏的论文
- **统计分析**：提供收藏数量统计和分类分布图表

### 💾 数据同步与备份
- **本地存储**：所有数据保存在浏览器本地，保护隐私安全
- **数据导入导出**：支持JSON格式的收藏数据备份和恢复
- **WebDAV同步**：支持与WebDAV服务器同步，实现跨设备数据共享
- **智能备份**：自动检测数据变化，提供增量同步功能

### 🎨 用户体验
- **深色模式**：支持浅色/深色主题自动切换
- **响应式设计**：完美适配桌面端和移动端
- **个性化设置**：可自定义API配置、并发请求数量等参数
- **实时更新**：显示项目最新更新日志和版本信息

## 🛠 技术栈

- **前端框架**：Next.js 15.1.7 (React 19.0.0)
- **UI框架**：TailwindCSS 3.4.1 + Headless UI 2.2.0
- **图标库**：Heroicons 2.2.0
- **开发语言**：TypeScript 5
- **HTTP客户端**：Axios 1.7.9
- **XML解析**：xml2js 0.6.2
- **状态管理**：React Hooks
- **数据缓存**：Upstash Redis 1.34.4
- **构建工具**：PostCSS 8, ESLint 9

## 🚀 快速开始

### 环境要求

- Node.js (推荐 v18 或更高版本)
- npm 或 yarn

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd paper
```

2. **安装依赖**
```bash
npm install
# 或
yarn install
```

3. **配置环境变量**
在项目根目录创建`.env.local` 文件：
```env
# ArXiv API 配置【可选】
ARXIV_API_DELAY=3000
ARXIV_API_MAX_RESULTS=50

# Redis 配置【可选，用于缓存】
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token

# GitHub API 配置【可选，用于版本信息】
GITHUB_TOKEN=your_github_token
GITHUB_REPO=your_repo_name
```

4. **启动开发服务器**
```bash
npm run dev
# 或
yarn dev
```

访问 http://localhost:3000 即可看到应用界面。

### 生产环境部署

1. **构建项目**
```bash
npm run build
# 或
yarn build
```

2. **启动生产服务器**
```bash
npm run start
# 或
yarn start
```

## 📖 使用指南

### 首次使用配置

1. **个性化设置**
   - 首次使用时，点击"个性化设置"按钮
   - 配置AI服务API信息（推荐使用Qwen或其他兼容OpenAI格式的API）
   - 设置研究领域和兴趣方向
   - 可自定义并发请求数量，优化分析速度

2. **WebDAV同步设置**（可选）
   - 在设置中配置WebDAV服务器信息
   - 支持坚果云、NextCloud等WebDAV服务
   - 实现跨设备收藏数据同步

### 搜索与分析

1. **搜索论文**
   - 输入关键词、作者或分类进行搜索
   - 支持多个搜索条件组合
   - 可设置搜索结果数量和时间范围

2. **查看分析结果**
   - 系统自动分析论文与研究兴趣的相关性
   - 提供相关度评分和详细分析理由
   - 可切换显示所有论文或仅显示相关论文

### 收藏管理

1. **收藏论文**
   - 点击论文右上角的心形图标收藏
   - 选择合适的分类并添加个人备注
   - 按住Shift键点击可快速收藏到"其他"分类

2. **管理收藏夹**
   - 点击"管理收藏夹"按钮查看所有收藏
   - 支持按分类筛选和搜索
   - 可编辑收藏的分类和备注
   - 支持批量操作和数据导出

## 📁 项目结构

```
├── app/                    # Next.js应用主目录
│   ├── api/               # API路由
│   │   ├── analyze/       # 论文分析API
│   │   ├── llm-proxy/     # LLM代理API
│   │   ├── version/       # 版本信息API
│   │   └── webdav/        # WebDAV同步API
│   ├── components/        # React组件
│   │   ├── FavoriteButton.tsx      # 收藏按钮
│   │   ├── FavoritesPage.tsx       # 收藏夹主页
│   │   ├── FavoritesManager.tsx    # 收藏管理器
│   │   ├── FavoritesStats.tsx      # 收藏统计
│   │   ├── FavoritesGuide.tsx      # 使用指南
│   │   ├── PaperList.tsx           # 论文列表
│   │   ├── SearchForm.tsx          # 搜索表单
│   │   ├── Settings.tsx            # 设置界面
│   │   ├── VersionInfo.tsx         # 版本信息
│   │   └── WebDAVSettings.tsx      # WebDAV设置
│   ├── test-webdav/       # WebDAV测试页面
│   ├── layout.tsx         # 应用布局
│   └── page.tsx          # 主页面
├── lib/                   # 工具库
│   ├── ai.ts             # AI服务接口
│   ├── arxiv.ts          # ArXiv API接口
│   ├── favorites.ts      # 收藏功能服务
│   ├── webdav.ts         # WebDAV客户端
│   ├── redis.ts          # Redis缓存服务
│   ├── user.ts           # 用户服务
│   └── config.ts         # 配置管理
├── public/               # 静态资源
├── FAVORITES_README.md   # 收藏功能详细说明
└── README.md            # 项目说明文档
```

## 🔧 API配置说明

### 支持的AI服务

- **OpenAI GPT系列**：GPT-3.5-turbo, GPT-4等
- **阿里云通义千问**：qwen-turbo, qwen-plus, qwen-max
- **其他兼容OpenAI格式的API**：如本地部署的模型

### 配置示例

```javascript
// 通义千问配置示例
{
  "apiUrl": "https://dashscope.aliyuncs.com/compatible-mode/v1",
  "apiKey": "your_api_key",
  "model": "qwen-turbo",
  "maxConcurrentRequests": 3
}
```

## 📊 功能特色

### 智能分析算法
- 基于用户研究偏好的个性化分析
- 多维度评分系统（相关性、重要性、新颖性）
- 支持中英文混合内容分析

### 收藏系统亮点
- 7个预设专业分类，覆盖主要AI研究领域
- 支持无限自定义分类
- 智能搜索支持模糊匹配
- 数据导入导出保证数据安全

### 同步功能
- WebDAV协议支持，兼容主流网盘服务
- 增量同步，减少网络传输
- 冲突检测和解决机制

## 🤝 贡献指南

欢迎提交Issue和Pull Request来帮助改进项目！

### 开发规范
1. 代码必须通过ESLint检查
2. 新功能需要包含适当的TypeScript类型定义
3. 重要功能变更需要更新相关文档
4. 提交信息请使用清晰的中文描述

### 功能建议
- 支持更多AI模型和API
- 增加论文推荐算法
- 支持团队协作功能
- 移动端App开发

## 📄 许可证

本项目采用 MIT 许可证。详见 [LICENSE](LICENSE) 文件。

## 🔗 相关链接

- [收藏功能详细说明](FAVORITES_README.md)
- [ArXiv官网](https://arxiv.org/)
- [Next.js文档](https://nextjs.org/docs)
- [TailwindCSS文档](https://tailwindcss.com/docs)

---

**版本**: v1.2.0  
**技术支持**: 如有问题请提交Issue