import { Suspense } from "react";
import VloerenPaspoortPage from "./Vloerpaspoortpage";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <VloerenPaspoortPage />
    </Suspense>
  );
}
