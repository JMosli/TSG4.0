import React, { useState } from "react";

export function ButtonLoading({
  onClick,
  ...other
}: {
  onClick: () => Promise<any>;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <button
      {...other}
      onClick={() => {
        setIsLoading(true);
        onClick().then(() => setIsLoading(false));
      }}
    >
      {isLoading ? "..." : other.children}
    </button>
  );
}
