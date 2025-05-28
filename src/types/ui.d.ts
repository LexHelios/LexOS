import { ReactNode } from "react";

export interface ButtonProps {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export interface CardProps {
  children: ReactNode;
  className?: string;
}

export interface InputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export interface BadgeProps {
  variant?: "default" | "secondary" | "destructive" | "outline";
  children: ReactNode;
  className?: string;
}

export interface AreaChartProps {
  data: {
    timestamp: number;
    value: number;
  }[];
  color?: string;
  className?: string;
}

export interface NodeProps {
  id: string;
  type: string;
  data: {
    id: string;
    name: string;
    type: string;
    status: "idle" | "running" | "error";
    metrics: {
      cpu: number;
      memory: number;
      gpu: number;
    };
    error?: string;
  };
  selected?: boolean;
  className?: string;
}

export interface EdgeProps {
  id: string;
  source: string;
  target: string;
  type?: string;
  animated?: boolean;
  style?: {
    stroke?: string;
  };
  className?: string;
} 