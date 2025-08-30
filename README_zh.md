<h1 align="center">NextWebUI</h1>

NextWebUI 是一个基于 Next.js 构建的现代、高性能 AI 聊天用户界面。

<p align="center"> <a href="#功能"><strong>功能</strong></a> · <a href="#模型提供商"><strong>模型提供商</strong></a> · <a href="#部署你自己的实例"><strong>部署你自己的实例</strong></a> · <a href="#本地运行"><strong>本地运行</strong></a> </p>  <br/>

简体中文 | [English](./README.md)

## 功能

- **开箱即用**: 像 OpenWebUI 一样，简单配置后即可使用。
- 管理员面板:
  - 轻松为不同用户组设置可用的模型。
  - 提供易于使用的模型管理界面。
- 良好的安全性:
  - 具备高安全性设计。
  - 允许服务端作废用户Token，增强账户安全。
- 现代化UI:
  - 界面美观，提供高性能的用户体验。
  - 基于 [Next.js](https://nextjs.org/) App Router 构建，利用 React Server Components (RSCs) 和 Server Actions 实现服务端渲染和高性能。
- 全面的用户设置:
  - 支持用户自定义提示词。
  - 提供多种主题选项。
  - 支持多语言切换。
- 多语言支持:
  - 内置英文和中文翻译。
  - 设计上易于扩展，可根据需求轻松添加更多语言。
- 数据持久化
  - 使用 [PostgresSQL](https://www.postgresql.org/) 保存聊天历史和用户数据。
  - 使用 [Vercel Blob](https://vercel.com/storage/blob) 进行高效的对话文件存储。
- 身份认证
  - 使用 [Auth.js](https://authjs.dev/) 及 [Redis](https://redis.io/) 提供安全的认证。

## 模型提供商

本项目基于 [Chat SDK](https://chat-sdk.dev/) 进行扩展, 使用 [AI SDK](https://sdk.vercel.ai/docs)进行模型交互，默认支持 OpenAI 与 Ollama 。您只需几行代码即可轻松扩展。

## 部署你自己的实例

你可以通过一键部署将 NextWebUI 部署到 Vercel：

[![Deploy with Vercel](https://vercel.com/button?x-oss-process=image/resize,m_mfit,w_320,h_320)]()

(仍在工作中, 暂不可用)

## 本地运行

你需要在 [.env.example]((./.env.example)) 文件中定义环境变量来运行 NextWebUI。建议你使用 [Vercel 环境变量](https://vercel.com/docs/projects/environment-variables)，但创建一个 `.env` 文件也足够了。

> **注意**: 请勿提交你的 `.env` 文件，否则会暴露你的密钥，导致他人可以访问你的AI和认证服务账户。 

1. 安装 Vercel CLI: `npm i -g vercel`
2. 将本地实例与 Vercel 和 GitHub 账户关联 (会创建 `.vercel` 目录): `vercel link`
3. 下载你的环境变量: `vercel env pull`



> pnpm install
>
> pnpm dev

你的 NextWebUI 应用现在应该在 [localhost:3001](http://localhost:3001/) 上运行。

## 鸣谢
- **Vercel**: 非常感谢Vercel创建了ChatSDK, 这为NextWebUI的开发节省了很多工作量.
- **所有贡献者**: 感谢为NextWebUI做出编辑的所有贡献者, 你们为NextWebUI的发展添砖加瓦.

## *支持开发者*
*如果您是中国用户, 可以考虑为开发者在[bilibili](https://space.bilibili.com/1098279072)进行充电*

*或者, 您也可以点一个免费的Star!*

*万分感谢!*