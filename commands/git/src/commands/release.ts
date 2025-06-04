import { intro, outro, select, isCancel, text } from "@clack/prompts";
import pc from "picocolors";
import { execa } from "execa";
import useGit from "../utils/useGit";

class ReleaseManagement {
  private git = useGit();

  async listReleases(): Promise<void> {
    try {
      const { stdout } = await execa("gh", ["release", "list", "--limit", "50"]);
      const releases = stdout.split("\n").filter(Boolean);

      if (releases.length === 0) {
        console.log(pc.yellow("No releases found in this repository."));
      } else {
        console.log(pc.blue("\nReleases:"));
        releases.forEach((release, index) => {
          console.log(`  ${index + 1}. ${release}`);
        });
      }
    } catch (error) {
      console.error(pc.red("Failed to list releases:"), error instanceof Error ? error.message : error);
      throw error;
    }
  }

  async compareReleases(v1: string, v2: string): Promise<void> {
    try {
      await execa("gh", ["release", "view", v1, "--json", "body"], {
        stdio: "inherit",
      });
      await execa("gh", ["release", "view", v2, "--json", "body"], {
        stdio: "inherit",
      });
    } catch (error) {
      console.error(pc.red("Failed to compare releases:"), error instanceof Error ? error.message : error);
      throw error;
    }
  }

  async rollbackRelease(version: string): Promise<void> {
    try {
      await execa("git", ["checkout", `tags/${version}`]);
      console.log(pc.green(`Rolled back to version ${version}`));
    } catch (error) {
      console.error(pc.red("Failed to rollback release:"), error instanceof Error ? error.message : error);
      throw error;
    }
  }

  async getReleaseNotes(version: string): Promise<void> {
    try {
      const { stdout } = await execa("gh", [
        "release",
        "view",
        version,
        "--json",
        "body",
      ]);
      console.log(pc.blue(`\nRelease notes for ${version}:`));
      console.log(stdout);
    } catch (error) {
      console.error(pc.red("Failed to get release notes:"), error instanceof Error ? error.message : error);
      throw error;
    }
  }

  async manage(): Promise<void> {
    intro(pc.bgBlue(pc.white(" Release Management ")));

    try {
      const action = await select({
        message: "Select release action:",
        options: [
          {
            value: "list",
            label: "List Releases",
            hint: "Show all releases",
          },
          {
            value: "compare",
            label: "Compare Releases",
            hint: "Compare two versions",
          },
          {
            value: "rollback",
            label: "Rollback Release",
            hint: "Revert to a previous version",
          },
          {
            value: "notes",
            label: "View Release Notes",
            hint: "Show notes for a version",
          },
        ],
      });

      if (isCancel(action)) {
        outro("Operation cancelled");
        return;
      }

      switch (action) {
        case "list": {
          await this.listReleases();
          break;
        }
        case "compare": {
          const v1 = await text({
            message: "Enter first version to compare:",
          });
          if (isCancel(v1)) break;
          const v2 = await text({
            message: "Enter second version to compare:",
          });
          if (isCancel(v2)) break;
          await this.compareReleases(v1, v2);
          break;
        }
        case "rollback": {
          const version = await text({
            message: "Enter version to rollback to:",
          });
          if (isCancel(version)) break;
          await this.rollbackRelease(version);
          break;
        }
        case "notes": {
          const ver = await text({
            message: "Enter version to view notes:",
          });
          if (isCancel(ver)) break;
          await this.getReleaseNotes(ver);
          break;
        }
      }
    } finally {
      outro("Done");
    }
  }
}

export async function release() {
  await new ReleaseManagement().manage();
}
