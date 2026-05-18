import { useForm } from "@tanstack/react-form";
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
import { Field, FieldDescription, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "~/components/ui/input-group";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "~/components/ui/sheet";
import { configSchema, emptyConfig } from "./config.schema";
import { useConfig, useSaveConfig } from "./use-config";

function PasswordInput({
  id,
  value,
  onChange,
  onBlur,
  placeholder,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
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
        onBlur={onBlur}
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

  const form = useForm({
    defaultValues: emptyConfig,
    validators: {
      onSubmit: configSchema,
    },
    onSubmit: async ({ value }) => {
      saveConfig.mutate(value, {
        onSuccess: () => setOpen(false),
      });
    },
  });

  const handleOpen = (isOpen: boolean) => {
    if (isOpen && config) {
      form.setFieldValue("username", config.username);
      form.setFieldValue("password", config.password);
    }
    setOpen(isOpen);
  };

  const handleClear = () => {
    saveConfig.mutate(emptyConfig, {
      onSuccess: () => {
        form.reset();
        setOpen(false);
      },
    });
  };

  const hasConfig = Boolean(config?.username && config.password);

  return (
    <Sheet open={open} onOpenChange={handleOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Settings className="size-5" />
          {!hasConfig && (
            <span className="absolute top-1 right-1 size-2 rounded-full bg-red-500" />
          )}
          <span className="sr-only">Settings</span>
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>BGG Settings</SheetTitle>
          <SheetDescription>
            Enter your BoardGameGeek credentials for adding games to your
            collection.
          </SheetDescription>
        </SheetHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          className="space-y-4 px-4"
        >
          <form.Field name="username">
            {(field) => (
              <Field>
                <FieldLabel htmlFor={field.name}>BGG Username</FieldLabel>
                <Input
                  id={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="your-bgg-username"
                />
              </Field>
            )}
          </form.Field>
          <form.Field name="password">
            {(field) => (
              <Field>
                <FieldLabel htmlFor={field.name}>BGG Password</FieldLabel>
                <PasswordInput
                  id={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(v) => field.handleChange(v)}
                  placeholder="your-bgg-password"
                />
                <FieldDescription>
                  Used to log in to BGG and add games to your collection via
                  browser automation.
                </FieldDescription>
              </Field>
            )}
          </form.Field>
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={saveConfig.isPending}>
              {saveConfig.isPending ? "Saving..." : "Save"}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="outline">
                  Clear
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="z-60">
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear all settings?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove your saved username and password.
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
        </form>
      </SheetContent>
    </Sheet>
  );
}
