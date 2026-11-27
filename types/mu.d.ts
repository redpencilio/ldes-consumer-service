declare module "mu" {
  /**
   * Register an async callback to run when the server shuts down.
   */
  export function beforeExit(callback: () => Promise<void>): void;
}
