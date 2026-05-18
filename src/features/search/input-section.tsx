import { useForm, useStore } from "@tanstack/react-form";
import { FileUp, Loader2, Search } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Field, FieldLabel } from "~/components/ui/field";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Textarea } from "~/components/ui/textarea";
import { parseIds, parseInput } from "~/lib/csv";

interface InputSectionProps {
  onSearchByName: (names: string[], includeExpansions: boolean) => void;
  onAddByIds: (ids: number[]) => void;
  isSearching: boolean;
  searchWarning: string | null;
  idsWarning: string | null;
}

export function InputSection({
  onSearchByName,
  onAddByIds,
  isSearching,
  searchWarning,
  idsWarning,
}: InputSectionProps) {
  const [tab, setTab] = useState("names");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm({
    defaultValues: {
      textValue: "",
      includeExpansions: false,
    },
    onSubmit: ({ value }) => {
      if (tab === "names") {
        const names = parseInput(value.textValue);
        if (names.length > 0) onSearchByName(names, value.includeExpansions);
      } else {
        const ids = parseIds(value.textValue);
        if (ids.length > 0) onAddByIds(ids);
      }
    },
  });

  const textValue = useStore(form.store, (s) => s.values.textValue);

  const parsedNames = tab === "names" ? parseInput(textValue) : [];
  const parsedIdList = tab === "ids" ? parseIds(textValue) : [];
  const hasInput =
    tab === "names" ? parsedNames.length > 0 : parsedIdList.length > 0;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result;
      if (typeof content === "string") {
        form.setFieldValue("textValue", content);
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

      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
        className="space-y-4"
      >
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="names">
              <Search />
              Search by Name
            </TabsTrigger>
            <TabsTrigger value="ids">I Already Have IDs</TabsTrigger>
          </TabsList>

          <TabsContent value="names" className="space-y-3">
            <Textarea
              placeholder={"Catan; Wingspan; Azul\nor one game per line"}
              value={textValue}
              onChange={(e) => form.setFieldValue("textValue", e.target.value)}
              rows={6}
              className="resize-y font-mono text-sm"
            />
            <form.Field name="includeExpansions">
              {(field) => (
                <Field orientation="horizontal">
                  <Checkbox
                    id="expansions"
                    checked={field.state.value}
                    onCheckedChange={(checked) =>
                      field.handleChange(checked === true)
                    }
                  />
                  <FieldLabel
                    htmlFor="expansions"
                    className="font-normal text-sm"
                  >
                    Include expansions in search
                  </FieldLabel>
                </Field>
              )}
            </form.Field>
          </TabsContent>

          <TabsContent value="ids" className="space-y-3">
            <Textarea
              placeholder={"12345; 67890; 11111\nor one ID per line"}
              value={textValue}
              onChange={(e) => form.setFieldValue("textValue", e.target.value)}
              rows={6}
              className="resize-y font-mono text-sm"
            />
          </TabsContent>
        </Tabs>

        <div className="flex items-center gap-3">
          <Button
            type="submit"
            disabled={
              !hasInput ||
              isSearching ||
              !!(tab === "names" ? searchWarning : idsWarning)
            }
          >
            {isSearching && <Loader2 className="animate-spin" />}
            {tab === "names" ? "Search Games" : "Add to Collection"}
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSearching}
          >
            <FileUp />
            Upload CSV
          </Button>

          {hasInput && (
            <span className="text-muted-foreground text-sm">
              {tab === "names" ? parsedNames.length : parsedIdList.length}{" "}
              {(tab === "names" ? parsedNames.length : parsedIdList.length) ===
              1
                ? "item"
                : "items"}
            </span>
          )}
        </div>

        {(tab === "names" ? searchWarning : idsWarning) && (
          <p className="text-destructive text-sm">
            {tab === "names" ? searchWarning : idsWarning}
          </p>
        )}
      </form>
    </section>
  );
}
