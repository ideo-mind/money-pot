import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
interface CopyableInputProps {
  value: string;
  className?: string;
}
export function CopyableInput({ value, className }: CopyableInputProps) {
  const [hasCopied, setHasCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };
  return (
    <div className={cn("relative", className)}>
      <Input
        readOnly
        value={value}
        className="pr-12 h-10 font-mono text-sm"
        placeholder="Generate a key first..."
      />
      <Button
        size="icon"
        variant="ghost"
        className="absolute top-1/2 right-1 -translate-y-1/2 h-8 w-8"
        onClick={handleCopy}
        disabled={!value}
      >
        {hasCopied ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}