// This is a placeholder for the /live page.
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wifi } from "lucide-react";

export default function LivePage() {
  return (
    <div className="flex h-full flex-col items-center justify-center p-4">
        <Wifi className="w-24 h-24 text-muted-foreground mb-4"/>
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle>Live</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Live streaming content will appear here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
