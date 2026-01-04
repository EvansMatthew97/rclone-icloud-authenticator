# Rclone iCloud authentication
This is a proof of concept script to authenticate Rclone iCloud (`icloudddrive`) remotes.

It uses Puppeteer to control a Chromium window, to fetch the required cookies.

> [!NOTE]
> Requires Node.js version 24 or above (TypeScript support is required).

## Installation
```bash
# if using Node Version Manager
nvm use 24

# install dependencies
npm install
```

## Usage
```bash
npm run start
```

## License
This project is licensed under the MIT License.
