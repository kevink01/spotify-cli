import type { SingleBar } from 'cli-progress';
import { writeFile } from 'fs/promises';
import { DEFAULT_OFFSET, TRACKS_URL } from '~/constants/spotify';
import { statusBars, logger } from '~/index';
import { getURL } from '~/util/url';

let likedSongsBar: SingleBar | null = null;

export async function getLikedSongs(access_token: string, index: number) {
	// logger.startMessage("Downloading user's saved tracks", index);
	const albumsCountURL = getURL(TRACKS_URL, 0, 1);
	return await fetch(albumsCountURL, {
		headers: {
			Authorization: `Bearer ${access_token}`,
		},
	})
		.then(async (res) => {
			if (!res.ok) {
				throw new Error('Error in saved tracks');
			}
			const data = await res.json();
			const totalTracks = data['total'] as number;
			likedSongsBar = statusBars.createSingleBar(
				'Saved tracks',
				totalTracks,
				0
			);
			const allTracks = await getAllTracks(0, totalTracks, access_token);
			const schemedTracks = [];
			for (const track of allTracks) {
				schemedTracks.push({
					name: track['track']['name'],
					id: track['track']['id'],
					href: track['track']['href'],
					uri: track['track']['uri'],
					added_at: track['added_at'],
				});
			}
			await writeFile(
				'data/likedSongs.json',
				JSON.stringify(schemedTracks, null, 4),
				'utf-8'
			);
			if (schemedTracks.length === totalTracks) {
				await statusBars.stop(likedSongsBar);
			} else {
				await statusBars.stopWithError(likedSongsBar);
			}
		})
		.catch(async () => {
			logger.error("Failed to save user's saved tracks");
			if (likedSongsBar) {
				await statusBars.stopWithError(likedSongsBar);
			}
		});
}

async function getAllTracks(
	start: number,
	totalTracks: number,
	access_token: string
): Promise<any[]> {
	if (start > totalTracks) return [];
	const savedAlbumsURL = getURL(TRACKS_URL, start, DEFAULT_OFFSET);
	return await fetch(savedAlbumsURL, {
		headers: {
			Authorization: `Bearer ${access_token}`,
		},
	})
		.then(async (res): Promise<any[]> => {
			if (!res.ok) {
				throw new Error(
					`Could not get information for tracks with offset ${start}`
				);
			}
			const data = await res.json();
			const items = data['items'] as any[];
			await statusBars.step(likedSongsBar, items.length);

			return [
				...items,
				...(await getAllTracks(
					start + DEFAULT_OFFSET,
					totalTracks,
					access_token
				)),
			];
		})
		.catch((err: Error) => {
			logger.error(err.message);
			return [];
		});
}
