import React from "react";

type HeaderProps = {
  title: string;
  showLogo: boolean;
};

export const Header: React.FC<HeaderProps> = ({ title, showLogo }) => (
  <header>
    {showLogo && <img src="/assets/logo.svg" alt="Logo" />}
    <h1>{title}</h1>
  </header>
);
