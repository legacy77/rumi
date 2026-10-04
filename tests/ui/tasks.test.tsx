// tests/ui/tasks.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import TaskRow from "@/components/TaskRow";
test("geser kanan = selesai memanggil onToggle", () => {
  const fn = vi.fn();
  render(<TaskRow judul="Pel lantai" status="todo" onToggle={fn} />);
  fireEvent.click(screen.getByRole("checkbox"));
  expect(fn).toHaveBeenCalled();
});
