/**
 * Hook สำหรับ render Markdown ใน terminal
 */
export function useMarkdown() {
  /**
   * แปลง Markdown เป็นข้อความสำหรับ terminal
   */
  function renderMarkdown(markdown: string): string {
    let result = markdown;
    
    // แปลง code blocks (แบบง่ายๆ)
    result = result.replace(/```[\s\S]*?```/g, (match) => {
      return match.replace(/```(\w+)?\n/g, '').replace(/```/g, '');
    });
    
    // แปลง headers
    result = result.replace(/^# (.*$)/gm, (_, text) => `${text}\n${'='.repeat(text.length)}`);
    result = result.replace(/^## (.*$)/gm, (_, text) => `${text}\n${'-'.repeat(text.length)}`);
    result = result.replace(/^### (.*$)/gm, '$1');
    
    // แปลง lists
    result = result.replace(/^[-*+] (.*$)/gm, '• $1');
    result = result.replace(/^(\d+)\. (.*$)/gm, '$1. $2');
    
    // แปลง bold/italic
    result = result.replace(/\*\*(.*?)\*\*/g, '$1');
    result = result.replace(/\*(.*?)\*/g, '$1');
    result = result.replace(/_(.*?)_/g, '$1');
    
    // แปลง links
    result = result.replace(/\[(.*?)\]\((.*?)\)/g, '$1 ($2)');
    
    // แปลง inline code
    result = result.replace(/`(.*?)`/g, '$1');
    
    // แปลง horizontal rules
    result = result.replace(/^[-*]{3,}$/gm, '―'.repeat(40));
    
    return result;
  }

  return { renderMarkdown };
}