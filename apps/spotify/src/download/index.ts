import { checkbox } from '@inquirer/prompts';
import { statusBars } from '~/index';
import DownloadOptions from '../actions/download';
import type { SingleBar } from 'cli-progress';

let totalStatusBar: SingleBar | null = null;

export function updateTotalStatusBar(progress: number = 1) {
	statusBars.updateTotal(totalStatusBar, progress);
}

export function updateProgessTotalbar(step: number = 1) {
	statusBars.step(totalStatusBar, step);
}

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
				name: DownloadOptions.getPlaylistsOptions.name,
				value: DownloadOptions.getPlaylistsOptions.value,
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
				name: DownloadOptions.getArtistOptions.name,
				value: DownloadOptions.getArtistOptions.value,
			},
		],
	});
	totalStatusBar = statusBars.createSingleBar('Download', answers.length, 0);
	for (const answer of answers) {
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
			case DownloadOptions.getPlaylistsOptions.value:
				await DownloadOptions.getPlaylistsOptions.process_data(access_token);
				break;
			case DownloadOptions.getShowsOptions.value:
				await DownloadOptions.getShowsOptions.process_data(access_token);
				break;
			case DownloadOptions.getLikedSongsOptions.value:
				await DownloadOptions.getLikedSongsOptions.process_data(access_token);
				break;
			case DownloadOptions.getArtistOptions.value:
				await DownloadOptions.getArtistOptions.process_data(access_token);
				break;
			default:
		}
		await statusBars.step(totalStatusBar, 1);
	}
	await statusBars.stop(totalStatusBar);
	statusBars.stopAll();
	return;
}
