import type { SingleBar } from 'cli-progress';
import { logger, statusBars } from '../..';
import { ARTISTS_URL, DEFAULT_OFFSET } from '~/constants/spotify';
import { writeFile } from 'fs/promises';
import type { Option } from '~/util/option';

let artistBar: SingleBar | null = null;

export const getArtistOptions: Option = {
	name: 'Saved artists',
	value: 'saved_artists',
	key: '',
	save_file: 'data/savedArtists',
	url: ARTISTS_URL,
	include_added_at: false,
	offset_error_message: 'Could not get information for artists with offset',
	process_data: async (token: string) => await getSavedArtists(token),
};

export async function getSavedArtists(access_token: string) {
	const artistsCountURL = getArtistURL(1, undefined);
	return await fetch(artistsCountURL, {
		headers: {
			Authorization: `Bearer ${access_token}`,
		},
	})
		.then(async (res) => {
			if (!res.ok) {
				throw new Error(
					`Error getting the total count for ${getArtistOptions.name.toLowerCase()}`
				);
			}
			const data = await res.json();
			const totalArtists = data['artists']['total'] as number;
			artistBar = statusBars.createSingleBar(
				getArtistOptions.name,
				totalArtists,
				0
			);
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
				`${getArtistOptions.save_file}.json`,
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
				throw new Error(`${getArtistOptions.offset_error_message} ${start}`);
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
	const artistURL = new URL(getArtistOptions.url);
	artistURL.search = getArtistSearchParams(limit, after);
	return artistURL;
}

function getArtistSearchParams(limit: number, after?: string) {
	const params = new URLSearchParams({
		limit: limit.toString(),
		type: 'artist',
	});
	if (after) {
		params.set('after', after);
	}
	return params.toString();
}
