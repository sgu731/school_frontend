import * as React from "react"
import { ToggleGroup as ToggleGroupPrimitive, ToggleGroupItem as ToggleGroupItemPrimitive } from "@radix-ui/react-toggle-group"
import { cn } from "../../lib/utils"

const ToggleGroup = React.forwardRef(({ className, ...props }, ref) => (
  <ToggleGroupPrimitive
    ref={ref}
    className={cn("flex items-center gap-1", className)}
    {...props}
  />
))
ToggleGroup.displayName = ToggleGroupPrimitive.displayName

const ToggleGroupItem = React.forwardRef(({ className, ...props }, ref) => (
  <ToggleGroupItemPrimitive
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center rounded-md border border-input bg-background px-2 py-1 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent hover:border-accent-foreground data-[state=on]:bg-accent data-[state=on]:text-foreground",
      className
    )}
    {...props}
  />
))
ToggleGroupItem.displayName = ToggleGroupItemPrimitive.displayName

export { ToggleGroup, ToggleGroupItem }