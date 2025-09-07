import { getWebsocket, getWebsocketData } from '~/websockets';

export async function getCode() {
	const ws = await getWebsocket();
	return await getWebsocketData(ws);
}
