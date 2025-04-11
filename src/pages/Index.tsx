
import { useNavigate } from "react-router-dom";
import Dashboard from "./Dashboard";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const navigate = useNavigate();
  const { loading } = useAuth();
  
  useEffect(() => {
    // Log the page load
    console.log("Index page loaded", { loading });
  }, [loading]);
  
  return <Dashboard />;
};

export default Index;
