const BASE_URL = 'https://api.spotify.com/v1';
const USER_URL = `${BASE_URL}/me`;

export const ALBUMS_URL = `${USER_URL}/albums`;
export const AUDIOBOOKS_URL = `${USER_URL}/audiobooks`;
export const ARTISTS_URL = `${USER_URL}/following`;
export const EPISODES_URL = `${USER_URL}/episodes`;
export const PLAYLISTS_URL = `${USER_URL}/playlists`;
export const SHOWS_URL = `${USER_URL}/shows`;
export const TRACKS_URL = `${USER_URL}/tracks`;

export const DEFAULT_OFFSET = 50;

export function getPlaylistTracksByIdURL(playlistId: string): string {
	return `${BASE_URL}/playlists/${playlistId}/tracks`;
}
