# Valle Real Comida

Plataforma de pedidos directos para locales de comida en Valle Real. Los clientes ven el menú, arman su carrito y envían el pedido por WhatsApp sin comisiones. Los comerciantes gestionan su menú desde un panel privado.

## Requisitos

- Node.js 20+
- Cuenta de [Supabase](https://supabase.com) con las tablas del proyecto configuradas
- Archivo `.env.local` con las variables de Supabase

## Variables de entorno

Crea un `.env.local` en la raíz del proyecto:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
```

## Desarrollo

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Scripts

| Comando        | Descripción              |
|----------------|--------------------------|
| `npm run dev`  | Servidor de desarrollo   |
| `npm run build`| Build de producción      |
| `npm run start`| Servidor de producción   |
| `npm run lint` | Revisión con ESLint      |

## Rutas principales

| Ruta                    | Descripción                          |
|-------------------------|--------------------------------------|
| `/`                     | Directorio de locales                |
| `/[slug]`               | Menú público de un local             |
| `/registro`             | Registro de nuevo comercio           |
| `/dashboard/[token]`    | Panel de administración del local    |
| `/master-admin`         | Panel super admin (acceso restringido)|

## Stack

- [Next.js 16](https://nextjs.org) (App Router)
- React 19
- Tailwind CSS 4
- Supabase
