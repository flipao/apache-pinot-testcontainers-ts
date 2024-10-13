import { Readable } from 'stream';

const logBuffer: string[] = [];
const MAX_BUFFER_SIZE = 30;
let intervalId: NodeJS.Timeout;

export function logConsumer(name: string) {
  return (stream: Readable) => {
    stream.on('data', line => {
      logBuffer.push(`[${name}] ${line}`);
      if (logBuffer.length >= MAX_BUFFER_SIZE) {
        flushLogs();
      }
      clearInterval(intervalId);
      intervalId = setInterval(flushLogs, 10 * 1000);
    });
    stream.on('error', line => {
      console.error(`[${name}]`, line);
    });
    stream.on('end', () => {
      console.log(`[${name}]`, 'stream closed');
      clearInterval(intervalId);
    });
  };
}

function flushLogs() {
  if (logBuffer.length > 0) {
    console.log(logBuffer.join(''));
    logBuffer.splice(0, MAX_BUFFER_SIZE);
  }
}
