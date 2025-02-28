# ArXiv 论文筛选助手

一个基于Next.js开发的智能论文筛选工具，帮助研究者快速找到感兴趣的ArXiv论文。

## 主要功能

- 🔍 智能论文搜索：支持在ArXiv数据库中搜索论文
- 🤖 AI辅助分析：根据用户偏好自动分析论文相关性
- 🌓 深色模式：支持浅色/深色主题切换
- 💾 偏好设置：保存用户研究兴趣和偏好
- 🔄 实时分析：并行处理多篇论文，提供即时分析结果
- 🌐 中文支持：提供论文标题和摘要的中文翻译

## 技术栈

- **前端框架**：Next.js 14.1.0
- **UI框架**：TailwindCSS 3.4.1
- **开发语言**：TypeScript
- **HTTP客户端**：Axios
- **XML解析**：xml2js

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
在项目根目录`.env` 文件或环境变量中：
```env
# AI服务配置【必选】
OPENAI_API_KEY=
OPENAI_API_BASE_URL=
OPENAI_MODEL=
# ArXiv API Configuration【非必选】
NEXT_PUBLIC_ARXIV_API_DELAY=3000
NEXT_PUBLIC_ARXIV_API_MAX_RESULTS=50
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

1. **设置研究偏好**
   - 首次使用时，需要设置研究领域和兴趣方向
   - 可以随时通过右上角的"修改偏好设置"按钮更新偏好

2. **搜索论文**
   - 输入关键词、作者或分类进行搜索
   - 支持多个搜索条件组合

3. **查看结果**
   - 系统会自动分析论文与您研究兴趣的相关性
   - 可以切换显示所有论文或仅显示相关论文
   - 每篇论文都提供标题和摘要的中文翻译

## 项目结构

```
├── app/                # Next.js应用主目录
│   ├── components/     # React组件
│   ├── layout.tsx     # 应用布局
│   └── page.tsx       # 主页面
├── lib/               # 工具库
│   ├── ai.ts         # AI服务接口
│   └── arxiv.ts      # ArXiv API接口
└── public/            # 静态资源
```

## 贡献指南

欢迎提交Issue和Pull Request来帮助改进项目。在提交PR之前，请确保：

1. 代码通过ESLint检查
2. 新功能包含适当的测试
3. 更新相关文档

## 许可证

本项目采用 MIT 许可证。详见 [LICENSE](LICENSE) 文件。
