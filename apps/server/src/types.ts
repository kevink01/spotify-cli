import type { OpenAPIHono, RouteConfig, RouteHandler } from '@hono/zod-openapi';
import type { Env } from 'hono';
import type { PinoLogger } from 'hono-pino';

export interface AppConfig extends Env {
	Variables: {
		logger: PinoLogger;
	};
}

export type AppOpenAPI = OpenAPIHono<AppConfig>;

export type AppRouteHandler<C extends RouteConfig> = RouteHandler<C, AppConfig>;

export interface WebSocketData {
	message: string;
	timestamp: string;
}
