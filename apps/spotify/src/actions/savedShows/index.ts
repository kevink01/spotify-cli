import type { SingleBar } from 'cli-progress';
import { SHOWS_URL } from '~/constants/spotify';
import type { Option } from '~/util/option';
import { processData } from '~/util/handleDownloadData';

let showBar: SingleBar | null = null;

export const getShowsOptions: Option = {
	name: 'Saved shows',
	value: 'saved_shows',
	key: 'show',
	save_file: 'data/savedShows',
	url: SHOWS_URL,
	include_added_at: true,
	offset_error_message: 'Could not get information for shows with offset',
	process_data: async (token: string) =>
		await processData({
			options: getShowsOptions,
			statusBar: showBar,
			token,
		}),
};
