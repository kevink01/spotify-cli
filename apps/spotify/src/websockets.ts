import WebSocket from 'ws';

function connectWithRetry(
	url: string,
	maxAttempts = 10,
	delay = 1000
): Promise<WebSocket> {
	let attempts = 0;

	return new Promise((resolve, reject) => {
		function attemptConnection() {
			attempts++;
			const ws = new WebSocket(url);

			ws.onopen = () => {
				attempts = maxAttempts;
				resolve(ws);
			};

			ws.onclose = (event) => {
				if (!event.wasClean && attempts < maxAttempts) {
					const backoffDelay = delay * Math.pow(2, attempts - 1);
					console.log(
						`Attempting to reconnect in ${backoffDelay / 1000} seconds...`
					);
					setTimeout(attemptConnection, backoffDelay);
				} else {
					reject(
						new Error('Failed to connect to WebSocket after maximum attempts.')
					);
				}
			};

			ws.onerror = () => {};
		}
		attemptConnection();
	});
}

function waitForWebSocketMessage(ws: WebSocket): Promise<any> {
	return new Promise((resolve) => {
		ws.addEventListener(
			'message',
			(event) => {
				resolve(event.data);
			},
			{ once: true }
		); // The { once: true } option automatically removes the listener after the first message
	});
}

export async function getWebsocket(): Promise<WebSocket> {
	const websocket = await connectWithRetry('ws://localhost:9999/ws');
	return websocket;
}

export async function getWebsocketData(ws: WebSocket): Promise<any> {
	const receivedData = await waitForWebSocketMessage(ws);
	ws.close();
	return receivedData;
}
