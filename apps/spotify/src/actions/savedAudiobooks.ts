import type { SingleBar } from 'cli-progress';
import { logger, statusBars } from '..';
import { AUDIOBOOKS_URL, DEFAULT_OFFSET } from '~/constants/spotify';
import { writeFile } from 'fs/promises';
import { getURL } from '~/util/url';

let audiobookBar: SingleBar | null = null;

export async function getSavedAudiobooks(access_token: string, index: number) {
	// logger.startMessage("Downloading user's saved audiobooks", index);
	const audiobooksCountURL = getURL(AUDIOBOOKS_URL, 0, 1);
	return await fetch(audiobooksCountURL, {
		headers: {
			Authorization: `Bearer ${access_token}`,
		},
	})
		.then(async (res) => {
			if (!res.ok) {
				throw new Error('Error in saved audiobooks');
			}
			const data = await res.json();
			const totalAudiobooks = data['total'] as number;
			audiobookBar = statusBars.createSingleBar(
				'Saved audiobooks',
				totalAudiobooks,
				0
			);
			const allAudiobooks = await getAllAudiobooks(
				0,
				totalAudiobooks,
				access_token
			);
			const schemedAudiobooks = [];
			for (const audiobook of allAudiobooks) {
				schemedAudiobooks.push({
					name: audiobook['name'],
					id: audiobook['id'],
					href: audiobook['href'],
					uri: audiobook['uri'],
				});
			}
			await writeFile(
				'data/savedAudiobooks.json',
				JSON.stringify(schemedAudiobooks, null, 4),
				'utf-8'
			);
			if (schemedAudiobooks.length === totalAudiobooks) {
				await statusBars.stop(audiobookBar);
			} else {
				await statusBars.stopWithError(audiobookBar);
			}
		})
		.catch(async () => {
			logger.error("Failed to save user's saved audiobooks");
			if (audiobookBar) {
				await statusBars.stopWithError(audiobookBar);
			}
		});
}

async function getAllAudiobooks(
	start: number,
	totalAudiobooks: number,
	access_token: string
): Promise<any[]> {
	if (start > totalAudiobooks) return [];
	const savedAudiobooksURL = getURL(AUDIOBOOKS_URL, start, DEFAULT_OFFSET);
	return await fetch(savedAudiobooksURL, {
		headers: {
			Authorization: `Bearer ${access_token}`,
		},
	})
		.then(async (res): Promise<any[]> => {
			if (!res.ok) {
				throw new Error(
					`Could not get information for audiobooks with offset ${start}`
				);
			}
			const data = await res.json();
			const items = data['items'] as any[];
			await statusBars.step(audiobookBar, items.length);

			return [
				...items,
				...(await getAllAudiobooks(
					start + DEFAULT_OFFSET,
					totalAudiobooks,
					access_token
				)),
			];
		})
		.catch((err: Error) => {
			logger.error(err.message);
			return [];
		});
}
