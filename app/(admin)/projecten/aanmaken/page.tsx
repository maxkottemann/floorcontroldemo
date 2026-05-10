import { Suspense } from "react";
import ProjectenAanmakenPage from "./projectAanmakenClient";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ProjectenAanmakenPage />
    </Suspense>
  );
}
