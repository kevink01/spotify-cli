import type { SingleBar } from 'cli-progress';
import { writeFile } from 'fs/promises';
import { ALBUMS_URL, DEFAULT_OFFSET } from '~/constants/spotify';
import { statusBars, logger } from '~/index';
import { getURL } from '~/util/url';

let albumBar: SingleBar | null = null;

export async function getSavedAlbums(access_token: string, index: number) {
	// logger.startMessage("Downloading user's saved albums", index);
	const albumsCountURL = getURL(ALBUMS_URL, 0, 1);
	return await fetch(albumsCountURL, {
		headers: {
			Authorization: `Bearer ${access_token}`,
		},
	})
		.then(async (res) => {
			if (!res.ok) {
				throw new Error('Error in saved albums');
			}
			const data = await res.json();
			const totalAlbums = data['total'] as number;
			albumBar = statusBars.createSingleBar('Saved albums', totalAlbums, 0);
			const allAlbums = await getAllAlbums(0, totalAlbums, access_token);
			const schemedAlbums = [];
			for (const album of allAlbums) {
				schemedAlbums.push({
					name: album['album']['name'],
					id: album['album']['id'],
					href: album['album']['href'],
					uri: album['album']['uri'],
				});
			}
			await writeFile(
				'data/savedAlbums.json',
				JSON.stringify(schemedAlbums, null, 4),
				'utf-8'
			);
			if (schemedAlbums.length === totalAlbums) {
				await statusBars.stop(albumBar);
			} else {
				await statusBars.stopWithError(albumBar);
			}
		})
		.catch(async () => {
			logger.error("Failed to save user's saved albums");
			if (albumBar) {
				await statusBars.stopWithError(albumBar);
			}
		});
}

async function getAllAlbums(
	start: number,
	totalAlbums: number,
	access_token: string
): Promise<any[]> {
	if (start > totalAlbums) return [];
	const savedAlbumsURL = getURL(ALBUMS_URL, start, DEFAULT_OFFSET);
	return await fetch(savedAlbumsURL, {
		headers: {
			Authorization: `Bearer ${access_token}`,
		},
	})
		.then(async (res): Promise<any[]> => {
			if (!res.ok) {
				throw new Error(
					`Could not get information for albums with offset ${start}`
				);
			}
			const data = await res.json();
			const items = data['items'] as any[];
			await statusBars.step(albumBar, items.length);

			return [
				...items,
				...(await getAllAlbums(
					start + DEFAULT_OFFSET,
					totalAlbums,
					access_token
				)),
			];
		})
		.catch((err: Error) => {
			logger.error(err.message);
			return [];
		});
}
