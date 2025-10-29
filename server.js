const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const pty = require('@lydell/node-pty');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static(path.join(__dirname, 'public')));
app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));

const PORT = 3000;
const shell = process.env.SHELL || (process.platform === 'win32' ? 'powershell.exe' : 'bash');

wss.on('connection', function connection(ws) {
    console.log('クライアントが接続しました。新しいPTYを作成します。');
    const ptyProcess = pty.spawn(shell, [], {
        name: 'xterm-color',
        cols: 80,
        rows: 30,
        cwd: process.cwd(),
        env: process.env
    });
    ptyProcess.onData((data) => {
        ws.send(data);
    });

    ws.on('message', (message) => {
        const data = JSON.parse(message);
        if (data.type === 'input') {
            ptyProcess.write(data.content);
        } 
        else if (data.type === 'resize') {
            ptyProcess.resize(data.cols, data.rows);
        }
    });
    ws.on('close', () => {
        console.log('クライアントが切断されました。PTYを終了します。');
        ptyProcess.kill();
    });
    ptyProcess.onExit(() => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.close();
        }
    });
});

server.listen(PORT, () => {
    console.log(`サーバーは http://localhost:${PORT} で起動しました。`);
});
