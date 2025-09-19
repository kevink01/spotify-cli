import type { SingleBar } from 'cli-progress';
import { TRACKS_URL } from '~/constants/spotify';
import type { Option } from '~/util/option';
import { processData } from '~/util/handleDownloadData';

let likedSongsBar: SingleBar | null = null;
export const getLikedSongsOptions: Option = {
	name: 'Saved tracks',
	value: 'saved_tracks',
	key: 'track',
	save_file: 'data/likedSongs',
	url: TRACKS_URL,
	include_added_at: true,
	offset_error_message: 'Could not get information for track with offset',
	process_data: async (token: string) =>
		await processData({
			options: getLikedSongsOptions,
			statusBar: likedSongsBar,
			token,
		}),
};
