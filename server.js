const WebSocket = require('ws');

// WebSocket 서버 생성
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', ws => {
    console.log('클라이언트가 연결되었습니다.');

    // 메시지 수신 시
    ws.on('message', message => {
        console.log('받은 메시지:', message);

        // 받은 메시지를 다시 클라이언트에 전송 (Echo)
        ws.send(`서버로부터 받은 메시지: ${message}`);
    });

    // 연결 종료 시
    ws.on('close', () => {
        console.log('클라이언트 연결이 종료되었습니다.');
    });

    // 클라이언트에 초기 메시지 전송
    ws.send('서버에 연결되었습니다!');
});

console.log('WebSocket 서버가 8080 포트에서 실행 중입니다.');
