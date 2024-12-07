import React, { useState } from "react";
import MainLayout from "../layouts/main-layout";

export default function ContactPage() {
  const test = () => {
    console.log("test");
  };

  return (
    <MainLayout>
      <h1>Welcome to the Contact</h1>
      <div>
        <h2>Counter</h2>

        <button onClick={test}>Decrement</button>
      </div>
    </MainLayout>
  );
}
