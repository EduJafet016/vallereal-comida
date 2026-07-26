# 🍔 Valle Real - Comida Local

> Plataforma web de comercio local y delivery diseñada para conectar de forma directa a los comercios de Valle Real con sus clientes, eliminando comisiones intermediarias.

![Status](https://img.shields.io/badge/status-en%20producci%C3%B3n-success)
![Next.js](https://img.shields.io/badge/Next.js-16.2-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38BDF8?logo=tailwind-css)

---

## Demo en Vivo
Puedes probar la aplicación en funcionamiento aquí:  
🔗 **[vallereal-comida.vercel.app](https://vallereal-comida.vercel.app)**

---

##  Stack Tecnológico

Este proyecto fue desarrollado utilizando un stack moderno enfocado en rendimiento, optimización y experiencia de usuario:

* **Frontend & Framework:** [Next.js](https://nextjs.org/) (App Router, Server Components y optimización con Turbopack).
* **Tipado:** [TypeScript](https://www.typescriptlang.org/) para garantizar robustez y seguridad de tipos en toda la lógica de negocio y estados.
* **Estilos y UI:** [Tailwind CSS](https://tailwindcss.com/) para un diseño responsivo, limpio y adaptado a dispositivos móviles (enfoque *Mobile-First*).
* **Gestión de Estado:** React Context API (`CartContext`) para el manejo centralizado del carrito de compras y sesiones de usuario.
* **Arquitectura PWA (Progressive Web App):** Configurado con `manifest.json` y metadatos nativos para permitir su instalación directa en dispositivos móviles como una aplicación de escritorio o app nativa.
* **Control de Versiones y Despliegue:** Git, GitHub y despliegue continuo automatizado en [Vercel](https://vercel.com/).

---

## Características Principales

* **Estructura Multi-rol / Multi-tenant:** Lógica diseñada para soportar tanto la vista del cliente final como paneles de administración y gestión para los diferentes negocios locales.
* **Flujo de Pedidos Directo:** Sistema de carrito optimizado para armar órdenes y enrutarlas de manera eficiente.
* **Experiencia Nativa (PWA):** Soporte completo para instalación en pantalla de inicio con iconos personalizados e interfaz adaptada a pantallas táctiles.
* **Optimización de Activos:** Cero dependencias pesadas innecesarias, logrando tiempos de carga mínimos y alta puntuación en rendimiento web.
