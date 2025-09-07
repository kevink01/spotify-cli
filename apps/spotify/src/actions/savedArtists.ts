import type { SingleBar } from 'cli-progress';
import { logger, statusBars } from '..';
import { ARTISTS_URL, DEFAULT_OFFSET } from '~/constants/spotify';
import { writeFile } from 'fs/promises';

let artistBar: SingleBar | null = null;

export async function getSavedArtists(access_token: string, index: number) {
	// logger.startMessage("Downloading user's saved artists", index);
	const artistsCountURL = getArtistURL(1, undefined);
	return await fetch(artistsCountURL, {
		headers: {
			Authorization: `Bearer ${access_token}`,
		},
	})
		.then(async (res) => {
			if (!res.ok) {
				throw new Error('Error in saved artists');
			}
			const data = await res.json();
			const totalArtists = data['artists']['total'] as number;
			artistBar = statusBars.createSingleBar('Saved artists', totalArtists, 0);
			const allArtists = await getAllArtists(
				0,
				totalArtists,
				access_token,
				undefined
			);
			const schemedArtists = [];
			for (const artist of allArtists) {
				schemedArtists.push({
					name: artist['name'],
					id: artist['id'],
					href: artist['href'],
					uri: artist['uri'],
				});
			}
			await writeFile(
				'data/savedArtists.json',
				JSON.stringify(schemedArtists, null, 4),
				'utf-8'
			);
			if (schemedArtists.length === totalArtists) {
				await statusBars.stop(artistBar);
			} else {
				await statusBars.stopWithError(artistBar);
			}
		})
		.catch(async () => {
			logger.error("Failed to save user's saved artists");
			if (artistBar) {
				await statusBars.stopWithError(artistBar);
			}
		});
}

async function getAllArtists(
	start: number,
	totalArtists: number,
	access_token: string,
	after?: string
): Promise<any[]> {
	if (start > totalArtists) return [];
	const savedAlbumsURL = getArtistURL(DEFAULT_OFFSET, after);
	return await fetch(savedAlbumsURL, {
		headers: {
			Authorization: `Bearer ${access_token}`,
		},
	})
		.then(async (res): Promise<any[]> => {
			if (!res.ok) {
				throw new Error(
					`Could not get information for artists with offset ${start}`
				);
			}
			const data = await res.json();
			const items = data['artists']['items'] as any[];
			const newAfter = data['artists']['cursors']?.['after'] as string | null;
			await statusBars.step(artistBar, items.length);

			return [
				...items,
				...(await getAllArtists(
					start + DEFAULT_OFFSET,
					totalArtists,
					access_token,
					newAfter ?? undefined
				)),
			];
		})
		.catch((err: Error) => {
			logger.error(err.message);
			return [];
		});
}

function getArtistURL(limit: number, after?: string) {
	const artistURL = new URL(ARTISTS_URL);
	artistURL.search = getAlbumSearchParams(limit, after);
	return artistURL;
}

function getAlbumSearchParams(limit: number, after?: string) {
	const params = new URLSearchParams({
		limit: limit.toString(),
		type: 'artist',
	});
	if (after) {
		params.set('after', after);
	}
	return params.toString();
}
