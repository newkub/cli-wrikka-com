import { text, select, isCancel } from "@clack/prompts";
import pc from "picocolors";
import { execa } from "execa";
import { manageReleases } from "./release";

type TagAction = "list" | "create" | "push" | "delete";

export async function tag() {
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
            await listTags();
            break;
        case "create":
            await manageReleases();
            break;
        case "push":
            await pushTag();
            break;
        case "delete":
            await deleteTag();
            break;
    }
}

async function listTags() {
    try {
        const { stdout } = await execa("git", ["tag", "--list"]);
        const tags = stdout.split("\n").filter(Boolean);

        if (tags.length === 0) {
            console.log(pc.yellow("No tags found in this repository."));
        } else {
            console.log(pc.blue("\nTags:"));
            tags.forEach((tag, index) => {
                console.log(`  ${index + 1}. ${tag}`);
            });
        }
    } catch (error) {
        console.error(pc.red("Failed to list tags:"), error instanceof Error ? error.message : error);
    }
}

async function pushTag() {
    const tagName = await text({
        message: "Enter tag name to push:",
        validate: (value: string) => (!value ? "Tag name is required" : undefined),
    });

    if (isCancel(tagName)) return;

    try {
        await execa("git", ["push", "origin", tagName], { stdio: "inherit" });
        console.log(pc.green(`Tag ${tagName} pushed successfully`));
    } catch (error) {
        console.error(pc.red("Failed to push tag:"), error instanceof Error ? error.message : error);
    }
}

async function deleteTag() {
    const tagName = await text({
        message: "Enter tag name to delete:",
        validate: (value: string) => (!value ? "Tag name is required" : undefined),
    });

    if (isCancel(tagName)) return;

    try {
        await execa("git", ["tag", "-d", tagName], { stdio: "inherit" });
        console.log(pc.green(`Tag ${tagName} deleted successfully`));
    } catch (error) {
        console.error(pc.red("Failed to delete tag:"), error instanceof Error ? error.message : error);
    }
}