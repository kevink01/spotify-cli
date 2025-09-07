import chalk from 'chalk';
import {
	MultiBar,
	Presets,
	SingleBar,
	type Preset,
	type GenericFormatter,
	type Params,
	type Options,
} from 'cli-progress';

const customFormatter: GenericFormatter = (
	options: Options,
	params: Params,
	payload: any
) => {
	const progress = Math.round(
		params.progress * (params.maxWidth / 100) * (options.barsize ?? 40)
	);
	const completeBar = options.barCompleteString?.substring(0, progress);
	const incompleteBar = options.barIncompleteString?.substring(
		progress,
		params.maxWidth
	);
	const percentage = `${(params.progress * 100).toFixed(2)}%`.padStart(6);
	const totalStr = `${params.value}/${params.total}`.padStart(10);
	return `${chalk.green(completeBar + '' + incompleteBar)} | ${payload.name} | ${percentage} | ETA: ${params.eta}s | ${totalStr} | ${payload.status}`;
};

const customPreset: Preset = {
	...Presets.shades_classic,
};

export class StatusBar {
	private statusBars: MultiBar;

	constructor() {
		this.statusBars = new MultiBar(
			{
				clearOnComplete: false,
				hideCursor: true,
				format: customFormatter,
			},
			customPreset
		);
	}

	createSingleBar(name: string, total: number, start: number): SingleBar {
		return this.statusBars.create(total, start, {
			name: name.padEnd(15),
			status: this.getStatus('pending'),
		});
	}

	async step(bar: SingleBar | null, step: number) {
		this.assertStatusBarIsNotNull(bar);
		await this.asyncProgress(() => {
			bar.increment(step, { status: this.getStatus('pending') });
		});
	}

	async stop(bar: SingleBar | null) {
		this.assertStatusBarIsNotNull(bar);
		await this.asyncProgress(() => {
			bar.increment(0, { status: this.getStatus('success') });
			bar.stop();
		});
	}

	async stopWithError(bar: SingleBar | null) {
		this.assertStatusBarIsNotNull(bar);
		await this.asyncProgress(() => {
			bar.increment(0, { status: this.getStatus('error') });
			bar.stop();
		});
	}

	stopAll(): void {
		this.statusBars.stop();
	}

	private asyncProgress(operation: () => void): Promise<null> {
		return new Promise((resolve) => {
			setTimeout(() => {
				operation();
				resolve(null);
			}, 50);
		});
	}

	private assertStatusBarIsNotNull(
		bar: SingleBar | null
	): asserts bar is SingleBar {
		if (bar === null) {
			throw new Error('Status bar must not be null');
		}
	}

	private getStatus(status: string) {
		switch (status) {
			case 'success':
				return '✅';
			case 'error':
				return '❌';
			case 'pending':
				return '➖';
			default:
				return '';
		}
	}
}
