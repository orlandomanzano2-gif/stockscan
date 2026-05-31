# StockScan — Inventario QR en tiempo real

App de inventario con escáner QR, base de datos Firebase en tiempo real y PWA instalable en celular.

## 🚀 Despliegue en Vercel (sin código)

### Paso 1 — Sube el proyecto a GitHub

1. Ve a [github.com](https://github.com) → crea cuenta si no tienes
2. Clic en **"New repository"** → nombre: `stockscan` → **Create repository**
3. En la página del repo, clic en **"uploading an existing file"**
4. **Arrastra y suelta TODA la carpeta** `stockscan` descomprimida
5. Clic **"Commit changes"**

### Paso 2 — Despliega en Vercel

1. Ve a [vercel.com](https://vercel.com) → **"Sign up"** con tu cuenta de GitHub
2. Clic en **"Add New Project"**
3. Selecciona el repo `stockscan` → clic **"Import"**
4. Vercel detecta Vite automáticamente → clic **"Deploy"**
5. En ~1 minuto tendrás tu URL, ej: `https://stockscan-tuusuario.vercel.app`

### Paso 3 — Instala en tu celular (PWA)

**En iPhone (Safari):**
1. Abre la URL en Safari
2. Toca el botón de compartir (□↑)
3. "Agregar a pantalla de inicio"

**En Android (Chrome):**
1. Abre la URL en Chrome
2. Toca el menú (⋮)
3. "Agregar a pantalla de inicio" o aparece un banner automático

---

## ⚠️ Reglas de Firebase

En Firebase Console → Firestore → Reglas, cambia a:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

Esto permite que todos los usuarios puedan leer y escribir.
Para producción con usuarios, agregar autenticación.

---

## 📱 Funcionalidades

- ✅ Escaneo de QR y códigos de barras con la cámara
- ✅ Registro de productos en Firestore (tiempo real)
- ✅ Entradas y salidas de stock
- ✅ Dashboard con estadísticas
- ✅ Filtro por día / semana / mes / todo
- ✅ Alertas de stock bajo
- ✅ Múltiples usuarios simultáneos
- ✅ Instalable como app en celular (PWA)
