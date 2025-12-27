import puppeteer from "puppeteer";

// create browser window
const browser = await puppeteer.launch({
  headless: false,

  // scale viewport to the browser window size
  defaultViewport: null,

  // no timeouts
  timeout: 0,
});

// get the default page
const page = (await browser.pages())[0] ?? (await browser.newPage());

// intercept the request to /accountLogin to always remember me (set extended_login=true)
page.on("request", async (request) => {
  if (request.isInterceptResolutionHandled()) return;

  if (request.url().includes("/accountLogin")) {
    console.log("Got accountLogin request. Overriding extended_login");
    const bodyRaw = await request.fetchPostData();
    if (!bodyRaw) {
      request.continue();
      return;
    }

    const bodyJson = JSON.parse(bodyRaw);
    const newBody = JSON.stringify({
      ...bodyJson,
      extended_login: true,
    });
    request.continue({
      postData: newBody,
    });
  } else {
    request.continue();
  }
});
await page.setRequestInterception(true);

await page.bringToFront();

// navigate to login page
console.log("Navigating to iCloud...");
await page.goto("https://www.icloud.com");
console.log("Please log in via the browser window");

// click sign in button automatically
const signInButton = await page.waitForSelector(".sign-in-button");
if (!signInButton) {
  throw new Error("Could not find sign in button");
}
await signInButton.click();

// wait until we get the Cookie header containing the X-APPLE-WEBAUTH-HSA-TRUST token
console.log("Waiting for cookies...");
let configTrustToken: string | undefined;
let configCookies: string | undefined;
await page.waitForRequest(
  (request) => {
    const cookieHeader = request.headers()["cookie"];
    if (!cookieHeader) {
      return false;
    }

    const cookiesHeader = cookieHeader
      .split(";")
      .map((cookie) => cookie.trim());
    const trustCookie = cookiesHeader.find((cookie) =>
      cookie.startsWith("X-APPLE-WEBAUTH-HSA-TRUST")
    );

    if (!trustCookie) {
      return false;
    }

    configTrustToken = trustCookie?.split("=")[1];
    configCookies = cookieHeader;

    return true;
  },
  {
    timeout: 0,
  }
);

await browser.close();

console.log("Run the following command to authenticate:");
console.log(
  `rclone config update [remote] cookies='${configCookies}' trust_token='${configTrustToken}'`
);
