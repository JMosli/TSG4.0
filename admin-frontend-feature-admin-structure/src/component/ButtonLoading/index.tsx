import React, { useState } from "react";

export function ButtonLoading({
  onTap,
  ...other
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  onTap: (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => Promise<any>;
}) {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <button
      {...other}
      onClick={(ev) => {
        setIsLoading(true);
        onTap(ev).then(() => setIsLoading(false));
      }}
    >
      {isLoading ? "..." : other.children}
    </button>
  );
}
