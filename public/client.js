document.addEventListener('DOMContentLoaded', () => {
    const terminalContainer = document.getElementById('terminal-container');
    const term = new Terminal({
        cursorBlink: true,
        macOptionIsMeta: true,
        allowProposedApi: true // Fit Addonのために必要
    });

    const fitAddon = new FitAddon.FitAddon();
    term.loadAddon(fitAddon);

    term.open(terminalContainer);
    fitAddon.fit();

    const socket = new WebSocket('ws://' + window.location.host);
    socket.onopen = function() {
        console.log('WebSocket接続が開かれました。');
        term.write('シェルに接続中...\r\n');
        term.onData((data) => {
            socket.send(JSON.stringify({ type: 'input', content: data }));
        });
        window.addEventListener('resize', () => {
            fitAddon.fit();
            socket.send(JSON.stringify({ 
                type: 'resize', 
                cols: term.cols, 
                rows: term.rows 
            }));
        });
        socket.send(JSON.stringify({ 
            type: 'resize', 
            cols: term.cols, 
            rows: term.rows 
        }));
    };

    socket.onmessage = (event) => {
        term.write(event.data);
    };
    socket.onclose = () => {
        console.log('WebSocket接続が閉じられました。');
        term.write('\r\n\r\n[接続が切断されました]');
    };
    socket.onerror = (err) => {
        console.error('WebSocketエラー:', err);
    };
});