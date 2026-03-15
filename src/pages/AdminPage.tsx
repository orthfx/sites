import { useQuery, useMutation } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import type { Id } from "../../convex/_generated/dataModel";

export function AdminPage() {
  const church = useQuery(api.churches.getMine);
  const { signOut } = useAuthActions();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate("/");
  }

  if (church === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b px-6 py-4">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <span className="text-lg font-semibold">orthfx/sites</span>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            Sign out
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-8">
        {church === null ? <CreateChurch /> : <EditChurch church={church} />}
      </main>
    </div>
  );
}

function CreateChurch() {
  const create = useMutation(api.churches.create);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await create({ name, slug: slug.toLowerCase() });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create your parish page</CardTitle>
        <CardDescription>
          Choose a name and subdomain for your church's page.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Parish name</Label>
            <Input
              id="name"
              placeholder="St. Michael Orthodox Church"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="slug">Subdomain</Label>
            <div className="flex items-center gap-1">
              <Input
                id="slug"
                placeholder="stmichael"
                value={slug}
                onChange={(e) =>
                  setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
                }
                required
              />
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                .orthdx.site
              </span>
            </div>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit">Create</Button>
        </form>
      </CardContent>
    </Card>
  );
}

interface Church {
  _id: Id<"churches">;
  name: string;
  slug: string;
  jurisdiction?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
  email?: string;
  website?: string;
  latitude?: number;
  longitude?: number;
  services?: { name: string; day: string; time: string }[];
  published: boolean;
}

function EditChurch({ church }: { church: Church }) {
  const update = useMutation(api.churches.update);
  const personnel = useQuery(api.personnel.listByChurch, {
    churchId: church._id,
  });
  const addPerson = useMutation(api.personnel.add);
  const removePerson = useMutation(api.personnel.remove);

  const [form, setForm] = useState({
    name: church.name,
    jurisdiction: church.jurisdiction ?? "",
    address: church.address ?? "",
    city: church.city ?? "",
    state: church.state ?? "",
    zip: church.zip ?? "",
    phone: church.phone ?? "",
    email: church.email ?? "",
    website: church.website ?? "",
    latitude: church.latitude?.toString() ?? "",
    longitude: church.longitude?.toString() ?? "",
  });

  const [services, setServices] = useState(church.services ?? []);
  const [newPersonName, setNewPersonName] = useState("");
  const [newPersonTitle, setNewPersonTitle] = useState("");
  const [saving, setSaving] = useState(false);

  function setField(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const { latitude, longitude, ...rest } = form;
      await update({
        id: church._id,
        ...rest,
        latitude: latitude ? parseFloat(latitude) : undefined,
        longitude: longitude ? parseFloat(longitude) : undefined,
        services,
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleTogglePublish() {
    await update({ id: church._id, published: !church.published });
  }

  async function handleAddService() {
    setServices([...services, { name: "", day: "", time: "" }]);
  }

  function updateService(index: number, field: string, value: string) {
    setServices(
      services.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  }

  function removeService(index: number) {
    setServices(services.filter((_, i) => i !== index));
  }

  async function handleAddPerson(e: React.FormEvent) {
    e.preventDefault();
    if (!newPersonName || !newPersonTitle) return;
    await addPerson({
      churchId: church._id,
      name: newPersonName,
      title: newPersonTitle,
    });
    setNewPersonName("");
    setNewPersonTitle("");
  }

  const previewUrl = `${window.location.protocol}//${church.slug}.${window.location.hostname === "localhost" ? "localhost" : "orthdx.site"}${window.location.port ? `:${window.location.port}` : ""}`;

  return (
    <div className="flex flex-col gap-6">
      {/* Status bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Switch
            checked={church.published}
            onCheckedChange={handleTogglePublish}
          />
          <span className="text-sm">
            {church.published ? "Published" : "Draft"}
          </span>
        </div>
        <a
          href={previewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-muted-foreground underline"
        >
          {church.slug}.orthdx.site
        </a>
      </div>

      {/* Church info */}
      <Card>
        <CardHeader>
          <CardTitle>Church information</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>Parish name</Label>
            <Input
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Jurisdiction</Label>
            <Input
              placeholder="e.g. OCA, Greek, Antiochian, ROCOR"
              value={form.jurisdiction}
              onChange={(e) => setField("jurisdiction", e.target.value)}
            />
          </div>

          <Separator />

          <div className="flex flex-col gap-2">
            <Label>Address</Label>
            <Input
              value={form.address}
              onChange={(e) => setField("address", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col gap-2">
              <Label>City</Label>
              <Input
                value={form.city}
                onChange={(e) => setField("city", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>State</Label>
              <Input
                value={form.state}
                onChange={(e) => setField("state", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>ZIP</Label>
              <Input
                value={form.zip}
                onChange={(e) => setField("zip", e.target.value)}
              />
            </div>
          </div>

          <Separator />

          <div className="flex flex-col gap-2">
            <Label>Phone</Label>
            <Input
              type="tel"
              value={form.phone}
              onChange={(e) => setField("phone", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Email</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setField("email", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Website</Label>
            <Input
              type="url"
              placeholder="https://"
              value={form.website}
              onChange={(e) => setField("website", e.target.value)}
            />
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-2">
              <Label>Latitude</Label>
              <Input
                type="number"
                step="any"
                placeholder="40.7128"
                value={form.latitude}
                onChange={(e) => setField("latitude", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Longitude</Label>
              <Input
                type="number"
                step="any"
                placeholder="-74.0060"
                value={form.longitude}
                onChange={(e) => setField("longitude", e.target.value)}
              />
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </CardContent>
      </Card>

      {/* Services */}
      <Card>
        <CardHeader>
          <CardTitle>Service schedule</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {services.map((service, i) => (
            <div key={i} className="flex items-end gap-2">
              <div className="flex flex-1 flex-col gap-1">
                <Label className="text-xs">Service</Label>
                <Input
                  placeholder="Divine Liturgy"
                  value={service.name}
                  onChange={(e) => updateService(i, "name", e.target.value)}
                />
              </div>
              <div className="flex flex-1 flex-col gap-1">
                <Label className="text-xs">Day</Label>
                <Input
                  placeholder="Sunday"
                  value={service.day}
                  onChange={(e) => updateService(i, "day", e.target.value)}
                />
              </div>
              <div className="flex flex-1 flex-col gap-1">
                <Label className="text-xs">Time</Label>
                <Input
                  placeholder="10:00 AM"
                  value={service.time}
                  onChange={(e) => updateService(i, "time", e.target.value)}
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeService(i)}
              >
                Remove
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={handleAddService}>
            Add service
          </Button>
          <Button onClick={handleSave} disabled={saving} className="mt-2">
            {saving ? "Saving..." : "Save schedule"}
          </Button>
        </CardContent>
      </Card>

      {/* Personnel */}
      <Card>
        <CardHeader>
          <CardTitle>Clergy & personnel</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {personnel?.map((person) => (
            <div key={person._id} className="flex items-center justify-between">
              <div>
                <span className="font-medium">{person.name}</span>
                <span className="ml-2 text-sm text-muted-foreground">
                  {person.title}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removePerson({ id: person._id })}
              >
                Remove
              </Button>
            </div>
          ))}
          <Separator />
          <form onSubmit={handleAddPerson} className="flex items-end gap-2">
            <div className="flex flex-1 flex-col gap-1">
              <Label className="text-xs">Name</Label>
              <Input
                placeholder="Fr. John Smith"
                value={newPersonName}
                onChange={(e) => setNewPersonName(e.target.value)}
              />
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <Label className="text-xs">Title</Label>
              <Input
                placeholder="Rector"
                value={newPersonTitle}
                onChange={(e) => setNewPersonTitle(e.target.value)}
              />
            </div>
            <Button type="submit" size="sm">
              Add
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
