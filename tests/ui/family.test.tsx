import { render, screen } from "@testing-library/react";
import KeluargaPage from "@/app/(main)/keluarga/page";
test("member tidak lihat tombol keluarkan", () => {
  render(<KeluargaPage members={[{ nama: "Ibu", role: "admin" }]} myRole="member" />);
  expect(screen.queryByText(/keluarkan/i)).toBeNull();
});
