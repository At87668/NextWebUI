<h1 align="center">NextWebUI</h1>

NextWebUI is a modern, high-performance AI chat user interface built with Next.js.

<p align="center"> <a href="#features"><strong>Features</strong></a> · <a href="#model-providers"><strong>Model Providers</strong></a> · <a href="#deploy-your-own-instance"><strong>Deploy Your Own Instance</strong></a> · <a href="#run-locally"><strong>Run Locally</strong></a> </p> <br/>

[简体中文](./README_zh.md) | English

## Features

- **Ready to use out of the box**: Like OpenWebUI, it works right after simple configuration.
- Admin Panel:
  - Easily configure available models for different user groups.
  - Provides a user-friendly model management interface.
- Strong Security:
  - Designed with high security standards.
  - Allows server-side invalidation of user tokens to enhance account security.
- Modern UI:
  - Beautiful interface delivering a high-performance user experience.
  - Built on the [Next.js](https://nextjs.org/) App Router, leveraging React Server Components (RSCs) and Server Actions for server-side rendering and high performance.
- Comprehensive User Settings:
  - Supports user-defined prompts.
  - Offers multiple theme options.
  - Supports multi-language switching.
- Multi-language Support:
  - Built-in English and Chinese translations.
  - Designed for easy extensibility, allowing additional languages to be added effortlessly as needed.
- Data Persistence:
  - Uses [PostgresSQL](https://www.postgresql.org/) to store chat history and user data.
  - Uses [Vercel Blob](https://vercel.com/storage/blob) for efficient file storage in conversations.
- Authentication:
  - Provides secure authentication via [Auth.js](https://authjs.dev/) and [Redis](https://redis.io/).

## Model Providers

This project is extended from [Chat SDK](https://chat-sdk.dev/) and uses the [AI SDK](https://sdk.vercel.ai/docs) for model interaction, and supports OpenAI and Ollama by default. You can easily scale with just a few lines of code.

## Deploy Your Own Instance

You can deploy NextWebUI to Vercel with one click:

**One-click deployment** *(all needed integrations will be created)*

[![Deploy with Vercel](https://vercel.com/button?x-oss-process=image/resize,m_mfit,w_320,h_320)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FAt87668%2FNextWebUI&env=AUTH_SECRET,ADMIN_EMAIL&envDescription=You%20need%20to%20fill%20in%20these%20environment%20variables%20for%20the%20program%20to%20work.&envLink=https%3A%2F%2Fgithub.com%2FAt87668%2FNextWebUI%2Fblob%2Fmain%2F.env.example&project-name=nextwebui&repository-name=nextwebui-cloned&products=%5B%7B%22type%22%3A%22integration%22%2C%22protocol%22%3A%22storage%22%2C%22productSlug%22%3A%22neon%22%2C%22integrationSlug%22%3A%22neon%22%7D%2C%7B%22type%22%3A%22blob%22%7D%5D&integration-ids=oac_4nMvFhFSbAGAK6MU5mUFFILs)

**Existing Environment** *(need to edit all environment variables yourself)*

[![Deploy with Vercel](https://vercel.com/button?x-oss-process=image/resize,m_mfit,w_320,h_320)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FAt87668%2FNextWebUI&env=AUTH_SECRET,BLOB_READ_WRITE_TOKEN,POSTGRES_URL,REDIS_URL,ADMIN_EMAIL&envDescription=You%20need%20to%20fill%20in%20these%20environment%20variables%20for%20the%20program%20to%20work.&envLink=https%3A%2F%2Fgithub.com%2FAt87668%2FNextWebUI%2Fblob%2Fmain%2F.env.example&project-name=nextwebui&repository-name=nextwebui-cloned)


## Run Locally

You need to run NextWebUI using the environment variables defined in the [.env.example](./.env.example) file. We recommend using [Vercel environment variables](https://vercel.com/docs/projects/environment-variables), but creating a `.env` file is also sufficient.

> **Note**: Never commit your `.env` file, as it may expose your secrets and allow others to access your AI and authentication service accounts. 

1. Install Vercel CLI: `npm i -g vercel`
2. Link your local instance to your Vercel and GitHub account (this creates a `.vercel` directory): `vercel link`
3. Download your environment variables: `vercel env pull`

> pnpm install
>
> pnpm dev

Your NextWebUI application should now be running at [localhost:3001](http://localhost:3001/).

## Acknowledgement
- **Vercel**: Many thanks to Vercel for creating ChatSDK, which greatly reduced development effort for NextWebUI.
- **All Contributors**: Thank you to all contributors who have helped improve NextWebUI—your efforts are greatly appreciated.

## *Support the Developer*
*If you are a user from China, consider "charging" the developer via [bilibili](https://space.bilibili.com/1098279072) .*

*Alternatively, a free GitHub Star would mean a lot!*

*Thank you so much!*