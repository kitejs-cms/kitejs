import React from "react";

type HeroProps = {
  image: string;
  ctaText: string;
};

export const Hero: React.FC<HeroProps> = ({ image, ctaText }) => (
  <section>
    <img src={image} alt="Hero" />
    <button>{ctaText}</button>
  </section>
);
