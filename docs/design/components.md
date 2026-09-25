# ClosedBook UI Primitives Usage Guide (G.3)

Panduan implementasi komponen antarmuka primitive `@/components/ui/` yang digunakan pada sub-fase G.3 s/d G.8.

---

## 1. Button (`@/components/ui/Button`)

Tombol memenuhi WCAG 2.5.5 dengan tinggi minimal **$44\text{px}$** dan fokus ganda crimson.

```tsx
import { Button } from "@/components/ui";

// Primary Crimson Pill
<Button variant="primary">Simpan Proyek</Button>

// Secondary Surface Pill
<Button variant="secondary">Batal</Button>

// Ghost Minimal
<Button variant="ghost">Lewati</Button>

// Square Icon Button (44x44px)
<Button variant="icon" aria-label="Tutup"><X className="w-5 h-5" /></Button>

// Loading State
<Button isLoading>Memproses Data...</Button>
```

---

## 2. Card (`@/components/ui/Card`)

Permukaan konten dengan radius $14\text{px}$ tanpa drop-shadow (Zero Drop Shadow per ADR-007).

```tsx
import { Card } from "@/components/ui";

<Card variant="default">
  <h3>Judul Kartu</h3>
  <p>Deskripsi konten proyek</p>
</Card>

// Interactive hover
<Card variant="interactive" onClick={handleSelect}>
  <h3>Proyek Film Pendek</h3>
</Card>
```

---

## 3. Input & Label (`@/components/ui/Input`, `@/components/ui/Label`)

Input form dengan ukuran font minimal $16\text{px}$ untuk mencegah auto-zoom pada iOS Safari.

```tsx
import { Input, Label } from "@/components/ui";

<div>
  <Label htmlFor="project-name" isRequired>Nama Proyek</Label>
  <Input id="project-name" placeholder="Contoh: Sang Penari" />
</div>
```

---

## 4. Badge (`@/components/ui/Badge`)

Label status berukuran micro ($11\text{px}$) berbentuk kapsul pill.

```tsx
import { Badge } from "@/components/ui";

<Badge variant="crimson">P0 Urgent</Badge>
<Badge variant="success">Tersinkron</Badge>
<Badge variant="warning">Tertunda</Badge>
```

---

## 5. Sheet (`@/components/ui/Sheet`)

Bottom sheet container ramah sentuhan mobile dengan notch handle dan padding safe-area.

```tsx
import { Sheet } from "@/components/ui";

<Sheet isOpen={isOpen} onClose={() => setIsOpen(false)} title="Tambah Transaksi">
  <form>...</form>
</Sheet>
```
