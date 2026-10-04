export function buildHouseholdScope(household_id: string) {
  if (!household_id) throw new Error("household_id wajib");
  return { household_id };
}
