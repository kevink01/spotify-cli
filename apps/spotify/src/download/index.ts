import { checkbox } from '@inquirer/prompts';
import { getSavedArtists } from '~/actions/savedArtists';
import { getSavedPlaylists } from '~/actions/savedPlaylists';
import { statusBars } from '~/index';
import DownloadOptions from '../actions/download';

export async function handleDownloadOptions(access_token: string) {
	const answers = await checkbox({
		message: 'Select which download options to conduct',
		choices: [
			{
				name: DownloadOptions.getAlbumsOptions.name,
				value: DownloadOptions.getAlbumsOptions.value,
			},
			{
				name: DownloadOptions.getAudiobooksOptions.name,
				value: DownloadOptions.getAudiobooksOptions.value,
			},
			{
				name: DownloadOptions.getEpisodesOptions.name,
				value: DownloadOptions.getEpisodesOptions.value,
				description: 'Spotify API is in BETA mode',
			},
			{
				name: 'Owned playlsits',
				value: 'owned_playlists',
			},
			{
				name: DownloadOptions.getShowsOptions.name,
				value: DownloadOptions.getShowsOptions.value,
			},
			{
				name: DownloadOptions.getLikedSongsOptions.name,
				value: DownloadOptions.getLikedSongsOptions.value,
			},
			{
				name: 'Saved artists',
				value: 'saved_artists',
			},
		],
	});
	const totalStatusBar = statusBars.createSingleBar(
		'Download',
		answers.length,
		0
	);
	for (let index = 0; index < answers.length; index++) {
		const answer = answers[index];
		const num = index + 1;
		switch (answer) {
			case DownloadOptions.getAlbumsOptions.value:
				await DownloadOptions.getAlbumsOptions.process_data(access_token);
				break;
			case DownloadOptions.getAudiobooksOptions.value:
				await DownloadOptions.getAudiobooksOptions.process_data(access_token);
				break;
			case DownloadOptions.getEpisodesOptions.value:
				await DownloadOptions.getEpisodesOptions.process_data(access_token);
				break;
			case 'owned_playlists':
				await getSavedPlaylists(access_token, num);
				break;
			case DownloadOptions.getShowsOptions.value:
				await DownloadOptions.getShowsOptions.process_data(access_token);
				break;
			case DownloadOptions.getLikedSongsOptions.value:
				await DownloadOptions.getLikedSongsOptions.process_data(access_token);
				break;
			case 'saved_artists':
				await getSavedArtists(access_token, num);
				break;
			default:
		}
		await statusBars.step(totalStatusBar, 1);
	}
	await statusBars.stop(totalStatusBar);
	statusBars.stopAll();
	return;
}
