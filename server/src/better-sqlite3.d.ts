declare module "better-sqlite3" {
  export interface RunResult {
    changes: number;
    lastInsertRowid: number | bigint;
  }

  export interface Statement<Result = unknown> {
    get(...params: unknown[]): Result;
    all(...params: unknown[]): Result[];
    run(...params: unknown[]): RunResult;
  }

  export default class Database {
    constructor(path: string);
    pragma(statement: string): void;
    exec(statement: string): void;
    prepare<Result = unknown>(statement: string): Statement<Result>;
    transaction<T extends (...args: never[]) => unknown>(fn: T): T;
    close(): void;
  }
}
