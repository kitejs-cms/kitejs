import React, { useState } from "react";
import MainLayout from "../layouts/main-layout";

const seoConfig = {
  title: "Home Page - My Site",
  description: "Welcome to the home page of My Site",
  keywords: "home, my site, welcome",
  ogImage: "/assets/images/home-og.png",
};

export default function HomePage() {
  const [count, setCount] = useState(0);

  const incrementCounter = () => {
    setCount(count + 1);
  };

  const decrementCounter = () => {
    setCount(count - 1);
  };

  return (
    <MainLayout seo={seoConfig}>
      <h1>Welcome to the Home Page</h1>
      <p>This is the home page content..</p>
      <div>
        <h2>Counter</h2>
        <p>Current count: {count}</p>
        <button onClick={incrementCounter}>Increment</button>
        <button onClick={decrementCounter}>Decrement</button>
      </div>
    </MainLayout>
  );
}
