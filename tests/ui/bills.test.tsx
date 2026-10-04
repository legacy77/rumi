// tests/ui/bills.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import BillCard from "@/components/BillCard";
test("tombol tandai lunas memanggil onPay", () => {
  const fn = vi.fn();
  render(<BillCard nama="Internet" nominal={350000} status="belum" onPay={fn} />);
  fireEvent.click(screen.getByText(/tandai lunas/i));
  expect(fn).toHaveBeenCalled();
});
