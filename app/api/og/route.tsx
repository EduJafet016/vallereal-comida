import { ImageResponse } from 'next/og';

export const runtime = 'edge';

// Diccionario de SVGs puros optimizados para Satori (Edge Runtime)
const ICON_SVGS: Record<string, string> = {
  plumbing: '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>', // Droplet
  zap: '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
  medical: '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.8 2.3A.3.3 0 0 1 5 2h14a.3.3 0 0 1 .2.3l-2.5 14.5a1 1 0 0 1-1 .8H8.3a1 1 0 0 1-1-.8z"/><path d="M8 10h8"/><path d="M12 6v8"/></svg>', // Stethoscope
  hammer: '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 12-8.5 8.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L12 9"/><path d="M17.64 15 22 10.64"/><path d="m20.91 3.2-12.5 12.5"/><path d="M15.5 6.5 17.5 4.5"/><path d="M18.5 9.5 20.5 7.5"/></svg>',
  lock: '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
  car: '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>',
  clean: '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.2 1.2L3 12l5.8 1.9a2 2 0 0 1 1.2 1.2L12 21l1.9-5.8a2 2 0 0 1 1.2-1.2L21 12l-5.8-1.9a2 2 0 0 1-1.2-1.2Z"/></svg>', // Sparkles
  paint: '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 13-6-6-6 6h12Z"/><path d="M6 22h12v-2H6z"/></svg>',
  tech: '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="12" x="3" y="4" rx="2" ry="2"/><line x1="2" x2="22" y1="20" y2="20"/></svg>', // Laptop
  scissors: '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" x2="8.12" y1="4" y2="15.88"/><line x1="14.47" x2="20" y1="14.48" y2="20"/><line x1="8.12" x2="12" y1="8.12" y2="12"/></svg>',
  delivery: '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="13" x="2" y="5" rx="2"/><polygon points="16 8 20 8 22 12 22 18 16 18 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>',
  security: '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>',
  shopping: '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>',
  dog: '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m10 5.172C10 3.782 8.423 2.675 6.5 3c-1.5.25-2.5 1.5-2.5 3 0 .5.2 1 .5 1.5"/><path d="m14 5.172c0-1.39 1.577-2.497 3.5-2.172 1.5.25 2.5 1.5 2.5 3 0 .5-.2 1-.5 1.5"/><path d="M12 12c-3 0-6 2-6 5v2h12v-2c0-3-3-5-6-5Z"/><path d="M12 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/></svg>',
  home: '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>'
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name')?.slice(0, 50) || 'Valle Real';
    const logo = searchParams.get('logo');
    const iconKey = searchParams.get('icon');

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#065f46',
            position: 'relative',
          }}
        >
          {logo ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={logo}
              alt="Logo"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '100%',
                backgroundColor: '#047857',
              }}
            >
              {iconKey && ICON_SVGS[iconKey] ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    marginBottom: 20,
                  }}
                  dangerouslySetInnerHTML={{ __html: ICON_SVGS[iconKey] }}
                />
              ) : null}
            </div>
          )}

          {/* Sombra inferior */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '45%',
              display: 'flex',
              backgroundImage: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)',
            }}
          />

          {/* Nombre del servicio */}
          <div
            style={{
              position: 'absolute',
              bottom: 40,
              left: 40,
              right: 220,
              display: 'flex',
              color: '#ffffff',
              fontSize: 48,
              fontWeight: 'bold',
            }}
          >
            {name}
          </div>

          {/* Sello de marca */}
          <div
            style={{
              position: 'absolute',
              bottom: 40,
              right: 40,
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#ffffff',
              padding: '10px 20px',
              borderRadius: 20,
            }}
          >
            <span style={{ fontSize: 22, fontWeight: 'bold', color: '#047857' }}>
              Valle Real
            </span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch {
    return new Response('Error generando tarjeta', { status: 500 });
  }
}