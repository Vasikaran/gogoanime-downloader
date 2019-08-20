#!/usr/bin/env node

const request = require("./request");
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");
const https = require("https");
const cliProgress = require("cli-progress");
const colors = require("colors");
const bytes = require("bytes");

let [, , animeUrl, start = 1, end = 2] = process.argv;

let animeName = animeUrl.split("/").pop();
let cwd = process.cwd();

let outputDir = path.join(cwd, animeName);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

let getEpisodeUrl = episode => {
  return `https://www9.gogoanime.io/${animeName}-episode-${episode}`;
};

let downloadAnime = episode => {
  return new Promise(resolve => {
    let filename = `${animeName}-${episode}.mp4`;
    request({ url: getEpisodeUrl(episode) }).then(({ body: doc }) => {
      const dom = new JSDOM(doc);
      let redirctUrl = dom.window.document.getElementsByClassName(
        "btndownload"
      )[0].parentElement.href;

      request({ url: redirctUrl }).then(({ body: doc }) => {
        const loadingBar = new cliProgress.SingleBar({
          format: `Downloading ${filename} | ${colors.cyan(
            "{bar}"
          )} | {percentage}% | {value}{downloededUnit}/{total}{totalUnit}`,
          barCompleteChar: "\u2588",
          barIncompleteChar: "\u2591",
          hideCursor: true
        });

        const dom = new JSDOM(doc);
        let downloadUrl = dom.window.document.getElementsByClassName(
          "dowload"
        )[0].children[0].href;
        const file = fs.createWriteStream(path.join(outputDir, filename));
        const request = https.get(downloadUrl, response => {
          let contentLength = parseInt(response.headers["content-length"], 10);
          let downloaded = 0;
          loadingBar.start(
            parseInt(bytes(contentLength).replace(/[a-zA-Z]/g, "")),
            0,
            {
              percentage: 0,
              totalUnit: bytes(contentLength).replace(/[0-9.]/g, "")
            }
          );

          response
            .on("data", chunk => {
              file.write(chunk);
              downloaded += chunk.length;
              loadingBar.update(
                Number(bytes(downloaded).replace(/[a-zA-Z]/g, "")),
                {
                  downloededUnit: bytes(downloaded).replace(/[0-9.]/g, ""),
                  percentage: ((100.0 * downloaded) / contentLength).toFixed(2)
                }
              );
            })
            .on("end", () => {
              file.end();
              loadingBar.stop();
              resolve();
            })
            .on("error", err => {
              console.log(err);
            });
        });
      });
    });
  });
};

let downloadAnimes = async () => {
  for (let i = start; i <= end; i++) {
    await downloadAnime(i);
  }
};

downloadAnimes();
