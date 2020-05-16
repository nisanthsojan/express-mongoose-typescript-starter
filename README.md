# TypeScript Node Starter ( EMBT Starter)

The main purpose of this repository is to show a good starter template in TypeScript using ExpressJS Mongoose Bootstrap v4.
I will try to keep this as up-to-date as possible, but community contributions and recommendations for improvements are encouraged and will be most welcome.

-   Only the production required dependencies are installed in server.
-   PUG templates are compiled on build. This makes it very fast.

**Live demo:** [https://embt-starter.herokuapp.com/](https://embt-starter.herokuapp.com/)

# Pre-reqs

To build and run this app locally you will need a few things:

-   Install [Node.js](https://nodejs.org/en/)
-   Install [MongoDB](https://docs.mongodb.com/manual/installation/)

# Getting started

-   Clone the repository

```
git clone --depth=1 https://github.com/nisanthsojan/express-mongoose-typescript-starter.git <project_name>
```

-   Install dependencies

```
cd <project_name>
npm install
```

-   Configure your mongoDB server
-   Start your mongoDB server (you'll probably want another command prompt)
-   Build and run the project

```
npm run debug
```

Finally, navigate to `http://localhost:5001` and you should see the template being served and rendered locally!

# Deploying the app

There are many ways to deploy an Node app, and in general, nothing about the deployment process changes because you're using TypeScript.

All the required front-end and server js code is compiled into the folder '/dist'. All you need to do is copy this folder to your server and run npm install.
The repo contains the configuration files for deploying the app to [Heroku](https://www.heroku.com/). It is using the [CircleCI](https://circleci.com/). Both of which are free to try out.

### Troubleshooting failed deployments

Deployment can fail for various reasons, if you get stuck with a page that says _Service Unavailable_ or some other error, open an issue and I'll try to help you resolve the problems.

# TypeScript + Node

In the next few sections I will call out everything that changes when adding TypeScript to an Express project.
Note that all of this has already been setup for this project, but feel free to use this as a reference for converting other Node.js project to TypeScript.

## Getting TypeScript

TypeScript itself is simple to add to any project with `npm`.

```
npm install -D typescript
```

If you're using VS Code then you're good to go!
VS Code will detect and use the TypeScript version you have installed in your `node_modules` folder.
For Editors, make sure you have the corresponding [TypeScript plugin](http://www.typescriptlang.org/index.html#download-links).

## Project Structure

The most obvious difference in a TypeScript + Node project is the folder structure.
In a TypeScript project, it's best to have separate _source_ and _distributable_ files.
TypeScript (`.ts`) files live in your `src-server` and `src-public` folder and after compilation are output as JavaScript (`.js`) in the `dist` folder.

The full folder structure of this app is explained below:

> **Note!** Make sure you have already built the app using `npm run build`

| Name                       | Description                                                                                                |
| -------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **.vscode**                | Contains VS Code specific settings                                                                         |
| **dist**                   | Contains the distributable (or output) from your TypeScript build. This is the code you ship               |
| **node_modules**           | Contains all your npm dependencies                                                                         |
| **src-server**             | Contains your source code that will be compiled to the dist dir                                            |
| **src-server/config**      | Passport authentication strategies and login middleware. Add other complex config code here                |
| **src-server/controllers** | Controllers define functions that respond to various http requests                                         |
| **src-server/models**      | Models define Mongoose schemas that will be used in storing and retrieving data from MongoDB               |
| **src-server/views**       | Views define how your app renders on the client. In this case we're using pug                              |
| **src-server**/server.ts   | Entry point to your express app                                                                            |
| **src-public**             | Static assets that will be used client side                                                                |
| **@types**                 | Holds .d.ts files not found on DefinitelyTyped. Covered more in this [section](#type-definition-dts-files) |
| **src-tests**              | Contains your tests. Seperate from source because there is a different build process.                      |
| .env.example               | API keys, tokens, passwords, database URI. Clone this, but don't check it in to public repos.              |
| package.json               | File that contains npm dependencies as well as [build scripts](#what-if-a-library-isnt-on-definitelytyped) |
| tsconfig.json              | Config settings for compiling server code written in TypeScript                                            |
| .eslintrc.js               | Config settings for ESLint code checking                                                                   |

## Building the project

It is rare for JavaScript projects not to have some kind of build pipeline these days, however Node projects typically have the least amount build configuration.
Because of this I've tried to keep the build as simple as possible.
If you're concerned about compile time, the main watch task takes ~2s to refresh.

### Configuring TypeScript compilation

TypeScript uses the file `tsconfig.json` to adjust project compile options.
Let's dissect this project's `tsconfig.json`, starting with the `compilerOptions` which details how your project is compiled.

```json
    "compilerOptions": {
        "module": "commonjs",
        "esModuleInterop": true,
        "target": "es6",
        "noImplicitAny": true,
        "moduleResolution": "node",
        "sourceMap": true,
        "outDir": "dist",
        "baseUrl": ".",
        "paths": {
            "*": [
                "node_modules/*",
                "src/types/*"
            ]
        }
    },
```

| `compilerOptions`            | Description                                                                                                                                                |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"module": "commonjs"`       | The **output** module type (in your `.js` files). Node uses commonjs, so that is what we use                                                               |
| `"esModuleInterop": true,`   | Allows usage of an alternate module import syntax: `import foo from 'foo';`                                                                                |
| `"target": "es6"`            | The output language level. Node supports ES6, so we can target that here                                                                                   |
| `"noImplicitAny": true`      | Enables a stricter setting which throws errors when something has a default `any` value                                                                    |
| `"moduleResolution": "node"` | TypeScript attempts to mimic Node's module resolution strategy. Read more [here](https://www.typescriptlang.org/docs/handbook/module-resolution.html#node) |
| `"sourceMap": true`          | We want source maps to be output along side our JavaScript. See the [debugging](#debugging) section                                                        |
| `"outDir": "dist"`           | Location to output `.js` files after compilation                                                                                                           |
| `"baseUrl": "."`             | Part of configuring module resolution. See [path mapping section](#installing-dts-files-from-definitelytyped)                                              |
| `paths: {...}`               | Part of configuring module resolution. See [path mapping section](#installing-dts-files-from-definitelytyped)                                              |

The rest of the file define the TypeScript project context.
The project context is basically a set of options that determine which files are compiled when the compiler is invoked with a specific `tsconfig.json`.
In this case, we use the following to define our project context:

```json
    "include": [
        "src-server/**/*"
    ]
```

`include` takes an array of glob patterns of files to include in the compilation.
This project is fairly simple and all of our .ts files are under the `src` folder.
For more complex setups, you can include an `exclude` array of glob patterns that removes specific files from the set defined with `include`.
There is also a `files` option which takes an array of individual file names which overrides both `include` and `exclude`.

### Running the build

All the different build steps are orchestrated via [npm scripts](https://docs.npmjs.com/misc/scripts).
Npm scripts basically allow us to call (and chain) terminal commands via npm.
This is nice because most JavaScript tools have easy to use command line utilities allowing us to not need grunt or gulp to manage our builds.
If you open `package.json`, you will see a `scripts` section with all the different scripts you can call.
To call a script, simply run `npm run <script-name>` from the command line.
You'll notice that npm scripts can call each other which makes it easy to compose complex builds out of simple individual build scripts.
Below is a list of all the scripts this template has available:

| Npm Script       | Description                                                                                                                           |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `start:dev`      | Runs node on `dist/server.js` which is the apps entry point                                                                           |
| `start:dev:prod` | Runs app with env set as production                                                                                                   |
| `start:prod`     | Runs node on `server.js` which is the apps entry point when on production                                                             |
| `check:circular` | Runs [madge](https://github.com/pahen/madge) to check for circular dependencies. Note: Need to build dist folder first before running |
| `watch`          | Runs all watch tasks (TypeScript, Sass, Node). Use this if you're not touching static assets.                                         |
| `test`           | Runs tests using Mocha test runner                                                                                                    |

#### Gulp tasks

All the gulp scripts are written in typescript. inside the folder **_gulpfile.ts_**.

| Gulp tasks        | Description                                                                                                                                                                                                                                                                                                                          |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `server:template` | Compiles the pug view files. Note: ENV must be set to "production", otherwise it would just ignore.                                                                                                                                                                                                                                  |
| `server:scripts`  | Compiles .ts files in the folder **_src-server_**                                                                                                                                                                                                                                                                                    |
| `server:statics`  | Copy the static assets from the folder **_src-server_**                                                                                                                                                                                                                                                                              |
| `public:images`   | Optimise and compress all images from the folder **_src-public/images_** into **_dist/public/images_**                                                                                                                                                                                                                               |
| `public:icons`    | Generate different favicons from the file **_src-public/favicon.png_** (You can change it in the script) and puts it inside **_dist/public/favicons_**. The HTML code for these generated favicons are then saved to **_src-server/views/partials/favicons.pug_**. Note: Run this before compiling server templates to include them. |
| `public:statics`  | Copy static public assets like fonts, etc,.                                                                                                                                                                                                                                                                                          |
| `public:scripts`  | Compile public script using webpack.                                                                                                                                                                                                                                                                                                 |
| `public:styles`   | Compile sass file to css                                                                                                                                                                                                                                                                                                             |
| `lint:lint`       | Checks all the ts files using [eslint](https://eslint.org) and [typescript-eslint](https://github.com/typescript-eslint/typescript-eslint#readme)                                                                                                                                                                                    |
| `lint:fix`        | Checks and fixes issues which are fixable using eslint                                                                                                                                                                                                                                                                               |
| `pretty:check`    | Checks if the files are formatted using [prettier.io](https://prettier.io)                                                                                                                                                                                                                                                           |
| `pretty:fix`      | formats the files using [prettier.io](https://prettier.io)                                                                                                                                                                                                                                                                           |
| `clean`           | Deletes the **_dist_** folder                                                                                                                                                                                                                                                                                                        |
| `build`           | Full build, runs the full build for production                                                                                                                                                                                                                                                                                       |
| `watch`           | Watches for script changes and rebuilds                                                                                                                                                                                                                                                                                              |

### Source maps

Source maps allow you to drop break points in your TypeScript source code and have that break point be hit by the JavaScript that is being executed at runtime.

> **Note!** - Source maps aren't specific to TypeScript.
> Anytime JavaScript is transformed (transpiled, compiled, optimized, minified, etc) you need source maps so that the code that is executed at runtime can be _mapped_ back to the source that generated it.

The best part of source maps is when configured correctly, you don't even know they exist! So let's take a look at how we do that in this project.

#### Configuring source maps

First you need to make sure your `tsconfig.json` has source map generation enabled:

```json
"compilerOptions" {
    "sourceMap": true
}
```

With this option enabled, next to every `.js` file that the TypeScript compiler outputs there will be a `.map.js` file as well.
This `.map.js` file provides the information necessary to map back to the source `.ts` file while debugging.

> **Note!** - It is also possible to generate "inline" source maps using `"inlineSourceMap": true`.
> This is more common when writing client side code because some bundlers need inline source maps to preserve the mapping through the bundle.
> Because we are writing Node.js code, we don't have to worry about this.

## Testing

For this project, I chose [Mocha](https://mochajs.org) as our test framework.

### Running tests

Simply run `npm run test`.
To generate a coverage report run `npm run test:nyc`.

### Writing tests

Writing tests for web apps has entire books dedicated to it and best practices are strongly influenced by personal style.

# Dependencies

Dependencies are managed through `package.json`.
In that file you'll find two sections:

## `dependencies`

These dependencies are only required to be installed in production for running the app.

1. @sendgrid/mail
1. bcrypt
1. bluebird
1. body-parser
1. compression
1. connect-flash
1. connect-mongo
1. csurf
1. dotenv
1. errorhandler
1. express
1. express-enforces-ssl
1. express-session
1. express-validator
1. helmet
1. moment
1. mongo-sanitize
1. mongoose
1. named-routes
1. passport
1. passport-local
1. winston

## `devDependencies`

1. @types/\*
1. @fortawesome/fontawesome-free
1. @typescript-eslint/\*
1. autoprefixer
1. bootstrap
1. cssnano
1. del
1. eslint
1. eslint-config-prettier
1. gulp
1. etc... Please check package.json file for the list and versions

To install or update these dependencies you can use `npm install` or `npm update`.
