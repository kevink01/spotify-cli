import type { SingleBar } from 'cli-progress';
import { ALBUMS_URL } from '~/constants/spotify';
import { processData } from '~/util/handleDownloadData';
import type { Option } from '~/util/option';

let albumBar: SingleBar | null = null;

export const getAlbumsOptions: Option = {
	name: 'Saved albums',
	value: 'saved_albums',
	key: 'album',
	save_file: 'data/savedAlbums',
	user_url: ALBUMS_URL,
	included_added_at: false,
	offset_error_message: 'Could not get information for albums with offset',
	process_data: async (token: string) =>
		await processData({
			options: getAlbumsOptions,
			statusBar: albumBar,
			token,
		}),
};
