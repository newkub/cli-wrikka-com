import { text, select, isCancel } from "@clack/prompts";
import pc from "picocolors";
import useGit from "../utils/useGit";

type TagAction = "list" | "create" | "push" | "delete";

export async function tag() {
    const git = useGit();

    const action = await select({
        message: "Select tag action:",
        options: [
            { value: "list", label: "List Tags", hint: "Show all tags" },
            { value: "create", label: "Create Tag", hint: "Create new tag" },
            { value: "push", label: "Push Tag", hint: "Push tag to remote" },
            { value: "delete", label: "Delete Tag", hint: "Delete a tag" },
        ],
    }) as TagAction;

    if (isCancel(action)) return;

    switch (action) {
        case "list":
            await listTags(git);
            break;
        case "create":
            await createTag(git);
            break;
        case "push":
            await pushTag(git);
            break;
        case "delete":
            await deleteTag(git);
            break;
    }
}

async function listTags(git: ReturnType<typeof useGit>) {
    try {
        const tags = await git.getTags();
        if (tags.length === 0) {
            console.log(pc.blue("No tags found"));
        } else {
            console.log(pc.cyan("\nTags:"));
            for (const tag of tags) {
                console.log(` - ${tag}`);
            }
        }
    } catch (error) {
        console.error(pc.red("Failed to list tags:"), error instanceof Error ? error.message : error);
        throw error;
    }
}

async function createTag(git: ReturnType<typeof useGit>) {
    try {
        const tagName = await text({
            message: "Enter tag name:",
            validate: (name) => (!name ? "Tag name is required" : undefined),
        });

        if (isCancel(tagName)) return;

        const message = await text({
            message: "Enter tag message (optional):",
        });

        if (isCancel(message)) return;

        const result = await git.createTag(tagName, message || undefined);
        console.log(pc.green(`Created tag: ${result}`));
    } catch (error) {
        console.error(pc.red("Failed to create tag:"), error instanceof Error ? error.message : error);
        throw error;
    }
}

async function pushTag(git: ReturnType<typeof useGit>) {
    try {
        const tagName = await text({
            message: "Enter tag name to push (leave empty for all tags):",
        });

        if (isCancel(tagName)) return;

        if (tagName) {
            await git.pushTag(tagName);
            console.log(pc.green(`Pushed tag: ${tagName}`));
        } else {
            await git.execute(["push", "--tags"]);
            console.log(pc.green("Pushed all tags"));
        }
    } catch (error) {
        console.error(pc.red("Failed to push tag:"), error instanceof Error ? error.message : error);
        throw error;
    }
}

async function deleteTag(git: ReturnType<typeof useGit>) {
    try {
        const tagName = await text({
            message: "Enter tag name to delete:",
            validate: (name) => (!name ? "Tag name is required" : undefined),
        });

        if (isCancel(tagName)) return;

        await git.deleteTag(tagName);
        console.log(pc.green(`Deleted tag: ${tagName}`));
    } catch (error) {
        console.error(pc.red("Failed to delete tag:"), error instanceof Error ? error.message : error);
        throw error;
    }
}