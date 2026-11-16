import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/give")({
  head: () => ({
    meta: [
      { title: "Give — CAC" },
      { name: "description", content: "Give tithes, offerings and donations to Christ Apostolic Church." },
      { property: "og:title", content: "Give — CAC" },
      { property: "og:description", content: "Support the ministry with tithes and offerings." },
    ],
  }),
  component: GivePage,
});

const bank = {
  bankName: "First Bank of Nigeria",
  accountName: "Christ Apostolic Church",
  accountNumber: "1234567890",
};

function GivePage() {
  function copy(value: string) {
    navigator.clipboard.writeText(value);
    toast.success("Copied");
  }

  return (
    <div>
      <section className="bg-hero rounded-b-[2rem] px-5 pt-8 pb-10 text-primary-foreground">
        <Link to="/home" className="inline-flex items-center gap-1 text-sm opacity-80"><ArrowLeft className="h-4 w-4" /> Home</Link>
        <h1 className="mt-6 text-3xl font-bold">Give</h1>
        <p className="mt-2 font-display italic opacity-90">"God loves a cheerful giver." — 2 Corinthians 9:7</p>
      </section>

      <div className="space-y-6 px-5 pt-6">
        <div className="rounded-2xl bg-card p-5 shadow-soft space-y-4">
          <h2 className="text-lg font-bold">Bank Transfer Details</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Bank</p>
                <p className="font-semibold">{bank.bankName}</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Account Name</p>
                <p className="font-semibold">{bank.accountName}</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Account Number</p>
                <p className="font-display text-2xl font-bold">{bank.accountNumber}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => copy(bank.accountNumber)}>
                <Copy className="h-4 w-4" /> Copy
              </Button>
            </div>
          </div>
        </div>
        <p className="text-center text-xs text-muted-foreground">Use your name as payment reference. Thank you for your generosity.</p>
      </div>
    </div>
  );
}

