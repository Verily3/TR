"use client";

import {
  Sparkles,
  Target,
  BookOpen,
  Users,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import type { WelcomeScreenProps } from "./types";

export function WelcomeScreen({
  userName = "there",
  onGetStarted,
  onSkipTour,
}: WelcomeScreenProps) {
  const features = [
    {
      icon: Target,
      title: "Set & Track Goals",
      description: "Define objectives and measure progress",
      color: "text-green-600",
      bg: "bg-green-100",
    },
    {
      icon: BookOpen,
      title: "Learn & Grow",
      description: "Access curated development programs",
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    {
      icon: Users,
      title: "Get Coaching",
      description: "Connect with mentors and coaches",
      color: "text-orange-600",
      bg: "bg-orange-100",
    },
    {
      icon: TrendingUp,
      title: "Track Progress",
      description: "Visualize your transformation journey",
      color: "text-purple-600",
      bg: "bg-purple-100",
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] p-8 text-center">
      {/* Logo/Icon */}
      <div className="mb-6">
        <div className="w-20 h-20 bg-accent/10 rounded-2xl flex items-center justify-center mb-4 mx-auto">
          <Sparkles className="w-10 h-10 text-accent" />
        </div>
        <h1 className="text-3xl font-bold text-sidebar-foreground mb-2">
          Welcome{userName ? `, ${userName}` : ""}!
        </h1>
        <p className="text-lg text-muted-foreground max-w-md">
          We're excited to have you. Let's set up your account and get you started on your transformation journey.
        </p>
      </div>

      {/* Feature Highlights */}
      <div className="grid grid-cols-2 gap-4 max-w-lg mb-8">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card text-left"
          >
            <div className={`p-2 rounded-lg ${feature.bg} shrink-0`}>
              <feature.icon className={`w-5 h-5 ${feature.color}`} />
            </div>
            <div>
              <h3 className="text-sm font-medium text-sidebar-foreground">
                {feature.title}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {feature.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Estimated Time */}
      <p className="text-sm text-muted-foreground mb-6">
        Setup takes about <span className="font-medium text-sidebar-foreground">5 minutes</span>
      </p>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <button
          onClick={onGetStarted}
          className="px-8 py-3 bg-accent text-accent-foreground rounded-lg font-medium hover:bg-accent/90 transition-colors flex items-center gap-2"
        >
          Get Started
          <ArrowRight className="w-5 h-5" />
        </button>
        <button
          onClick={onSkipTour}
          className="text-sm text-muted-foreground hover:text-sidebar-foreground transition-colors"
        >
          Skip setup and explore on my own
        </button>
      </div>
    </div>
  );
}
