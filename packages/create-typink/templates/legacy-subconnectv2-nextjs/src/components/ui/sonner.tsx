"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--description-text": "hsl(var(--muted-foreground))",
        } as React.CSSProperties
      }
      toastOptions={{
        style: {
          "--description-text": "hsl(215 25% 45%)", // darker description for light mode
        },
        classNames: {
          description: "!text-gray-600 dark:!text-gray-400",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
