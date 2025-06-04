declare module "node-fzf" {
	interface FzfOptions {
		list: string[];
		mode?: "normal" | "fuzzy";
		prefill?: string;
		prefillOffset?: number;
	}

	interface FzfResult {
		selected: {
			value: string;
			index: number;
		};
		query: string;
	}

	function fzf(options: FzfOptions): Promise<FzfResult>;
	export = fzf;
}
