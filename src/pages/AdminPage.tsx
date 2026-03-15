import { useQuery, useMutation } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
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
import { ImageUpload } from "@/components/ImageUpload";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import type { Id } from "../../convex/_generated/dataModel";

export function AdminPage() {
  const churches = useQuery(api.churches.getMine);
  const { signOut } = useAuthActions();
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState<Id<"churches"> | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  async function handleSignOut() {
    await signOut();
    navigate("/");
  }

  if (churches === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const selected = churches.find((c) => c._id === selectedId) ?? null;

  return (
    <div className="min-h-screen">
      <header className="border-b px-6 py-4">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <Link to="/" className="text-lg font-semibold hover:underline">
            orthdx.site
          </Link>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-8">
        {selected && !showCreate ? (
          <>
            <button
              onClick={() => setSelectedId(null)}
              className="mb-4 text-sm text-muted-foreground hover:underline"
            >
              &larr; All parishes
            </button>
            <EditChurch church={selected} />
          </>
        ) : showCreate ? (
          <>
            <button
              onClick={() => setShowCreate(false)}
              className="mb-4 text-sm text-muted-foreground hover:underline"
            >
              &larr; All parishes
            </button>
            <CreateChurch
              onCreated={(id) => {
                setShowCreate(false);
                setSelectedId(id);
              }}
            />
          </>
        ) : (
          <ChurchList
            churches={churches}
            onSelect={(id) => setSelectedId(id)}
            onCreate={() => setShowCreate(true)}
          />
        )}
      </main>
    </div>
  );
}

function ChurchList({
  churches,
  onSelect,
  onCreate,
}: {
  churches: Church[];
  onSelect: (id: Id<"churches">) => void;
  onCreate: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Your parishes</h2>
        <Button size="sm" onClick={onCreate}>
          New parish
        </Button>
      </div>
      {churches.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <p>You haven't created any parish pages yet.</p>
            <Button className="mt-4" onClick={onCreate}>
              Create your first parish
            </Button>
          </CardContent>
        </Card>
      ) : (
        churches.map((church) => (
          <button
            key={church._id}
            onClick={() => onSelect(church._id)}
            className="flex items-center gap-4 rounded-lg border p-4 text-left transition-colors hover:bg-muted/50"
          >
            {church.avatarUrl ? (
              <img
                src={church.avatarUrl}
                alt=""
                className="h-12 w-12 shrink-0 rounded-full object-cover"
              />
            ) : (
              <div className="h-12 w-12 shrink-0 rounded-full bg-muted" />
            )}
            <div className="flex-1">
              <div className="font-medium">{church.name}</div>
              <div className="text-sm text-muted-foreground">
                {church.slug}.orthdx.site
              </div>
            </div>
            <span
              className={`text-xs ${church.published ? "text-green-600" : "text-muted-foreground"}`}
            >
              {church.published ? "Published" : "Draft"}
            </span>
          </button>
        ))
      )}
    </div>
  );
}

function CreateChurch({ onCreated }: { onCreated: (id: Id<"churches">) => void }) {
  const create = useMutation(api.churches.create);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const id = await create({ name, slug: slug.toLowerCase() });
      onCreated(id);
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
  avatarUrl: string | null;
  bannerUrl: string | null;
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
  const updatePerson = useMutation(api.personnel.update);

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
      await update({
        id: church._id,
        ...form,
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

  const previewUrl = `https://${church.slug}.orthdx.site`;

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
        <div className="flex items-center gap-3 text-sm">
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground underline"
          >
            {church.slug}.orthdx.site
          </a>
          <Link to={`/parish/${church.slug}`} className="text-muted-foreground underline">
            preview
          </Link>
        </div>
      </div>

      {/* Church info */}
      <Card>
        <CardHeader>
          <CardTitle>Church information</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-4">
            <Label>Images</Label>
            <div className="flex items-start gap-4">
              <ImageUpload
                currentUrl={church.avatarUrl}
                onUploaded={(id) => update({ id: church._id, avatarId: id })}
                label="Avatar"
                aspect="square"
              />
              <ImageUpload
                currentUrl={church.bannerUrl}
                onUploaded={(id) => update({ id: church._id, bannerId: id })}
                label="Banner"
                aspect="banner"
                className="flex-1"
              />
            </div>
          </div>

          <Separator />

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
            <AddressAutocomplete
              defaultValue={[form.address, form.city, form.state, form.zip]
                .filter(Boolean)
                .join(", ")}
              onSelect={(result) => {
                setForm((f) => ({
                  ...f,
                  address: result.address,
                  city: result.city,
                  state: result.state,
                  zip: result.zip,
                }));
                update({
                  id: church._id,
                  address: result.address,
                  city: result.city,
                  state: result.state,
                  zip: result.zip,
                  latitude: result.latitude,
                  longitude: result.longitude,
                });
              }}
            />
            {form.address && (
              <p className="text-xs text-muted-foreground">
                {[form.address, form.city, form.state, form.zip]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            )}
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
            <div key={person._id} className="flex items-center gap-3">
              <ImageUpload
                currentUrl={person.avatarUrl}
                onUploaded={(id) =>
                  updatePerson({ id: person._id, avatarId: id })
                }
                label="Photo"
                aspect="square"
                className="shrink-0 [&_button]:h-12 [&_button]:w-12"
              />
              <div className="flex-1">
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
