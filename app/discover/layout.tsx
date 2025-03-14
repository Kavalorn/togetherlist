// app/discover/layout.tsx
export default function DiscoverLayout({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return (
      <div className="flex-1 m-0 p-0">
        {children}
      </div>
    );
  }