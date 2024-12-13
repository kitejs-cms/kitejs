import { useState } from "react";
import MainLayout from "../layouts/main-layout";

export default function HomePage() {
  const [count, setCount] = useState(0);

  const incrementCounter = () => {
    setCount(count + 1);
  };

  const decrementCounter = () => {
    setCount(count - 5);
  };

  return (
    <MainLayout>
      <h1>Welcome to the Home Page</h1>
      <p>This is the home page content..</p>
      <div className="bg-blue-500 text-white p-4">
        <h2>Counter</h2>
        <p>Current count: {count}</p>
        <button onClick={incrementCounter}>Increments</button>
        <button onClick={decrementCounter}>Decrement</button>
      </div>
    </MainLayout>
  );
}
