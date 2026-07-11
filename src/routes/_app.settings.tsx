import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { PageHeader } from "@/components/page-header";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dumbbell, Upload, Loader as Loader2, X, Eye, EyeOff, Lock } from "lucide-react";
import { useGym, useUpdateGym } from "@/hooks/use-data";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Settings — GymOS" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { gym, loading } = useGym();
  const updateGym = useUpdateGym();

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    currency: "PKR",
    logo_url: "" as string | null,
    fine_enabled: true,
    fine_amount: 200,
    fine_grace_days: 30,
    monthly_price: 3500,
    quarterly_price: 9500,
    half_yearly_price: 17000,
    yearly_price: 30000,
  });

  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (gym) {
      setFormData({
        name: gym.name || "",
        phone: gym.phone || "",
        address: gym.address || "",
        currency: gym.currency || "PKR",
        logo_url: gym.logo_url || null,
        fine_enabled: gym.fine_enabled ?? true,
        fine_amount: gym.fine_amount || 200,
        fine_grace_days: gym.fine_grace_days || 30,
        monthly_price: gym.monthly_price || 3500,
        quarterly_price: gym.quarterly_price || 9500,
        half_yearly_price: gym.half_yearly_price || 17000,
        yearly_price: gym.yearly_price || 30000,
      });
    }
  }, [gym]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert("Image must be less than 2MB");
      return;
    }

    // Convert to base64 for storage
    const reader = new FileReader();
    reader.onload = () => {
      setFormData(prev => ({ ...prev, logo_url: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setFormData(prev => ({ ...prev, logo_url: null }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  async function handleSave() {
    setSaving(true);
    await updateGym.mutateAsync(formData);
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Settings" description="Manage gym profile, pricing and system preferences." />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

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
            <div className="h-16 w-16 rounded-2xl overflow-hidden grid place-items-center bg-primary/10 ring-1 ring-primary/20">
              {formData.logo_url ? (
                <img src={formData.logo_url} alt="Gym logo" className="h-full w-full object-cover" />
              ) : (
                <Dumbbell className="h-8 w-8 text-primary" />
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-1" /> Upload logo
              </Button>
              {formData.logo_url && (
                <Button variant="ghost" size="icon" onClick={handleRemoveLogo} className="h-9 w-9 text-muted-foreground hover:text-destructive">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field
              label="Gym Name"
              value={formData.name}
              onChange={(v) => setFormData({ ...formData, name: v })}
            />
            <Field
              label="Phone Number"
              value={formData.phone}
              onChange={(v) => setFormData({ ...formData, phone: v })}
            />
            <Field
              label="Address"
              value={formData.address}
              onChange={(v) => setFormData({ ...formData, address: v })}
              className="md:col-span-2"
            />
            <Field
              label="Currency"
              value={formData.currency}
              onChange={(v) => setFormData({ ...formData, currency: v })}
            />
            <div className="space-y-1.5">
              <Label className="text-xs">Theme</Label>
              <div className="flex items-center gap-2 rounded-md border border-border/60 bg-muted/40 h-10 px-3 text-sm">
                <span className="h-4 w-4 rounded-full bg-black border border-primary" />
                Dark · Gold accent
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving} className="gold-gradient text-primary-foreground">
              {saving ? "Saving…" : "Save Changes"}
            </Button>
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
              <Switch
                checked={formData.fine_enabled}
                onCheckedChange={(v) => setFormData({ ...formData, fine_enabled: v })}
              />
            </div>
            <Field
              label="Fine Amount (PKR)"
              value={formData.fine_amount}
              type="number"
              onChange={(v) => setFormData({ ...formData, fine_amount: parseInt(v) || 0 })}
            />
            <Field
              label="Grace Period (days)"
              value={formData.fine_grace_days}
              type="number"
              onChange={(v) => setFormData({ ...formData, fine_grace_days: parseInt(v) || 0 })}
            />
          </div>

          <div className="glass rounded-2xl p-5 space-y-3">
            <h3 className="text-base font-semibold">Membership Prices</h3>
            <div className="flex items-center gap-2">
              <Label className="text-xs flex-1">Monthly</Label>
              <Input
                value={formData.monthly_price}
                type="number"
                className="h-9 w-32 bg-muted/40"
                onChange={(e) => setFormData({ ...formData, monthly_price: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs flex-1">Quarterly</Label>
              <Input
                value={formData.quarterly_price}
                type="number"
                className="h-9 w-32 bg-muted/40"
                onChange={(e) => setFormData({ ...formData, quarterly_price: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs flex-1">Half-Yearly</Label>
              <Input
                value={formData.half_yearly_price}
                type="number"
                className="h-9 w-32 bg-muted/40"
                onChange={(e) => setFormData({ ...formData, half_yearly_price: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs flex-1">Yearly</Label>
              <Input
                value={formData.yearly_price}
                type="number"
                className="h-9 w-32 bg-muted/40"
                onChange={(e) => setFormData({ ...formData, yearly_price: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
        </div>
      </div>

      <ChangePasswordCard />
    </div>
  );
}

function Field({
  label,
  value,
  type = "text",
  className,
  onChange,
}: {
  label: string;
  value: string | number;
  type?: string;
  className?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label className="text-xs">{label}</Label>
      <Input
        value={value}
        type={type}
        className="h-10 bg-muted/40"
        onChange={(e) => onChange?.(e.target.value)}
      />
    </div>
  );
}

function ChangePasswordCard() {
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    const form = new FormData(e.currentTarget);
    const password = form.get("password") as string;
    const confirm = form.get("confirm") as string;
    if (password.length < 6) {
      setMsg({ type: "err", text: "Password must be at least 6 characters." });
      return;
    }
    if (password !== confirm) {
      setMsg({ type: "err", text: "Passwords do not match." });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setMsg({ type: "err", text: error.message });
      return;
    }
    setMsg({ type: "ok", text: "Password updated successfully." });
    (e.target as HTMLFormElement).reset();
  }

  return (
    <div className="glass rounded-2xl p-5 space-y-4">
      <div>
        <h3 className="text-base font-semibold mb-1">Change Password</h3>
        <p className="text-xs text-muted-foreground">Update the password for your account.</p>
      </div>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
        {msg && (
          <div
            className={`md:col-span-2 rounded-lg border px-3 py-2 text-sm ${
              msg.type === "ok"
                ? "border-green-500/30 bg-green-500/10 text-green-500"
                : "border-red-500/30 bg-red-500/10 text-red-400"
            }`}
          >
            {msg.text}
          </div>
        )}
        <PasswordInput name="password" label="New password" show={showPw} onToggle={() => setShowPw((s) => !s)} />
        <PasswordInput name="confirm" label="Confirm new password" show={showPw} onToggle={() => setShowPw((s) => !s)} />
        <div className="md:col-span-2 flex justify-end">
          <Button type="submit" disabled={loading} className="gold-gradient text-primary-foreground">
            {loading ? "Updating…" : "Update password"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function PasswordInput({
  name,
  label,
  show,
  onToggle,
}: {
  name: string;
  label: string;
  show: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          name={name}
          type={show ? "text" : "password"}
          required
          minLength={6}
          className="h-10 pl-9 pr-9 bg-muted/40"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
