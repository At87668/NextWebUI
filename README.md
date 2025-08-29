<h1 align="center">NextWebUI</h1>

NextWebUI is a modern, high-performance AI chat user interface built with Next.js.

<p align="center"> <a href="#features"><strong>Features</strong></a> · <a href="#model-providers"><strong>Model Providers</strong></a> · <a href="#deploy-your-own-instance"><strong>Deploy Your Own Instance</strong></a> · <a href="#run-locally"><strong>Run Locally</strong></a> </p> <br/>

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
  - Uses [Postgres](https://vercel.com/marketplace/neon) to store chat history and user data.
  - Uses [Vercel Blob](https://vercel.com/storage/blob) for efficient file storage in conversations.
- Authentication:
  - Provides secure authentication via [Auth.js](https://authjs.dev/) and Redis.

## Model Providers

This project uses the [AI SDK](https://sdk.vercel.ai/docs) and natively supports OpenAI and Ollama by default. You can easily extend support with just a few lines of code.

## Deploy Your Own Instance

You can deploy NextWebUI to Vercel with one click:

[![Deploy with Vercel](https://vercel.com/button?x-oss-process=image/resize,m_mfit,w_320,h_320&x-oss-process=image/resize,m_mfit,w_320,h_320)]()

(Still under development, not yet available)

## Run Locally

You need to run NextWebUI using the environment variables defined in the [.env.example file](https://chat.qwen.ai/c/.env.example). We recommend using [Vercel environment variables](https://vercel.com/docs/projects/environment-variables), but creating a `.env` file is also sufficient.

> **Note**: Never commit your `.env` file, as it may expose your secrets and allow others to access your AI and authentication service accounts. 

1. Install Vercel CLI: `npm i -g vercel`
2. Link your local instance to your Vercel and GitHub account (this creates a `.vercel` directory): `vercel link`
3. Download your environment variables: `vercel env pull`

> pnpm install

> pnpm dev

Your NextWebUI application should now be running at [localhost:3001 ](http://localhost:3001/).
