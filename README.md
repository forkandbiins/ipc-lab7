# iPc Inventory and Stock Management System – Lab 7 Forms

Front-end demo of the forms for CS 301 Laboratory Activity 7 (Technological Institute of the Philippines – Quezon City).
Pages: Login, Dashboard, Master Data and Storage Location, Inventory Transaction, Reports.

> **Demo only.** Data is saved in the browser (`localStorage`), not in PostgreSQL. Accounts are hard-coded.
> A real deployment would use the Node.js/Express API, bcrypt hashing, and JWT described in Chapters 1 and 3.

---

## 1. Folder structure

```
ipc-lab7/
├── login.html
├── dashboard.html
├── master-data.html
├── inventory-transaction.html
├── reports.html
├── css/styles.css
├── js/common.js        (validation, storage, role access, shared layout)
└── README.md
```

Keep this structure. The pages load `css/styles.css` and `js/common.js` by relative path.

---

## 2. How to run (use Live Server in VS Code)

**Open the pages through a local server, not by double-clicking the files.**
The pages store data in the browser and redirect between each other. Some browsers (notably Firefox) treat each `file://` page as a separate site, so data saved on one page is not visible on another and the login redirect can fail.

### VS Code + Live Server (recommended)

1. Open the `ipc-lab7` folder in VS Code (**File → Open Folder**).
2. Install the extension **Live Server** (publisher: Ritwick Dey) from the Extensions panel (`Ctrl+Shift+X`).
3. In the Explorer, right-click **`login.html`** → **Open with Live Server**.
   (Or click **Go Live** in the bottom-right status bar, then open `login.html`.)
4. The browser opens at `http://127.0.0.1:5500/login.html`. Always start from `login.html`.

Use the **same address for the whole test**. `127.0.0.1` and `localhost` count as different sites, so data saved under one is not visible under the other.

### Without VS Code

```
cd ipc-lab7
python -m http.server 8000     # then open http://localhost:8000/login.html
# or
npx serve
```

An internet connection is optional. It is only used for the Inter font and the Lucide icons. Without it the pages still work, but the icons are missing and the font falls back to the system font.

---

## 3. Demo accounts

Password for all accounts: `Demo@1234`

| Email | Role | Lands on after login | Can open |
|---|---|---|---|
| admin@ipc.demo | System Administrator | Dashboard | All pages |
| manager@ipc.demo | Operations Manager | Dashboard | All pages; Master Data and Inventory Transaction are **read-only** |
| inventory@ipc.demo | Inventory Personnel | Inventory Transaction | Dashboard, Master Data, Inventory Transaction (no Reports) |
| production@ipc.demo | Production Personnel | Inventory Transaction | Dashboard, Inventory Transaction (**read-only**) |

Login redirects immediately; there is no extra click. Role access is a **TEAM DESIGN DECISION** based on Chapter 1 and is **TO VALIDATE** with iPc (see Section 8).

---

## 4. Recommended test order (about 10 minutes)

Log in as **admin@ipc.demo**, then:

1. **Master Data** → add a material (e.g., "LDPE film roll", Roll, LDPE, thickness 50, width 600, density 0.92, unit roll, reorder 10). Note the generated SKU.
2. **Master Data** → add a storage bin (Zone `B`, Rack `3`, Shelf `C`, Bin `12`, Available). The preview shows `Zone B - Rack 03 - Shelf C - Bin 12`.
3. **Inventory Transaction** → **Receive**: pick your material, enter a reference (e.g. `RCV-0001`), today's date, supplier lot, PO reference, inspection status, bin, quantity `100`, your name. A batch ID like `B-20261027-001` is generated.
4. **Issue**: choose that batch, job order `JO-0001`, quantity `30`. The balance becomes 70.
5. **Return**: same batch, job order `JO-0001`, condition, bin, quantity `5`. The balance becomes 75.
6. **Adjust**: same batch, type Decrease, reason "Sampling", quantity `2`. The balance becomes 73.
7. Check **Current batch balances** and **Transaction history** (use "Show history for" to filter by batch).
8. **Dashboard** → the cards, monthly bars, stock table, recent activity, and bins holding stock now reflect step 3 to 6.
9. **Reports** → generate each of the three reports, change sort/filters, then export.
10. **Sign out** (top right) and repeat the role checks in Section 6.

---

## 5. Form validation tests

Each form blocks submission on invalid input, shows a red message under the field, shows a summary banner ("Form not submitted: N field(s) need attention."), and moves focus to the first invalid field.

### Login (supporting form)
| Test | Expected |
|---|---|
| Submit empty | "Enter your corporate email." / "Enter your password." |
| Email `abc` | "Enter a valid email, e.g. name@company.com." |
| Password shorter than 8 characters | "Enter at least 8 characters." |
| Wrong password, valid email | "Invalid email or password. Failed attempts: 1." |
| 4th consecutive wrong attempt | "Too many failed attempts. The account is locked for 5 minutes." |
| Try again while locked | "Account locked. Try again in N minute(s)." |
| Show password checkbox | Toggles password visibility |
| Remember my email | Email is pre-filled next visit |
| Forgot password? | Notice only (OTP recovery is a separate sub-module) |
| Clear form | Empties fields and errors |
| Correct login | Immediate redirect to the role's landing page |

Lockout is counted per email. To clear it, see Section 7.

### Master Data – Register raw material (major form)
| Test | Expected |
|---|---|
| Submit empty | Errors on name, material form, polymer, density, unit, reorder |
| Name `ab` | "Enter at least 3 characters." |
| Name equal to an existing material | "A material with this trade name already exists." |
| Select **Plastic roll** | Thickness and width become required (asterisk appears) |
| Select **Plastic pellet** | Thickness and width are not required |
| Density `0` or `9` | "Enter a density between 0.1 and 5 g/cm³." |
| Reorder `-1` | "Threshold cannot be negative." |
| Valid save | Toast with the new SKU; table updates; form clears |

### Master Data – Add storage bin
| Test | Expected |
|---|---|
| Zone `AB` or `1` | "Use a single letter, e.g. A." |
| Rack `0` or `100` | "Rack must be 1–99." |
| Same coordinate twice (e.g. `A`, `1`, `A`, `1`) | "This coordinate already exists." |
| Status not chosen | "Select a status." |
| Valid save | Toast; table updates; code preview shows `Zone X - Rack NN - Shelf Y - Bin NN` |

### Inventory Transaction (major form)
| Test | Expected |
|---|---|
| Submit with no type chosen | Error on Transaction type |
| Choose each type | Only the fields for that type appear (Receive, Issue, Return, Adjust) |
| Reference `a!` | "Use 3–30 letters, digits or hyphens." |
| Reuse a saved reference | "This reference number is already recorded." |
| Future date | "Date cannot be in the future." |
| Quantity `0` | "Quantity must be greater than zero." |
| Issue more than the batch balance | "Quantity exceeds the available balance (N)." |
| Adjust → Decrease more than the balance | Same message |
| Valid save | Toast; balances and history update; form clears |

### Reports (supporting form)
| Test | Expected |
|---|---|
| Generate with no report chosen | "Select a report." |
| To date earlier than From date | "The end date cannot be earlier than the start date." |
| "Quantities received and issued" with all transaction types unchecked | "Select at least one transaction type." |
| Generate each report | Preview table and row count appear |
| Export before generating | "Generate a report before exporting." |
| Export format Excel | Downloads a `.csv` file (opens in Excel) |
| Export format PDF | Opens the browser print dialog; choose **Save as PDF** |

---

## 6. Role and access tests

| Test | Expected |
|---|---|
| Open `dashboard.html` directly without logging in | Redirected to `login.html` |
| Log in as **manager** → open Master Data | Page shows "Read-only access…" notice; fields disabled; Save buttons hidden |
| Log in as **inventory** | No Reports link in the sidebar. Opening `reports.html` by typing the address redirects to Inventory Transaction |
| Log in as **production** | Only Dashboard and Inventory Transaction in the sidebar (read-only). Opening `master-data.html` redirects back |
| Click **Sign out** | Returns to login; going back to a protected page redirects to login |

---

## 7. Resetting test data

Open the browser DevTools console (`F12`) on any page and run:

```js
localStorage.clear(); sessionStorage.clear(); location.href = 'login.html';
```

This clears saved materials, bins, transactions, failed-login counters, and the theme choice. The two `DEMO` materials and two `DEMO` bins are re-created automatically on the next load.

---

## 8. Accessibility and usability checks

- **Keyboard:** press `Tab` through each form; focus order follows the visual order and the focus ring is always visible. `Enter` submits; the **Skip to main content** link appears on the first `Tab`.
- **Labels and help:** every input has a label and helper text. Errors are announced by screen readers (`role="alert"`) and linked with `aria-describedby`.
- **Dark mode:** use the sun/moon button in the top bar. The choice is remembered.
- **Small screens:** narrow the browser window (or use DevTools device mode). The sidebar becomes a menu button.

---

## 9. Known limitations (state these in the documentation)

- **Storage:** `localStorage` stands in for the database. Clearing browser data erases records.
- **Accounts:** hard-coded for the demo; no real hashing or tokens.
- **Excel export:** a CSV file; **PDF export:** the browser's print-to-PDF.
- **Demo data:** the `DEMO` materials and bins are placeholders, not iPc data.
- **Dashboard bins:** "bins holding stock" comes from each batch's last recorded bin and does not change the bin's Available/Occupied status in Master Data.

---

## 10. Troubleshooting

| Problem | Fix |
|---|---|
| Every page sends me back to login | You are not signed in, or you switched between `localhost` and `127.0.0.1`. Sign in again and keep one address. |
| Dropdowns for material, bin, or batch are empty | Nothing is saved yet. Add a material and bin in Master Data, then record a Receive. |
| Icons are missing or the font looks plain | No internet (optional resources). The pages still work. |
| Changes to the code do not show | Hard refresh with `Ctrl+Shift+R`. |
| Data saved on one page is missing on another | The pages were opened from `file://`. Use Live Server. |
