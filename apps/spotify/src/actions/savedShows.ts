import type { SingleBar } from 'cli-progress';
import { logger, statusBars } from '..';
import { SHOWS_URL, DEFAULT_OFFSET } from '~/constants/spotify';
import { writeFile } from 'fs/promises';
import { getURL } from '~/util/url';

let showBar: SingleBar | null = null;

export async function getSavedShows(access_token: string, index: number) {
	// logger.startMessage("Downloading user's saved shows", index);
	const showsCountURL = getURL(SHOWS_URL, 0, 1);
	return await fetch(showsCountURL, {
		headers: {
			Authorization: `Bearer ${access_token}`,
		},
	})
		.then(async (res) => {
			if (!res.ok) {
				throw new Error('Error in saved shows');
			}
			const data = await res.json();
			const totalShows = data['total'] as number;
			showBar = statusBars.createSingleBar('Saved shows', totalShows, 0);
			const allShows = await getAllShows(0, totalShows, access_token);
			const schemedShows = [];
			for (const show of allShows) {
				schemedShows.push({
					name: show['show']['name'],
					id: show['show']['id'],
					href: show['show']['href'],
					uri: show['show']['uri'],
					added_at: show['added_at'],
				});
			}
			await writeFile(
				'data/savedShows.json',
				JSON.stringify(schemedShows, null, 4),
				'utf-8'
			);
			if (schemedShows.length === totalShows) {
				await statusBars.stop(showBar);
			} else {
				await statusBars.stopWithError(showBar);
			}
		})
		.catch(async () => {
			logger.error("Failed to save user's saved shows");
			if (showBar) {
				await statusBars.stopWithError(showBar);
			}
		});
}

async function getAllShows(
	start: number,
	totalShows: number,
	access_token: string
): Promise<any[]> {
	if (start > totalShows) return [];
	const savedShowsURL = getURL(SHOWS_URL, start, DEFAULT_OFFSET);
	return await fetch(savedShowsURL, {
		headers: {
			Authorization: `Bearer ${access_token}`,
		},
	})
		.then(async (res): Promise<any[]> => {
			if (!res.ok) {
				throw new Error(
					`Could not get information for shows with offset ${start}`
				);
			}
			const data = await res.json();
			const items = data['items'] as any[];
			await statusBars.step(showBar, items.length);

			return [
				...items,
				...(await getAllShows(
					start + DEFAULT_OFFSET,
					totalShows,
					access_token
				)),
			];
		})
		.catch((err: Error) => {
			logger.error(err.message);
			return [];
		});
}
