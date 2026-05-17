import { EyeIcon, EyeOffIcon, Settings } from "lucide-react";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "~/components/ui/input-group";
import { Label } from "~/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "~/components/ui/sheet";
import { useConfig, useSaveConfig } from "./use-config";

function PasswordInput({
  id,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <InputGroup>
      <InputGroupInput
        id={id}
        type={visible ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          size="icon-xs"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide" : "Show"}
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}

export function SettingsSheet() {
  const { data: config } = useConfig();
  const saveConfig = useSaveConfig();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    username: "",
    password: "",
    apiToken: "",
  });

  const handleOpen = (isOpen: boolean) => {
    if (isOpen && config) {
      setForm({
        username: config.username,
        password: config.password,
        apiToken: config.apiToken,
      });
    }
    setOpen(isOpen);
  };

  const handleSave = () => {
    saveConfig.mutate(form, {
      onSuccess: () => setOpen(false),
    });
  };

  const handleClear = () => {
    const empty = { username: "", password: "", apiToken: "" };
    saveConfig.mutate(empty, {
      onSuccess: () => {
        setForm(empty);
        setOpen(false);
      },
    });
  };

  const hasConfig = config && (config.username || config.apiToken);

  return (
    <Sheet open={open} onOpenChange={handleOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Settings className="h-5 w-5" />
          {!hasConfig && (
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
          )}
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>BGG Settings</SheetTitle>
          <SheetDescription>
            Enter your BoardGameGeek credentials and API token.{" "}
            <a
              href="https://boardgamegeek.com/using_the_xml_api"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline"
            >
              How to get an API token
            </a>
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-4 px-4">
          <div className="space-y-2">
            <Label htmlFor="username">BGG Username</Label>
            <Input
              id="username"
              value={form.username}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, username: e.target.value }))
              }
              placeholder="your-bgg-username"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">BGG Password</Label>
            <PasswordInput
              id="password"
              value={form.password}
              onChange={(v) => setForm((prev) => ({ ...prev, password: v }))}
              placeholder="your-bgg-password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="apiToken">XML API Token</Label>
            <PasswordInput
              id="apiToken"
              value={form.apiToken}
              onChange={(v) => setForm((prev) => ({ ...prev, apiToken: v }))}
              placeholder="your-api-bearer-token"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button onClick={handleSave} disabled={saveConfig.isPending}>
              {saveConfig.isPending ? "Saving..." : "Save"}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline">Clear</Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="z-60">
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear all settings?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove your saved username, password, and API
                    token.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClear}>
                    Clear
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
