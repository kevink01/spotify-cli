import type { SingleBar } from 'cli-progress';
import { AUDIOBOOKS_URL } from '~/constants/spotify';
import type { Option } from '~/util/option';
import { processData } from '~/util/handleDownloadData';

let audiobookBar: SingleBar | null = null;
export const getAudiobooksOptions: Option = {
	name: 'Saved audiobooks',
	value: 'saved_audiobooks',
	key: undefined,
	save_file: 'data/savedAudiobooks',
	user_url: AUDIOBOOKS_URL,
	included_added_at: false,
	offset_error_message: 'Could not get information for audiobooks with offset',
	process_data: async (token: string) =>
		await processData({
			options: getAudiobooksOptions,
			statusBar: audiobookBar,
			token,
		}),
};
