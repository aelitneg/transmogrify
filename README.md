# transmogrify

[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

Microservice for converting file formats.

## API

### /convert

-   Endpoint: `POST /convert`
-   Arguments:
    -   `input`: Method in which the input media is accessed
        -   _Supported Values_: download
    -   `inputFormat`: Input media format - see **Supported Conversions**
    -   `file` _(optional)_: The input media. Dpeneds on `input`
        -   _input: download_: File is a URL to the resource
    -   `converterOptions`: Specific to each conversion. See **Supported Conversions**
    -   `outputFormat`: Output media format
    -   `download` _(optional)_: Stream output media in response
        -   _Supported Values_: true, false, undefined
    -   `storage` _(optional)_: Storage driver congiruation. Can be defined as a single object or an array of configurations. See **Storage Drivers**
        -   `wait`: Wait for storage driver to complete upload before returning response
            -   _Supported Values_: true, false, undefined

## Supported Conversions

-   HTML to PDF

    ```javascript
    {
        input: 'download',
        inputFormat: 'html',
        file: 'http://example.com',
        outputFormat: 'pdf',
    }
    ```

-   PDF to Image

    ```javascript
    {
        input: 'download',
        inputFormat: 'pdf',
        file: 'http://example.com/file.pdf',
        converterOptions: {
            // ImageMagick Input Commands
            command: '-resize 600 -crop 600x400+0+0 +repage'
        },
        outputFormat: 'png'
    }
    ```

-   Image to Image
    ```javascript
    {
        input: 'download',
        inputFormat: 'png',
        file: 'http://example.com/file.png',
        converterOptions: {
            // ImageMagick Input and Output Commands
            command: '-units PixelsPerInch -density 203 {INPUT_FILE} -colorspace GRAY -ordered-dither 8x8 {OUTPUT_FILE}'
        },
        outputFormat; 'png',
    }
    ```

## Storage Drivers

-   S3

    ```javascript
    {
        type: 's3',
        region: 'us-east-1',
        bucket: 'com.example.bucket',
        key: 'folder/file.pdf'
        metadata: { /*Optinal metadata to be attached to object*/ }

        // Authentication handled by transmogrify-client
        accessKeyId: ''
        secretAccessKey: ''
        sessionToken: ''
    }
    ```

## Development

Transmogrify is designed to be run as a microservice running inside a docker container. The repository is setup to leverage VS Code's Remote Development extensions to develop inside a docker container. Use the instructions below to start the development environment.

#### Prerequisites

-   [Docker](https://www.docker.com/products/docker-desktop)
-   [Visual Studio Code](https://code.visualstudio.com/download)
-   [Remote Development Extension Pack](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.vscode-remote-extensionpack)
-   AWS Credentials - `devcontainer.json` assumes a `.aws/` directory is in your home directory on your local machine.

#### Start Development Environment

1. Navigate to the repository root and launch vs code
    ```bash
    cd ./transmogrify
    code .
    ```
1. Open the VS Code Command Palette (⇧⌘P) and select `Remote-Containers: Rebuild and Reopen in Container`
1. In the new VS Code Instance, open a new terminal (⌃`)
1. Start the server in development mode with the following command:

    ```bash
    su pptruser # Run as pptruser (see note)
    npm run dev
    ```

    **Note**: The `devcontainer.json` overrides `USER pptruser` in the `Dockerfile`. This is necessary to install extensions. The app must be run as `pptruser` to allow puppeteer to run without `--no-sandbox` flag

-   To reubuild and relaunch the container, open the VS Code Command Palette (⇧⌘P) and select `Remote-Containers: Rebuild Container`
-   To exit the container, open the VS Code Command Palette (⇧⌘P) and select `Remote-Containers: Close Remote Connection`

### Format / Lint

-   This repository uses [lint-staged](https://www.npmjs.com/package/lint-staged) and [husky](https://www.npmjs.com/package/husky) to lint and format code with a pre-commit hook
    -   If the code being committed contains errors, the commit will be rejected until errors are resolved
    -   This is done automatically, no further configuration is required
-   To further improve the development experience, it is reccomended to install the the following VS Code extensions:
    -   [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
    -   [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
-   To enable Prettier to **Format on Save** in VS Code:
    -   **Note:** These settings are not necessary when developing inside the docker container as they are included in the `devcontainer.js`
    1. Create a `.vscode` directory in the repository root
    1. Create a `settings.json` file inside `.vscode`
    1. Add these settings:
        ```json
        {
            "editor.defaultFormatter": "esbenp.prettier-vscode",
            "editor.formatOnSave": true
        }
        ```

### Debugging

-   The VS Code debugger configuration is located in `./.vscode/launch.json`
-   The debugger can be started by pressing F5 or by opening the Run tab (⇧⌘D) and pressing the green play button
