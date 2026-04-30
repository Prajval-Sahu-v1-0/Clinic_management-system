```md
<!-- ========================================= -->
<!--           MEDIPANEL // README              -->
<!-- ========================================= -->

# 🧾 MediPanel  
```

```
███╗   ███╗███████╗██████╗ ██╗██████╗  █████╗ ███╗   ██╗███████╗██╗     
████╗ ████║██╔════╝██╔══██╗██║██╔══██╗██╔══██╗████╗  ██║██╔════╝██║     
██╔████╔██║█████╗  ██║  ██║██║██████╔╝███████║██╔██╗ ██║█████╗  ██║     
██║╚██╔╝██║██╔══╝  ██║  ██║██║██╔═══╝ ██╔══██║██║╚██╗██║██╔══╝  ██║     
██║ ╚═╝ ██║███████╗██████╔╝██║██║     ██║  ██║██║ ╚████║███████╗███████╗
╚═╝     ╚═╝╚══════╝╚═════╝ ╚═╝╚═╝     ╚═╝  ╚═╝╚═╝  ╚═══╝╚══════╝╚══════╝
```

> *A minimal clinic management prototype with a retro system-console feel.*

---

## 🧩 About MediPanel

```
[ CORE SYSTEM MODULES ]
```

```
▣ ROLE ENGINE
   └─ Dynamic management of staff, patients, appointments

▣ SECURITY LOGBOOK
   └─ Full audit trail of all portal activity

▣ INVENTORY SYSTEM
   └─ Transaction-based tracking of clinic resources
```

---

## ⚙️ Getting Started

```
[ INITIALIZATION SEQUENCE ]
```

```bash
npm run dev
```

### Setup Flow

```
1. Clone / Fork repository
2. Boot development server
3. Configure database connection
4. Inject environment variables (.env)
5. Sync schema using ER diagram
```

---

## 🗃️ Database Architecture

```
[ ENTITY RELATIONSHIP MAP ]
```

<img width="1024" height="559" alt="ER Diagram" src="https://github.com/user-attachments/assets/2bd4424e-e1c6-4c17-9ad7-6c736b078521" />

---

## ☁️ Supabase Configuration

```
[ BACKEND NODE ]
```

* Uses **Supabase** for database hosting
* Reference `.env-example` for configuration
* Populate credentials before runtime

```
ENV → CONNECT → SYNC → RUN
```

---

````md
## 🔐 Google OAuth (Extension)

```text
[ GOOGLE → SUPABASE → APP ]
````

### Setup

1. Create OAuth client in Google Cloud Console
2. Type: `Web Application`

---

### 🔗 Authorized Origins

```
http://localhost:3000
<your-deployment-URL>
```

---

### 🔁 Redirect URI (required)

```
https://<PROJECT_ID>.supabase.co/auth/v1/callback
```

---

### ☁️ Supabase

* Auth → Providers → Google
* Add Client ID + Secret

---

### 💻 Frontend

```ts
await supabase.auth.signInWithOAuth({
  provider: "google",
  options: {
    redirectTo: "http://localhost:3000/dashboard"
  }
})
```

---

```text
FLOW:
USER → GOOGLE → /auth/v1/callback → APP
```

```
```


## 🧪 Live Preview

```
[ DEPLOYED INSTANCE ]
```

🔗 [https://medipanel-v01.vercel.app](https://medipanel-v01.vercel.app)

---

## 🎮 Interface Theme Notes

```
STYLE PROFILE:
▣ Pixel-grid aesthetic
▣ Terminal-inspired layout
▣ Block-structured readability
▣ Minimal color dependency (GitHub friendly)
```

---

<!-- ========================================= -->

<!--           END OF FILE                      -->

<!-- ========================================= -->

```
```
