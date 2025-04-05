import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, Settings, Menu, BookOpen, Archive } from "lucide-react";
import { motion } from "framer-motion";

const NavigationBar = () => {
  return (
    <header className="border-b border-border/40 bg-card shadow-subtle sticky top-0 z-10">
      <div className="container mx-auto px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="md:hidden h-8 w-8">
            <Menu className="h-4 w-4" />
          </Button>
          <Link to="/">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2.5"
            >
              <div className="bg-brand rounded-full p-1.5">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M12 2L20 7V17L12 22L4 17V7L12 2Z" fill="white" />
                </svg>
              </div>
              <h1 className="text-base font-semibold tracking-tight hidden md:block">
                Content Repurposer
              </h1>
            </motion.div>
          </Link>

          <nav className="hidden md:flex ml-8 space-x-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-sm font-medium"
              asChild
            >
              <Link to="/">Home</Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-sm font-medium"
              asChild
            >
              <Link to="/input">Input</Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-sm font-medium"
              asChild
            >
              <Link to="/transform">Transform</Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-sm font-medium"
              asChild
            >
              <Link to="/preview">Preview</Link>
            </Button>
          </nav>
        </div>

        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <Link to="/research">
              <BookOpen className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <Link to="/archive">
              <Archive className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <Link to="/settings">
              <Settings className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Bell className="h-4 w-4" />
          </Button>
          <Avatar className="h-8 w-8 ml-1">
            <AvatarImage
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=user123"
              alt="User"
            />
            <AvatarFallback className="text-xs">US</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
};

export default NavigationBar;
