"use strict";
/* MOSH LAB headless runner.
   Usage: npx electron headless/main-headless.js /abs/path/to/job.json
   Renders every item in the job file to loop perfect GIFs + PNG stills,
   appends one JSON line per item to <out>/manifest.jsonl, then exits. */
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

const jobFile = process.argv[process.argv.length - 1];
if (!jobFile || !fs.existsSync(jobFile) || !jobFile.endsWith('.json')) {
  console.error('usage: electron headless/main-headless.js /abs/path/to/job.json');
  process.exit(2);
}

app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.disableDomainBlockingFor3DAPIs && app.disableDomainBlockingFor3DAPIs();

app.whenReady().then(() => {
  const win = new BrowserWindow({
    show: false,
    width: 1400, height: 900,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      backgroundThrottling: false,
      webSecurity: false,
    },
  });
  win.webContents.on('render-process-gone', (e, details) => {
    console.error('renderer gone: ' + details.reason);
    app.exit(1);
  });
  win.loadFile(path.join(__dirname, 'headless.html'), { query: { job: jobFile } });
});

ipcMain.on('log', (e, msg) => console.log(msg));
ipcMain.on('fatal', (e, msg) => { console.error('FATAL: ' + msg); app.exit(1); });
ipcMain.on('done', (e, summary) => {
  console.log('DONE ' + summary);
  app.exit(0);
});

process.on('uncaughtException', (err) => { console.error(err); app.exit(1); });
