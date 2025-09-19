import { OpenAPIHono } from '@hono/zod-openapi';
import type { AppConfig, WebSocketData } from './types';
import { defaultHook } from 'stoker/openapi';
import { getCodeRoute } from './routes';
import { getCodeHandle, subscribers } from './handles';
import { logger } from './logger';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import { createNodeWebSocket } from '@hono/node-ws';
import { WSContext } from 'hono/ws';
import { WebSocket } from 'ws';
import * as HttpStatusCodes from 'stoker/http-status-codes';

export function createRouter() {
	return new OpenAPIHono<AppConfig>({ strict: false, defaultHook });
}

export const codeRouter = createRouter().openapi(getCodeRoute, getCodeHandle);

export const app = new OpenAPIHono<AppConfig>();
const activeConnections = new Map<
	WSContext<WebSocket>,
	(data: WebSocketData) => void
>();

const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app });

let requestCount = 0;

app.use('*', logger());
app.use('*', cors());
app.use(async (c, next) => {
	requestCount++;
	try {
		await next();
	} finally {
		requestCount--;
	}
});
app.route('/code', codeRouter);

app.get(
	'/ws',
	upgradeWebSocket((c) => {
		return {
			onOpen(_event, ws) {
				const subscriber = (data: WebSocketData) => {
					ws.send(JSON.stringify(data));
				};
				subscribers.subscribe(subscriber);
				activeConnections.set(ws, subscriber);
			},
			onClose(_event, ws) {
				const subscriber = activeConnections.get(ws);
				if (subscriber) {
					subscribers.unsubscribe(subscriber);
					activeConnections.delete(ws);
				}
			},
		};
	})
);

const server = serve(
	{
		fetch: app.fetch,
		port: 9999,
	},
	(info) => {
		console.log(`Server is running on http://localhost:${info.port}`);
	}
);
injectWebSocket(server);
app.get('/exit', async (c) => {
	console.log('Received shutdown request. Terminating the server...');
	server.close(() => {
		console.log('Server gracefully closed.');
		process.exit(0);
	});
	return c.text('Server is shutting down.');
});
