/**
 * Demo seed — implemented in milestone 7.
 *
 * Target dataset for the demo and the report:
 * - 7th, 8th and 9th grade (middle) + 10th, 11th, 12th grade (high)
 * - 14 groups per grade in the school-wide catalogue, 4-6 active per grade
 * - realistic weekly free slots with overlaps, gaps and a few empty groups
 * - one admin, two teachers, a handful of students
 * - settings row with the documented defaults
 *
 * Run with: npm run db:seed
 */

async function main(): Promise<void> {
  console.log("Seed is not implemented yet. See TASKS.md, milestone 7.");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
