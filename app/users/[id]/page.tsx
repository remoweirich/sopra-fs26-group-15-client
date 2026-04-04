// your code here for S2 to display a single user profile after having clicked on it
// each user has their own slug /[id] (/1, /2, /3, ...) and is displayed using this file
// try to leverage the component library from antd by utilizing "Card" to display the individual user
// import { Card } from "antd"; // similar to /app/users/page.tsx

"use client";
// For components that need React hooks and browser APIs,
// SSR (server side rendering) has to be disabled.
// Read more here: https://nextjs.org/docs/pages/building-your-application/rendering/server-side-rendering

import React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";


const Profile: React.FC = () => {
  return (
    <div className="card-container">
      <div className="card card--wide">
        <h2>User Profile</h2>
        {/* Display user information here */} 
      </div>
      <div className="card card--wide">
        <h2></h2>
        {/* Container Card for Stats, Friends etc. */} 
      </div>
    </div>
  );
};

export default Profile;
