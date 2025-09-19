import type { SingleBar } from 'cli-progress';
import { logger, statusBars } from '../..';
import {
	PLAYLISTS_URL,
	DEFAULT_OFFSET,
	getPlaylistTracksByIdURL,
	USER_URL,
} from '~/constants/spotify';
import { writeFile } from 'fs/promises';
import { getSearchParams, getURL } from '~/util/url';
import { updateProgessTotalbar, updateTotalStatusBar } from '~/download';
import type { Option } from '~/util/option';

let playlistBar: SingleBar | null = null;
let playlistTrackBar: SingleBar | null = null;

export const getPlaylistsOptions: Option = {
	name: 'Saved playlists',
	value: 'saved_playlists',
	key: '',
	save_file: 'data/savedPlaylists',
	url: PLAYLISTS_URL,
	include_added_at: true,
	offset_error_message: 'Could not get information for playlists with offset',
	process_data: async (token: string) => await getSavedPlaylists(token),
};

async function getCurrentUser(
	access_token: string
): Promise<string | undefined> {
	return await fetch(USER_URL, {
		headers: {
			Authorization: `Bearer ${access_token}`,
		},
	})
		.then(async (res) => {
			if (!res.ok) {
				throw new Error('Could not get user information');
			}
			const data = await res.json();
			return data['uri'] ? (data['uri'] as string) : undefined;
		})
		.catch(() => {
			return undefined;
		});
}

export async function getSavedPlaylists(access_token: string) {
	// logger.startMessage("Downloading user's saved playlists", index);
	const playlistsCountURL = getURL(getPlaylistsOptions.url, 0, 1);
	return await fetch(playlistsCountURL, {
		headers: {
			Authorization: `Bearer ${access_token}`,
		},
	})
		.then(async (res) => {
			if (!res.ok) {
				throw new Error(
					`Error getting the total count for ${getPlaylistsOptions.name.toLowerCase()}`
				);
			}
			const data = await res.json();
			const totalPlaylists = data['total'] as number;
			playlistBar = statusBars.createSingleBar(
				getPlaylistsOptions.name,
				totalPlaylists,
				0
			);
			const user = await getCurrentUser(access_token);
			if (!user) {
				return;
			}
			const allPlaylists = await getAllPlaylists(
				0,
				totalPlaylists,
				user,
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
			const followedPlaylists = schemedPlaylists.filter((playlist) => {
				playlist.owner !== user;
			});
			await writeFile(
				'data/followedPlaylists.json',
				JSON.stringify(followedPlaylists, null, 4),
				'utf-8'
			);
			const myPlaylists = schemedPlaylists.filter(
				(playlist) => playlist.owner === user
			);
			updateTotalStatusBar(myPlaylists.length);
			for (const playlist of myPlaylists) {
				if (playlist['owner'] !== user) {
					continue;
				}
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
					updateProgessTotalbar();
					statusBars.step(playlistBar, 1);
				} else {
					await statusBars.stopWithError(playlistTrackBar);
				}
				playlistTrackBar = null;
			}
			await writeFile(
				`${getPlaylistsOptions.save_file}.json`,
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
	user: string,
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
				throw new Error(`${getPlaylistsOptions.offset_error_message} ${start}`);
			}
			const data = await res.json();
			const items = data['items'] as any[];
			const followedPlaylists = items.filter(
				(playlist) => (playlist?.owner?.uri ?? '') !== user
			);
			await statusBars.step(playlistBar, followedPlaylists.length);

			return [
				...items,
				...(await getAllPlaylists(
					start + DEFAULT_OFFSET,
					totalPlaylists,
					user,
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
