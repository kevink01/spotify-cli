import { select } from '@inquirer/prompts';
import { Login } from './login';
import { exit } from 'process';
import { handleDownloadOptions } from './download';
import { StatusBar } from './statusbar';
import { Logger } from './logging';

export const statusBars: StatusBar = new StatusBar();
export const logger: Logger = new Logger();

async function main() {
	const answer = await select({
		message: 'Select a choice',
		choices: [
			{ name: 'Download spotify data', value: 'download' },
			{ name: 'Upload spotify data', value: 'upload' },
		],
	});
	switch (answer) {
		case 'download':
			logger.info('Need to login to Spotify...');
			const access_token = await Login();
			if (!access_token) {
				exit(1);
			}
			await handleDownloadOptions(access_token);
			break;
		case 'upload':
			break;
		default:
			logger.error(
				'Your choice is not supported. Please choose between download and upload'
			);
			break;
	}
	await fetch('http://localhost:9999/exit')
		.then(() => {
			exit(0);
		})
		.catch(() => {
			exit(1);
		});
}
main();
