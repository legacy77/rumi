// tests/ui/dashboard.test.tsx
import { render, screen } from "@testing-library/react";
import Dashboard from "@/app/(main)/page";
test("tampilkan 1 hal urgent paling besar", () => {
  render(<Dashboard urgent={{ text: "Internet jatuh tempo besok" }} counts={{ tugas: 3, belanja: 5 }} />);
  expect(screen.getByText(/jatuh tempo besok/i)).toBeInTheDocument();
});
