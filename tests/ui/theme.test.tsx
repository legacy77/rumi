// tests/ui/theme.test.tsx
import { render, screen } from "@testing-library/react";
import RootLayout from "@/app/layout";

test("layout renders brand greeting slot", () => {
  render(<RootLayout><div>Halo, keluarga!</div></RootLayout>);
  expect(screen.getByText("Halo, keluarga!")).toBeInTheDocument();
});
