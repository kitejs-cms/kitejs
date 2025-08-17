import { useEffect, useState } from "react";

interface Gallery {
  id: string;
}

export function GalleriesManagePage() {
  const [galleries, setGalleries] = useState<Gallery[]>([]);

  useEffect(() => {
    fetch("/api/galleries")
      .then((res) => res.json())
      .then((data) => setGalleries(data?.data ?? []))
      .catch(() => setGalleries([]));
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Galleries</h1>
      <ul>
        {galleries.map((g) => (
          <li key={g.id}>{g.id}</li>
        ))}
      </ul>
    </div>
  );
}
