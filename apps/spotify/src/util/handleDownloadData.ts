import type { SingleBar } from 'cli-progress';
import { logger, statusBars } from '..';
import type { Option } from './option';
import { getURL } from './url';
import { validateSchema } from './validateSchema';
import { z } from 'zod/v4';
import { DEFAULT_OFFSET } from '~/constants/spotify';
import { writeFile } from 'fs/promises';

const simpleSchema = z.array(
	z.object({
		added_at: z.string().optional(),
		href: z.string(),
		id: z.string(),
		name: z.string(),
		uri: z.string(),
	})
);
type ProcessDataArgs = {
	options: Option;
	statusBar: SingleBar | null;
	token: string;
};

export async function processData({ ...args }: ProcessDataArgs) {
	const countURL = getURL(args.options.url, 0, 1);
	return await fetch(countURL, {
		headers: {
			Authorization: `Bearer ${args.token}`,
		},
	})
		.then(async (res) => {
			if (!res.ok) {
				throw new Error(
					`Error getting the total count for ${args.options.name.toLowerCase()}`
				);
			}
			const data = await res.json();
			const total = data['total'] as number;
			args.statusBar = statusBars.createSingleBar(args.options.name, total, 0);
			const allData = await getAllData(0, total, args);
			const schemedResponse = validateSchema(
				allData,
				simpleSchema,
				args.options
			);
			await writeFile(
				`${args.options.save_file}.json`,
				JSON.stringify(schemedResponse, null, 4),
				'utf-8'
			);
			if (schemedResponse.length === total) {
				await statusBars.stop(args.statusBar);
			} else {
				await statusBars.stopWithError(args.statusBar);
			}
		})
		.catch(async () => {
			logger.error(`Failed to save the ${args.options.name.toLowerCase()}`);
			if (args.statusBar) {
				await statusBars.stopWithError(args.statusBar);
			}
		});
}

async function getAllData(
	start: number,
	total: number,
	{ ...args }: ProcessDataArgs
): Promise<any[]> {
	if (start > total) return [];
	const savedEpisodesURL = getURL(args.options.url, start, DEFAULT_OFFSET);
	return await fetch(savedEpisodesURL, {
		headers: {
			Authorization: `Bearer ${args.token}`,
		},
	})
		.then(async (res): Promise<any[]> => {
			if (!res.ok) {
				throw new Error(`${args.options.offset_error_message} ${start}`);
			}
			const data = await res.json();
			const items = data['items'] as any[];
			await statusBars.step(args.statusBar, items.length);

			return [
				...items,
				...(await getAllData(start + DEFAULT_OFFSET, total, args)),
			];
		})
		.catch((err: Error) => {
			logger.error(err.message);
			return [];
		});
}
