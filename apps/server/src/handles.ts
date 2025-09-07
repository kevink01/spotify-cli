import { PubSub } from './pubsub';
import { type GetCodeRoute } from './routes';
import type { WebSocketData, AppRouteHandler } from './types';
import * as HttpStatusCodes from 'stoker/http-status-codes';

export const subscribers = new PubSub<WebSocketData>();

export const getCodeHandle: AppRouteHandler<GetCodeRoute> = async (c) => {
	const { code } = c.req.valid('query');
	const data: WebSocketData = {
		message: code,
		timestamp: new Date().toISOString(),
	};
	subscribers.publish(data);
	return c.json(
		{ message: 'Successfull received code from client' },
		HttpStatusCodes.OK
	);
};
