import { intro, outro, cancel, select } from "@clack/prompts";
import pc from "picocolors";
import { COMMANDS } from "./commands/index";
import { useFzf } from "@wrikka/tui";
import { 
  showHelp, 
  showVersion, 
  handleFeedback, 
  handleIssue, 
  initFlags 
} from "./flags";

(async function main() {
  try {
    // ตรวจสอบการเรียกใช้งานโดยตรง
    if (require.main !== module) return;

    // ตรวจสอบ flag พิเศษ
    const args = process.argv.slice(2);
    
    // ตรวจสอบ flag ต่างๆ
    if (args.includes('--help') || args.includes('-h')) {
      showHelp();
      process.exit(0);
    }
    
    if (args.includes('--version') || args.includes('-v')) {
      showVersion();
      process.exit(0);
    }
    
    if (args.includes('--feedback')) {
      await handleFeedback();
      process.exit(0);
    }
    
    if (args.includes('--issue')) {
      await handleIssue();
      process.exit(0);
    }
    
    if (args.includes('--init')) {
      await initFlags();
      process.exit(0);
    }

    const { runFzf } = useFzf();
    
    // หา command ที่ต้องการรัน
    let selectedCommand: string | symbol | null = args[0];
    
    if (!selectedCommand) {
      // สร้างตัวเลือก command
      const commandOptions = COMMANDS.map(({ value, label, hint }) => ({
        value,
        label: `${label} ${pc.gray(hint ?? '')}`.trim()
      }));

      // เลือก command ด้วย Fzf หรือ select
      const selected = await runFzf(commandOptions, {
        prompt: 'Select a command> ',
        height: 15
      }) || await select({
        message: "Select a command",
        options: commandOptions
      });

      // ตรวจสอบการยกเลิก
      if (selected === null || (typeof selected === 'symbol' && selected.toString() === 'Symbol(clack.cancel)')) {
        outro("Operation cancelled");
        process.exit(0);
      }
      
      selectedCommand = selected as string;
      
      // แสดงข้อความเริ่มต้นเมื่อมีการเลือก command
      intro(pc.white(" Git Interactive CLI "));
    }

    // หาและรัน command
    const command = COMMANDS.find((c) => c.value === selectedCommand);
    if (!command) {
      throw new Error(`Command '${selectedCommand}' not found`);
    }

    await command.handler();
    
    // จบการทำงาน
    outro(pc.green("Done"));
    process.exit(0);
  } catch (error) {
    // จัดการ error
    if (error === cancel || error?.toString() === 'Symbol(clack.cancel)') {
      outro("Operation cancelled");
      process.exit(0);
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    outro(pc.red(`Error: ${errorMessage}`));
    process.exit(1);
  }
})();
