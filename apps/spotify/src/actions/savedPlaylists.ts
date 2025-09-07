import type { SingleBar } from 'cli-progress';
import { logger, statusBars } from '..';
import {
	PLAYLISTS_URL,
	DEFAULT_OFFSET,
	getPlaylistTracksByIdURL,
} from '~/constants/spotify';
import { writeFile } from 'fs/promises';
import { getSearchParams, getURL } from '~/util/url';

let playlistBar: SingleBar | null = null;
let playlistTrackBar: SingleBar | null = null;

export async function getSavedPlaylists(access_token: string, index: number) {
	// logger.startMessage("Downloading user's saved playlists", index);
	const playlistsCountURL = getURL(PLAYLISTS_URL, 0, 1);
	return await fetch(playlistsCountURL, {
		headers: {
			Authorization: `Bearer ${access_token}`,
		},
	})
		.then(async (res) => {
			if (!res.ok) {
				throw new Error('Error in saved playlists');
			}
			const data = await res.json();
			const totalPlaylists = data['total'] as number;
			playlistBar = statusBars.createSingleBar(
				'Saved playlists',
				totalPlaylists,
				0
			);
			const allPlaylists = await getAllPlaylists(
				0,
				totalPlaylists,
				access_token
			);
			const schemedPlaylists = [];
			for (const playlist of allPlaylists) {
				schemedPlaylists.push({
					added_at: playlist['added_at'],
					collaborative: playlist['collaborative'],
					description: playlist['description'],
					href: playlist['href'],
					id: playlist['id'],
					name: playlist['name'],
					owner: playlist['owner']['uri'],
					public: playlist['public'],
					totalTracks: playlist['tracks']['total'],
					tracks: [] as any[],
					uri: playlist['uri'],
				});
			}
			const userID = 'spotify:user:22zdpbeul4bbyji6mkaae3hci';
			for (const playlist of schemedPlaylists) {
				if (playlist['owner'] === userID) {
					const totalTracks = playlist['totalTracks'] as number;
					playlistTrackBar = statusBars.createSingleBar(
						'Get playlist tracks',
						totalTracks,
						0
					);
					const allTracks = await getAllPlaylistTracks(
						playlist['id'] as string,
						0,
						totalTracks,
						access_token
					);
					playlist['tracks'] = allTracks;
					if (allTracks.length === totalTracks) {
						await statusBars.stop(playlistTrackBar);
					} else {
						await statusBars.stopWithError(playlistTrackBar);
					}
					playlistTrackBar = null;
				}
			}
			await writeFile(
				'data/savedPlaylists.json',
				JSON.stringify(schemedPlaylists, null, 4),
				'utf-8'
			);
			if (schemedPlaylists.length === totalPlaylists) {
				await statusBars.stop(playlistBar);
			} else {
				await statusBars.stopWithError(playlistBar);
			}
		})
		.catch(async () => {
			logger.error("Failed to save user's saved playlists");
			if (playlistBar) {
				await statusBars.stopWithError(playlistBar);
			}
		});
}

async function getAllPlaylists(
	start: number,
	totalPlaylists: number,
	access_token: string
): Promise<any[]> {
	if (start > totalPlaylists) return [];
	const savedPlaylistsURL = getURL(PLAYLISTS_URL, start, DEFAULT_OFFSET);
	return await fetch(savedPlaylistsURL, {
		headers: {
			Authorization: `Bearer ${access_token}`,
		},
	})
		.then(async (res): Promise<any[]> => {
			if (!res.ok) {
				throw new Error(
					`Could not get information for playlists with offset ${start}`
				);
			}
			const data = await res.json();
			const items = data['items'] as any[];
			await statusBars.step(playlistBar, items.length);

			return [
				...items,
				...(await getAllPlaylists(
					start + DEFAULT_OFFSET,
					totalPlaylists,
					access_token
				)),
			];
		})
		.catch((err: Error) => {
			logger.error(err.message);
			return [];
		});
}

async function getAllPlaylistTracks(
	playlistId: string,
	start: number,
	totalTracks: number,
	access_token: string
): Promise<any[]> {
	if (start > totalTracks) return [];
	const savedPlaylistTracksURL = new URL(getPlaylistTracksByIdURL(playlistId));
	const savedPlaylistTracksSearchParams = getSearchParams(
		start,
		DEFAULT_OFFSET
	);
	savedPlaylistTracksSearchParams.set(
		'fields',
		'items(added_at,is_local,track(href,id,is_local,name,uri,type))'
	);
	savedPlaylistTracksURL.search = savedPlaylistTracksSearchParams.toString();
	return await fetch(savedPlaylistTracksURL, {
		headers: {
			Authorization: `Bearer ${access_token}`,
		},
	})
		.then(async (res): Promise<any[]> => {
			if (!res.ok) {
				throw new Error(
					`Could not get information for playlist tracks with offset ${start}`
				);
			}
			const data = await res.json();
			const items = data['items'] as any[];
			await statusBars.step(playlistTrackBar, items.length);

			return [
				...items,
				...(await getAllPlaylistTracks(
					playlistId,
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
