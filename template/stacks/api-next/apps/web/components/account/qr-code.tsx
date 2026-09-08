// Adapted from shadcn.io/qr-code. Hex colors, a four-module quiet zone,
// reserved geometry and an explicit failure state replace its demo defaults.
"use client";

import QR from "qrcode";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import Image from "next/image";
export function QRCode({ data }: { data: string }) {
  const [image, setImage] = useState("");
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    void QR.toDataURL(data, {
      width: 224,
      margin: 4,
      errorCorrectionLevel: "M",
      color: { dark: "#000000", light: "#ffffff" },
    })
      .then((result) => {
        if (active) setImage(result);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [data]);
  if (failed)
    return (
      <Alert variant="destructive">
        <AlertTitle>QR code unavailable</AlertTitle>
        <AlertDescription>Use the manual setup key below instead.</AlertDescription>
      </Alert>
    );
  return image ? (
    <Image
      unoptimized
      src={image}
      width={224}
      height={224}
      alt="Scan this QR code with your authenticator app"
    />
  ) : (
    <Skeleton className="size-56" aria-label="Generating QR code" />
  );
}
