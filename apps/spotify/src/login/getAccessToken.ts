import { REDIRECT_URI, SPOTIFY_CLIENT_ID } from '~/constants/local';

export async function getAccessToken(code: string, codeVerifier: string) {
	const url = new URL('https://accounts.spotify.com/api/token');
	const payload = {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		body: new URLSearchParams({
			client_id: SPOTIFY_CLIENT_ID,
			grant_type: 'authorization_code',
			code,
			redirect_uri: REDIRECT_URI,
			code_verifier: codeVerifier,
		}),
	};
	return await fetch(url, payload)
		.then(async (res) => {
			if (!res.ok) {
				throw new Error('Error in getting access token');
			}
			const response = await res.json();
			return response['access_token'];
		})
		.catch((err: Error) => {
			console.error(err);
			return null;
		});
}
