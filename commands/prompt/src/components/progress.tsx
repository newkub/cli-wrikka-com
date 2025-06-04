import * as React from 'react';
import { Box, Text } from 'ink';
import type { FC } from 'react';
import Spinner from './spinner';

type ProgressBarProps = {
  /**
   * Progress value (0-100)
   */
  percent?: number;
  /**
   * Width of the progress bar
   * @default 50
   */
  width?: number;
  /**
   * Character to use for the filled portion of the progress bar
   * @default '█'
   */
  character?: string;
  /**
   * Character to use for the unfilled portion of the progress bar
   * @default ' ' (space)
   */
  emptyCharacter?: string;
  /**
   * Color of the filled portion of the progress bar
   * @default 'green'
   */
  color?: string;
  /**
   * Color of the unfilled portion of the progress bar
   * @default 'gray'
   */
  emptyColor?: string;
  /**
   * Whether to show the percentage
   * @default true
   */
  showPercentage?: boolean;
  /**
   * Whether to show the actual value (e.g., 50/100)
   * @default false
   */
  showValue?: boolean;
  /**
   * Total value (used when showValue is true)
   * @default 100
   */
  total?: number;
  /**
   * Current value (used when showValue is true)
   */
  value?: number;
  /**
   * Text to display before the progress bar
   */
  prefix?: string;
  /**
   * Text to display after the progress bar
   */
  suffix?: string;
};

export const ProgressBar: FC<ProgressBarProps> = ({
  percent = 0,
  width = 50,
  character = '█',
  emptyCharacter = ' ',
  color = 'green',
  emptyColor = 'gray',
  showPercentage = true,
  showValue = false,
  total = 100,
  value,
  prefix = '',
  suffix = '',
}) => {
  // Calculate the filled width based on the percentage
  const filledWidth = Math.min(100, Math.max(0, percent));
  const filledBars = Math.round((filledWidth / 100) * width);
  const emptyBars = width - filledBars;
  
  // Calculate the actual value if not provided
  const actualValue = value !== undefined ? value : Math.round((percent / 100) * total);
  
  return (
    <Box>
      {prefix && <Text>{prefix} </Text>}
      
      <Box>
        <Text color={color}>{character.repeat(filledBars)}</Text>
        <Text color={emptyColor}>{emptyCharacter.repeat(emptyBars)}</Text>
      </Box>
      
      {showPercentage && (
        <Text> {Math.round(percent)}%</Text>
      )}
      
      {showValue && (
        <Text> {actualValue}/{total}</Text>
      )}
      
      {suffix && <Text> {suffix}</Text>}
    </Box>
  );
};

export interface Task {
  /**
   * Task title
   */
  title: string;
  /**
   * Task function that returns a promise
   */
  task: () => Promise<void> | void;
  /**
   * Whether to skip this task
   */
  skip?: boolean | (() => boolean | Promise<boolean>);
  /**
   * Number of retries on error
   * @default 0
   */
  retry?: number;
};

interface TaskListProps {
  /**
   * List of tasks to run
   */
  tasks: Task[];
  /**
   * Whether to run tasks concurrently
   * @default false
   */
  concurrent?: boolean;
  /**
   * Whether to exit on error
   * @default true
   */
  exitOnError?: boolean;
  /**
   * Whether to show timers for each task
   * @default true
   */
  showTimer?: boolean;
  /**
   * Whether to show a summary at the end
   * @default true
   */
  showSummary?: boolean;
  /**
   * Callback when all tasks are completed
   */
  onComplete?: (results: { success: boolean; errors: Error[] }) => void;
};

interface TaskState {
  status: 'pending' | 'running' | 'success' | 'error' | 'skipped';
  error?: Error;
  startTime?: number;
  endTime?: number;
  retryCount: number;
};

export const TaskList: FC<TaskListProps> = ({
  tasks,
  concurrent = false,
  exitOnError = true,
  showTimer = true,
  showSummary = true,
  onComplete,
}) => {
  interface TaskSummary {
    total: number;
    success: number;
    failed: number;
    skipped: number;
    pending: number;
    running: number;
    isComplete: boolean;
    duration: number;
    startTime?: number;
    endTime?: number;
  }

  const [taskStates, setTaskStates] = React.useState<Record<number, TaskState>>(
    tasks.reduce<Record<number, TaskState>>((acc, _, index) => {
      acc[index] = { status: 'pending', retryCount: 0 };
      return acc;
    }, {})
  );
  const [_, setErrors] = React.useState<Error[]>([]);
  const [summary, setSummary] = React.useState<TaskSummary>({
    total: tasks.length,
    success: 0,
    failed: 0,
    skipped: 0,
    pending: tasks.length,
    running: 0,
    isComplete: false,
    duration: 0,
    startTime: Date.now(),
  });

  const isCompleteRef = React.useRef(false);
  
  // Run tasks on mount
  React.useEffect(() => {
    let isMounted = true;
    
    const runTasks = async () => {
      const _results: { success: boolean; skipped?: boolean; error?: Error }[] = [];
      const taskErrors: Error[] = [];
      
      const runTask = async (task: Task, index: number): Promise<{ success: boolean; skipped?: boolean; error?: Error }> => {
        if (!isMounted) return { success: false };
        
        // Check if task should be skipped
        const shouldSkip = task.skip === undefined 
          ? false 
          : typeof task.skip === 'function' 
            ? await task.skip() 
            : task.skip;
          
        if (shouldSkip) {
          setTaskStates(prev => ({
            ...prev,
            [index]: { ...prev[index], status: 'skipped' },
          }));
          return { success: true, skipped: true };
        }
        
        // Mark task as running
        setTaskStates(prev => ({
          ...prev,
          [index]: { 
            ...prev[index], 
            status: 'running',
            startTime: Date.now(),
          },
        }));
        
        let result = { success: false, error: undefined as Error | undefined };
        let retryCount = 0;
        const maxRetries = task.retry ?? 0;
        
        // Run task with retries
        while (retryCount <= maxRetries) {
          try {
            await task.task();
            result = { success: true, error: undefined };
            break;
          } catch (error) {
            result = { 
              success: false, 
              error: error instanceof Error ? error : new Error(String(error)),
            };
            
            if (retryCount < maxRetries) {
              retryCount++;
              setTaskStates(prev => ({
                ...prev,
                [index]: { 
                  ...prev[index], 
                  retryCount,
                },
              }));
              // Wait a bit before retrying
              await new Promise(resolve => setTimeout(resolve, 1000));
            } else {
              break;
            }
          }
        }
        
        // Update task state
        if (isMounted) {
          setTaskStates(prev => ({
            ...prev,
            [index]: { 
              ...prev[index], 
              status: result.success ? 'success' : 'error',
              error: result.error,
              endTime: Date.now(),
              retryCount,
            },
          }));
          
          if (!result.success && result.error) {
            taskErrors.push(result.error);
            if (result?.error) {
              setErrors(prev => [...prev, result.error!]);
            }
          }
        }
        
        return { success: result.success, error: result.error };
      };
      
      try {
        if (concurrent) {
          // Run all tasks concurrently
          await Promise.all(
            tasks.map((task, index) => runTask(task, index))
          );
        } else {
          // Run tasks sequentially
          for (let i = 0; i < tasks.length; i++) {
            const result = await runTask(tasks[i], i);
            
            // Exit on error if exitOnError is true
            if (!result.success && exitOnError) {
              break;
            }
          }
        }
      } finally {
        if (isMounted) {
          isCompleteRef.current = true;
          onComplete?.({
            success: taskErrors.length === 0,
            errors: taskErrors,
          });
        }
      }
    };
    
    runTasks();
    
    return () => {
      isMounted = false;
    };
  }, [tasks, concurrent, exitOnError, onComplete]);
  
  // Get status symbol
  const getStatusSymbol = (status: TaskState['status']) => {
    switch (status) {
      case 'running':
        return '↻';
      case 'success':
        return '✓';
      case 'error':
        return '✗';
      case 'skipped':
        return '↓';
      default: // pending and any other cases
        return ' ';
    }
  };
  
  // Get status color
  const getStatusColor = (status: TaskState['status']) => {
    switch (status) {
      case 'running':
        return 'blue';
      case 'success':
        return 'green';
      case 'error':
        return 'red';
      case 'skipped':
        return 'yellow';
      default: // pending and any other cases
        return 'gray';
    }
  };
  
  // Format duration
  const formatDuration = (startTime?: number, endTime?: number): string => {
    if (!startTime) return '';
    const end = endTime ?? Date.now();
    const duration = end - startTime;
    
    if (duration < 1000) {
      return `${duration}ms`;
    }
    
    return `${(duration / 1000).toFixed(2)}s`;
  };
  
  // Calculate summary
  const currentSummary = React.useMemo(() => {
    const states = Object.values(taskStates);
    const success = states.filter(s => s.status === 'success').length;
    const failed = states.filter(s => s.status === 'error').length;
    const skipped = states.filter(s => s.status === 'skipped').length;
    const pending = states.filter(s => s.status === 'pending').length;
    const running = states.filter(s => s.status === 'running').length;
    const isComplete = states.every(s => ['success', 'error', 'skipped'].includes(s.status));
    const endTime = isComplete ? Date.now() : undefined;
    const duration = endTime && summary.startTime ? endTime - summary.startTime : 0;

    return {
      ...summary,
      total: states.length,
      success,
      failed,
      skipped,
      pending,
      running,
      isComplete,
      endTime,
      duration
    };
  }, [taskStates, summary.startTime]);

  // Update summary when it changes
  React.useEffect(() => {
    setSummary(prev => ({
      ...prev,
      ...currentSummary
    }));
  }, [currentSummary]);
  
  return (
    <Box flexDirection="column">
      {tasks.map((task, index) => {
        const state = taskStates[index] || { status: 'pending', retryCount: 0 };
        const isRunning = state.status === 'running';
        const hasError = state.status === 'error';
        const wasSkipped = state.status === 'skipped';
        
        return (
          <Box key={`task-${task.title}-${index}`} flexDirection="column" marginBottom={1}>
            <Box>
              <Text color={getStatusColor(state.status)}>
                {getStatusSymbol(state.status)} {task.title}
              </Text>
              
              {state.retryCount > 0 && (
                <Text color="yellow" dimColor>
                  {' '}(retry {state.retryCount}/{task.retry ?? 0})
                </Text>
              )}
              
              {showTimer && (state.startTime || state.endTime) && (
                <Text color="gray" dimColor>
                  {' '}({formatDuration(state.startTime, state.endTime)})
                </Text>
              )}
              
              {isRunning && (
                <Text> <Spinner type="dots" color="blue" /></Text>
              )}
            </Box>
            
            {hasError && state.error && (
              <Box marginLeft={2}>
                <Text color="red">
                  {state.error.message || 'An error occurred'}
                </Text>
              </Box>
            )}
            
            {wasSkipped && (
              <Box marginLeft={2}>
                <Text color="yellow" dimColor>
                  Skipped
                </Text>
              </Box>
            )}
          </Box>
        );
      })}
      
      {showSummary && (summary.isComplete || summary.running > 0) && (
        <Box marginTop={1} flexDirection="column">
          <Box>
            <Text bold>Summary:</Text>
            {' '}
            <Text color="green">{summary.success} passed</Text>
            {summary.failed > 0 && (
              <Text>, <Text color="red">{summary.failed} failed</Text></Text>
            )}
            {summary.skipped > 0 && (
              <Text>, <Text color="yellow">{summary.skipped} skipped</Text></Text>
            )}
            {summary.pending > 0 && (
              <Text>, <Text color="gray">{summary.pending} pending</Text></Text>
            )}
            {summary.running > 0 && (
              <Text>, <Text color="blue">{summary.running} running</Text></Text>
            )}
            {' '}
            <Text color="gray">({summary.total} total)</Text>
            {' '}
            <Text color="gray">in {summary.duration ? formatDuration(0, summary.duration) : '0s'}</Text>
          </Box>
          
          <Box marginTop={1}>
            <ProgressBar 
              percent={(summary.success / summary.total) * 100} 
              width={30}
              color="green"
              emptyColor="gray"
              showPercentage={false}
            />
          </Box>
        </Box>
      )}
    </Box>
  );
};

// Export ProgressBar as default
export default ProgressBar;
