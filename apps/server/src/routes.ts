import { createRoute, z } from '@hono/zod-openapi';
import { jsonContent } from 'stoker/openapi/helpers';
import * as HttpStatusCodes from 'stoker/http-status-codes';

export const getCodeRoute = createRoute({
	tags: ['Code'],
	method: 'get',
	path: '',
	request: {
		query: z.object({ code: z.string() }),
	},
	summary: 'Get code',
	description: 'Get code',
	responses: {
		[HttpStatusCodes.OK]: jsonContent(
			z.object({ message: z.string().min(1) }),
			'Got message from server'
		),
	},
});
export type GetCodeRoute = typeof getCodeRoute;
