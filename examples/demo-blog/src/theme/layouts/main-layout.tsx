import React from "react";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <header>Header Component</header>
      <main>{children}</main>
      <footer>Footer Component</footer>
    </div>
  );
}
