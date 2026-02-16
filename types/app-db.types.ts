/**
 * App-level type re-exports.
 *
 * Re-export only the tables/views the app actually uses
 * so that components and lib code don't depend on the full
 * auto-generated schema.
 *
 * Example:
 *   import type { Database } from "./database.types";
 *   export type AdsDataDaily = Database["public"]["Tables"]["ads_data_daily"]["Row"];
 */

export {};
