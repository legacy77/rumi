import { render, screen } from "@testing-library/react";
import { HouseholdProvider } from "@/lib/household-context";
test("tampilkan nama rumah aktif", () => {
  render(<HouseholdProvider initial={{ id: "h1", nama: "Rumah Kita", role: "admin" }}><span>Rumah Kita</span></HouseholdProvider>);
  expect(screen.getByText("Rumah Kita")).toBeInTheDocument();
});
