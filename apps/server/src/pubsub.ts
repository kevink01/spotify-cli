export class PubSub<T> {
	private subscribers: ((data: T) => void)[] = [];

	public subscribe(callback: (data: T) => void) {
		this.subscribers.push(callback);
	}

	public publish(data: T) {
		this.subscribers.forEach((callback) => {
			callback(data);
		});
	}

	public unsubscribe(callback: (data: T) => void) {
		const index = this.subscribers.indexOf(callback);
		if (index > -1) {
			this.subscribers.splice(index, 1);
		}
	}
}
