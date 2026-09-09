import { useId, useState, type ComponentProps } from "react";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { Field, FieldLabel, FieldDescription, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
  InputGroupButton,
} from "@/components/ui/input-group";

export function InputField({
  label,
  error,
  hint,
  type,
  ...props
}: ComponentProps<"input"> & { label: string; error?: string[]; hint?: string }) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const attributes = {
    ...props,
    id,
    type: type === "password" && visible ? "text" : type,
    "aria-invalid": !!error,
    "aria-describedby": error ? `${id}-error` : hint ? `${id}-hint` : undefined,
  };
  return (
    <Field data-invalid={!!error}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      {type === "password" ? (
        <InputGroup>
          <InputGroupInput {...attributes} />
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              size="icon-sm"
              aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
              onClick={() => setVisible(!visible)}
            >
              {visible ? <EyeOffIcon /> : <EyeIcon />}
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      ) : (
        <Input {...attributes} />
      )}
      {hint ? <FieldDescription id={`${id}-hint`}>{hint}</FieldDescription> : null}
      {error ? <FieldError id={`${id}-error`}>{error.join(" ")}</FieldError> : null}
    </Field>
  );
}
