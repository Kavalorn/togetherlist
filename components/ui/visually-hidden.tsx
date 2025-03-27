// components/ui/visually-hidden.tsx
import * as React from "react"

export interface VisuallyHiddenProps extends React.HTMLAttributes<HTMLSpanElement> {}

const VisuallyHidden = React.forwardRef<HTMLSpanElement, VisuallyHiddenProps>(
  ({ ...props }, ref) => {
    return (
      <span
        ref={ref}
        style={{
          position: 'absolute',
          border: 0,
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          wordWrap: 'normal',
        }}
        {...props}
      />
    )
  }
)

VisuallyHidden.displayName = "VisuallyHidden"

export { VisuallyHidden }