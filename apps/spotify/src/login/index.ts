import { exec } from 'child_process';
import { getCode } from './getCode';
import { REDIRECT_URI, SPOTIFY_CLIENT_ID } from '~/constants/local';
import { getAccessToken } from './getAccessToken';

const generateRandomString = (length: number) => {
	const possible =
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	const values = crypto.getRandomValues(new Uint8Array(length));
	return values.reduce((acc, x) => acc + possible[x % possible.length], '');
};

const sha256 = async (plain: string) => {
	const encoder = new TextEncoder();
	const data = encoder.encode(plain);
	return crypto.subtle.digest('SHA-256', data);
};

const base64encode = (input: Awaited<ReturnType<typeof sha256>>) => {
	return btoa(String.fromCharCode(...new Uint8Array(input)))
		.replace(/=/g, '')
		.replace(/\+/g, '-')
		.replace(/\//g, '_');
};

const codeVerifier = generateRandomString(64);
const hashed = await sha256(codeVerifier);
const codeChallenge = base64encode(hashed);

const scope =
	'user-read-private user-read-email user-library-read user-follow-read user-read-playback-position';
const authOptions = new URLSearchParams({
	response_type: 'code',
	client_id: SPOTIFY_CLIENT_ID,
	scope,
	code_challenge_method: 'S256',
	code_challenge: codeChallenge,
	redirect_uri: REDIRECT_URI,
});

export async function Login() {
	const url = new URL('https://accounts.spotify.com/authorize');
	url.search = authOptions.toString();
	return await fetch(url)
		.then(async (res) => {
			exec(`start ${res.url}`);
			const data = await getCode();
			const json = JSON.parse(data);
			const code = json['message'];
			const access_token = await getAccessToken(code, codeVerifier);
			return !access_token ? null : (access_token as string);
		})
		.catch((err: Error) => {
			console.error(err);
			return null;
		});
}
