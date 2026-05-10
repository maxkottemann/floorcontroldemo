import { Suspense } from "react";
import VloerenPaspoortPage from "./VloerpaspoortClient";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <VloerenPaspoortPage />
    </Suspense>
  );
}
