import { checkbox } from '@inquirer/prompts';
import { getLikedSongs } from '~/actions/likedSongs';
import { getSavedAlbums } from '~/actions/savedAlbums';
import { getSavedArtists } from '~/actions/savedArtists';
import { statusBars } from '~/index';

export async function handleDownloadOptions(access_token: string) {
	const answers = await checkbox({
		message: 'Select which download options to conduct',
		choices: [
			{
				name: 'Saved albums',
				value: 'saved_albums',
			},
			{
				name: 'Saved audiobooks',
				value: 'saved_audiobooks',
			},
			{
				name: 'Saved episodes',
				value: 'saved_episodes',
				description: 'Spotify API is in BETA mode',
			},
			{
				name: 'Owned playlsits',
				value: 'owned_playlists',
			},
			{
				name: 'Followed playlsits',
				value: 'followed_playlists',
			},
			{
				name: 'Saved shows',
				value: 'saved_shows',
			},
			{
				name: 'Liked songs',
				value: 'liked',
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
			case 'saved_albums':
				await getSavedAlbums(access_token, num);
				await statusBars.step(totalStatusBar, 1);
				break;
			case 'saved_artists':
				await getSavedArtists(access_token, num);
				await statusBars.step(totalStatusBar, 1);
				break;
			case 'liked':
				await getLikedSongs(access_token, num);
				await statusBars.step(totalStatusBar, 1);
				break;
			default:
		}
	}
	await statusBars.stop(totalStatusBar);
	statusBars.stopAll();
	return;
}
