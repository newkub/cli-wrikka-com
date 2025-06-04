import { intro, isCancel, outro, select } from "@clack/prompts";
import consola from "consola";
import {
	Copy,
	Create,
	Delete,
	Edit,
	Find,
	Grep,
	Info,
	List,
	Move,
	Open,
	Rename,
	Search,
	Tree,
	Zip,
} from "./commands";

async function main() {
	try {
		intro("File Manager CLI");

		const action = await select({
			message: "What do you want to do?",
			options: [
				{ value: "create", label: "Create new file" },
				{ value: "edit", label: "Edit file" },
				{ value: "rename", label: "Rename file" },
				{ value: "move", label: "Move file" },
				{ value: "copy", label: "Copy file" },
				{ value: "search", label: "Search files" },
				{ value: "delete", label: "Delete file" },
				{ value: "open", label: "Open file" },
				{ value: "list", label: "List files" },
				{ value: "info", label: "File info" },
				{ value: "find", label: "Find files" },
				{ value: "grep", label: "Search in files" },
				{ value: "tree", label: "Directory tree" },
				{ value: "zip", label: "Create zip archive" },
			],
		});

		if (isCancel(action)) {
			outro("Operation cancelled");
			process.exit(0);
		}

		switch (action) {
			case "create":
				await Create();
				break;
			case "edit":
				await Edit();
				break;
			case "rename":
				await Rename();
				break;
			case "move":
				await Move();
				break;
			case "copy":
				await Copy();
				break;
			case "search":
				await Search();
				break;
			case "delete":
				await Delete();
				break;
			case "open":
				await Open();
				break;
			case "list":
				await List();
				break;
			case "info":
				await Info();
				break;
			case "find":
				await Find();
				break;
			case "grep":
				await Grep();
				break;
			case "tree":
				await Tree();
				break;
			case "zip":
				await Zip();
				break;
		}

		outro("Done!");
	} catch (error) {
		consola.error("An error occurred:", error);
		process.exit(1);
	}
}

main();
