# DocsBot AI Next.js Website and API

DocsBot.ai is a [Tailwind UI](https://tailwindui.com) site template built using [Tailwind CSS](https://tailwindcss.com) and [Next.js](https://nextjs.org). It uses Firebase for authentication, database, and cloud storage. It also uses [Markdoc](https://markdoc.dev) for documentation.

## Getting started

To get started with development, first install the npm dependencies:

```bash
npm install
```

Next, run the development server:

```bash
npm run dev
```

Finally, open [http://localhost:3000](http://localhost:3000) in your browser to view the website.

## Development

There are a set of required environment variables that need to be set in order to run the site locally. You can find these in the `.env.example` file. Copy this file to `.env.local` and fill in the values.

You can start editing this site by modifying the files in the `/src` folder. The site will auto-update as you edit these files.

User uploads for source files are uploaded directly to Firebase storage on which they are authorized via Firebase authentication to upload to a /users/{user_id}/ directory. This directory automatically purges files more than a day old. Those files are then moved to the /teams/ directory when the source is created for permanent storage. You can find the storage bucket in the Firebase console.

### Frontend

The frontend is located in the `/src/pages` folder.

### Documentation

The documentation is located in the `/src/pages/docs` folder. Each file in this folder represents a single page in the documentation. They are written in Markdown and use Markdoc to generate the HTML. You can learn more about Markdoc in the [Markdoc documentation](https://markdoc.dev). Components can be added to the documentation by creating a new file in the `/src/components/docs` folder.

### Application

The application is located in the `/src/pages/app` folder. Each file in this folder represents a single page in the application. Most app pages use SSR to fetch data from the database and are powered by Vercel functions. The `/src/pages/api` folder contains the API endpoints used by the application.

### API

The API is located in the `/src/pages/api` folder. Each file in this folder represents a single API endpoint. The API is powered by [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction). API endpoints use the Firebase authentication cookie to authenticate users, and fallback to the `Authorization: Bearer APIKEY` header if the cookie is not present.

## Deploying

The site is hosted on [Vercel](https://vercel.com). It is linked to the GitHub repository and automatically deploys when changes are pushed to the `main` branch.

## Learn more

To learn more about the technologies used in this site template, see the following resources:

- [Tailwind CSS](https://tailwindcss.com/docs) - the official Tailwind CSS documentation
- [Next.js](https://nextjs.org/docs) - the official Next.js documentation
- [Headless UI](https://headlessui.dev) - the official Headless UI documentation
