import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CHARACTER_DOMAINS } from "@/lib/constants";
import { Search } from "lucide-react";
interface CharacterSelectorProps {
  value: string;
  onSelect: (character: string) => void;
}
export function CharacterSelector({ value, onSelect }: CharacterSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const allCharacters = Object.values(CHARACTER_DOMAINS).flat();
  const filteredCharacters = search
    ? allCharacters.filter((char) => char.includes(search))
    : [];
  const handleSelect = (char: string) => {
    onSelect(char);
    setIsOpen(false);
    setSearch("");
  };
  const CharacterButton = ({ char }: { char: string }) => (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            className="w-12 h-12 text-xl"
            onClick={() => handleSelect(char)}
          >
            {char}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Unicode: U+{char.codePointAt(0)?.toString(16).toUpperCase()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start text-left font-normal h-12">
          {value ? (
            <span className="text-2xl font-display">{value}</span>
          ) : (
            <span className="text-muted-foreground">Select a secret character...</span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[625px] h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Your Secret Character</DialogTitle>
          <DialogDescription>
            Browse through character sets or search to find your unique secret character.
          </DialogDescription>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search for a character..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {search ? (
          <ScrollArea className="flex-grow">
            <div className="flex flex-wrap gap-2 p-4">
              {filteredCharacters.length > 0 ? (
                filteredCharacters.map((char, index) => (
                  <CharacterButton key={`${char}-${index}`} char={char} />
                ))
              ) : (
                <p className="text-muted-foreground text-center w-full">No characters found.</p>
              )}
            </div>
          </ScrollArea>
        ) : (
          <Tabs defaultValue="ascii" className="flex-1 flex flex-col min-h-0">
            {/* FIX: Removed invalid 'orientation' prop and ensured horizontal scrolling with classes */}
            <ScrollArea className="w-full whitespace-nowrap">
              <TabsList className="w-max">
                {Object.keys(CHARACTER_DOMAINS).map((domain) => (
                  <TabsTrigger key={domain} value={domain} className="capitalize text-xs md:text-sm">
                    {domain}
                  </TabsTrigger>
                ))}
              </TabsList>
            </ScrollArea>
            <ScrollArea className="flex-grow mt-4">
              {Object.entries(CHARACTER_DOMAINS).map(([domain, chars]) => (
                <TabsContent key={domain} value={domain}>
                  <div className="flex flex-wrap gap-2 p-1">
                    {chars.map((char, index) => (
                      <CharacterButton key={`${char}-${index}`} char={char} />
                    ))}
                  </div>
                </TabsContent>
              ))}
            </ScrollArea>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}