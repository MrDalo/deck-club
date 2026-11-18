import { Logger } from '@nestjs/common';

// The server logs on purpose (tool calls, refusals); tests assert on those
// lines through spies, so nothing needs to reach the test output.
Logger.overrideLogger(false);
