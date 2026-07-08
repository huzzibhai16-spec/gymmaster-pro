import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { PLAN_PRICE } from "@/lib/mock-data";
import { Dumbbell, Upload } from "lucide-react";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Settings — GymOS" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Manage gym profile, pricing and system preferences." />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="glass rounded-2xl p-5 lg:col-span-2 space-y-5">
          <div>
            <h3 className="text-base font-semibold mb-1">Gym Profile</h3>
            <p className="text-xs text-muted-foreground">Public identity of your gym.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl gold-gradient grid place-items-center">
              <Dumbbell className="h-8 w-8 text-primary-foreground" />
            </div>
            <Button variant="outline"><Upload className="h-4 w-4 mr-1" /> Upload logo</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Gym Name" value="Body Strong Gym" />
            <Field label="Phone Number" value="+92 300 1234567" />
            <Field label="Address" value="Main Boulevard, Gulberg III, Lahore" className="md:col-span-2" />
            <Field label="Currency" value="PKR" />
            <div className="space-y-1.5">
              <Label className="text-xs">Theme</Label>
              <div className="flex items-center gap-2 rounded-md border border-border/60 bg-muted/40 h-10 px-3 text-sm">
                <span className="h-4 w-4 rounded-full bg-black border border-primary" />
                Dark · Gold accent
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button className="gold-gradient text-primary-foreground">Save Changes</Button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass rounded-2xl p-5 space-y-4">
            <h3 className="text-base font-semibold">Fine System</h3>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm">Enable automatic fines</div>
                <div className="text-xs text-muted-foreground">Applied when absent 30+ days</div>
              </div>
              <Switch defaultChecked />
            </div>
            <Field label="Fine Amount (PKR)" value="200" type="number" />
            <Field label="Grace Period (days)" value="30" type="number" />
          </div>

          <div className="glass rounded-2xl p-5 space-y-3">
            <h3 className="text-base font-semibold">Membership Prices</h3>
            {Object.entries(PLAN_PRICE).map(([plan, price]) => (
              <div key={plan} className="flex items-center gap-2">
                <Label className="text-xs flex-1">{plan}</Label>
                <Input defaultValue={price} type="number" className="h-9 w-32 bg-muted/40" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, type = "text", className }: { label: string; value: string | number; type?: string; className?: string }) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label className="text-xs">{label}</Label>
      <Input defaultValue={value} type={type} className="h-10 bg-muted/40" />
    </div>
  );
}
