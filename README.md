# TypeScript Node Starter ( EMBT Starter) 


The main purpose of this repository is to show a good starter template in TypeScript using ExpressJS Mongoose Bootstrap.
I will try to keep this as up-to-date as possible, but community contributions and recommendations for improvements are encouraged and will be most welcome. 


# Pre-reqs
To build and run this app locally you will need a few things:
- Install [Node.js](https://nodejs.org/en/)
- Install [MongoDB](https://docs.mongodb.com/manual/installation/)

# Getting started
- Clone the repository
```
git clone --depth=1 https://github.com/nisanthsojan/express-mongoose-typescript-starter.git <project_name>
```
- Install dependencies
```
cd <project_name>
npm install
```
- Configure your mongoDB server
- Start your mongoDB server (you'll probably want another command prompt)
- Build and run the project
```
npm run build
npm start
```

Finally, navigate to `http://localhost:5001` and you should see the template being served and rendered locally!

# Deploying the app
There are many ways to deploy an Node app, and in general, nothing about the deployment process changes because you're using TypeScript.

All the required front-end and server js code is compiled into the folder '/dist'. All you need to do is copy this folder to your server and run npm install. 

### Troubleshooting failed deployments
Deployment can fail for various reasons, if you get stuck with a page that says *Service Unavailable* or some other error, open an issue and I'll try to help you resolve the problems.

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
In a TypeScript project, it's best to have separate _source_  and _distributable_ files.
TypeScript (`.ts`) files live in your `src-server` and `src-public` folder and after compilation are output as JavaScript (`.js`) in the `dist` folder.
The `test` and `views` folders remain top level as expected. 

The full folder structure of this app is explained below:

> **Note!** Make sure you have already built the app using `npm run build`

| Name | Description |
| ------------------------------- | --------------------------------------------------------------------------------------------- |
| **.vscode**                     | Contains VS Code specific settings                                                            |
| **dist**                        | Contains the distributable (or output) from your TypeScript build. This is the code you ship  |
| **node_modules**                | Contains all your npm dependencies                                                            |
| **src-server**                  | Contains your source code that will be compiled to the dist dir                               |
| **src-server/config**           | Passport authentication strategies and login middleware. Add other complex config code here   |
| **src-server/controllers**      | Controllers define functions that respond to various http requests                            |
| **src-server/models**           | Models define Mongoose schemas that will be used in storing and retrieving data from MongoDB  |
| **src-public**           | Static assets that will be used client side                                                   |
| **src/types**            | Holds .d.ts files not found on DefinitelyTyped. Covered more in this [section](#type-definition-dts-files)          |
| **src**/server.ts        | Entry point to your express app                                                               |
| **test**                 | Contains your tests. Seperate from source because there is a different build process.         |
| **views**                | Views define how your app renders on the client. In this case we're using pug                 |
| .env.example             | API keys, tokens, passwords, database URI. Clone this, but don't check it in to public repos. |
| .travis.yml              | Used to configure Travis CI build                                                             |
| .copyStaticAssets.ts     | Build script that copies images, fonts, and JS libs to the dist folder                        |
| jest.config.js           | Used to configure Jest                                                                        |
| package.json             | File that contains npm dependencies as well as [build scripts](#what-if-a-library-isnt-on-definitelytyped)                          |
| tsconfig.json            | Config settings for compiling server code written in TypeScript                               |
| tsconfig.tests.json      | Config settings for compiling tests written in TypeScript                                     |
| tslint.json              | Config settings for TSLint code style checking                                                |

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

| `compilerOptions` | Description |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `"module": "commonjs"`             | The **output** module type (in your `.js` files). Node uses commonjs, so that is what we use            |
| `"esModuleInterop": true,`         | Allows usage of an alternate module import syntax: `import foo from 'foo';`                            |
| `"target": "es6"`                  | The output language level. Node supports ES6, so we can target that here                               |
| `"noImplicitAny": true`            | Enables a stricter setting which throws errors when something has a default `any` value                |
| `"moduleResolution": "node"`       | TypeScript attempts to mimic Node's module resolution strategy. Read more [here](https://www.typescriptlang.org/docs/handbook/module-resolution.html#node)                                                                    |
| `"sourceMap": true`                | We want source maps to be output along side our JavaScript. See the [debugging](#debugging) section    |
| `"outDir": "dist"`                 | Location to output `.js` files after compilation                                                        |
| `"baseUrl": "."`                   | Part of configuring module resolution. See [path mapping section](#installing-dts-files-from-definitelytyped) |
| `paths: {...}`                     | Part of configuring module resolution. See [path mapping section](#installing-dts-files-from-definitelytyped) |



The rest of the file define the TypeScript project context.
The project context is basically a set of options that determine which files are compiled when the compiler is invoked with a specific `tsconfig.json`.
In this case, we use the following to define our project context: 
```json
    "include": [
        "src/**/*"
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


| Npm Script | Description |
| ------------------------- | ------------------------------------------------------------------------------------------------- |
| `start`                   | Does the same as 'npm run serve'. Can be invoked with `npm start`                                 |
| `build`                   | Full build. Runs ALL build tasks (`build-sass`, `build-ts`, `tslint`, `copy-static-assets`)       |
| `serve`                   | Runs node on `dist/server.js` which is the apps entry point                                       |
| `watch-node`              | Runs node with nodemon so the process restarts if it crashes. Used in the main watch task         |
| `watch`                   | Runs all watch tasks (TypeScript, Sass, Node). Use this if you're not touching static assets.     |
| `test`                    | Runs tests using Jest test runner                                                                 |
| `watch-test`              | Runs tests in watch mode                                                                          |
| `build-ts`                | Compiles all source `.ts` files to `.js` files in the `dist` folder                                 |
| `watch-ts`                | Same as `build-ts` but continuously watches `.ts` files and re-compiles when needed                |
| `build-sass`              | Compiles all `.scss` files to `.css` files                                                          |
| `watch-sass`              | Same as `build-sass` but continuously watches `.scss` files and re-compiles when needed            |
| `tslint`                  | Runs TSLint on project files                                                                       |
| `copy-static-assets`      | Calls script that copies JS libs, fonts, and images to dist directory                             |
| `debug`                   | Performs a full build and then serves the app in watch mode                                       |
| `serve-debug`             | Runs the app with the --inspect flag                                                               |
| `watch-debug`             | The same as `watch` but includes the --inspect flag so you can attach a debugger                   |

## Type Definition (`.d.ts`) Files
TypeScript uses `.d.ts` files to provide types for JavaScript libraries that were not written in TypeScript.
This is great because once you have a `.d.ts` file, TypeScript can type check that library and provide you better help in your editor.
The TypeScript community actively shares all of the most up-to-date `.d.ts` files for popular libraries on a GitHub repository called [DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types).
Making sure that your `.d.ts` files are setup correctly is super important because once they're in place, you get an incredible amount of high quality type checking (and thus bug catching, IntelliSense, and other editor tools) for free.

> **Note!** Because we're using `"noImplicitAny": true`, we are required to have a `.d.ts` file for **every** library we use. While you could set `noImplicitAny` to `false` to silence errors about missing `.d.ts` files, it is a best practice to have a `.d.ts` file for every library. (Even if the `.d.ts` file is [basically empty!](#writing-a-dts-file)) 

### Installing `.d.ts` files from DefinitelyTyped
For the most part, you'll find `.d.ts` files for the libraries you are using on DefinitelyTyped.
These `.d.ts` files can be easily installed into your project by using the npm scope `@types`.
For example, if we want the `.d.ts` file for jQuery, we can do so with `npm install --save-dev @types/jquery`.

> **Note!** Be sure to add `--save-dev` (or `-D`) to your `npm install`. `.d.ts` files are project dependencies, but only used at compile time and thus should be dev dependencies.

In this template, all the `.d.ts` files have already been added to `devDependencies` in `package.json`, so you will get everything you need after running your first `npm install`.
Once `.d.ts` files have been installed using npm, you should see them in your `node_modules/@types` folder. 
The compiler will always look in this folder for `.d.ts` files when resolving JavaScript libraries.

#### Setting up TypeScript to look for `.d.ts` files in another folder
The compiler knows to look in `node_modules/@types` by default, but to help the compiler find our own `.d.ts` files we have to configure path mapping in our `tsconfig.json`.
Path mapping can get pretty confusing, but the basic idea is that the TypeScript compiler will look in specific places, in a specific order when resolving modules, and we have the ability to tell the compiler exactly how to do it.
In the `tsconfig.json` for this project you'll see the following:
```json
"baseUrl": ".",
"paths": {
    "*": [
        "node_modules/*",
        "src/types/*"
    ]
}
```
This tells the TypeScript compiler that in addition to looking in `node_modules/@types` for every import (`*`) also look in our own `.d.ts` file location `<baseUrl>` + `src/types/*`.
So when we write something like: 
```ts
import * as flash from "express-flash";
```
First the compiler will look for a `d.ts` file in `node_modules/@types` and then when it doesn't find one look in `src/types` and find our file `express-flash.d.ts`.

## Debugging
Debugging TypeScript is exactly like debugging JavaScript with one caveat, you need source maps.

### Source maps
Source maps allow you to drop break points in your TypeScript source code and have that break point be hit by the JavaScript that is being executed at runtime. 

> **Note!** - Source maps aren't specific to TypeScript.
Anytime JavaScript is transformed (transpiled, compiled, optimized, minified, etc) you need source maps so that the code that is executed at runtime can be _mapped_ back to the source that generated it.

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
This is more common when writing client side code because some bundlers need inline source maps to preserve the mapping through the bundle.
Because we are writing Node.js code, we don't have to worry about this. 

## Testing
For this project, I chose [Jest](https://facebook.github.io/jest/) as our test framework.
While Mocha is probably more common, Mocha seems to be looking for a new maintainer and setting up TypeScript testing in Jest is wicked simple.

### Install the components
To add TypeScript + Jest support, first install a few npm packages:
```
npm install -D jest ts-jest
```
`jest` is the testing framework itself, and `ts-jest` is just a simple function to make running TypeScript tests a little easier.

### Configure Jest
Jest's configuration lives in `jest.config.js`, so let's open it up and add the following code:
```js
module.exports = {
	globals: {
		'ts-jest': {
			tsConfigFile: 'tsconfig.json'
		}
	},
	moduleFileExtensions: [
		'ts',
		'js'
	],
	transform: {
		'^.+\\.(ts|tsx)$': './node_modules/ts-jest/preprocessor.js'
	},
	testMatch: [
		'**/test/**/*.test.(ts|js)'
	],
	testEnvironment: 'node'
};
```
Basically we are telling Jest that we want it to consume all files that match the pattern `"**/test/**/*.test.(ts|js)"` (all `.test.ts`/`.test.js` files in the `test` folder), but we want to preprocess the `.ts` files first. 
This preprocess step is very flexible, but in our case, we just want to compile our TypeScript to JavaScript using our `tsconfig.json`.
This all happens in memory when you run the tests, so there are no output `.js` test files for you to manage.   

### Running tests
Simply run `npm run test`.
Note this will also generate a coverage report.

### Writing tests
Writing tests for web apps has entire books dedicated to it and best practices are strongly influenced by personal style, so I'm deliberately avoiding discussing how or when to write tests in this guide.
However, if prescriptive guidance on testing is something that you're interested in, let me know, I'll do some homework and get back to you.

## TSLint
TSLint is a code linter which mainly helps catch minor code quality and style issues.
TSLint is very similar to ESLint or JSLint but is built with TypeScript in mind.

### TSLint rules
Like most linters, TSLint has a wide set of configurable rules as well as support for custom rule sets.
All rules are configured through `tslint.json`.
In this project, we are using a fairly basic set of rules with no additional custom rules.
The settings are largely based off the TSLint settings that we use to develop TypeScript itself.

### Running TSLint
Like the rest of our build steps, we use npm scripts to invoke TSLint.
To run TSLint you can call the main build script or just the TSLint task.
```
npm run build   // runs full build including TSLint
npm run tslint  // runs only TSLint
```
Notice that TSLint is not a part of the main watch task.
It can be annoying for TSLint to clutter the output window while in the middle of writing a function, so I elected to only run it only during the full build.
If you are interesting in seeing TSLint feedback as soon as possible, I strongly recommend the TSLint extension in VS Code.

# Dependencies
Dependencies are managed through `package.json`.
In that file you'll find two sections:
## `dependencies`

| Package                         | Description                                                           |
| ------------------------------- | --------------------------------------------------------------------- |
| async                           | Utility library that provides asynchronous control flow.              |
| bcrypt-nodejs                   | Library for hashing and salting user passwords.                       |
| bluebird                        | Promise library                                                       |
| body-parser                     | Express 4 middleware.                                                 |
| compression                     | Express 4 middleware.                                                 |
| connect-mongo                   | MongoDB session store for Express.                                    |
| dotenv                          | Loads environment variables from .env file.                           |
| errorhandler                    | Express 4 middleware.                                                 |
| express                         | Node.js web framework.                                                |
| express-flash                   | Provides flash messages for Express.                                  |
| express-session                 | Express 4 middleware.                                                 |
| express-validator               | Easy form validation for Express.                                     |
| lodash                          | General utility library.                                              |
| csurf                           | CSRF middleware.                                                      |
| mongoose                        | MongoDB ODM.                                                          |
| nodemailer                      | Node.js library for sending emails.                                   |
| passport                        | Simple and elegant authentication library for node.js                 |
| passport-local                  | Sign-in with Username and Password plugin.                            |
| pug (jade)                      | Template engine for Express.                                          |
| request                         | Simplified HTTP request library.                                      |
| request-promise                 | Promisified HTTP request library. Let's us use async/await            |
| winston                         | Logging library                                                       |

## `devDependencies`

| Package                         | Description                                                           |
| ------------------------------- | --------------------------------------------------------------------- |
| @types                          | Dependencies in this folder are `.d.ts` files used to provide types   |
| chai                            | Testing utility library that makes it easier to write tests           |
| concurrently                    | Utility that manages multiple concurrent tasks. Used with npm scripts |
| jest                            | Testing library for JavaScript.                                       |
| node-sass                       | Allows to compile .scss files to .css                                 |
| nodemon                         | Utility that automatically restarts node process when it crashes      |
| supertest                       | HTTP assertion library.                                               |
| ts-jest                         | A preprocessor with sourcemap support to help use TypeScript wit Jest.|
| ts-node                         | Enables directly running TS files. Used to run `copy-static-assets.ts` |
| tslint                          | Linter (similar to ESLint) for TypeScript files                        |
| typescript                      | JavaScript compiler/type checker that boosts JavaScript productivity  |

To install or update these dependencies you can use `npm install` or `npm update`.

# Hackathon Starter Project
A majority of this quick start's content was inspired or adapted from Sahat's excellent [Hackathon Starter project](https://github.com/sahat/hackathon-starter).
