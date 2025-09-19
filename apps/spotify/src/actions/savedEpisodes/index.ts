import type { SingleBar } from 'cli-progress';
import { EPISODES_URL } from '~/constants/spotify';
import type { Option } from '~/util/option';
import { processData } from '~/util/handleDownloadData';

let episodeBar: SingleBar | null = null;

export const getEpisodesOptions: Option = {
	name: 'Saved episodes',
	value: 'saved_episodes',
	key: 'episode',
	save_file: 'data/savedEpisodes',
	url: EPISODES_URL,
	include_added_at: true,
	offset_error_message: 'Could not get information for episodes with offset',
	process_data: async (token: string) =>
		await processData({
			options: getEpisodesOptions,
			statusBar: episodeBar,
			token,
		}),
};
