import { intro, isCancel, outro, select } from "@clack/prompts";
import consola from "consola";
import { add, remove, edit, sync } from "./commands";

async function main() {
	try {
		intro("Registry Manager CLI");

		const action = await select({
			message: "What do you want to do?",
			options: [
				{ value: "add", label: "Add to registry" },
				{ value: "remove", label: "Remove from registry" },
				{ value: "edit", label: "Edit registry entry" },
				{ value: "sync", label: "Sync registry" },
			],
		});

		if (isCancel(action)) {
			outro("Operation cancelled");
			process.exit(0);
		}

		switch (action) {
			case "add":
				await add();
				break;
			case "remove":
				await remove();
				break;
			case "edit":
				await edit();
				break;
			case "sync":
				await sync();
				break;
		}

		outro("Done!");
	} catch (error) {
		consola.error(error);
		process.exit(1);
	}
}

main();
