import type { SingleBar } from 'cli-progress';
import { logger, statusBars } from '..';
import { EPISODES_URL, DEFAULT_OFFSET } from '~/constants/spotify';
import { writeFile } from 'fs/promises';
import { getURL } from '~/util/url';

let episodeBar: SingleBar | null = null;

export async function getSavedEpisodes(access_token: string, index: number) {
	// logger.startMessage("Downloading user's saved episodes", index);
	const episodesCountURL = getURL(EPISODES_URL, 0, 1);
	return await fetch(episodesCountURL, {
		headers: {
			Authorization: `Bearer ${access_token}`,
		},
	})
		.then(async (res) => {
			if (!res.ok) {
				throw new Error('Error in saved episodes');
			}
			const data = await res.json();
			const totalEpisodes = data['total'] as number;
			episodeBar = statusBars.createSingleBar(
				'Saved episodes',
				totalEpisodes,
				0
			);
			const allEpisodes = await getAllEpisodes(0, totalEpisodes, access_token);
			const schemedEpisodes = [];
			for (const episode of allEpisodes) {
				schemedEpisodes.push({
					name: episode['episode']['name'],
					id: episode['episode']['id'],
					href: episode['episode']['href'],
					uri: episode['episode']['uri'],
					added_at: episode['added_at'],
				});
			}
			await writeFile(
				'data/savedEpisodes.json',
				JSON.stringify(schemedEpisodes, null, 4),
				'utf-8'
			);
			if (schemedEpisodes.length === totalEpisodes) {
				await statusBars.stop(episodeBar);
			} else {
				await statusBars.stopWithError(episodeBar);
			}
		})
		.catch(async () => {
			logger.error("Failed to save user's saved episodes");
			if (episodeBar) {
				await statusBars.stopWithError(episodeBar);
			}
		});
}

async function getAllEpisodes(
	start: number,
	totalEpisodes: number,
	access_token: string
): Promise<any[]> {
	if (start > totalEpisodes) return [];
	const savedEpisodesURL = getURL(EPISODES_URL, start, DEFAULT_OFFSET);
	return await fetch(savedEpisodesURL, {
		headers: {
			Authorization: `Bearer ${access_token}`,
		},
	})
		.then(async (res): Promise<any[]> => {
			if (!res.ok) {
				throw new Error(
					`Could not get information for episodes with offset ${start}`
				);
			}
			const data = await res.json();
			const items = data['items'] as any[];
			await statusBars.step(episodeBar, items.length);

			return [
				...items,
				...(await getAllEpisodes(
					start + DEFAULT_OFFSET,
					totalEpisodes,
					access_token
				)),
			];
		})
		.catch((err: Error) => {
			logger.error(err.message);
			return [];
		});
}
