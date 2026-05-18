import { Loader2, Plus, Search, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupTextarea,
} from "~/components/ui/input-group";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { type ParsedIdEntry, parseIds, parseInput } from "~/lib/csv";

interface InputSectionProps {
  onSearchByName: (names: string[]) => void;
  onAddByIds: (entries: ParsedIdEntry[]) => void;
  isSearching: boolean;
  idsWarning: string | null;
}

export function InputSection({
  onSearchByName,
  onAddByIds,
  isSearching,
  idsWarning,
}: InputSectionProps) {
  const [tab, setTab] = useState("names");
  const [textValue, setTextValue] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parsedNames = tab === "names" ? parseInput(textValue) : [];
  const parsedIdEntries = tab === "ids" ? parseIds(textValue) : [];
  const itemCount =
    tab === "names" ? parsedNames.length : parsedIdEntries.length;
  const hasInput = itemCount > 0;

  const handleSubmit = () => {
    if (!hasInput) {
      toast.warning(
        tab === "names"
          ? "Enter at least one game name"
          : "Enter at least one BGG ID",
      );
      return;
    }
    if (tab === "ids" && idsWarning) {
      toast.error(idsWarning);
      return;
    }
    if (tab === "names") {
      onSearchByName(parsedNames);
    } else {
      onAddByIds(parsedIdEntries);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result;
      if (typeof content === "string") {
        setTextValue((prev) => (prev ? `${prev}\n${content}` : content));
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-semibold text-2xl tracking-tight">
          Enter Your Games
        </h2>
        <p className="text-muted-foreground text-sm">
          Enter board game names to search, or BGG IDs if you already have them.
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="names">
            <Search />
            Search by Name
          </TabsTrigger>
          <TabsTrigger value="ids">I Already Have IDs</TabsTrigger>
        </TabsList>
      </Tabs>

      <InputGroup>
        <InputGroupTextarea
          placeholder={
            tab === "names"
              ? "Catan; Wingspan; Azul\nor one game per line"
              : "12345; 67890; 11111\nor one ID per line"
          }
          value={textValue}
          onChange={(e) => setTextValue(e.target.value)}
          rows={4}
          className="font-mono text-sm"
        />
        <InputGroupAddon align="block-end" className="border-t">
          <InputGroupText>
            {hasInput
              ? `${itemCount} ${itemCount === 1 ? "item" : "items"}`
              : ""}
          </InputGroupText>
          <InputGroupButton
            size="sm"
            className="ml-auto"
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSearching}
          >
            <Upload />
            Upload CSV
          </InputGroupButton>
          <InputGroupButton
            size="sm"
            variant="default"
            onClick={handleSubmit}
            disabled={isSearching}
          >
            {isSearching ? (
              <Loader2 className="animate-spin" />
            ) : tab === "names" ? (
              <Search />
            ) : (
              <Plus />
            )}
            {tab === "names" ? "Search" : "Add"}
          </InputGroupButton>
        </InputGroupAddon>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.txt"
          onChange={handleFileUpload}
          className="hidden"
        />
      </InputGroup>

      {tab === "names" && (
        <p className="text-muted-foreground text-sm">
          Tip: Use{" "}
          <a
            href="https://bgg-scan.aabuhijleh.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-4 hover:text-foreground"
          >
            BGG Scan
          </a>{" "}
          to scan board game barcodes and automatically get a list of BGG IDs.
        </p>
      )}

      {tab === "ids" && idsWarning && (
        <p className="text-destructive text-sm">{idsWarning}</p>
      )}
    </section>
  );
}
